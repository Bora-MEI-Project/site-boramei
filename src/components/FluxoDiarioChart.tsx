"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// Gráfico "Lançamentos diários" da aba /financeiro (Fluxo de Caixa).
//
// Mesma mecânica hand-rolled em SVG do DreChart.tsx/GestaoChart.tsx — só
// que aqui o eixo X é dia do mês (1..N) em vez de mês do ano, montado
// 100% no cliente a partir da lista de lançamentos que a página já busca
// (não bate em nenhuma API nova). Cada dia:
//   - barra verde pra cima  = Entradas do dia
//   - barra vermelha pra baixo = Saídas do dia
//   - linha roxa = Saldo acumulado no mês até aquele dia
// ─────────────────────────────────────────────────────────────

interface LancamentoResumo {
  data: string; // YYYY-MM-DD
  valor: number;
  natureza: "receita" | "despesa";
}

interface FluxoDiarioChartProps {
  itens: LancamentoResumo[];
  periodo: { inicio: string; fim: string };
}

const COR_ENTRADAS = "#00D37F";
const COR_SAIDAS = "#ef4444";
const COR_SALDO = "#840EC9";

const LARGURA = 760;
const ALTURA = 240;
const PAD_ESQ = 56;
const PAD_DIR = 44;
const PAD_TOPO = 16;
const PAD_BASE = 24;

const numero = (n: number): string => n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const BRL = (n: number): string =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function passoLimpo(bruto: number): number {
  if (bruto <= 0) return 1;
  const exp = Math.floor(Math.log10(bruto));
  const base = bruto / 10 ** exp;
  const baseLimpa = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
  return baseLimpa * 10 ** exp;
}

/** Monta 1 ponto por dia do mês do período — mesmo sem nenhum lançamento naquele dia. */
function montarSerieDiaria(itens: LancamentoResumo[], periodo: { inicio: string; fim: string }) {
  const [ano, mes] = periodo.inicio.split("-").map(Number);
  const diasNoMes = new Date(ano, mes, 0).getDate();

  const porDia = new Map<number, { entradas: number; saidas: number }>();
  for (const it of itens) {
    const dia = Number(it.data.split("-")[2]);
    const acumulado = porDia.get(dia) ?? { entradas: 0, saidas: 0 };
    if (it.natureza === "receita") acumulado.entradas += it.valor;
    else acumulado.saidas += it.valor;
    porDia.set(dia, acumulado);
  }

  let saldo = 0;
  return Array.from({ length: diasNoMes }, (_, i) => {
    const dia = i + 1;
    const { entradas, saidas } = porDia.get(dia) ?? { entradas: 0, saidas: 0 };
    saldo += entradas - saidas;
    return { dia, entradas, saidas, saldoAcumulado: saldo };
  });
}

