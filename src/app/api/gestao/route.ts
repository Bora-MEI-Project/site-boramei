import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUsuarioLogado } from "@/lib/auth";
import { query } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// GET /api/gestao — indicadores da aba "Gestão" (/financeiro/gestao):
// Receita, Custos, Lucro estimado, Margem, Ponto de Equilíbrio, Projeção
// anual, Distância do limite do MEI e progresso da Meta de faturamento.
//
// Sem seletor de período (ao contrário da DRE): sempre mês atual (do dia 1
// até hoje) e ano corrente (de 1º de janeiro até hoje), igual ao Fluxo de
// Caixa. Reaproveita o mesmo padrão de agregação em SQL de
// src/app/api/dre/route.ts (buscarAgregado), mas agrupando por
// natureza + tipo_custo em vez de grupo/categoria — o cálculo aqui é mais
// simples que a cascata inteira da DRE.
// ─────────────────────────────────────────────────────────────

type Natureza = "receita" | "despesa";
type TipoCusto = "fixo" | "variavel" | null;

interface AgregadoRow {
  natureza: Natureza;
  tipoCusto: TipoCusto;
  total: string; // NUMERIC volta como string (sem type parser custom em db.ts)
}

interface MetaRow {
  meta_faturamento_mensal: string;
}

interface FaturamentoMensalRow {
  mes: number;
  total: string;
}

async function buscarAgregado(usuarioId: number, inicio: string, fim: string): Promise<AgregadoRow[]> {
  return query<AgregadoRow>(
    `SELECT c.natureza, c.tipo_custo AS "tipoCusto", COALESCE(SUM(l.valor), 0) AS total
     FROM bora_mei_core.lancamentos l
     JOIN bora_mei_core.categorias_financeiras c ON c.id = l.categoria_id
     WHERE l.usuario_id = $1 AND l.data BETWEEN $2 AND $3
     GROUP BY c.natureza, c.tipo_custo`,
    [usuarioId, inicio, fim]
  );
}

/**
 * Faturamento (não "receita" no sentido amplo) quebrado por mês do ano — base
 * do gráfico de previsão. Faturamento = só o grupo "Receitas Diretas" (venda
 * de produto/serviço, a mesma classificação que vira "Receita de Vendas e
 * Serviços" na DRE, ver GRUPO_PARA_SECAO em src/app/api/dre/route.ts) —
 * exclui "Outras Entradas" e "Receitas Indiretas", que somam em `receita`
 * no restante desta rota mas não são faturamento de verdade.
 */
async function buscarFaturamentoPorMes(usuarioId: number, ano: number): Promise<FaturamentoMensalRow[]> {
  return query<FaturamentoMensalRow>(
    `SELECT EXTRACT(MONTH FROM l.data)::int AS mes, COALESCE(SUM(l.valor), 0) AS total
     FROM bora_mei_core.lancamentos l
     JOIN bora_mei_core.categorias_financeiras c ON c.id = l.categoria_id
     WHERE l.usuario_id = $1 AND l.data BETWEEN $2 AND $3 AND c.grupo = 'Receitas Diretas'
     GROUP BY mes`,
    [usuarioId, `${ano}-01-01`, `${ano}-12-31`]
  );
}

const NOMES_MES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const formatarData = (data: Date): string => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

