"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, TrendingUp, Target, Calculator, AlertTriangle, LineChart } from "lucide-react";
import FinanceiroTabs from "@/components/FinanceiroTabs";
import GestaoChart from "@/components/GestaoChart";

// ─────────────────────────────────────────────────────────────
// /financeiro/gestao — "Como está minha empresa?"
//
// Dados de indicadores/meta vêm de GET /api/gestao?ano=&mes= — mesmo
// seletor de Mês/Ano da DRE (ver src/app/(painel)/financeiro/dre/page.tsx).
// A calculadora de Precificação é 100% local (não bate em nenhuma API).
// ─────────────────────────────────────────────────────────────

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface GestaoResponse {
  periodo: { ano: number; mes: number; mesLabel: string };
  receita: number;
  custos: number;
  lucroEstimado: number;
  margem: number;
  pontoEquilibrio: number | null;
  temCategoriaNaoClassificada: boolean;
  projecaoAnual: number;
  limiteMeiAnual: number;
  receitaAnoAcumulada: number;
  distanciaLimiteMei: number;
  projecaoUltrapassaLimite: boolean;
  metaFaturamentoMensal: number | null;
  progressoMetaPercent: number | null;
  serieMensal: { mes: number; mesLabel: string; realizado: number; projecao: number }[];
}

