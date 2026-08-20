import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUsuarioLogado } from "@/lib/auth";
import { query } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// GET /api/dre — monta a Demonstração de Resultado do Exercício
// (DRE) do usuário logado a partir dos mesmos lançamentos usados
// no Fluxo de Caixa (/api/lancamentos).
//
// Fluxo do handler, de cima a baixo:
//   1. Autentica (mesmo cookie de sessão das outras rotas).
//   2. Resolve o período: ?ano=&mes= (com defaults pro mês atual).
//   3. Dispara 3 queries em paralelo — mês selecionado, ano inteiro
//      e ano quebrado por mês (essa última alimenta o gráfico).
//   4. Cada resultado bruto (linhas de "grupo + categoria + total")
//      passa por `montarBloco`, que classifica cada linha numa seção
//      da DRE e calcula os subtotais/resultados em cascata.
//
// Não existe nenhuma tabela nova pra isso: a DRE inteira é derivada
// de bora_mei_core.categorias_financeiras + lancamentos, que já
// existiam para o Fluxo de Caixa.
// ─────────────────────────────────────────────────────────────

type Natureza = "receita" | "despesa";

interface AgregadoRow {
  grupo: string;
  categoria: string;
  natureza: Natureza;
  total: string;
}

interface LinhaDre {
  label: string;
  valor: number;
  avPercent: number;
}

interface BlocoDre {
  receitaBruta: number;
  receitas: LinhaDre[];
  deducoes: LinhaDre[];
  totalDeducoes: number;
  receitaLiquida: number;
  custos: LinhaDre[];
  totalCustos: number;
  lucroBruto: number;
  margemBruta: number;
  despesas: LinhaDre[];
  totalDespesas: number;
  resultadoOperacional: number;
  receitasFinanceiras: number;
  despesasFinanceiras: number;
  investimentos: number;
  resultadoLiquido: number;
}

// ── Classificação: de "grupo" solto para "seção da DRE" ────────
//
// categorias_financeiras.conta_dre existe mas está preenchida só em
// parte das linhas (ex.: "Compras de Materia Prima" e "Simples
// Nacional (DAS)" ficam NULL). O campo `grupo`, por outro lado, está
// 100% preenchido — por isso a classificação usa `grupo` (com o DAS
// tratado à parte) em vez de depender do conta_dre incompleto.
//
// Cada chave à direita ("receita_bruta", "custo", "despesa_admin"...)
// é um "balde" que depois vira uma linha ou um subtotal da DRE lá
// embaixo em montarBloco(). O mapeamento em si é uma decisão de
// negócio (que grupo contábil vira o quê na demonstração), não algo
// que vem pronto do banco.
const GRUPO_PARA_SECAO: Record<string, string> = {
  "Receitas Diretas": "receita_bruta",
  "Outras Entradas": "outras_receitas",
  "Devoluções": "outras_receitas",
  "Devoluções de Vendas": "deducao",
  "Despesas Diretas": "custo",
  "Despesas com Pessoal": "despesa_pessoal",
  "Despesas Administrativas": "despesa_admin",
  "Despesas de Vendas e Marketing": "despesa_comercial",
  "Impostos e Taxas": "despesa_tributo",
  "Outras Despesas": "despesa_outras",
  "Receitas Indiretas": "receita_financeira",
  "Despesas Financeiras / Bancos": "despesa_financeira",
  "Investimento": "investimento",
};

/**
 * Decide em qual balde uma linha agregada (grupo + categoria + total) cai.
 * "Simples Nacional (DAS)" é a única categoria tratada fora do mapa de
 * grupo: é a única tributação que realmente incide sobre a receita de um
 * MEI, então vira uma dedução da receita (como no print de referência),
 * enquanto o resto de "Impostos e Taxas" (ICMS, IPI etc., que não se
 * aplicam a MEI, mas podem existir em dados antigos) cai em "Outros
 * Tributos" dentro de Despesas Operacionais. Qualquer grupo não mapeado
 * cai num balde "outras_receitas"/"despesa_outras" — nada se perde, só o
 * detalhamento fica genérico.
 */
function classificar(row: AgregadoRow): string {
  if (row.categoria === "Simples Nacional (DAS)") return "deducao_das";
  return (
    GRUPO_PARA_SECAO[row.grupo] ??
    (row.natureza === "receita" ? "outras_receitas" : "despesa_outras")
  );
}

/** Monta uma linha de exibição da DRE, já com o AV% (percentual sobre a Receita Bruta) calculado. */
function linha(label: string, valor: number, receitaBruta: number): LinhaDre {
  return {
    label,
    valor,
    avPercent: receitaBruta === 0 ? 0 : (Math.abs(valor) / receitaBruta) * 100,
  };
}

