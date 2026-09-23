"use client";

import { useEffect, useState } from "react";
import { KeyRound, X } from "lucide-react";

/**
 * O pai monta este componente só enquanto o modal está aberto — assim o
 * formulário já nasce limpo a cada abertura, sem precisar resetar estado.
 */
interface CriarSenhaModalProps {
  onClose: () => void;
  /** Chamado após a senha ser criada e a sessão aberta — leva o usuário para /user. */
  onSucesso: () => void;
}

interface CriarSenhaResponse {
  sucesso: boolean;
  mensagem?: string;
}

const SENHA_MIN_LENGTH = 8;
const INPUT_CLASSES =
  "h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 disabled:bg-gray-50";

/** 000.000.000-00 conforme o usuário digita, igual ao CheckoutForm. */
function formatarCpf(raw: string): string {
  const digitos = raw.replace(/\D/g, "").slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function CriarSenhaModal({ onClose, onSucesso }: CriarSenhaModalProps) {
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);

    const digitosCpf = cpf.replace(/\D/g, "");
    if (digitosCpf.length !== 11) {
      setErro("Informe um CPF válido, com 11 dígitos.");
      return;
    }
    if (senha.length < SENHA_MIN_LENGTH) {
      setErro(`A senha deve ter pelo menos ${SENHA_MIN_LENGTH} caracteres.`);
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não são iguais.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/criar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: digitosCpf, email, senha }),
      });

      const data: CriarSenhaResponse = await response.json();

      if (!response.ok || !data.sucesso) {
        setErro(data.mensagem || "Não foi possível criar sua senha. Tente novamente.");
        setIsLoading(false);
        return;
      }

      onSucesso();
    } catch {
      setErro("Não foi possível falar com o servidor. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-brand-bgLight p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple">
              <KeyRound className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Crie sua senha</h3>
              <p className="text-xs text-gray-500">
                Confirme o CPF e o e-mail usados no pré-cadastro.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 cursor-pointer active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-4 overflow-y-auto p-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">CPF</span>
            <input
              type="text" name="cpf" value={cpf}
              onChange={(e) => setCpf(formatarCpf(e.target.value))}
              placeholder="000.000.000-00" inputMode="numeric"
              className={INPUT_CLASSES}
              required disabled={isLoading}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">E-mail</span>
            <input
              type="email" name="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao@email.com"
              className={INPUT_CLASSES}
              required disabled={isLoading}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Nova senha</span>
            <input
              type="password" name="senha" value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo de 8 caracteres" minLength={SENHA_MIN_LENGTH}
              className={INPUT_CLASSES}
              required disabled={isLoading}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Confirmar senha</span>
            <input
              type="password" name="confirmarSenha" value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a senha" minLength={SENHA_MIN_LENGTH}
              className={INPUT_CLASSES}
              required disabled={isLoading}
            />
          </label>

          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-purple text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 cursor-pointer"
          >
            {isLoading ? "Criando senha..." : "Criar senha e entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
