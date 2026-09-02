import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUsuarioLogado } from "@/lib/auth";
import { query } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// GET /api/gestao — indicadores da aba "Gestão" (/financeiro/gestao):
// Receita, Custos, Lucro estimado, Margem, Ponto de Equilíbrio, Projeção
// anual, Distância do limite do MEI e progresso da Meta de faturamento.
//
// Aceita ?ano=&mes= igual à DRE (default: ano/mês atuais, fora da faixa
// cai silenciosamente no default, nunca 400). Os indicadores "do mês"
// (Receita, Custos, Lucro, Margem, Ponto de Equilíbrio) são sempre do
// mês/ano selecionado — mês passado = total fechado do mês inteiro; o mês
// REAL atual continua sendo "do dia 1 até hoje" (em andamento).
//
// Já Projeção anual / Distância do limite do MEI / gráfico de previsão
// (serieMensal) são sobre o ANO selecionado, mas a divisão "quantos meses
// já são conhecidos" segue o calendário de verdade, não o mês escolhido na
// tela: ano selecionado = ano real atual → conhecido até o mês real atual
// (o resto é projeção); ano selecionado no passado → os 12 meses já
// aconteceram, nada a projetar.
//
// Reaproveita o mesmo padrão de agregação em SQL de src/app/api/dre/route.ts
// (buscarAgregado), mas agrupando por natureza + tipo_custo em vez de
// grupo/categoria — o cálculo aqui é mais simples que a cascata da DRE.
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
const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

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
  const anoAtualReal = agora.getFullYear();
  const mesAtualReal = agora.getMonth() + 1;

  // ?ano=&mes= — mesmo padrão de default silencioso da DRE (nunca 400).
  const params = request.nextUrl.searchParams;
  const anoParam = Number(params.get("ano"));
  const ano = Number.isInteger(anoParam) && anoParam >= 2000 && anoParam <= 2100 ? anoParam : anoAtualReal;
  const mesParam = Number(params.get("mes"));
  const mes = Number.isInteger(mesParam) && mesParam >= 1 && mesParam <= 12 ? mesParam : mesAtualReal;

  const ehAnoAtual = ano === anoAtualReal;
  const ehMesAtual = ehAnoAtual && mes === mesAtualReal;

  const ultimoDiaMes = new Date(ano, mes, 0).getDate();
  const inicioMes = `${ano}-${String(mes).padStart(2, "0")}-01`;
  // Mês selecionado é o mês real em andamento → só até hoje. Qualquer outro
  // (passado, ou futuro dentro do próprio ano) → mês fechado, dia 1 ao último.
  const fimMes = ehMesAtual ? hoje : `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDiaMes).padStart(2, "0")}`;

  const inicioAno = `${ano}-01-01`;
  const fimAno = ehAnoAtual ? hoje : `${ano}-12-31`;
  // Quantos meses do ano selecionado já são "conhecidos" de verdade (pro
  // divisor da Projeção anual e pro corte do gráfico de previsão) — segue o
  // calendário real, não o mês escolhido pra olhar os indicadores do mês.
  const mesesConhecidos = ehAnoAtual ? mesAtualReal : 12;

  const [linhasMes, linhasAno, metaRows, linhasPorMes] = await Promise.all([
    buscarAgregado(usuario.usuarioId, inicioMes, fimMes),
    buscarAgregado(usuario.usuarioId, inicioAno, fimAno),
    query<MetaRow>(
      `SELECT meta_faturamento_mensal FROM bora_mei_core.metas_usuario WHERE usuario_id = $1`,
      [usuario.usuarioId]
    ),
    buscarFaturamentoPorMes(usuario.usuarioId, ano),
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
  const projecaoAnual = mesesConhecidos > 0 ? (receitaAnoAcumulada / mesesConhecidos) * 12 : 0;
  const distanciaLimiteMei = LIMITE_MEI_ANUAL - receitaAnoAcumulada;
  const projecaoUltrapassaLimite = projecaoAnual > LIMITE_MEI_ANUAL;

  const metaFaturamentoMensal =
    metaRows.length > 0 ? Number(metaRows[0].meta_faturamento_mensal) : null;
  const progressoMetaPercent =
    metaFaturamentoMensal && metaFaturamentoMensal > 0 ? (receita / metaFaturamentoMensal) * 100 : null;

  // Gráfico de previsão: cada mês carrega faturamento realizado E projeção,
  // pra desenhar como barras sobrepostas (projeção larga atrás, realizado
  // estreito na frente). Meses já conhecidos (`mesesConhecidos`, calendário
  // real — ver comentário no topo do arquivo) não têm projeção, só o mês
  // atual real em diante ganha a barra, usando a mesma média mensal de
  // faturamento que já embasa a Projeção anual acima, só espalhada mês a
  // mês. Num ano do passado, `ehAnoAtual` é falso e nenhum mês projeta.
  const faturamentoPorMes = new Map<number, number>();
  for (const row of linhasPorMes) {
    faturamentoPorMes.set(row.mes, Number(row.total));
  }
  const faturamentoAnoAcumulado = Array.from({ length: mesesConhecidos }, (_, i) => faturamentoPorMes.get(i + 1) ?? 0).reduce(
    (a, b) => a + b,
    0
  );
  const mediaFaturamentoMensal = mesesConhecidos > 0 ? faturamentoAnoAcumulado / mesesConhecidos : 0;
  const serieMensal = Array.from({ length: 12 }, (_, i) => {
    const mesDoPonto = i + 1;
    return {
      mes: mesDoPonto,
      mesLabel: NOMES_MES_ABREV[i],
      realizado: faturamentoPorMes.get(mesDoPonto) ?? 0,
      // Ano no passado: os 12 meses já são história, nunca há projeção.
      projecao: ehAnoAtual && mesDoPonto >= mesesConhecidos ? mediaFaturamentoMensal : 0,
    };
  });

  return NextResponse.json({
    periodo: { ano, mes, mesLabel: `${NOMES_MES[mes - 1]} de ${ano}`, inicioMes, fimMes },
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