export default function FluxoDiarioChart({ itens, periodo }: FluxoDiarioChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const serie = montarSerieDiaria(itens, periodo);

  const valoresBarras = serie.flatMap((p) => [p.entradas, -p.saidas]);
  const valoresSaldo = serie.map((p) => p.saldoAcumulado);
  const bruteMax = Math.max(0, ...valoresBarras, ...valoresSaldo);
  const bruteMin = Math.min(0, ...valoresBarras, ...valoresSaldo);
  const passo = passoLimpo(Math.max(bruteMax - bruteMin, 1) / 4);
  const yMax = Math.max(passo, Math.ceil(bruteMax / passo) * passo);
  const yMin = Math.min(0, Math.floor(bruteMin / passo) * passo);

  const chartW = LARGURA - PAD_ESQ - PAD_DIR;
  const chartH = ALTURA - PAD_TOPO - PAD_BASE;
  const bandW = chartW / serie.length;
  const barW = Math.min(10, bandW * 0.55);

  const xCentro = (i: number) => PAD_ESQ + i * bandW + bandW / 2;
  const yEscala = (v: number) => PAD_TOPO + ((yMax - v) / (yMax - yMin)) * chartH;
  const yZero = yEscala(0);

  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-6; v += passo) ticks.push(Math.round(v * 100) / 100);

  // Só rotula alguns dias (1, o último, e múltiplos de um passo) pra não empilhar 31 números.
  const passoLabel = Math.max(1, Math.ceil(serie.length / 10));
  const mostrarLabel = (dia: number) => dia === 1 || dia === serie.length || dia % passoLabel === 0;

  const linhaSaldo = serie.map((p, i) => `${i === 0 ? "M" : "L"} ${xCentro(i)} ${yEscala(p.saldoAcumulado)}`).join(" ");
  const hover = hoverIndex !== null ? serie[hoverIndex] : null;

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap gap-4 text-xs font-medium text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_ENTRADAS }} />
          Entradas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_SAIDAS }} />
          Saídas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: COR_SALDO }} />
          Saldo acumulado
        </span>
      </div>

      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full" role="img" aria-label="Entradas, saídas e saldo acumulado por dia do mês">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD_ESQ} x2={LARGURA - PAD_DIR} y1={yEscala(t)} y2={yEscala(t)} stroke="#e1e0d9" strokeWidth={1} />
            <text x={PAD_ESQ - 8} y={yEscala(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#898781">
              {numero(t)}
            </text>
          </g>
        ))}

        <line x1={PAD_ESQ} x2={LARGURA - PAD_DIR} y1={yZero} y2={yZero} stroke="#c3c2b7" strokeWidth={1} />

        {serie.map((p, i) => (
          <rect
            key={`entrada-${p.dia}`}
            x={xCentro(i) - barW / 2}
            y={yEscala(p.entradas)}
            width={barW}
            height={Math.max(yZero - yEscala(p.entradas), 0)}
            rx={2}
            fill={COR_ENTRADAS}
            opacity={hoverIndex === null || hoverIndex === i ? 0.85 : 0.35}
          />
        ))}
        {serie.map((p, i) => (
          <rect
            key={`saida-${p.dia}`}
            x={xCentro(i) - barW / 2}
            y={yZero}
            width={barW}
            height={Math.max(yEscala(-p.saidas) - yZero, 0)}
            rx={2}
            fill={COR_SAIDAS}
            opacity={hoverIndex === null || hoverIndex === i ? 0.85 : 0.35}
          />
        ))}

        <path d={linhaSaldo} fill="none" stroke={COR_SALDO} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {serie.map((p, i) =>
          mostrarLabel(p.dia) ? (
            <text key={p.dia} x={xCentro(i)} y={ALTURA - 6} textAnchor="middle" fontSize={10} fill="#898781">
              {p.dia}
            </text>
          ) : null
        )}

        {serie.map((p, i) => (
          <rect
            key={p.dia}
            x={PAD_ESQ + i * bandW}
            y={PAD_TOPO}
            width={bandW}
            height={chartH}
            fill="transparent"
            tabIndex={0}
            onMouseEnter={() => setHoverIndex(i)}
            onFocus={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            onBlur={() => setHoverIndex(null)}
          />
        ))}

        {hoverIndex !== null && (
          <line
            x1={xCentro(hoverIndex)}
            x2={xCentro(hoverIndex)}
            y1={PAD_TOPO}
            y2={PAD_TOPO + chartH}
            stroke="#c3c2b7"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {hover && hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-44 rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg"
          style={{ left: `${Math.min(80, Math.max(2, (xCentro(hoverIndex) / LARGURA) * 100))}%` }}
        >
          <p className="mb-2 font-semibold text-[#111827]">Dia {hover.dia}</p>
          <div className="space-y-1">
            <p className="flex items-center justify-between gap-2">
              <span className="text-gray-500">Entradas</span>
              <span className="font-semibold tabular-nums text-[#111827]">{BRL(hover.entradas)}</span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="text-gray-500">Saídas</span>
              <span className="font-semibold tabular-nums text-[#111827]">{BRL(hover.saidas)}</span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="text-gray-500">Saldo acumulado</span>
              <span className="font-semibold tabular-nums text-[#111827]">{BRL(hover.saldoAcumulado)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
