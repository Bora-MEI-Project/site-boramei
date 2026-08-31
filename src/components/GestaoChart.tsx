"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// Gráfico "Previsão de faturamento" da aba /financeiro/gestao.
//
// Mesma mecânica do DreChart.tsx (SVG desenhado à mão, sem lib de
// gráficos): eixo Y com passo "limpo", tooltip via <div> posicionado em %
// do viewBox. A diferença é o desenho da barra: cada mês tem duas barras
// SOBREPOSTAS no mesmo eixo (não lado a lado) —
//   - "projeção" (larga, roxo claro, atrás): só existe do mês atual em
//     diante ("meses subsequentes") — pros meses já fechados não faz
//     sentido comparar com uma projeção.
//   - "realizado" (estreita, roxo sólido, na frente): o faturamento de
//     fato lançado naquele mês (parcial e crescendo, no caso do mês atual;
//     zero, nos meses futuros que ainda não chegaram).
// Uma linha tracejada horizontal marca a Meta de faturamento, se definida.
// ─────────────────────────────────────────────────────────────

interface PontoPrevisao {
  mes: number;
  mesLabel: string;
  realizado: number;
  projecao: number;
}

interface GestaoChartProps {
  serie: PontoPrevisao[];
  metaMensal: number | null;
}

const COR_REALIZADO = "#840EC9";
const COR_PROJETADO = "#c9a3e8";
const COR_META = "#00814e";

const LARGURA = 760;
const ALTURA = 240;
const PAD_ESQ = 60;
const PAD_DIR = 16;
const PAD_TOPO = 16;
const PAD_BASE = 28;

const BRL = (n: number): string =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function passoLimpo(bruto: number): number {
  if (bruto <= 0) return 1;
  const exp = Math.floor(Math.log10(bruto));
  const base = bruto / 10 ** exp;
  const baseLimpa = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
  return baseLimpa * 10 ** exp;
}

export default function GestaoChart({ serie, metaMensal }: GestaoChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const bruteMax = Math.max(0, metaMensal ?? 0, ...serie.map((p) => Math.max(p.realizado, p.projecao)));
  const passo = passoLimpo(Math.max(bruteMax, 1) / 4);
  const yMax = Math.max(passo, Math.ceil(bruteMax / passo) * passo);

  const chartW = LARGURA - PAD_ESQ - PAD_DIR;
  const chartH = ALTURA - PAD_TOPO - PAD_BASE;
  const bandW = chartW / serie.length;
  const barWLarga = Math.min(34, bandW * 0.62);
  const barWEstreita = Math.min(15, bandW * 0.28);

  const xCentro = (i: number) => PAD_ESQ + i * bandW + bandW / 2;
  const yEscala = (v: number) => PAD_TOPO + ((yMax - v) / yMax) * chartH;
  const yBase = yEscala(0);

  const ticks: number[] = [];
  for (let v = 0; v <= yMax + 1e-6; v += passo) ticks.push(Math.round(v * 100) / 100);

  const hover = hoverIndex !== null ? serie[hoverIndex] : null;

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap gap-4 text-xs font-medium text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_REALIZADO }} />
          Faturamento realizado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_PROJETADO }} />
          Projeção (mês atual em diante)
        </span>
        {metaMensal !== null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: COR_META, borderTop: `2px dashed ${COR_META}` }} />
            Meta mensal
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full" role="img" aria-label="Previsão de faturamento mensal: realizado sobreposto à projeção">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD_ESQ} x2={LARGURA - PAD_DIR} y1={yEscala(t)} y2={yEscala(t)} stroke="#e1e0d9" strokeWidth={1} />
            <text x={PAD_ESQ - 8} y={yEscala(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#898781">
              {BRL(t)}
            </text>
          </g>
        ))}

        <line x1={PAD_ESQ} x2={LARGURA - PAD_DIR} y1={yBase} y2={yBase} stroke="#c3c2b7" strokeWidth={1} />

        {/* Barra larga de projeção, atrás — só do mês atual em diante */}
        {serie.map((p, i) => {
          if (p.projecao <= 0) return null;
          const h = Math.max(yBase - yEscala(p.projecao), 1);
          return (
            <rect
              key={`proj-${p.mes}`}
              x={xCentro(i) - barWLarga / 2}
              y={yEscala(p.projecao)}
              width={barWLarga}
              height={h}
              rx={3}
              fill={COR_PROJETADO}
              opacity={hoverIndex === null || hoverIndex === i ? 0.9 : 0.4}
            />
          );
        })}

        {/* Barra estreita de realizado, sobreposta na frente */}
        {serie.map((p, i) => {
          const h = Math.max(yBase - yEscala(p.realizado), p.realizado > 0 ? 1 : 0);
          if (h <= 0) return null;
          return (
            <rect
              key={`real-${p.mes}`}
              x={xCentro(i) - barWEstreita / 2}
              y={yEscala(p.realizado)}
              width={barWEstreita}
              height={h}
              rx={2}
              fill={COR_REALIZADO}
              opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.45}
            />
          );
        })}

        {metaMensal !== null && (
          <line
            x1={PAD_ESQ}
            x2={LARGURA - PAD_DIR}
            y1={yEscala(metaMensal)}
            y2={yEscala(metaMensal)}
            stroke={COR_META}
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
        )}

        {serie.map((p, i) => (
          <text key={p.mes} x={xCentro(i)} y={ALTURA - 8} textAnchor="middle" fontSize={10} fill="#898781">
            {p.mesLabel}
          </text>
        ))}

        {serie.map((p, i) => (
          <rect
            key={p.mes}
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
          className="pointer-events-none absolute top-2 z-10 w-48 rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg"
          style={{ left: `${Math.min(78, Math.max(2, (xCentro(hoverIndex) / LARGURA) * 100))}%` }}
        >
          <p className="mb-1 font-semibold text-[#111827]">{hover.mesLabel}</p>
          <p className="flex items-center justify-between gap-2">
            <span className="text-gray-500">Realizado</span>
            <span className="font-semibold tabular-nums text-[#111827]">{BRL(hover.realizado)}</span>
          </p>
          {hover.projecao > 0 && (
            <p className="flex items-center justify-between gap-2">
              <span className="text-gray-500">Projeção</span>
              <span className="font-semibold tabular-nums text-[#111827]">{BRL(hover.projecao)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
