-- 0006_remove_indices_duplicados.sql
--
-- Índices que repetem exatamente um índice UNIQUE já existente na mesma coluna: só ocupam
-- espaço e deixam INSERT/UPDATE mais lentos. As buscas continuam usando o índice único.
--   idx_usuarios_cpf          = usuarios_cpf_key (UNIQUE cpf)
--   idx_usuarios_email        = usuarios_email_key (UNIQUE email)
--   idx_mei_profiles_whatsapp = mei_profiles_whatsapp_number_key (UNIQUE whatsapp_number)

DROP INDEX IF EXISTS bora_mei_core.idx_usuarios_cpf;
DROP INDEX IF EXISTS bora_mei_core.idx_usuarios_email;
DROP INDEX IF EXISTS bora_mei_core.idx_mei_profiles_whatsapp;
