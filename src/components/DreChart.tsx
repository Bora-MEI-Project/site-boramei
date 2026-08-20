"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// Gráfico "Evolução no ano" da página /financeiro/dre.
//
// É um SVG desenhado à mão (sem lib de gráficos) combinando:
//   - barras vermelhas  = Gastos
//   - linha roxa        = Receitas
//   - linha verde       = Lucro Líquido
// pros 12 meses do ano selecionado.
//
// A mecânica de um gráfico SVG é sempre a mesma, só muda o desenho:
//   1. Acha o menor/maior valor de todos os pontos (`bruteMin`/`bruteMax`).
//   2. Converte isso num eixo Y "arredondado" (`passoLimpo` + `yMax`/`yMin`),
//      pra não terminar com um eixo tipo "0, 137, 274, 411".
//   3. Duas funções fazem a conversão "valor de negócio" → "pixel na tela":
//      `xCentro(i)` (posição horizontal do mês i) e `yEscala(v)` (posição
//      vertical do valor v). Todo o resto do componente só chama essas duas.
//   4. O estado `hoverIndex` guarda qual mês o mouse/teclado está sobre —
//      usado pra desenhar o crosshair, escurecer as outras barras e mostrar
//      o tooltip com os 3 valores daquele mês.
// ─────────────────────────────────────────────────────────────

interface PontoSerieMensal {
  mes: number;
  mesLabel: string;
  receitas: number;
  gastos: number;
  resultadoLiquido: number;
}

interface DreChartProps {
  serie: PontoSerieMensal[];
}

const COR_RECEITAS = "#840EC9";
const COR_GASTOS = "#ef4444";
const COR_RESULTADO = "#00D37F";

const LARGURA = 760;
const ALTURA = 260;
const PAD_ESQ = 44;
const PAD_DIR = 56;
const PAD_TOPO = 16;
const PAD_BASE = 28;

const numero = (n: number): string => n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

/**
 * Arredonda o passo do eixo Y para um número "limpo" (1/2/5 × 10^n) — o
 * mesmo truque que qualquer lib de gráfico usa por baixo dos panos pra
 * gridlines caírem em 0 / 500 / 1.000 em vez de 0 / 137 / 274. Recebe um
 * tamanho de passo "bruto" (o range dividido em ~4 pedaços) e devolve o
 * múltiplo de 1/2/5 mais próximo na mesma ordem de grandeza.
 */
function passoLimpo(bruto: number): number {
  if (bruto <= 0) return 1;
  const exp = Math.floor(Math.log10(bruto));
  const base = bruto / 10 ** exp;
  const baseLimpa = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
  return baseLimpa * 10 ** exp;
}

