-- 0008_campanha_teste_gratis.sql
--
-- A partir daqui o checkout padrão cobra na hora (sem teste grátis). O teste grátis passa a
-- existir só por link de campanha:
--   https://boramei.cloud/checkout?plano=essencial&cupom=TESTE90
--   https://boramei.cloud/checkout?plano=basico&cupom=TESTE90
--
-- 90 dias, qualquer plano, preço normal, sem validade nem limite de usos. O link DIRETO (0005)
-- continua existindo e hoje tem o mesmo efeito do checkout sem cupom.
-- Para desligar: UPDATE bora_mei_core.campanhas SET ativo = false WHERE codigo = 'TESTE90';

INSERT INTO bora_mei_core.campanhas (codigo, trial_dias)
VALUES ('TESTE90', 90)
ON CONFLICT (codigo) DO NOTHING;