const BRL = (n: number): string =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const percentual = (n: number): string => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export default function GestaoPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [gestao, setGestao] = useState<GestaoResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  const [metaInput, setMetaInput] = useState("");
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [salvandoMeta, setSalvandoMeta] = useState(false);

  const [custoInput, setCustoInput] = useState("");
  const [margemInput, setMargemInput] = useState("");

  const carregarGestao = useCallback(async (): Promise<boolean> => {
    const res = await fetch(`/api/gestao?ano=${ano}&mes=${mes}`);
    if (res.status === 401) {
      router.push("/login");
      return false;
    }
    if (!res.ok) {
      // Erro do servidor (ex.: migração de banco pendente) — evita tentar
      // fazer JSON.parse numa página de erro HTML, que quebraria feio.
      setErro("Não foi possível carregar os indicadores. Tente novamente em instantes.");
      return false;
    }
    const data: GestaoResponse = await res.json();
    setGestao(data);
    setErro(null);
    return true;
  }, [ano, mes, router]);

  // Refaz a busca sempre que o seletor de Mês/Ano muda — mesmo padrão de
  // `cancelado` da DRE, pra uma resposta atrasada de um período antigo não
  // sobrescrever o estado depois que o usuário já trocou de novo.
  useEffect(() => {
    let cancelado = false;

    (async () => {
      setCarregando(true);
      const ok = await carregarGestao();
      if (!cancelado) setCarregando(false);
      if (!ok) return;
    })();

    return () => {
      cancelado = true;
    };
  }, [carregarGestao]);

  const salvarMeta = async (): Promise<void> => {
    const valor = parseFloat(metaInput.replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0 || salvandoMeta) return;

    setSalvandoMeta(true);
    try {
      const res = await fetch("/api/metas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metaFaturamentoMensal: valor }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        await carregarGestao();
        setEditandoMeta(false);
        setMetaInput("");
      }
    } finally {
      setSalvandoMeta(false);
    }
  };

  // Precificação: puramente local, sem API. margem em % sobre o preço de
  // venda (mesma convenção da "Margem" calculada em /api/dre e /api/gestao —
  // não é markup sobre o custo).
  const precificacao = useMemo(() => {
    const custo = parseFloat(custoInput.replace(",", "."));
    const margem = parseFloat(margemInput.replace(",", "."));
    if (!Number.isFinite(custo) || custo <= 0 || !Number.isFinite(margem)) return null;
    if (margem >= 100) return { invalido: true as const };

    const preco = custo / (1 - margem / 100);
    return { invalido: false as const, preco, lucro: preco - custo };
  }, [custoInput, margemInput]);

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  if (erro || !gestao) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-red-500">
        {erro ?? "Não foi possível carregar os indicadores."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-20 sm:px-6 sm:pb-10 md:pt-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple">
          <BarChart3 className="h-6 w-6 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Gestão</h1>
          <p className="text-sm text-gray-500">Como está minha empresa?</p>
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
      </div>

      {/* Indicadores simples */}
      <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <IndicadorCard titulo="Receita (mês)" valor={BRL(gestao.receita)} />
        <IndicadorCard titulo="Custos (mês)" valor={BRL(gestao.custos)} />
        <IndicadorCard titulo="Lucro estimado (mês)" valor={BRL(gestao.lucroEstimado)} destaque />
        <IndicadorCard titulo="Margem" valor={percentual(gestao.margem)} />
        <IndicadorCard
          titulo="Ponto de equilíbrio"
          valor={gestao.pontoEquilibrio === null ? "—" : BRL(gestao.pontoEquilibrio)}
          nota={
            gestao.temCategoriaNaoClassificada
              ? "Algumas despesas ainda não têm classificação fixo/variável — contando como fixas."
              : undefined
          }
        />
        <IndicadorCard titulo="Projeção anual" valor={BRL(gestao.projecaoAnual)} />
        <IndicadorCard
          titulo="Distância do limite do MEI"
          valor={BRL(gestao.distanciaLimiteMei)}
          alerta={gestao.projecaoUltrapassaLimite}
          nota={
            gestao.projecaoUltrapassaLimite
              ? `Sua projeção anual (${BRL(gestao.projecaoAnual)}) passa do limite de ${BRL(gestao.limiteMeiAnual)}.`
              : `Limite anual do MEI: ${BRL(gestao.limiteMeiAnual)}.`
          }
        />
      </section>

      {/* Previsão de faturamento */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <LineChart className="h-4 w-4 text-brand-purple" />
          <h2 className="text-sm font-semibold text-[#111827]">Previsão de faturamento</h2>
        </div>
        <GestaoChart serie={gestao.serieMensal} metaMensal={gestao.metaFaturamentoMensal} />

        {/* Barra do limite anual do MEI: realizado (sólido) + projeção até o
            fim do ano (listrado), com um marcador no teto de R$81.000. */}
        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between text-xs text-gray-500">
            <span>Acumulado no ano: {BRL(gestao.receitaAnoAcumulada)}</span>
            <span>Limite MEI: {BRL(gestao.limiteMeiAnual)}</span>
          </div>
          {(() => {
            const escala = Math.max(gestao.limiteMeiAnual, gestao.projecaoAnual) * 1.02;
            const pctRealizado = Math.min(100, (gestao.receitaAnoAcumulada / escala) * 100);
            const pctProjecao = Math.min(100, (gestao.projecaoAnual / escala) * 100);
            const pctLimite = Math.min(100, (gestao.limiteMeiAnual / escala) * 100);
            return (
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-brand-purple"
                  style={{ width: `${pctRealizado}%` }}
                />
                <div
                  className={`absolute inset-y-0 rounded-r-full ${
                    gestao.projecaoUltrapassaLimite ? "bg-red-300" : "bg-brand-purple/30"
                  }`}
                  style={{ left: `${pctRealizado}%`, width: `${Math.max(0, pctProjecao - pctRealizado)}%` }}
                />
                <div
                  className="absolute inset-y-0 w-0.5 bg-[#111827]"
                  style={{ left: `${pctLimite}%` }}
                  title={`Limite: ${BRL(gestao.limiteMeiAnual)}`}
                />
              </div>
            );
          })()}
          <p className="mt-2 text-xs text-gray-500">
            Projeção até dezembro: <span className="font-semibold text-[#111827]">{BRL(gestao.projecaoAnual)}</span>
            {gestao.projecaoUltrapassaLimite && (
              <span className="ml-1 font-semibold text-red-600">— passa do limite do MEI</span>
            )}
          </p>
        </div>
      </section>

      {/* Meta de faturamento */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-brand-purple" />
          <h2 className="text-sm font-semibold text-[#111827]">Meta de faturamento</h2>
        </div>

        {gestao.metaFaturamentoMensal && !editandoMeta ? (
          <>
            <div className="mb-2 flex items-baseline justify-between text-sm">
              <span className="text-gray-500">
                {BRL(gestao.receita)} de {BRL(gestao.metaFaturamentoMensal)}
              </span>
              <span className="font-semibold text-brand-purple">
                {percentual(gestao.progressoMetaPercent ?? 0)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-purple transition-all"
                style={{ width: `${Math.min(100, gestao.progressoMetaPercent ?? 0)}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setMetaInput(String(gestao.metaFaturamentoMensal));
                setEditandoMeta(true);
              }}
              className="mt-3 cursor-pointer text-xs font-semibold text-brand-purple hover:underline"
            >
              Editar meta
            </button>
          </>
        ) : (
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={metaInput}
              onChange={(e) => setMetaInput(e.target.value)}
              placeholder="Ex.: 5000"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            />
            <button
              type="button"
              onClick={salvarMeta}
              disabled={salvandoMeta}
              className="h-10 shrink-0 cursor-pointer rounded-lg bg-brand-purple px-4 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvandoMeta ? "Salvando..." : "Salvar"}
            </button>
          </div>
        )}
      </section>

      {/* Precificação */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-brand-purple" />
          <h2 className="text-sm font-semibold text-[#111827]">Precificação</h2>
        </div>
        <p className="mb-4 text-xs text-gray-500">
          Informe o custo e a margem de lucro que você quer sobre o preço de venda.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Custo (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={custoInput}
              onChange={(e) => setCustoInput(e.target.value)}
              placeholder="0,00"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Margem desejada (%)</label>
            <input
              type="number"
              min="0"
              max="99"
              step="1"
              value={margemInput}
              onChange={(e) => setMargemInput(e.target.value)}
              placeholder="30"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            />
          </div>
        </div>

        {precificacao?.invalido && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-red-500">
            <AlertTriangle className="h-4 w-4" />
            A margem precisa ser menor que 100%.
          </p>
        )}

        {precificacao && !precificacao.invalido && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-brand-purple/10 p-3 text-center">
              <p className="text-xs text-gray-500">Preço sugerido</p>
              <p className="text-lg font-bold text-brand-purple">{BRL(precificacao.preco)}</p>
            </div>
            <div className="rounded-xl bg-brand-green/10 p-3 text-center">
              <p className="text-xs text-gray-500">Lucro por venda</p>
              <p className="text-lg font-bold text-[#00814e]">{BRL(precificacao.lucro)}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

interface IndicadorCardProps {
  titulo: string;
  valor: string;
  nota?: string;
  destaque?: boolean;
  alerta?: boolean;
}

function IndicadorCard({ titulo, valor, nota, destaque, alerta }: IndicadorCardProps): ReactNode {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        alerta
          ? "border-amber-200 bg-amber-50"
          : destaque
          ? "border-brand-purple/20 bg-brand-purple/5"
          : "border-gray-200 bg-white"
      }`}
    >
      <p className="mb-1 text-xs font-medium text-gray-500">{titulo}</p>
      <p className={`text-xl font-bold tabular-nums ${alerta ? "text-amber-700" : "text-[#111827]"}`}>
        {valor}
      </p>
      {nota && <p className={`mt-1.5 text-xs ${alerta ? "text-amber-700" : "text-gray-400"}`}>{nota}</p>}
    </div>
  );
}
