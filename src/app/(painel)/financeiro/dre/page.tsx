"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileBarChart, TrendingUp, Download } from "lucide-react";
import FinanceiroTabs from "@/components/FinanceiroTabs";
import DreChart from "@/components/DreChart";
import FluxoDiarioChart from "@/components/FluxoDiarioChart";
import { gerarPdfDre } from "@/lib/pdfDre";

// ─────────────────────────────────────────────────────────────
// /financeiro/dre — DRE Gerencial
//
// Como funciona, de cima a baixo neste arquivo:
//   1. Os tipos `LinhaDre`/`BlocoDre`/`PontoSerieMensal`/`DreResponse`
//      espelham exatamente o JSON que GET /api/dre devolve (ver
//      src/app/api/dre/route.ts) — a página não recalcula nada, só formata
//      e desenha o que já vem pronto do servidor.
//   2. Helpers de formatação (`numero`, `numeroResultado`, `percentual`) e
//      `zipLinhas` (junta a coluna do mês com a do ano lado a lado).
//   3. `SecaoRow` / `ItemRow`: as duas "fôrmas" de linha da tabela — uma
//      para os totais em negrito (RECEITA LÍQUIDA, LUCRO BRUTO...) e outra
//      para os itens detalhados abaixo de cada total.
//   4. `DrePage`: busca os dados em `/api/dre?ano=&mes=` toda vez que o
//      usuário troca o seletor de Mês/Ano, e renderiza cabeçalho → abas →
//      seletor de período → cards de resumo → gráfico → tabela.
// ─────────────────────────────────────────────────────────────

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

interface PontoSerieMensal {
  mes: number;
  mesLabel: string;
  receitas: number;
  gastos: number;
  resultadoLiquido: number;
}

interface DreResponse {
  periodo: { ano: number; mes: number; mesLabel: string };
  mensal: BlocoDre;
  anual: BlocoDre;
  serieMensal: PontoSerieMensal[];
}

interface LancamentoResumo {
  data: string; // YYYY-MM-DD
  valor: number;
  natureza: "receita" | "despesa";
}

/** "2026-09" + dia 30 -> "2026-09-01".."2026-09-30", pra buscar os lançamentos do mês selecionado no seletor. */
function periodoDoMes(ano: number, mes: number): { inicio: string; fim: string } {
  const mesStr = String(mes).padStart(2, "0");
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return { inicio: `${ano}-${mesStr}-01`, fim: `${ano}-${mesStr}-${String(ultimoDia).padStart(2, "0")}` };
}

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Número inteiro no formato brasileiro (ponto de milhar), sem casas decimais — igual ao print de referência. */
const numero = (n: number): string =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

/** Números negativos aparecem entre parênteses, no padrão contábil do print de referência. */
const numeroResultado = (n: number): string => (n < 0 ? `(${numero(Math.abs(n))})` : numero(n));

/** Percentual com no máximo 1 casa decimal, sem ".0" sobrando (16% em vez de 16.0%). */
const percentual = (n: number): string => {
  const arredondado = Math.round(n * 10) / 10;
  return `${arredondado % 1 === 0 ? arredondado.toFixed(0) : arredondado.toFixed(1)}%`;
};

/**
 * A API devolve dois blocos separados (`mensal` e `anual`), cada um com seu
 * próprio array `receitas`/`deducoes`/`despesas`/etc. Como os dois arrays
 * sempre têm as mesmas linhas na mesma ordem (a lista de labels é fixa, vem
 * de src/app/api/dre/route.ts), basta juntar por índice — não precisa achar
 * por nome — pra virar uma linha só com as colunas de mês e de ano lado a
 * lado, que é como a tabela é desenhada.
 */
function zipLinhas(mensal: LinhaDre[], anual: LinhaDre[]) {
  return mensal.map((linha, i) => ({
    label: linha.label,
    valorMes: linha.valor,
    avMes: linha.avPercent,
    valorAno: anual[i]?.valor ?? 0,
    avAno: anual[i]?.avPercent ?? 0,
  }));
}

interface SecaoRowProps {
  label: string;
  valorMes: number;
  avMes: number;
  valorAno: number;
  avAno: number;
  tom: "receita" | "reducao" | "resultado";
}

