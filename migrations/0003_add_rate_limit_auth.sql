-- 0003_add_rate_limit_auth.sql
-- Comment: NOT auto-applied by the Next.js project — applied manually via n8n/psql
-- against schema bora_mei_core, mesmo padrão da 0001 e 0002.
--
-- Contador de tentativas para os endpoints de autenticação (/api/auth/login e
-- /api/auth/criar-senha). Guarda uma linha por chave ("login:ip:1.2.3.4",
-- "criar-senha:cpf:12345678901", ...) usando janela fixa: quando a janela
-- expira, a própria escrita seguinte zera o contador e recomeça a contagem.
--
-- Fica no banco, e não em memória do processo, porque a aplicação roda em
-- ambiente serverless: cada instância teria o seu próprio contador e o limite
-- na prática seria multiplicado pelo número de instâncias ativas.
--
-- ATENÇÃO: aplicar esta migration ANTES de subir o deploy que usa a tabela.
-- O código trata a ausência dela liberando a requisição (fail-open), então o
-- login continua funcionando — mas fica sem proteção nenhuma até rodar aqui.

CREATE TABLE bora_mei_core.rate_limit_auth (
  chave TEXT PRIMARY KEY,
  janela_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tentativas INTEGER NOT NULL DEFAULT 0
);

-- Usado só pela limpeza das linhas de janelas já vencidas.
CREATE INDEX idx_rate_limit_auth_janela ON bora_mei_core.rate_limit_auth (janela_inicio);