const LIMITE_MEI_ANUAL = 81000;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: "Não autenticado." }, { status: 401 });
  }

  const agora = new Date();
  const hoje = formatarData(agora);
  const inicioMes = formatarData(new Date(agora.getFullYear(), agora.getMonth(), 1));
  const inicioAno = `${agora.getFullYear()}-01-01`;
  const mesAtual = agora.getMonth() + 1;

  const [linhasMes, linhasAno, metaRows, linhasPorMes] = await Promise.all([
    buscarAgregado(usuario.usuarioId, inicioMes, hoje),
    buscarAgregado(usuario.usuarioId, inicioAno, hoje),
    query<MetaRow>(
      `SELECT meta_faturamento_mensal FROM bora_mei_core.metas_usuario WHERE usuario_id = $1`,
      [usuario.usuarioId]
    ),
    buscarFaturamentoPorMes(usuario.usuarioId, agora.getFullYear()),
  ]);

  // Soma tudo por "balde" (natureza + tipo_custo), igual ao padrão de dre/route.ts.
  const somar = (rows: AgregadoRow[], filtro: (r: AgregadoRow) => boolean): number =>
    rows.filter(filtro).reduce((acc, r) => acc + Number(r.total), 0);

  const receita = somar(linhasMes, (r) => r.natureza === "receita");
  const custos = somar(linhasMes, (r) => r.natureza === "despesa");
  const lucroEstimado = receita - custos;
  const margem = receita === 0 ? 0 : (lucroEstimado / receita) * 100;

  // Categoria sem classificação conta como fixo por padrão (mais conservador
  // pro Ponto de Equilíbrio) — mas fica sinalizado pra UI avisar o usuário.
  const despesasFixas = somar(
    linhasMes,
    (r) => r.natureza === "despesa" && (r.tipoCusto === "fixo" || r.tipoCusto === null)
  );
  const custosVariaveis = somar(linhasMes, (r) => r.natureza === "despesa" && r.tipoCusto === "variavel");
  const temCategoriaNaoClassificada = linhasMes.some(
    (r) => r.natureza === "despesa" && r.tipoCusto === null && Number(r.total) > 0
  );

  const pontoEquilibrio =
    receita === 0 || custosVariaveis >= receita
      ? null
      : despesasFixas / (1 - custosVariaveis / receita);

  const receitaAnoAcumulada = somar(linhasAno, (r) => r.natureza === "receita");
  const projecaoAnual = (receitaAnoAcumulada / mesAtual) * 12;
  const distanciaLimiteMei = LIMITE_MEI_ANUAL - receitaAnoAcumulada;
  const projecaoUltrapassaLimite = projecaoAnual > LIMITE_MEI_ANUAL;

  const metaFaturamentoMensal =
    metaRows.length > 0 ? Number(metaRows[0].meta_faturamento_mensal) : null;
  const progressoMetaPercent =
    metaFaturamentoMensal && metaFaturamentoMensal > 0 ? (receita / metaFaturamentoMensal) * 100 : null;

  // Gráfico de previsão: cada mês carrega faturamento realizado E projeção,
  // pra desenhar como barras sobrepostas (projeção larga atrás, realizado
  // estreito na frente). Meses passados não têm projeção (já fecharam, não
  // faz sentido comparar) — só o mês atual em diante ("meses subsequentes")
  // ganha a barra de projeção, usando a mesma média mensal de faturamento
  // que já embasa a Projeção anual abaixo, só espalhada mês a mês.
  const faturamentoPorMes = new Map<number, number>();
  for (const row of linhasPorMes) {
    faturamentoPorMes.set(row.mes, Number(row.total));
  }
  const faturamentoAnoAcumulado = Array.from({ length: mesAtual }, (_, i) => faturamentoPorMes.get(i + 1) ?? 0).reduce(
    (a, b) => a + b,
    0
  );
  const mediaFaturamentoMensal = mesAtual > 0 ? faturamentoAnoAcumulado / mesAtual : 0;
  const serieMensal = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    return {
      mes,
      mesLabel: NOMES_MES_ABREV[i],
      realizado: faturamentoPorMes.get(mes) ?? 0,
      projecao: mes >= mesAtual ? mediaFaturamentoMensal : 0,
    };
  });

  return NextResponse.json({
    periodo: { inicioMes, inicioAno, hoje },
    receita,
    custos,
    lucroEstimado,
    margem,
    pontoEquilibrio,
    temCategoriaNaoClassificada,
    projecaoAnual,
    limiteMeiAnual: LIMITE_MEI_ANUAL,
    receitaAnoAcumulada,
    distanciaLimiteMei,
    projecaoUltrapassaLimite,
    metaFaturamentoMensal,
    progressoMetaPercent,
    serieMensal,
  });
}
