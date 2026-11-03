import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, IdCard, CreditCard, Activity } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import { obterUsuario } from "@/lib/admin/usuarios";
import {
  formatarCentavos,
  formatarCnpj,
  formatarCpf,
  formatarDataIso,
  formatarReais,
  formatarTelefone,
} from "@/lib/admin/formatar";

// ─────────────────────────────────────────────────────────────
// /admin/usuarios/[id] — ficha completa de um usuário: cadastro, assinatura
// (dados gravados pelo n8n em usuarios) e uso do produto (WhatsApp,
// Financeiro, NFS-e). Só leitura.
// ─────────────────────────────────────────────────────────────

interface Campo {
  label: string;
  valor: React.ReactNode;
}

export default async function AdminUsuarioDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuarioId = Number(id);
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) notFound();

  const u = await obterUsuario(usuarioId);
  if (!u) notFound();

  const whatsappDigitos = u.whatsapp?.replace(/\D/g, "") ?? "";

  const cadastro: Campo[] = [
    { label: "E-mail", valor: u.email },
    { label: "CPF", valor: formatarCpf(u.cpf) },
    { label: "WhatsApp", valor: formatarTelefone(u.whatsapp) },
    { label: "CNPJ", valor: formatarCnpj(u.cnpj) },
    { label: "Já é MEI", valor: u.eMei ? "Sim" : "Não" },
    { label: "CEP / número", valor: u.cep ? `${u.cep}${u.enderecoNumero ? `, nº ${u.enderecoNumero}` : ""}` : null },
    { label: "Senha do painel", valor: u.temSenha ? "Definida" : "Não definida (pré-cadastro)" },
    { label: "Cadastrado em", valor: u.cadastradoEm },
    { label: "Atualizado em", valor: u.atualizadoEm },
  ];

  const assinatura: Campo[] = [
    { label: "Plano", valor: u.plano },
    { label: "Valor", valor: formatarCentavos(u.valorPlano) },
    { label: "Status", valor: <StatusBadge status={u.status} /> },
    { label: "Status da assinatura", valor: u.statusAssinatura },
    { label: "Trial expira em", valor: u.trialExpiraEm },
    { label: "Assinatura ativada em", valor: u.assinaturaAtivadaEm },
    { label: "Próxima cobrança", valor: formatarDataIso(u.proximaCobranca) },
    { label: "Último pagamento", valor: u.ultimoPagamento },
    {
      label: "Cartão",
      valor: u.cartaoFinal ? `${u.cartaoBandeira ?? "Cartão"} final ${u.cartaoFinal}` : null,
    },
    {
      label: "Última falha de cobrança",
      valor: u.ultimaFalhaCobranca
        ? `${u.ultimaFalhaCobranca}${u.motivoFalha ? ` — ${u.motivoFalha}` : ""}${
            u.tentativas ? ` (${u.tentativas} tentativa${u.tentativas === 1 ? "" : "s"})` : ""
          }`
        : null,
    },
  ];

  const uso: Campo[] = [
    {
      label: "Assistente no WhatsApp",
      valor: u.perfilWhatsapp
        ? `${u.mensagensWhatsapp} mensagens (${u.mensagensWhatsapp30Dias} nos últimos 30 dias)`
        : "Nunca conversou",
    },
    { label: "Última mensagem", valor: u.ultimaMensagemWhatsapp },
    {
      label: "Onboarding no WhatsApp",
      valor: u.onboardingCompleto === null ? null : u.onboardingCompleto ? "Completo" : "Incompleto",
    },
    { label: "Ramo de atuação", valor: u.ramoAtuacao },
    { label: "Cidade", valor: u.municipio ? `${u.municipio}${u.uf ? `/${u.uf}` : ""}` : null },
    {
      label: "Lançamentos no Financeiro",
      valor: `${u.totalLancamentos} (${u.lancamentos30Dias} nos últimos 30 dias)`,
    },
    { label: "Último lançamento", valor: formatarDataIso(u.ultimoLancamento) },
    { label: "Meta de faturamento", valor: formatarReais(u.metaFaturamentoMensal) },
    { label: "NFS-e emitidas", valor: String(u.totalNfse) },
    {
      label: "Certificado digital",
      valor: u.certificadoStatus
        ? `${u.certificadoStatus}, válido até ${formatarDataIso(u.certificadoValidoAte)}`
        : null,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-20 sm:px-6 sm:pb-10 md:pt-10">
      <Link
        href="/admin/usuarios"
        className="mb-6 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-brand-purple active:scale-95"
      >
        <ArrowLeft className="h-4 w-4" /> Usuários
      </Link>

      <header className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple text-xl font-bold text-white">
          {u.nome.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight">{u.nome}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <StatusBadge status={u.status} />
            <span>#{u.id}</span>
          </div>
        </div>
        {whatsappDigitos.length === 11 && (
          <a
            href={`https://wa.me/55${whatsappDigitos}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand-green px-4 text-sm font-semibold text-[#003d25] transition hover:opacity-90 active:scale-95"
          >
            <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
          </a>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Secao titulo="Cadastro" icone={IdCard} campos={cadastro} />
        <Secao titulo="Assinatura" icone={CreditCard} campos={assinatura} />
        <div className="lg:col-span-2">
          <Secao titulo="Uso do produto" icone={Activity} campos={uso} />
        </div>
      </div>
    </div>
  );
}

function Secao({
  titulo,
  icone: Icone,
  campos,
}: {
  titulo: string;
  icone: React.ComponentType<{ className?: string }>;
  campos: Campo[];
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icone className="h-4 w-4 text-brand-purple" />
        {titulo}
      </h2>
      <dl className="divide-y divide-gray-100">
        {campos.map(({ label, valor }) => (
          <div key={label} className="flex items-start justify-between gap-4 py-2.5">
            <dt className="shrink-0 text-xs text-gray-500">{label}</dt>
            <dd
              className={`min-w-0 break-words text-right text-sm ${
                valor ? "font-medium text-[#111827]" : "italic text-gray-400"
              }`}
            >
              {valor ?? "Não informado"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
