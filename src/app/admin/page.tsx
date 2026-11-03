import Link from "next/link";
import { LayoutDashboard, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  obterCadastrosPorMes,
  obterDistribuicaoPlanos,
  obterResumoUsuarios,
  listarUltimosCadastros,
  type CadastrosMes,
} from "@/lib/admin/usuarios";
import { formatarCentavos, formatarMesCurto } from "@/lib/admin/formatar";

// ─────────────────────────────────────────────────────────────
// /admin — Visão geral dos usuários do BoraMEI.
// Server Component: lê o banco direto (src/lib/admin/usuarios.ts), sem API
// intermediária. Os números são calculados a cada acesso.
// ─────────────────────────────────────────────────────────────

interface Kpi {
  label: string;
  valor: string;
  detalhe: string;
  href?: string;
}

export default async function AdminVisaoGeralPage() {
  const [resumo, cadastrosPorMes, planos, ultimos] = await Promise.all([
    obterResumoUsuarios(),
    obterCadastrosPorMes(6),
    obterDistribuicaoPlanos(),
    listarUltimosCadastros(),
  ]);

  const percentual = (parte: number): string =>
    resumo.total > 0 ? `${Math.round((parte / resumo.total) * 100)}% da base` : "—";

  const kpis: Kpi[] = [
    {
      label: "Usuários",
      valor: String(resumo.total),
      detalhe: `+${resumo.novos30Dias} nos últimos 30 dias`,
      href: "/admin/usuarios",
    },
    {
      label: "Ativos",
      valor: String(resumo.ativos),
      detalhe: percentual(resumo.ativos),
      href: "/admin/usuarios?status=ativo",
    },
    {
      label: "Em trial",
      valor: String(resumo.trial),
      detalhe: percentual(resumo.trial),
      href: "/admin/usuarios?status=trial",
    },
    {
      label: "MRR (ativos)",
      valor: formatarCentavos(resumo.mrrCentavos) ?? "—",
      detalhe: "soma de valor_plano dos ativos",
    },
    {
      label: "Usando o WhatsApp",
      valor: String(resumo.usandoWhatsapp30Dias),
      detalhe: "com mensagem nos últimos 30 dias",
    },
    {
      label: "Usando o Financeiro",
      valor: String(resumo.usandoFinanceiro30Dias),
      detalhe: "com lançamento nos últimos 30 dias",
    },
    {
      label: "Sem senha definida",
      valor: String(resumo.semSenha),
      detalhe: "pré-cadastros que ainda não entraram no painel",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-20 sm:px-6 sm:pb-10 md:pt-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple">
          <LayoutDashboard className="h-6 w-6 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Visão geral</h1>
          <p className="text-sm text-gray-500">Base de usuários do BoraMEI</p>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const conteudo = (
            <>
              <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{kpi.valor}</p>
              <p className="mt-1 text-xs text-gray-400">{kpi.detalhe}</p>
            </>
          );
          const classe = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm";

          return kpi.href ? (
            <Link
              key={kpi.label}
              href={kpi.href}
              className={`${classe} cursor-pointer transition hover:border-brand-purple/40 active:scale-[0.98]`}
            >
              {conteudo}
            </Link>
          ) : (
            <div key={kpi.label} className={classe}>
              {conteudo}
            </div>
          );
        })}
      </section>

      <div className="mb-6 grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="text-sm font-semibold">Cadastros por mês</h2>
          <p className="mb-4 text-xs text-gray-500">Últimos 6 meses</p>
          <GraficoCadastros dados={cadastrosPorMes} />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Planos</h2>
          <ul className="divide-y divide-gray-100">
            {planos.map((p) => (
              <li key={`${p.plano}-${p.status}`} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm">{p.plano ?? "Sem plano"}</p>
                  <StatusBadge status={p.status} />
                </div>
                <span className="text-sm font-semibold tabular-nums">{p.total}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-sm font-semibold">Últimos cadastros</h2>
          <Link
            href="/admin/usuarios"
            className="cursor-pointer text-xs font-semibold text-brand-purple transition hover:underline active:scale-95"
          >
            Ver todos
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-gray-100">
          {ultimos.map((u) => (
            <li key={u.id}>
              <Link
                href={`/admin/usuarios/${u.id}`}
                className="flex cursor-pointer items-center gap-3 px-5 py-3 transition hover:bg-gray-50 active:scale-[0.99]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-sm font-bold text-brand-purple">
                  {u.nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.nome}</p>
                  <p className="truncate text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <StatusBadge status={u.status} />
                  <p className="mt-0.5 text-xs text-gray-400">{u.cadastradoEm}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * Barras em CSS (sem lib de gráficos, como o resto do projeto). Série única,
 * então sem legenda — o título do card nomeia. O valor fica visível só no mês
 * atual (o mais recente); os demais aparecem no tooltip nativo (title) e na
 * tabela para leitores de tela.
 */
function GraficoCadastros({ dados }: { dados: CadastrosMes[] }) {
  const maximo = Math.max(1, ...dados.map((d) => d.total));

  return (
    <>
      <div className="flex h-40 items-end gap-3 border-b border-gray-200" aria-hidden="true">
        {dados.map((d, i) => {
          const atual = i === dados.length - 1;
          return (
            <div
              key={d.mes}
              title={`${formatarMesCurto(d.mes)}: ${d.total} cadastro${d.total === 1 ? "" : "s"}`}
              className="group flex h-full flex-1 flex-col items-center justify-end"
            >
              {atual && (
                <span className="mb-1 text-xs font-semibold tabular-nums text-[#111827]">{d.total}</span>
              )}
              <div
                className={`w-full max-w-10 rounded-t ${
                  atual ? "bg-brand-purple" : "bg-brand-purple/60 group-hover:bg-brand-purple"
                }`}
                style={{ height: `${(d.total / maximo) * 100}%`, minHeight: d.total > 0 ? 2 : 0 }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-3" aria-hidden="true">
        {dados.map((d) => (
          <span key={d.mes} className="flex-1 text-center text-xs text-gray-500">
            {formatarMesCurto(d.mes)}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Cadastros por mês</caption>
        <thead>
          <tr>
            <th>Mês</th>
            <th>Cadastros</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.mes}>
              <td>{formatarMesCurto(d.mes)}</td>
              <td>{d.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