/**
 * O coração da rota: recebe as linhas cruas (uma por grupo+categoria+natureza,
 * já somadas em SQL) e desce a "cascata" clássica de uma DRE, um subtotal de
 * cada vez. Cada bloco abaixo depende do valor calculado no bloco anterior —
 * por isso a ordem do código importa e segue a mesma ordem em que a tabela é
 * renderizada na página (ver src/app/financeiro/dre/page.tsx):
 *
 *   Receita Bruta
 *     (-) Deduções da Receita           → Receita Líquida
 *       (-) Custos Operacionais         → Lucro Bruto (+ Margem Bruta %)
 *         (-) Despesas Operacionais     → Resultado Operacional
 *           (+/-) Financeiro/Investim.  → Resultado Líquido do Período
 */
function montarBloco(rows: AgregadoRow[]): BlocoDre {
  // 1) Soma tudo por balde (uma única passada pelas linhas cruas).
  const somas: Record<string, number> = {};
  for (const row of rows) {
    const secao = classificar(row);
    somas[secao] = (somas[secao] ?? 0) + Number(row.total);
  }
  // Atalho: `s("custo")` devolve 0 se o usuário não teve nenhum lançamento
  // naquele balde no período, em vez de `undefined`.
  const s = (chave: string) => somas[chave] ?? 0;

  // 2) Receita Bruta = tudo que é "entrada operacional".
  const receitaBruta = s("receita_bruta") + s("outras_receitas");

  const receitas: LinhaDre[] = [
    linha("Receita de Vendas e Serviços", s("receita_bruta"), receitaBruta),
    linha("Outras Receitas Operacionais", s("outras_receitas"), receitaBruta),
  ];

  // 3) Deduções → Receita Líquida.
  const totalDeducoes = s("deducao") + s("deducao_das");
  const deducoes: LinhaDre[] = [
    linha("Devoluções de Vendas", s("deducao"), receitaBruta),
    linha("Impostos sobre a Receita (DAS)", s("deducao_das"), receitaBruta),
  ];

  const receitaLiquida = receitaBruta - totalDeducoes;

  // 4) Custos diretos (o que entra pra revender/produzir) → Lucro Bruto.
  const totalCustos = s("custo");
  const custos: LinhaDre[] = [
    linha("Custo de Mercadorias/Serviços Vendidos", totalCustos, receitaBruta),
  ];

  const lucroBruto = receitaLiquida - totalCustos;
  const margemBruta = receitaLiquida === 0 ? 0 : (lucroBruto / receitaLiquida) * 100;

  // 5) Despesas do dia a dia do negócio → Resultado Operacional.
  const totalDespesas =
    s("despesa_pessoal") + s("despesa_admin") + s("despesa_comercial") + s("despesa_tributo") + s("despesa_outras");
  const despesas: LinhaDre[] = [
    linha("Despesas com Pessoal", s("despesa_pessoal"), receitaBruta),
    linha("Despesas Administrativas", s("despesa_admin"), receitaBruta),
    linha("Despesas Comerciais e Marketing", s("despesa_comercial"), receitaBruta),
    linha("Outros Tributos", s("despesa_tributo"), receitaBruta),
    linha("Outras Despesas Operacionais", s("despesa_outras"), receitaBruta),
  ];

  const resultadoOperacional = lucroBruto - totalDespesas;

  // 6) Linhas "abaixo do operacional": entram/saem de fora da atividade-fim
  // (juros, tarifas bancárias, compra de equipamento) e fecham o resultado.
  const receitasFinanceiras = s("receita_financeira");
  const despesasFinanceiras = s("despesa_financeira");
  const investimentos = s("investimento");

  const resultadoLiquido =
    resultadoOperacional + receitasFinanceiras - despesasFinanceiras - investimentos;

  return {
    receitaBruta,
    receitas,
    deducoes,
    totalDeducoes,
    receitaLiquida,
    custos,
    totalCustos,
    lucroBruto,
    margemBruta,
    despesas,
    totalDespesas,
    resultadoOperacional,
    receitasFinanceiras,
    despesasFinanceiras,
    investimentos,
    resultadoLiquido,
  };
}

/**
 * A soma pesada (SUM por grupo/categoria) acontece aqui, em SQL — o Postgres já
 * devolve os totais prontos, e o JS só faz a classificação/cascata acima.
 * Usada duas vezes no handler: uma pro mês selecionado, outra pro ano inteiro.
 */
async function buscarAgregado(usuarioId: number, inicio: string, fim: string): Promise<AgregadoRow[]> {
  return query<AgregadoRow>(
    `SELECT c.grupo, c.categoria, c.natureza, COALESCE(SUM(l.valor), 0) AS total
     FROM bora_mei_core.lancamentos l
     JOIN bora_mei_core.categorias_financeiras c ON c.id = l.categoria_id
     WHERE l.usuario_id = $1 AND l.data BETWEEN $2 AND $3
     GROUP BY c.grupo, c.categoria, c.natureza`,
    [usuarioId, inicio, fim]
  );
}

interface AgregadoMensalRow extends AgregadoRow {
  mes: number;
}

/**
 * Mesma agregação de `buscarAgregado`, mas com um `GROUP BY` extra por mês
 * (EXTRACT(MONTH FROM l.data)) — em vez de um total único do ano, devolve até
 * 12 conjuntos de linhas (um por mês que teve lançamento). É a base do
 * gráfico "Evolução no ano" da página: sem essa quebra por mês não dá pra
 * desenhar a série temporal, só o total anual.
 */
