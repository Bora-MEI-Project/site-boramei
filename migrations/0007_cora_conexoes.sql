-- 0007_cora_conexoes.sql
--
-- Conexão de cada cliente com a conta Cora dele (integração por parceiro,
-- OAuth2 authorization code). Uma linha por usuário: reconectar sobrescreve.
--
-- Os tokens dão acesso à conta bancária do cliente, então NÃO ficam em texto
-- puro: o site cifra com AES-256-GCM (chave em CORA_TOKEN_KEY, ver
-- src/lib/cora.ts) antes de gravar. Quem tiver só um dump do banco não
-- consegue usar os tokens.

CREATE TABLE IF NOT EXISTS bora_mei_core.cora_conexoes (
  usuario_id     INTEGER PRIMARY KEY REFERENCES bora_mei_core.usuarios(id) ON DELETE CASCADE,
  access_token   TEXT NOT NULL,          -- cifrado
  refresh_token  TEXT,                   -- cifrado; NULL se a Cora não devolver
  expira_em      TIMESTAMPTZ NOT NULL,   -- quando o access_token vence
  escopo         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
