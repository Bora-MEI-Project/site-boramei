-- 0004_planos_e_assinaturas_fase1.sql
--
-- Fase 1 da reestruturação comercial (modelo: planos → assinaturas → cobranças).
-- Só ADICIONA estrutura e copia dados: nenhuma coluna existente é apagada ou
-- alterada, então o n8n, que ainda lê e grava as colunas antigas de usuarios
-- e assinaturas, continua funcionando igual.
--
--   Fase 1 (esta): cria planos, campanhas, metodos_pagamento e cobrancas;
--                  adiciona as colunas novas em assinaturas e preenche a
--                  partir de usuarios.
--   Fase 2:        n8n e site passam a gravar/ler as colunas novas; nova
--                  cópia para quem se cadastrou entre a fase 1 e a 2.
--   Fase 3:        remove as colunas antigas de usuarios/assinaturas e a
--                  tabela cobrancas_pix.
--
-- A tabela assinaturas é EVOLUÍDA (e não recriada) porque o n8n já grava nela.
-- Por isso as colunas novas entram todas nullable e sem o índice de "uma
-- assinatura viva por cliente" — essas travas entram na fase 2, quando o n8n
-- já estiver preenchendo os campos novos.
--
-- Os pré-cadastros (usuarios em trial que nunca passaram pelo checkout, sem
-- linha em assinaturas) NÃO ganham assinatura aqui: ela nasce no checkout.
--
-- Datas: as colunas antigas são TIMESTAMP sem fuso, gravadas no fuso padrão do
-- banco; o cast ::timestamptz usa esse mesmo fuso, então o instante é mantido.

