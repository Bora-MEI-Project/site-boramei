"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, KeyRound, Check } from "lucide-react";

interface Perfil {
  nome: string;
  email: string;
  whatsapp: string;
  cnpj: string | null;
}

/** Máscara progressiva de telefone enquanto o usuário digita: "81999998888" -> "(81) 99999-8888" */
function formatarTelefoneInput(raw: string): string {
  let v = raw.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  else if (v.length > 0) v = `(${v}`;
  return v;
}

/** Máscara progressiva de CNPJ enquanto o usuário digita. */
function formatarCnpjInput(raw: string): string {
  let v = raw.replace(/\D/g, "");
  if (v.length > 14) v = v.slice(0, 14);
  if (v.length > 12) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5");
  else if (v.length > 8) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, "$1.$2.$3/$4");
  else if (v.length > 5) v = v.replace(/(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3");
  else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,3})/, "$1.$2");
  return v;
}

export default function SegurancaPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);

  // Formulário "Dados de contato"
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [senhaContato, setSenhaContato] = useState("");
  const [enviandoContato, setEnviandoContato] = useState(false);
  const [erroContato, setErroContato] = useState<string | null>(null);
  const [sucessoContato, setSucessoContato] = useState(false);

  // Formulário "Alterar senha"
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [enviandoSenha, setEnviandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [sucessoSenha, setSucessoSenha] = useState(false);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const res = await fetch("/api/usuario");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data: Perfil = await res.json();
      if (cancelado) return;

      setEmail(data.email);
      setWhatsapp(formatarTelefoneInput(data.whatsapp));
      setCnpj(data.cnpj ? formatarCnpjInput(data.cnpj) : "");
      setCarregando(false);
    })();

    return () => {
      cancelado = true;
    };
  }, [router]);

  const salvarContato = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErroContato(null);
    setSucessoContato(false);
    setEnviandoContato(true);

    try {
      const res = await fetch("/api/usuario", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual: senhaContato, email, whatsapp, cnpj }),
      });

      if (res.status === 401) {
        const data: { mensagem?: string } = await res.json().catch(() => ({}));
        // 401 aqui pode ser sessão expirada OU senha atual incorreta — o texto
        // que o servidor manda já distingue os dois casos pro usuário.
        setErroContato(data.mensagem ?? "Não foi possível confirmar sua senha.");
        return;
      }
      if (!res.ok) {
        const data: { mensagem?: string } = await res.json().catch(() => ({}));
        setErroContato(data.mensagem ?? "Não foi possível salvar as alterações.");
        return;
      }

      setSenhaContato("");
      setSucessoContato(true);
    } finally {
      setEnviandoContato(false);
    }
  };

  const trocarSenha = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErroSenha(null);
    setSucessoSenha(false);

    if (novaSenha.length < 8) {
      setErroSenha("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setErroSenha("As senhas não coincidem.");
      return;
    }

    setEnviandoSenha(true);
    try {
      const res = await fetch("/api/usuario/senha", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      if (!res.ok) {
        const data: { mensagem?: string } = await res.json().catch(() => ({}));
        setErroSenha(data.mensagem ?? "Não foi possível trocar a senha.");
        return;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
      setSucessoSenha(true);
    } finally {
      setEnviandoSenha(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-20 sm:px-6 sm:pb-10 md:pt-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple">
          <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Segurança</h1>
          <p className="text-sm text-gray-500">Dados de contato e senha de acesso</p>
        </div>
      </header>

      {/* Dados de contato */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 text-sm font-semibold text-[#111827]">Dados de contato</h2>
        <p className="mb-5 text-xs text-gray-500">
          Pra confirmar qualquer alteração aqui, informe sua senha atual.
        </p>

        <form className="space-y-4" onSubmit={salvarContato}>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={enviandoContato}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">WhatsApp</span>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatarTelefoneInput(e.target.value))}
              placeholder="(11) 99999-9999"
              required
              disabled={enviandoContato}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">CNPJ (opcional)</span>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(formatarCnpjInput(e.target.value))}
              placeholder="00.000.000/0000-00"
              disabled={enviandoContato}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            />
          </label>

          <label className="block border-t border-gray-100 pt-4">
            <span className="mb-1 block text-xs font-medium text-gray-500">Sua senha atual</span>
            <input
              type="password"
              value={senhaContato}
              onChange={(e) => setSenhaContato(e.target.value)}
              placeholder="••••••••"
              required
              disabled={enviandoContato}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            />
          </label>

          {erroContato && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {erroContato}
            </div>
          )}
          {sucessoContato && (
            <div className="flex items-center gap-1.5 rounded-lg border border-brand-green/20 bg-brand-green/10 px-3 py-2.5 text-sm text-[#00814e]">
              <Check className="h-4 w-4" />
              Dados atualizados com sucesso.
            </div>
          )}

          <button
            type="submit"
            disabled={enviandoContato}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-purple text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 cursor-pointer"
          >
            {enviandoContato ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </section>

      {/* Alterar senha */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-1 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-[#111827]">Alterar senha</h2>
        </div>
        <p className="mb-5 text-xs text-gray-500">
          Pra trocar sua senha, informe a senha atual e a nova senha desejada.
        </p>

        <form className="space-y-4" onSubmit={trocarSenha}>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Senha atual</span>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="••••••••"
              required
              disabled={enviandoSenha}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Nova senha</span>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
                required
                minLength={8}
                disabled={enviandoSenha}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Confirme a nova senha</span>
              <input
                type="password"
                value={confirmarNovaSenha}
                onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                placeholder="Repita a nova senha"
                required
                minLength={8}
                disabled={enviandoSenha}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
              />
            </label>
          </div>

          {erroSenha && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {erroSenha}
            </div>
          )}
          {sucessoSenha && (
            <div className="flex items-center gap-1.5 rounded-lg border border-brand-green/20 bg-brand-green/10 px-3 py-2.5 text-sm text-[#00814e]">
              <Check className="h-4 w-4" />
              Senha alterada com sucesso.
            </div>
          )}

          <button
            type="submit"
            disabled={enviandoSenha}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-purple text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 cursor-pointer"
          >
            {enviandoSenha ? "Trocando..." : "Trocar senha"}
          </button>
        </form>
      </section>
    </div>
  );
}
