import { query } from './db';
import type { PlanoId } from './planos';

// ─────────────────────────────────────────────────────────────
// Links promocionais: /checkout?plano=essencial&cupom=DIRETO
//
// O link só carrega o CÓDIGO. Trial (e, no futuro, preço) vêm sempre da
// tabela bora_mei_core.campanhas, consultada no servidor — tanto na página do
// checkout (para exibir) quanto em /api/checkout (para valer de verdade).
// ─────────────────────────────────────────────────────────────

export interface CampanhaCheckout {
  codigo: string;
  /** Dias de trial que valem para quem entra por este link (0 = cobra na hora). */
  trialDias: number;
}

/** Códigos são gravados em maiúsculas; aceita o link digitado de qualquer jeito. */
export function normalizarCodigoCampanha(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim().toUpperCase() : '';
}

/**
 * Devolve a campanha se ela existe, está ativa, dentro da validade, com usos
 * disponíveis e vale para o plano escolhido. Caso contrário, null.
 */
export async function buscarCampanhaValida(codigo: string, plano: PlanoId): Promise<CampanhaCheckout | null> {
  if (!codigo) return null;

  const linhas = await query<CampanhaCheckout>(
    `SELECT c.codigo, COALESCE(c.trial_dias, p.trial_dias) AS "trialDias"
       FROM bora_mei_core.campanhas c
       JOIN bora_mei_core.planos p ON p.codigo = $2
      WHERE c.codigo = $1
        AND c.ativo
        AND (c.valido_ate IS NULL OR c.valido_ate > NOW())
        AND (c.max_usos IS NULL OR c.usos < c.max_usos)
        AND (c.plano_id IS NULL OR c.plano_id = p.id)
      LIMIT 1`,
    [codigo, plano]
  );

  return linhas[0] ?? null;
}

/** Conta um uso da campanha. Chamado só depois que o n8n aceitou o pedido. */
export async function registrarUsoCampanha(codigo: string): Promise<void> {
  await query(`UPDATE bora_mei_core.campanhas SET usos = usos + 1 WHERE codigo = $1`, [codigo]);
}
