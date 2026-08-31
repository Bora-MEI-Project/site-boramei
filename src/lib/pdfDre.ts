import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─────────────────────────────────────────────────────────────
// Exporta a DRE em PDF, 100% no navegador — usa o mesmo JSON já carregado
// pela página (GET /api/dre), sem bater em nenhuma rota nova. Espelha a
// mesma cascata (e a mesma ordem) da tabela em
// src/app/(painel)/financeiro/dre/page.tsx — se a ordem/labels lá mudar,
// atualize aqui também.
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

export interface DreResponse {
  periodo: { ano: number; mes: number; mesLabel: string };
  mensal: BlocoDre;
  anual: BlocoDre;
}

const numero = (n: number): string => n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const numeroResultado = (n: number): string => (n < 0 ? `(${numero(Math.abs(n))})` : numero(n));
const av = (valor: number, base: number): string =>
  base === 0 ? "0%" : `${((valor / base) * 100).toFixed(1)}%`;

interface LinhaPdf {
  label: string;
  valorMes: string;
  avMes: string;
  valorAno: string;
  avAno: string;
  negrito: boolean;
}

function linhaTotal(
  label: string,
  valorMes: number,
  valorAno: number,
  baseMes: number,
  baseAno: number,
  comoResultado = false
): LinhaPdf {
  return {
    label,
    valorMes: comoResultado ? numeroResultado(valorMes) : numero(valorMes),
    avMes: av(valorMes, baseMes),
    valorAno: comoResultado ? numeroResultado(valorAno) : numero(valorAno),
    avAno: av(valorAno, baseAno),
    negrito: true,
  };
}

function linhasItem(mensal: LinhaDre[], anual: LinhaDre[], baseMes: number, baseAno: number): LinhaPdf[] {
  return mensal.map((l, i) => ({
    label: `   ${l.label}`,
    valorMes: numero(l.valor),
    avMes: av(l.valor, baseMes),
    valorAno: numero(anual[i]?.valor ?? 0),
    avAno: av(anual[i]?.valor ?? 0, baseAno),
    negrito: false,
  }));
}

export function gerarPdfDre(dre: DreResponse): void {
  const { mensal, anual, periodo } = dre;
  const baseMes = mensal.receitaBruta;
  const baseAno = anual.receitaBruta;

  const linhas: LinhaPdf[] = [
    linhaTotal("RECEITAS OPERACIONAIS", mensal.receitaBruta, anual.receitaBruta, baseMes, baseAno),
    ...linhasItem(mensal.receitas, anual.receitas, baseMes, baseAno),

    linhaTotal("(-) Deduções da Receita", mensal.totalDeducoes, anual.totalDeducoes, baseMes, baseAno),
    ...linhasItem(mensal.deducoes, anual.deducoes, baseMes, baseAno),

    linhaTotal("(=) RECEITA LÍQUIDA", mensal.receitaLiquida, anual.receitaLiquida, baseMes, baseAno, true),

    linhaTotal("(-) Custos Operacionais", mensal.totalCustos, anual.totalCustos, baseMes, baseAno),
    ...linhasItem(mensal.custos, anual.custos, baseMes, baseAno),

    linhaTotal("(=) LUCRO BRUTO", mensal.lucroBruto, anual.lucroBruto, baseMes, baseAno, true),

    linhaTotal("(-) Despesas Operacionais", mensal.totalDespesas, anual.totalDespesas, baseMes, baseAno),
    ...linhasItem(mensal.despesas, anual.despesas, baseMes, baseAno),

    linhaTotal(
      "(=) RESULTADO OPERACIONAL",
      mensal.resultadoOperacional,
      anual.resultadoOperacional,
      baseMes,
      baseAno,
      true
    ),

    {
      label: "   (+) Receitas Financeiras",
      valorMes: numero(mensal.receitasFinanceiras),
      avMes: av(mensal.receitasFinanceiras, baseMes),
      valorAno: numero(anual.receitasFinanceiras),
      avAno: av(anual.receitasFinanceiras, baseAno),
      negrito: false,
    },
    {
      label: "   (-) Despesas Financeiras",
      valorMes: numero(mensal.despesasFinanceiras),
      avMes: av(mensal.despesasFinanceiras, baseMes),
      valorAno: numero(anual.despesasFinanceiras),
      avAno: av(anual.despesasFinanceiras, baseAno),
      negrito: false,
    },
    {
      label: "   (-) Investimentos",
      valorMes: numero(mensal.investimentos),
      avMes: av(mensal.investimentos, baseMes),
      valorAno: numero(anual.investimentos),
      avAno: av(anual.investimentos, baseAno),
      negrito: false,
    },

    linhaTotal(
      "(=) RESULTADO LÍQUIDO DO PERÍODO",
      mensal.resultadoLiquido,
      anual.resultadoLiquido,
      baseMes,
      baseAno,
      true
    ),
  ];

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("DRE Gerencial — BoraMEI", 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(periodo.mesLabel, 14, 25);

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Receita Bruta (mês): R$ ${numero(mensal.receitaBruta)}`, 14, 34);
  doc.text(`Resultado do Período (mês): R$ ${numeroResultado(mensal.resultadoLiquido)}`, 14, 40);

  autoTable(doc, {
    startY: 46,
    head: [["Descrição", `${periodo.mesLabel} R$`, "AV%", `${periodo.ano} R$`, "AV%"]],
    body: linhas.map((l) => [l.label, l.valorMes, l.avMes, l.valorAno, l.avAno]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [132, 14, 201] }, // brand-purple
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && linhas[data.row.index]?.negrito) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [249, 249, 250]; // brand-bgLight
      }
    },
  });

  doc.save(`dre-${periodo.ano}-${String(periodo.mes).padStart(2, "0")}.pdf`);
}
