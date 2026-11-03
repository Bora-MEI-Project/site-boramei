-- Adiciona a coluna que guarda o hash bcrypt da senha do MEI, definida no checkout
-- e usada para autenticar o acesso à área do cliente (/user).
--
-- Aplicada por scripts/migrate.mjs. Usa IF NOT EXISTS porque foi aplicada à mão
-- em produção antes do runner existir — rodar de novo não pode falhar.
--
-- A coluna é nullable de propósito: usuários cadastrados antes desta migration
-- não têm senha_hash até redefinirem a senha; o login trata esse caso como
-- credenciais inválidas.

ALTER TABLE bora_mei_core.usuarios
  ADD COLUMN IF NOT EXISTS senha_hash TEXT;