/**
 * Linha de TOTAL da DRE (RECEITAS OPERACIONAIS, RECEITA LÍQUIDA, LUCRO
 * BRUTO...): fundo levemente destacado, negrito, 4 colunas de valor (R$ e
 * AV% do mês, R$ e AV% do ano). A cor depende do `tom`:
 *   - "receita"   → sempre neutra (é uma entrada, não precisa de ênfase)
 *   - "reducao"   → sempre vermelha (deduções/custos/despesas)
 *   - "resultado" → verde se o valor for positivo, vermelha se negativo
 *     (e aí também aparece entre parênteses — ver `numeroResultado`)
 */
function SecaoRow({ label, valorMes, avMes, valorAno, avAno, tom }: SecaoRowProps) {
  const cor =
    tom === "reducao"
      ? "text-red-600"
      : tom === "resultado"
      ? valorMes < 0
        ? "text-red-700"
        : "text-[#00814e]"
      : "text-[#111827]";

  return (
    <tr className="border-b border-gray-200 bg-brand-bgLight/60 font-bold">
      <td className="py-2.5 pl-2">{label}</td>
      <td className={`py-2.5 pr-2 text-right tabular-nums ${cor}`}>
        {tom === "resultado" ? numeroResultado(valorMes) : numero(valorMes)}
      </td>
      <td className="py-2.5 pr-2 text-right text-xs text-gray-400 tabular-nums">{percentual(avMes)}</td>
      <td className={`py-2.5 pr-2 text-right tabular-nums ${cor}`}>
        {tom === "resultado" ? numeroResultado(valorAno) : numero(valorAno)}
      </td>
      <td className="py-2.5 pr-2 text-right text-xs text-gray-400 tabular-nums">{percentual(avAno)}</td>
    </tr>
  );
}

interface ItemRowProps {
  label: string;
  valorMes: number;
  avMes: number;
  valorAno: number;
  avAno: number;
  reducao?: boolean;
}

/**
 * Linha de DETALHE, sempre indentada logo abaixo de um `SecaoRow` (ex.:
 * "Despesas com Pessoal" e "Despesas Administrativas" abaixo do total
 * "(-) Despesas Operacionais"). `reducao` só troca a cor pra vermelho —
 * o restante do visual (peso, indentação) é sempre o mesmo.
 */
function ItemRow({ label, valorMes, avMes, valorAno, avAno, reducao }: ItemRowProps) {
  const cor = reducao ? "text-red-500" : "text-gray-600";
  return (
    <tr className="border-b border-gray-100 text-sm">
      <td className="py-2 pl-6 text-gray-500">{label}</td>
      <td className={`py-2 pr-2 text-right tabular-nums ${cor}`}>{numero(valorMes)}</td>
      <td className="py-2 pr-2 text-right text-xs text-gray-400 tabular-nums">{percentual(avMes)}</td>
      <td className={`py-2 pr-2 text-right tabular-nums ${cor}`}>{numero(valorAno)}</td>
      <td className="py-2 pr-2 text-right text-xs text-gray-400 tabular-nums">{percentual(avAno)}</td>
    </tr>
  );
}

