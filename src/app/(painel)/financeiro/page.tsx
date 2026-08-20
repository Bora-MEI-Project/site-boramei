"use client";

import { useCallback, useEffect, useState, type ReactNode, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import FinanceiroTabs from "@/components/FinanceiroTabs";

// ─────────────────────────────────────────────────────────────
// BoraMEI — Gestor Financeiro / Fluxo de Caixa
// Tokens (definidos em globals.css @theme):
//   brand-purple  #840EC9  · primário
//   brand-green   #00D37F  · secundário
//   brand-bgLight #F9F9FA  · fundo da página
//
// Dados vêm de GET /api/categorias e GET /api/lancamentos.
// Ver docs/api-financeiro.md para o formato completo das respostas.
// ─────────────────────────────────────────────────────────────

type Natureza = "receita" | "despesa";

interface Categoria {
  id: number;
  grupo: string;
  nome: string;
  natureza: Natureza;
}

interface Lancamento {
  id: number;
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  categoriaId: number;
  categoriaNome: string;
  natureza: Natureza;
}

interface Totais {
  entradas: number;
  saidas: number;
  saldo: number;
}

interface Periodo {
  inicio: string;
  fim: string;
}

interface LancamentosResponse {
  periodo: Periodo;
  lancamentos: Lancamento[];
  totais: Totais;
}

const BRL = (n: number): string =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

/** "2026-08-13" -> "13/08" */
const formatarDataCurta = (iso: string): string => {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
};

/** "2026-08-01" -> "Agosto de 2026" */
const formatarMesAno = (isoInicio: string): string => {
  const [ano, mes] = isoInicio.split("-").map(Number);
  const texto = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export default function FinanceiroPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [itens, setItens] = useState<Lancamento[]>([]);
  const [totais, setTotais] = useState<Totais>({ entradas: 0, saidas: 0, saldo: 0 });
  const [periodo, setPeriodo] = useState<Periodo | null>(null);

  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarLancamentos = useCallback(async (): Promise<boolean> => {
    const res = await fetch("/api/lancamentos");
    if (res.status === 401) {
      router.push("/login");
      return false;
    }
    const data: LancamentosResponse = await res.json();
    setItens(data.lancamentos);
    setTotais(data.totais);
    setPeriodo(data.periodo);
    return true;
  }, [router]);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const [resCategorias, autenticado] = await Promise.all([
        fetch("/api/categorias"),
        carregarLancamentos(),
      ]);

      if (cancelado) return;

      if (resCategorias.status === 401 || !autenticado) {
        router.push("/login");
        return;
      }

      const dataCategorias: { categorias: Categoria[] } = await resCategorias.json();
      if (cancelado) return;

      setCategorias(dataCategorias.categorias);
      setCategoriaId((atual) => atual ?? dataCategorias.categorias[0]?.id ?? null);
      setCarregando(false);
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adicionar = async (): Promise<void> => {
    const v = parseFloat(valor);
    if (!desc.trim() || Number.isNaN(v) || v <= 0 || categoriaId === null || enviando) return;

    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: desc.trim(), valor: v, categoriaId }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const data: { mensagem?: string } = await res.json().catch(() => ({}));
        setErro(data.mensagem ?? "Não foi possível adicionar o lançamento.");
        return;
      }

      await carregarLancamentos();
      setDesc("");
      setValor("");
    } finally {
      setEnviando(false);
    }
  };

  const remover = async (id: number): Promise<void> => {
    const res = await fetch(`/api/lancamentos/${id}`, { method: "DELETE" });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.ok) {
      await carregarLancamentos();
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") adicionar();
  };

  const gruposOrdenados = (() => {
    const grupos = Array.from(new Set(categorias.map((c) => c.grupo)));
    return grupos.map((g) => ({
      grupo: g,
      categorias: categorias.filter((c) => c.grupo === g),
    }));
  })();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-20 sm:px-6 sm:pb-10 md:pt-10">
      {/* Cabeçalho */}
        <header className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple">
            <Wallet className="h-6 w-6 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Fluxo de caixa</h1>
            <p className="text-sm text-gray-500">
              {periodo ? formatarMesAno(periodo.inicio) : ""}
            </p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-[#00814e]">
            <TrendingUp className="h-3.5 w-3.5" />
            BoraMEI
          </span>
        </header>

        <FinanceiroTabs />

        {/* Cards de resumo */}
        <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ResumoCard
            titulo="Entradas"
            valor={totais.entradas}
            icone={<ArrowUpRight className="h-5 w-5" />}
            className="bg-brand-green/10 text-[#00814e]"
            valorClass="text-[#006b41]"
          />
          <ResumoCard
            titulo="Saídas"
            valor={totais.saidas}
            icone={<ArrowDownRight className="h-5 w-5" />}
            className="bg-white border border-gray-200 text-gray-600"
            valorClass="text-[#111827]"
          />
          <ResumoCard
            titulo="Saldo"
            valor={totais.saldo}
            icone={<Wallet className="h-5 w-5" />}
            className="bg-brand-purple text-white/80"
            valorClass="text-white"
          />
        </section>

        {/* Novo lançamento */}
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[#111827]">
            Novo lançamento
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_0.8fr_1.2fr_auto] sm:items-end">
            <Campo label="Descrição">
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Venda de serviço"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
              />
            </Campo>

            <Campo label="Valor (R$)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="0,00"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
              />
            </Campo>

            <Campo label="Categoria">
              <select
                value={categoriaId ?? ""}
                onChange={(e) => setCategoriaId(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
              >
                {gruposOrdenados.map(({ grupo, categorias: cats }) => (
                  <optgroup key={grupo} label={grupo}>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Campo>

            <button
              type="button"
              onClick={adicionar}
              disabled={enviando}
              className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand-purple px-4 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              {enviando ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
          {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}
        </section>

        {/* Tabela de lançamentos */}
        <section>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2.5 pr-2 font-semibold">Data</th>
                <th className="py-2.5 pr-2 font-semibold">Descrição</th>
                <th className="py-2.5 pr-2 font-semibold">Categoria</th>
                <th className="py-2.5 pr-2 text-right font-semibold">Valor</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {itens.map((it) => {
                const entrada = it.natureza === "receita";
                return (
                  <tr
                    key={it.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="py-3 pr-2 text-gray-400">
                      {formatarDataCurta(it.data)}
                    </td>
                    <td className="py-3 pr-2 text-[#111827]">{it.descricao}</td>
                    <td className="py-3 pr-2 text-gray-500">
                      {it.categoriaNome}
                    </td>
                    <td
                      className={`py-3 pr-2 text-right font-semibold tabular-nums ${
                        entrada ? "text-[#00814e]" : "text-[#111827]"
                      }`}
                    >
                      {entrada ? "+" : "−"} {BRL(it.valor)}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={() => remover(it.id)}
                        aria-label="Remover lançamento"
                        className="cursor-pointer rounded-md p-1 text-gray-300 transition hover:bg-gray-100 hover:text-red-500 active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {itens.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-sm text-gray-400"
                  >
                    Nenhum lançamento ainda. Adicione o primeiro acima.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
    </div>
  );
}

interface ResumoCardProps {
  titulo: string;
  valor: number;
  icone: ReactNode;
  className?: string;
  valorClass?: string;
}

function ResumoCard({
  titulo,
  valor,
  icone,
  className = "",
  valorClass = "",
}: ResumoCardProps) {
  return (
    <div className={`rounded-2xl p-4 ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium">{titulo}</span>
        {icone}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${valorClass}`}>
        {BRL(valor)}
      </p>
    </div>
  );
}

interface CampoProps {
  label: string;
  children: ReactNode;
}

function Campo({ label, children }: CampoProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}
