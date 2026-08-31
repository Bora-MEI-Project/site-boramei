-- 0002_add_classificacao_e_metas.sql
-- Comment: NOT auto-applied by the Next.js project — applied manually via n8n/psql
-- against schema bora_mei_core, mesmo padrão da 0001.
--
-- 1) tipo_custo classifica cada categoria de despesa em fixo/variável, pro
--    cálculo de Ponto de Equilíbrio na aba Gestão. É uma classificação GLOBAL
--    (categorias_financeiras é compartilhada entre todos os usuários) e fica
--    NULL até ser preenchida manualmente em /admin/categorias. Não se aplica
--    a categorias de receita (fica NULL nelas também).
--
-- 2) metas_usuario guarda a meta de faturamento mensal que cada usuário
--    define na aba Gestão. Uma linha por usuário (upsert via ON CONFLICT).

ALTER TABLE bora_mei_core.categorias_financeiras
  ADD COLUMN tipo_custo TEXT CHECK (tipo_custo IN ('fixo', 'variavel'));

CREATE TABLE bora_mei_core.metas_usuario (
  usuario_id BIGINT PRIMARY KEY REFERENCES bora_mei_core.usuarios(id),
  meta_faturamento_mensal NUMERIC NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
