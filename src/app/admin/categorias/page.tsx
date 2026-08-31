"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────
// /admin/categorias — tela interna, só para o dono do BoraMEI.
// Classifica cada categoria de despesa como fixo/variável (usado no cálculo
// de Ponto de Equilíbrio da aba Gestão, /financeiro/gestao). Não é linkada
// em nenhum lugar do painel do cliente — acesso só pela URL direta, e
// mesmo assim só quem tem o e-mail na allowlist de src/lib/adminAuth.ts
// consegue ver os dados (checagem feita nas rotas /api/admin/categorias).
// ─────────────────────────────────────────────────────────────

type Natureza = "receita" | "despesa";
type TipoCusto = "fixo" | "variavel" | null;

interface Categoria {
  id: number;
  grupo: string;
  nome: string;
  natureza: Natureza;
  tipoCusto: TipoCusto;
}

export default function AdminCategoriasPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [negado, setNegado] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const res = await fetch("/api/admin/categorias");

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (cancelado) return;

      if (res.status === 403) {
        setNegado(true);
        setCarregando(false);
        return;
      }

      const data: { categorias: Categoria[] } = await res.json();
      if (cancelado) return;

      setCategorias(data.categorias);
      setCarregando(false);
    })();

    return () => {
      cancelado = true;
    };
  }, [router]);

  const classificar = async (id: number, tipoCusto: "fixo" | "variavel"): Promise<void> => {
    setSalvandoId(id);
    try {
      const res = await fetch(`/api/admin/categorias/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipoCusto }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        setCategorias((atual) =>
          atual.map((c) => (c.id === id ? { ...c, tipoCusto } : c))
        );
      }
    } finally {
      setSalvandoId(null);
    }
  };

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  if (negado) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Acesso negado.
      </div>
    );
  }

  const despesas = categorias.filter((c) => c.natureza === "despesa");
  const grupos = Array.from(new Set(despesas.map((c) => c.grupo)));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-xl font-bold text-gray-900">Classificação de custos</h1>
      <p className="mb-8 text-sm text-gray-500">
        Marca cada categoria de despesa como fixa ou variável. Usado no cálculo de
        Ponto de Equilíbrio da aba Gestão — categorias sem classificação contam
        como fixas por padrão.
      </p>

      {grupos.map((grupo) => (
        <section key={grupo} className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {grupo}
          </h2>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {despesas
              .filter((c) => c.grupo === grupo)
              .map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-sm text-gray-800">{c.nome}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={salvandoId === c.id}
                      onClick={() => classificar(c.id, "fixo")}
                      className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                        c.tipoCusto === "fixo"
                          ? "bg-brand-purple text-white"
                          : "border border-gray-200 text-gray-500 hover:border-brand-purple/40"
                      }`}
                    >
                      Fixo
                    </button>
                    <button
                      type="button"
                      disabled={salvandoId === c.id}
                      onClick={() => classificar(c.id, "variavel")}
                      className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                        c.tipoCusto === "variavel"
                          ? "bg-brand-purple text-white"
                          : "border border-gray-200 text-gray-500 hover:border-brand-purple/40"
                      }`}
                    >
                      Variável
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
