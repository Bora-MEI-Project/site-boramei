import Link from "next/link";
import { Users, Search, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import { listarUsuarios, TAMANHO_PAGINA } from "@/lib/admin/usuarios";
import { formatarCentavos, formatarDataIso, formatarTelefone } from "@/lib/admin/formatar";

// ─────────────────────────────────────────────────────────────
// /admin/usuarios — lista com busca, filtro de status e paginação.
// Filtros vivem na URL (?q=&status=&pagina=) via <form method="GET">, então a
// página continua sendo um Server Component e o link filtrado é compartilhável.
// ─────────────────────────────────────────────────────────────

type SearchParams = Promise<{ [chave: string]: string | string[] | undefined }>;

function primeiro(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? "";
}

export default async function AdminUsuariosPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const busca = primeiro(params.q);
  const status = primeiro(params.status);
  const pagina = Math.max(1, Number.parseInt(primeiro(params.pagina), 10) || 1);

  const { usuarios, total, statusDisponiveis } = await listarUsuarios({ busca, status, pagina });
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA));

  const hrefPagina = (destino: number): string => {
    const qs = new URLSearchParams();
    if (busca) qs.set("q", busca);
    if (status) qs.set("status", status);
    if (destino > 1) qs.set("pagina", String(destino));
    const texto = qs.toString();
    return texto ? `/admin/usuarios?${texto}` : "/admin/usuarios";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-20 sm:px-6 sm:pb-10 md:pt-10">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple">
          <Users className="h-6 w-6 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-gray-500">
            {total} {total === 1 ? "usuário encontrado" : "usuários encontrados"}
          </p>
        </div>
      </header>

      <form method="GET" className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            name="q"
            defaultValue={busca}
            placeholder="Nome, e-mail, CPF, WhatsApp ou CNPJ"
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand-purple/60"
          />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="h-10 w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-brand-purple/60 sm:w-40"
          >
            <option value="">Todos os status</option>
            {statusDisponiveis.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-10 cursor-pointer rounded-xl bg-brand-purple px-5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
        >
          Filtrar
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {usuarios.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">Nenhum usuário encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-gray-100 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Usuário</th>
                  <th className="px-3 py-3 font-medium">WhatsApp</th>
                  <th className="px-3 py-3 font-medium">Plano</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Último uso</th>
                  <th className="px-5 py-3 text-right font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((u) => (
                  <tr key={u.id} className="transition hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/usuarios/${u.id}`}
                        className="cursor-pointer font-medium text-[#111827] hover:text-brand-purple hover:underline"
                      >
                        {u.nome}
                      </Link>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      {!u.temSenha && (
                        <p className="mt-0.5 text-xs font-medium text-amber-600">Sem senha definida</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-gray-600">
                      {formatarTelefone(u.whatsapp) ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <p>{u.plano ?? "—"}</p>
                      <p className="text-xs text-gray-500">{formatarCentavos(u.valorPlano) ?? ""}</p>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600">
                      <p>WhatsApp: {u.ultimaMensagemWhatsapp ?? <span className="text-gray-400">nunca</span>}</p>
                      <p>
                        Financeiro:{" "}
                        {formatarDataIso(u.ultimoLancamento) ?? <span className="text-gray-400">nunca</span>}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-600">
                      {u.cadastradoEm ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {totalPaginas > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Paginação">
          <BotaoPagina href={hrefPagina(pagina - 1)} desabilitado={pagina <= 1}>
            <ChevronLeft className="h-4 w-4" /> Anterior
          </BotaoPagina>
          <span className="text-gray-500">
            Página {pagina} de {totalPaginas}
          </span>
          <BotaoPagina href={hrefPagina(pagina + 1)} desabilitado={pagina >= totalPaginas}>
            Próxima <ChevronRight className="h-4 w-4" />
          </BotaoPagina>
        </nav>
      )}
    </div>
  );
}

function BotaoPagina({
  href,
  desabilitado,
  children,
}: {
  href: string;
  desabilitado: boolean;
  children: React.ReactNode;
}) {
  const classe = "flex h-9 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 font-medium";

  if (desabilitado) {
    return <span className={`${classe} cursor-not-allowed text-gray-300`}>{children}</span>;
  }

  return (
    <Link href={href} className={`${classe} cursor-pointer text-gray-600 transition hover:border-brand-purple/40 active:scale-95`}>
      {children}
    </Link>
  );
}
