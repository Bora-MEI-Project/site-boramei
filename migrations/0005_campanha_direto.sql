-- 0005_campanha_direto.sql
--
-- Link fixo para checkout SEM período de teste:
--   https://boramei.cloud/checkout?plano=essencial&cupom=DIRETO
--   https://boramei.cloud/checkout?plano=basico&cupom=DIRETO
--
-- Vale para qualquer plano (plano_id NULL), preço normal do plano
-- (valor_centavos NULL), sem validade nem limite de usos. Para desligar o
-- link: UPDATE bora_mei_core.campanhas SET ativo = false WHERE codigo = 'DIRETO';

INSERT INTO bora_mei_core.campanhas (codigo, trial_dias)
VALUES ('DIRETO', 0)
ON CONFLICT (codigo) DO NOTHING;