export default function DreChart({ serie }: DreChartProps) {
  // Qual mês (índice 0–11) está sob o mouse/foco agora — null quando nenhum.
  // Controla o crosshair, o realce das barras e o tooltip lá embaixo no JSX.
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // ── Eixo Y: acha o range dos dados e "arredonda" pras pontas ──
  // Junta os 3 valores de todo mês numa lista só só pra achar o teto/piso.
  // `Math.max(0, ...)` e `Math.min(0, ...)` garantem que o zero sempre entra
  // no range mesmo se todos os valores forem positivos (ou todos negativos)
  // — é o que faz a "linha de base" fazer sentido visualmente.
  const valores = serie.flatMap((p) => [p.receitas, p.gastos, p.resultadoLiquido]);
  const bruteMax = Math.max(0, ...valores);
  const bruteMin = Math.min(0, ...valores);
  const passo = passoLimpo(Math.max(bruteMax - bruteMin, 1) / 4);
  const yMax = Math.max(passo, Math.ceil(bruteMax / passo) * passo);
  const yMin = Math.min(0, Math.floor(bruteMin / passo) * passo);

  // ── Área útil do desenho, descontando as margens pros eixos/labels ──
  const chartW = LARGURA - PAD_ESQ - PAD_DIR;
  const chartH = ALTURA - PAD_TOPO - PAD_BASE;
  const bandW = chartW / serie.length; // largura reservada pra cada mês
  const barW = Math.min(22, bandW * 0.5); // barra nunca ocupa a faixa inteira

  // As duas funções de escala: todo o resto do componente só sabe desenhar
  // em coordenadas de tela chamando estas duas, nunca fazendo conta de novo.
  const xCentro = (i: number) => PAD_ESQ + i * bandW + bandW / 2;
  const yEscala = (v: number) => PAD_TOPO + ((yMax - v) / (yMax - yMin)) * chartH;
  const yZero = yEscala(0);

  // Uma marcação de gridline a cada `passo`, do piso ao teto do eixo.
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-6; v += passo) ticks.push(Math.round(v * 100) / 100);

  // Monta o atributo `d` de um <path> de linha: "M x,y L x,y L x,y ..." —
  // move até o primeiro ponto, depois desenha reto até cada ponto seguinte.
  const linhaPath = (chave: "receitas" | "resultadoLiquido") =>
    serie.map((p, i) => `${i === 0 ? "M" : "L"} ${xCentro(i)} ${yEscala(p[chave])}`).join(" ");

  const ultimo = serie[serie.length - 1]; // pro rótulo direto no fim de cada linha
  const hover = hoverIndex !== null ? serie[hoverIndex] : null;

  return (
    <div className="relative">
      {/* Legenda — sempre visível para 3 séries, nunca só a cor identifica */}
      <div className="mb-3 flex flex-wrap gap-4 text-xs font-medium text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: COR_RECEITAS }} />
          Receitas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_GASTOS }} />
          Gastos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: COR_RESULTADO }} />
          Lucro Líquido
        </span>
      </div>

      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="w-full" role="img" aria-label="Receitas, gastos e lucro líquido por mês">
        {/* Gridlines horizontais + labels do eixo Y */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_ESQ}
              x2={LARGURA - PAD_DIR}
              y1={yEscala(t)}
              y2={yEscala(t)}
              stroke="#e1e0d9"
              strokeWidth={1}
            />
            <text x={PAD_ESQ - 8} y={yEscala(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#898781">
              {numero(t)}
            </text>
          </g>
        ))}

        {/* Linha de base (zero), mais forte quando há valores negativos */}
        <line x1={PAD_ESQ} x2={LARGURA - PAD_DIR} y1={yZero} y2={yZero} stroke="#c3c2b7" strokeWidth={1} />

        {/* Barras de Gastos — sempre crescem a partir do zero (`y0`), pra
            cima se `gastos` for positivo ou pra baixo se for negativo (caso
            raro, mas possível: ver o comentário sobre "Gastos" na API).
            `Math.max(..., 1)` evita uma barra de altura 0 sumir por completo
            num mês sem nenhum lançamento — ela ainda aparece, só bem fina. */}
        {serie.map((p, i) => {
          const y0 = yEscala(0);
          const y1 = yEscala(p.gastos);
          const y = Math.min(y0, y1);
          const h = Math.max(Math.abs(y1 - y0), 1);
          return (
            <rect
              key={p.mes}
              x={xCentro(i) - barW / 2}
              y={y}
              width={barW}
              height={h}
              rx={3}
              fill={COR_GASTOS}
              opacity={hoverIndex === null || hoverIndex === i ? 0.85 : 0.35}
            />
          );
        })}

        {/* Linha de Receitas */}
        <path d={linhaPath("receitas")} fill="none" stroke={COR_RECEITAS} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* Linha de Resultado Líquido */}
        <path d={linhaPath("resultadoLiquido")} fill="none" stroke={COR_RESULTADO} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Marcadores nos pontos, com anel na cor da superfície para legibilidade */}
        {serie.map((p, i) => (
          <g key={p.mes}>
            <circle cx={xCentro(i)} cy={yEscala(p.receitas)} r={4} fill={COR_RECEITAS} stroke="#F9F9FA" strokeWidth={2} />
            <circle cx={xCentro(i)} cy={yEscala(p.resultadoLiquido)} r={4} fill={COR_RESULTADO} stroke="#F9F9FA" strokeWidth={2} />
          </g>
        ))}

        {/* Rótulos diretos no último ponto — texto sempre em tinta neutra, nunca na cor da série */}
        <text x={xCentro(serie.length - 1) + 8} y={yEscala(ultimo.receitas)} dominantBaseline="middle" fontSize={10} fontWeight={600} fill="#111827">
          {numero(ultimo.receitas)}
        </text>
        <text x={xCentro(serie.length - 1) + 8} y={yEscala(ultimo.resultadoLiquido)} dominantBaseline="middle" fontSize={10} fontWeight={600} fill="#111827">
          {numero(ultimo.resultadoLiquido)}
        </text>

        {/* Eixo X */}
        {serie.map((p, i) => (
          <text key={p.mes} x={xCentro(i)} y={ALTURA - 8} textAnchor="middle" fontSize={10} fill="#898781">
            {p.mesLabel}
          </text>
        ))}

        {/* Faixas de hover/foco por mês: um <rect> invisível cobrindo a
            largura inteira da banda do mês (não só a barrinha fina), pra
            não precisar acertar exatamente em cima da barra ou do ponto da
            linha pra ver o tooltip. `tabIndex={0}` + `onFocus`/`onBlur`
            fazem o mesmo funcionar navegando só com Tab, sem mouse. */}
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

        {/* Crosshair vertical no mês em foco */}
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

      {/* Tooltip: é um <div> HTML normal por cima do SVG (não um elemento
          SVG), o que facilita muito estilizar com Tailwind. A posição
          horizontal é calculada como porcentagem da largura total do
          viewBox (`xCentro(hoverIndex) / LARGURA * 100`) em vez de pixel
          fixo — assim ela acompanha o gráfico mesmo ele sendo redimensionado
          pelo `w-full`. `Math.min(85, Math.max(2, ...))` só evita o tooltip
          vazar pra fora do card nos meses das pontas (janeiro/dezembro).
          Mesmos números do hover já aparecem na tabela abaixo, então nada
          fica escondido atrás do mouse. */}
      {hover && hoverIndex !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-44 rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg"
          style={{
            left: `${Math.min(85, Math.max(2, (xCentro(hoverIndex) / LARGURA) * 100))}%`,
          }}
        >
          <p className="mb-2 font-semibold text-[#111827]">{hover.mesLabel}</p>
          <div className="space-y-1">
            <p className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-gray-500">
                <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: COR_RECEITAS }} />
                Receitas
              </span>
              <span className="font-semibold tabular-nums text-[#111827]">{numero(hover.receitas)}</span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-gray-500">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: COR_GASTOS }} />
                Gastos
              </span>
              <span className="font-semibold tabular-nums text-[#111827]">{numero(hover.gastos)}</span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-gray-500">
                <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: COR_RESULTADO }} />
                Lucro Líquido
              </span>
              <span className="font-semibold tabular-nums text-[#111827]">{numero(hover.resultadoLiquido)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