async function buscarAgregadoPorMes(usuarioId: number, ano: number): Promise<AgregadoMensalRow[]> {
  return query<AgregadoMensalRow>(
    `SELECT EXTRACT(MONTH FROM l.data)::int AS mes, c.grupo, c.categoria, c.natureza, COALESCE(SUM(l.valor), 0) AS total
     FROM bora_mei_core.lancamentos l
     JOIN bora_mei_core.categorias_financeiras c ON c.id = l.categoria_id
     WHERE l.usuario_id = $1 AND l.data BETWEEN $2 AND $3
     GROUP BY mes, c.grupo, c.categoria, c.natureza`,
    [usuarioId, `${ano}-01-01`, `${ano}-12-31`]
  );
}

interface PontoSerieMensal {
  mes: number;
  mesLabel: string;
  receitas: number;
  gastos: number;
  resultadoLiquido: number;
}

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const NOMES_MES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/**
 * Transforma as linhas cruas (já com o mês de cada uma) nos 12 pontos que o
 * gráfico consome. Primeiro agrupa as linhas por mês num Map; depois, PARA
 * CADA um dos 12 meses do ano (mesmo os sem nenhum lançamento — daí o
 * `Array.from({ length: 12 })` em vez de só iterar o Map), roda o mesmo
 * `montarBloco` usado no resto do arquivo, só que aproveita dele apenas dois
 * números: Receita Bruta e Resultado Líquido.
 *
 * Só existem 3 séries no gráfico porque só isso é visualmente necessário:
 * "Gastos" não é um balde novo, é derivado (Receita Bruta − Resultado
 * Líquido) — ou seja, a barra de Gastos e as duas linhas sempre fecham a
 * mesma conta que a tabela detalhada mostra embaixo.
 */
function montarSerieMensal(rows: AgregadoMensalRow[]): PontoSerieMensal[] {
  const porMes = new Map<number, AgregadoRow[]>();
  for (const row of rows) {
    const bucket = porMes.get(row.mes);
    if (bucket) bucket.push(row);
    else porMes.set(row.mes, [row]);
  }

  return Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const bloco = montarBloco(porMes.get(mes) ?? []);
    return {
      mes,
      mesLabel: NOMES_MES_ABREV[i],
      receitas: bloco.receitaBruta,
      // "Gastos" = tudo que reduziu a Receita Bruta até chegar no Resultado Líquido.
      gastos: bloco.receitaBruta - bloco.resultadoLiquido,
      resultadoLiquido: bloco.resultadoLiquido,
    };
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Mesmo padrão de autenticação de /api/categorias e /api/lancamentos:
  // sem cookie de sessão válido, nem chega a tocar no banco.
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: "Não autenticado." }, { status: 401 });
  }

  const agora = new Date();
  const params = request.nextUrl.searchParams;

  // ?ano= e ?mes= são opcionais — um valor ausente ou fora da faixa cai
  // silenciosamente no mês/ano atual (nunca gera 400), mesmo padrão usado
  // em /api/lancamentos para inicio/fim.
  const anoParam = Number(params.get("ano"));
  const ano = Number.isInteger(anoParam) && anoParam >= 2000 && anoParam <= 2100 ? anoParam : agora.getFullYear();

  const mesParam = Number(params.get("mes"));
  const mes = Number.isInteger(mesParam) && mesParam >= 1 && mesParam <= 12 ? mesParam : agora.getMonth() + 1;

  // `new Date(ano, mes, 0)` é o truque clássico pra achar o último dia do
  // mês: o "dia 0" do mês seguinte é o último dia do mês atual.
  const mesStr = String(mes).padStart(2, "0");
  const ultimoDiaMes = new Date(ano, mes, 0).getDate();
  const inicioMes = `${ano}-${mesStr}-01`;
  const fimMes = `${ano}-${mesStr}-${String(ultimoDiaMes).padStart(2, "0")}`;

  const inicioAno = `${ano}-01-01`;
  const fimAno = `${ano}-12-31`;

  // As 3 queries não dependem uma da outra, então rodam em paralelo em vez
  // de sequencialmente — a resposta sai no tempo da mais lenta das três,
  // não na soma das três.
  const [linhasMes, linhasAno, linhasPorMes] = await Promise.all([
    buscarAgregado(usuario.usuarioId, inicioMes, fimMes),
    buscarAgregado(usuario.usuarioId, inicioAno, fimAno),
    buscarAgregadoPorMes(usuario.usuarioId, ano),
  ]);

  // A resposta já sai com tudo calculado (cascata da DRE pro mês e pro ano,
  // mais a série do gráfico) — a página só formata e desenha, não recalcula
  // nada.
  return NextResponse.json({
    periodo: {
      ano,
      mes,
      mesLabel: `${NOMES_MES[mes - 1]} de ${ano}`,
    },
    mensal: montarBloco(linhasMes),
    anual: montarBloco(linhasAno),
    serieMensal: montarSerieMensal(linhasPorMes),
  });
}
