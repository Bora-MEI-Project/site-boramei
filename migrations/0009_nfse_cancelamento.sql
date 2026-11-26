-- 0009_nfse_cancelamento.sql
--
-- Suporte ao cancelamento de NFS-e (rota api/nfse-cancelar do workflow "BoraMEI - API NFS-e"):
--   lancamento_id  lançamento de receita criado no painel financeiro quando a nota foi emitida
--                  (removido se a nota for cancelada)
--   cancelamento   pedido e retorno do evento de cancelamento (e101101) no Emissor Nacional
--   cancelada_em   quando o Emissor Nacional registrou o cancelamento
-- status continua 'AUTORIZADA' e passa a 'CANCELADA'.

ALTER TABLE bora_mei_core.nfse_emitidas
  ADD COLUMN IF NOT EXISTS lancamento_id BIGINT REFERENCES bora_mei_core.lancamentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancelamento  JSONB,
  ADD COLUMN IF NOT EXISTS cancelada_em  TIMESTAMPTZ;

-- Notas emitidas antes desta migration: liga ao lançamento pelo texto que a emissão grava,
-- "Serviço: ... (NFS-e nº <n_nfse> ...)", do mesmo usuário e com o mesmo valor.
UPDATE bora_mei_core.nfse_emitidas n
   SET lancamento_id = l.id
  FROM bora_mei_core.lancamentos l
 WHERE n.lancamento_id IS NULL
   AND n.tp_amb = 1
   AND l.usuario_id = n.usuario_id
   AND l.valor = n.valor
   AND l.descricao LIKE '%(NFS-e nº ' || n.n_nfse || '%'
   AND NOT EXISTS (SELECT 1 FROM bora_mei_core.nfse_emitidas o WHERE o.lancamento_id = l.id);
