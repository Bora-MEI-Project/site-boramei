-- Adiciona a coluna que guarda o hash bcrypt da senha do MEI, definida no checkout
-- e usada para autenticar o acesso à área do cliente (/user).
--
-- Esta migration NÃO é aplicada automaticamente pelo projeto Next.js — aplique
-- manualmente via n8n (ou psql) no schema bora_mei_core.
--
-- A coluna é nullable de propósito: usuários cadastrados antes desta migration
-- não têm senha_hash até redefinirem a senha; o login trata esse caso como
-- credenciais inválidas.

ALTER TABLE bora_mei_core.usuarios
  ADD COLUMN senha_hash TEXT;
