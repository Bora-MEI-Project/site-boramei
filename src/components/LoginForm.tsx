"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LoginResponse {
  sucesso: boolean;
  mensagem?: string;
}

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.sucesso) {
        setErro(data.mensagem || 'Não foi possível entrar. Tente novamente.');
        setIsLoading(false);
        return;
      }

      router.push('/user');
    } catch {
      setErro('Não foi possível falar com o servidor. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-500">E-mail</span>
          <input
            type="email" name="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="joao@email.com"
            className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            required disabled={isLoading}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-500">Senha</span>
          <input
            type="password" name="senha" value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••••"
            className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
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
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-500">
        Ainda não é assinante?{' '}
        <Link href="/#planos" className="font-medium text-brand-purple hover:underline">
          Conheça os planos
        </Link>
      </p>
    </div>
  );
}