export default function DrePage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [dre, setDre] = useState<DreResponse | null>(null);
  const [lancamentosMes, setLancamentosMes] = useState<LancamentoResumo[]>([]);
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  // Refaz a busca sempre que `ano` ou `mes` mudam (troca no seletor de
  // período). `cancelado` evita o clássico bug de setState em componente
  // desmontado/trocado: se o usuário mudar o mês de novo antes da resposta
  // anterior chegar, essa resposta antiga é descartada em vez de sobrescrever
  // o estado com um período que não é mais o selecionado.
  //
  // Além de /api/dre (os totais agregados), busca também /api/lancamentos
  // no intervalo do mês selecionado — só pra alimentar o gráfico "Lançamentos
  // diários" abaixo, que precisa do detalhe dia a dia (a DRE só devolve
  // totais por grupo/categoria, nunca por dia).
  useEffect(() => {
    let cancelado = false;

    (async () => {
      setCarregando(true);
      const { inicio, fim } = periodoDoMes(ano, mes);
      const [resDre, resLancamentos] = await Promise.all([
        fetch(`/api/dre?ano=${ano}&mes=${mes}`),
        fetch(`/api/lancamentos?inicio=${inicio}&fim=${fim}`),
      ]);

      if (resDre.status === 401 || resLancamentos.status === 401) {
        router.push("/login");
        return;
      }

      const data: DreResponse = await resDre.json();
      const dataLancamentos: { lancamentos: LancamentoResumo[] } = await resLancamentos.json();
      if (cancelado) return;

      setDre(data);
      setLancamentosMes(dataLancamentos.lancamentos);
      setCarregando(false);
    })();

    return () => {
      cancelado = true;
    };
  }, [ano, mes, router]);

  if (carregando || !dre) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  const { mensal, anual } = dre;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-20 sm:px-6 sm:pb-10 md:pt-10">
      {/* Cabeçalho */}
        <header className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple">
            <FileBarChart className="h-6 w-6 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">DRE Gerencial</h1>
            <p className="text-sm text-gray-500">{dre.periodo.mesLabel}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-[#00814e]">
            <TrendingUp className="h-3.5 w-3.5" />
            BoraMEI
          </span>
        </header>

        <FinanceiroTabs />

        {/* Seletor de período */}
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
          >
            {NOMES_MES.map((nome, i) => (
              <option key={nome} value={i + 1}>
                {nome}
              </option>
            ))}
          </select>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
          >
            {[anoAtual - 1, anoAtual, anoAtual + 1].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => gerarPdfDre(dre)}
            className="ml-auto flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:border-brand-purple/40 active:scale-95"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>

        {/* Cards de resumo (mês selecionado) */}
        <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium text-gray-500">Receita Bruta</span>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#111827]">{numero(mensal.receitaBruta)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-medium text-gray-500">Resultado do Período</span>
            <p
              className={`mt-2 text-2xl font-bold tabular-nums ${
                mensal.resultadoLiquido < 0 ? "text-red-700" : "text-[#00814e]"
              }`}
            >
              {numeroResultado(mensal.resultadoLiquido)}
            </p>
          </div>
        </section>

        {/* Gráfico: entradas, saídas e saldo dia a dia do mês selecionado no seletor acima */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-1 text-sm font-semibold text-[#111827]">Lançamentos diários — {dre.periodo.mesLabel}</h2>
          <FluxoDiarioChart itens={lancamentosMes} periodo={periodoDoMes(ano, mes)} />
        </section>

        {/* Gráfico: receitas, gastos e lucro líquido ao longo do ano */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-1 text-sm font-semibold text-[#111827]">Evolução no ano — {ano}</h2>
          <DreChart serie={dre.serieMensal} />
        </section>

        {/* Tabela DRE — cada bloco abaixo é a mesma cascata calculada em
            montarBloco() (src/app/api/dre/route.ts): um SecaoRow com o
            total, seguido pelos ItemRow do detalhamento daquele total. A
            ordem aqui é a ordem contábil (Receita Bruta → Deduções →
            Receita Líquida → Custos → Lucro Bruto → Despesas → Resultado
            Operacional → Financeiro/Investimentos → Resultado Líquido),
            não pode ser reordenada sem também reordenar a lógica da API. */}
        <section className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2.5 pl-2 font-semibold">Descrição</th>
                <th className="py-2.5 pr-2 text-right font-semibold" colSpan={2}>
                  {dre.periodo.mesLabel}
                </th>
                <th className="py-2.5 pr-2 text-right font-semibold" colSpan={2}>
                  {dre.periodo.ano}
                </th>
              </tr>
            </thead>
            <tbody>
              <SecaoRow
                label="RECEITAS OPERACIONAIS"
                valorMes={mensal.receitaBruta}
                avMes={100}
                valorAno={anual.receitaBruta}
                avAno={100}
                tom="receita"
              />
              {zipLinhas(mensal.receitas, anual.receitas).map((l) => (
                <ItemRow key={l.label} {...l} />
              ))}

              <SecaoRow
                label="(-) Deduções da Receita"
                valorMes={mensal.totalDeducoes}
                avMes={mensal.receitaBruta === 0 ? 0 : (mensal.totalDeducoes / mensal.receitaBruta) * 100}
                valorAno={anual.totalDeducoes}
                avAno={anual.receitaBruta === 0 ? 0 : (anual.totalDeducoes / anual.receitaBruta) * 100}
                tom="reducao"
              />
              {zipLinhas(mensal.deducoes, anual.deducoes).map((l) => (
                <ItemRow key={l.label} {...l} reducao />
              ))}

              <SecaoRow
                label="(=) RECEITA LÍQUIDA"
                valorMes={mensal.receitaLiquida}
                avMes={mensal.receitaBruta === 0 ? 0 : (mensal.receitaLiquida / mensal.receitaBruta) * 100}
                valorAno={anual.receitaLiquida}
                avAno={anual.receitaBruta === 0 ? 0 : (anual.receitaLiquida / anual.receitaBruta) * 100}
                tom="resultado"
              />

              <SecaoRow
                label="(-) Custos Operacionais"
                valorMes={mensal.totalCustos}
                avMes={mensal.receitaBruta === 0 ? 0 : (mensal.totalCustos / mensal.receitaBruta) * 100}
                valorAno={anual.totalCustos}
                avAno={anual.receitaBruta === 0 ? 0 : (anual.totalCustos / anual.receitaBruta) * 100}
                tom="reducao"
              />
              {zipLinhas(mensal.custos, anual.custos).map((l) => (
                <ItemRow key={l.label} {...l} reducao />
              ))}

              <SecaoRow
                label="(=) LUCRO BRUTO"
                valorMes={mensal.lucroBruto}
                avMes={mensal.receitaBruta === 0 ? 0 : (mensal.lucroBruto / mensal.receitaBruta) * 100}
                valorAno={anual.lucroBruto}
                avAno={anual.receitaBruta === 0 ? 0 : (anual.lucroBruto / anual.receitaBruta) * 100}
                tom="resultado"
              />
              <tr className="border-b border-gray-100 text-sm italic">
                <td className="py-2 pl-6 text-gray-400">(%) Margem Bruta</td>
                <td className="py-2 pr-2 text-right tabular-nums text-gray-400" colSpan={2}>
                  {mensal.margemBruta.toFixed(2)}%
                </td>
                <td className="py-2 pr-2 text-right tabular-nums text-gray-400" colSpan={2}>
                  {anual.margemBruta.toFixed(2)}%
                </td>
              </tr>

              <SecaoRow
                label="(-) Despesas Operacionais"
                valorMes={mensal.totalDespesas}
                avMes={mensal.receitaBruta === 0 ? 0 : (mensal.totalDespesas / mensal.receitaBruta) * 100}
                valorAno={anual.totalDespesas}
                avAno={anual.receitaBruta === 0 ? 0 : (anual.totalDespesas / anual.receitaBruta) * 100}
                tom="reducao"
              />
              {zipLinhas(mensal.despesas, anual.despesas).map((l) => (
                <ItemRow key={l.label} {...l} reducao />
              ))}

              <SecaoRow
                label="(=) RESULTADO OPERACIONAL"
                valorMes={mensal.resultadoOperacional}
                avMes={mensal.receitaBruta === 0 ? 0 : (mensal.resultadoOperacional / mensal.receitaBruta) * 100}
                valorAno={anual.resultadoOperacional}
                avAno={anual.receitaBruta === 0 ? 0 : (anual.resultadoOperacional / anual.receitaBruta) * 100}
                tom="resultado"
              />

              <ItemRow
                label="(+) Receitas Financeiras"
                valorMes={mensal.receitasFinanceiras}
                avMes={mensal.receitaBruta === 0 ? 0 : (mensal.receitasFinanceiras / mensal.receitaBruta) * 100}
                valorAno={anual.receitasFinanceiras}
                avAno={anual.receitaBruta === 0 ? 0 : (anual.receitasFinanceiras / anual.receitaBruta) * 100}
              />
              <ItemRow
                label="(-) Despesas Financeiras"
                valorMes={mensal.despesasFinanceiras}
                avMes={mensal.receitaBruta === 0 ? 0 : (mensal.despesasFinanceiras / mensal.receitaBruta) * 100}
                valorAno={anual.despesasFinanceiras}
                avAno={anual.receitaBruta === 0 ? 0 : (anual.despesasFinanceiras / anual.receitaBruta) * 100}
                reducao
              />
              <ItemRow
                label="(-) Investimentos"
                valorMes={mensal.investimentos}
                avMes={mensal.receitaBruta === 0 ? 0 : (mensal.investimentos / mensal.receitaBruta) * 100}
                valorAno={anual.investimentos}
                avAno={anual.receitaBruta === 0 ? 0 : (anual.investimentos / anual.receitaBruta) * 100}
                reducao
              />

              <SecaoRow
                label="(=) RESULTADO LÍQUIDO DO PERÍODO"
                valorMes={mensal.resultadoLiquido}
                avMes={mensal.receitaBruta === 0 ? 0 : (mensal.resultadoLiquido / mensal.receitaBruta) * 100}
                valorAno={anual.resultadoLiquido}
                avAno={anual.receitaBruta === 0 ? 0 : (anual.resultadoLiquido / anual.receitaBruta) * 100}
                tom="resultado"
              />
            </tbody>
          </table>
          <p className="mt-4 text-xs text-gray-400">
            Base: lançamentos registrados no fluxo de caixa. Valores em R$, sem centavos. AV% é o percentual sobre a
            Receita Bruta do período.
          </p>
        </section>
    </div>
  );
}