-- ── Catálogo de planos ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS bora_mei_core.planos (
  id              SERIAL PRIMARY KEY,
  codigo          TEXT NOT NULL UNIQUE,          -- o mesmo id usado no front (src/lib/planos.ts)
  nome            TEXT NOT NULL,
  valor_centavos  INTEGER NOT NULL CHECK (valor_centavos > 0),
  periodicidade   TEXT NOT NULL DEFAULT 'mensal' CHECK (periodicidade IN ('mensal', 'anual')),
  trial_dias      INTEGER NOT NULL DEFAULT 90 CHECK (trial_dias >= 0),
  ativo           BOOLEAN NOT NULL DEFAULT TRUE, -- false = não é mais vendido; quem assinou continua
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO bora_mei_core.planos (codigo, nome, valor_centavos, trial_dias) VALUES
  ('basico',    'Plano Básico',    990,  90),
  ('essencial', 'Plano Essencial', 3590, 90)
ON CONFLICT (codigo) DO NOTHING;

-- ── Campanhas (links promocionais) ───────────────────────────

CREATE TABLE IF NOT EXISTS bora_mei_core.campanhas (
  codigo          TEXT PRIMARY KEY,                                    -- vai no link ?cupom=
  plano_id        INTEGER REFERENCES bora_mei_core.planos(id),         -- NULL = qualquer plano
  valor_centavos  INTEGER CHECK (valor_centavos > 0),                  -- NULL = preço do plano
  trial_dias      INTEGER CHECK (trial_dias >= 0),                     -- NULL = trial do plano
  valido_ate      TIMESTAMPTZ,
  max_usos        INTEGER CHECK (max_usos > 0),
  usos            INTEGER NOT NULL DEFAULT 0,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Métodos de pagamento (cartão tokenizado) ─────────────────
-- Guarda só o necessário para cobrar e exibir: nada de nome/CPF do titular.

CREATE TABLE IF NOT EXISTS bora_mei_core.metodos_pagamento (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES bora_mei_core.usuarios(id) ON DELETE CASCADE,
  gateway     TEXT NOT NULL,              -- 'pagbank'
  token       TEXT NOT NULL,              -- o card_id devolvido pelo gateway
  bandeira    TEXT,
  final       CHAR(4),
  validade    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gateway, token)
);

CREATE INDEX IF NOT EXISTS idx_metodos_pagamento_usuario ON bora_mei_core.metodos_pagamento (usuario_id);

INSERT INTO bora_mei_core.metodos_pagamento (usuario_id, gateway, token, bandeira, final, created_at)
SELECT u.id, 'pagbank', u.card_id, u.card_bandeira, u.card_final,
       COALESCE(u.assinatura_ativada_em, u.created_at, NOW())::timestamptz
  FROM bora_mei_core.usuarios u
 WHERE u.card_id IS NOT NULL
ON CONFLICT (gateway, token) DO NOTHING;

-- ── Assinaturas: colunas novas ───────────────────────────────

ALTER TABLE bora_mei_core.assinaturas
  ADD COLUMN IF NOT EXISTS plano_id            INTEGER REFERENCES bora_mei_core.planos(id),
  ADD COLUMN IF NOT EXISTS campanha_codigo     TEXT REFERENCES bora_mei_core.campanhas(codigo),
  ADD COLUMN IF NOT EXISTS valor_centavos      INTEGER CHECK (valor_centavos > 0),
  ADD COLUMN IF NOT EXISTS metodo              TEXT CHECK (metodo IN ('cartao', 'pix')),
  ADD COLUMN IF NOT EXISTS status              TEXT CHECK (status IN ('trial', 'ativa', 'inadimplente', 'cancelada')),
  ADD COLUMN IF NOT EXISTS trial_ate           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proxima_cobranca    DATE,
  ADD COLUMN IF NOT EXISTS metodo_pagamento_id BIGINT REFERENCES bora_mei_core.metodos_pagamento(id),
  ADD COLUMN IF NOT EXISTS cancelada_em        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT,
  ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_assinaturas_usuario ON bora_mei_core.assinaturas (usuario_id);

-- Preenche as assinaturas que já existem a partir de usuarios, que hoje é a
-- fonte de verdade do plano/preço/status. O preço copiado é o valor_plano do
-- cliente (o que ele contratou), não o preço atual do plano.
UPDATE bora_mei_core.assinaturas a
   SET plano_id = p.id,
       valor_centavos = COALESCE(u.valor_plano, p.valor_centavos),
       metodo = CASE
                  WHEN a.tipo IN ('cartão', 'cartao') OR a.card_id IS NOT NULL OR u.card_id IS NOT NULL THEN 'cartao'
                  WHEN a.efi_id_rec IS NOT NULL OR u.efi_id_rec IS NOT NULL THEN 'pix'
                END,
       status = CASE u.status
                  WHEN 'ativo' THEN 'ativa'
                  WHEN 'trial' THEN 'trial'
                END,
       trial_ate = u.trial_expira_em::timestamptz,
       proxima_cobranca = u.data_proxima_cobranca,
       metodo_pagamento_id = mp.id,
       updated_at = NOW()
  FROM bora_mei_core.usuarios u
  LEFT JOIN bora_mei_core.planos p
         ON p.codigo = CASE
                         WHEN u.plano_ativo ILIKE '%essencial%' THEN 'essencial'
                         WHEN u.plano_ativo ILIKE '%b_sico%'    THEN 'basico'
                       END
  LEFT JOIN bora_mei_core.metodos_pagamento mp
         ON mp.gateway = 'pagbank' AND mp.token = COALESCE(u.card_id, '')
 WHERE a.usuario_id = u.id
   AND a.plano_id IS NULL;

-- ── Cobranças (histórico de todas, cartão e Pix) ─────────────

CREATE TABLE IF NOT EXISTS bora_mei_core.cobrancas (
  id              BIGSERIAL PRIMARY KEY,
  assinatura_id   BIGINT NOT NULL REFERENCES bora_mei_core.assinaturas(id) ON DELETE CASCADE,
  valor_centavos  INTEGER NOT NULL CHECK (valor_centavos > 0),
  metodo          TEXT NOT NULL CHECK (metodo IN ('cartao', 'pix')),
  status          TEXT NOT NULL CHECK (status IN ('pendente', 'paga', 'falhou', 'estornada')),
  gateway_id      TEXT,                   -- order_id (PagBank) ou txid (Efí)
  motivo_falha    TEXT,
  vencimento      DATE,
  paga_em         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cobrancas_assinatura ON bora_mei_core.cobrancas (assinatura_id);

-- usuarios só guarda o ÚLTIMO pagamento e a ÚLTIMA falha; é o que dá para
-- recuperar. Cobranças anteriores a essas não existem mais no banco.
INSERT INTO bora_mei_core.cobrancas (assinatura_id, valor_centavos, metodo, status, gateway_id, paga_em, created_at)
SELECT a.id, a.valor_centavos, a.metodo, 'paga', u.ultimo_order_id,
       u.ultimo_pagamento::timestamptz, u.ultimo_pagamento::timestamptz
  FROM bora_mei_core.usuarios u
  JOIN bora_mei_core.assinaturas a ON a.usuario_id = u.id
 WHERE u.ultimo_pagamento IS NOT NULL
   AND a.valor_centavos IS NOT NULL
   AND a.metodo IS NOT NULL;

INSERT INTO bora_mei_core.cobrancas (assinatura_id, valor_centavos, metodo, status, motivo_falha, created_at)
SELECT a.id, a.valor_centavos, a.metodo, 'falhou', u.motivo_falha, u.ultima_falha_cobranca::timestamptz
  FROM bora_mei_core.usuarios u
  JOIN bora_mei_core.assinaturas a ON a.usuario_id = u.id
 WHERE u.ultima_falha_cobranca IS NOT NULL
   AND a.valor_centavos IS NOT NULL
   AND a.metodo IS NOT NULL;
