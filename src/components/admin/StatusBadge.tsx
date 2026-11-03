// Selo do usuarios.status (preenchido pelo n8n). Hoje o banco só tem "ativo"
// e "trial"; qualquer outro valor que o n8n passe a gravar cai no estilo
// neutro, exibindo o próprio texto — não quebra a tela.
const ESTILOS: Record<string, string> = {
  ativo: "bg-brand-green/10 text-[#00814e]",
  trial: "bg-amber-50 text-amber-700",
  cancelado: "bg-red-50 text-red-600",
  inadimplente: "bg-red-50 text-red-600",
};

const ROTULOS: Record<string, string> = {
  ativo: "Ativo",
  trial: "Trial",
  cancelado: "Cancelado",
  inadimplente: "Inadimplente",
};

export default function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return <span className="text-xs italic text-gray-400">Sem status</span>;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        ESTILOS[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {ROTULOS[status] ?? status}
    </span>
  );
}
