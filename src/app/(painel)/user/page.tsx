"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Phone, Mail, IdCard, TrendingUp } from "lucide-react";

interface Perfil {
  nome: string;
  email: string;
  whatsapp: string;
  cnpj: string | null;
}

/** "81999998888" -> "(81) 99999-8888" */
function formatarTelefone(digits: string): string {
  const v = digits.replace(/\D/g, "");
  if (v.length !== 11) return digits;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}

/** "12345678000199" -> "12.345.678/0001-99" */
function formatarCnpj(digits: string): string {
  const v = digits.replace(/\D/g, "");
  if (v.length !== 14) return digits;
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`;
}

export default function VisaoGeralPage() {
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

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

      setPerfil(data);
      setCarregando(false);
    })();

    return () => {
      cancelado = true;
    };
  }, [router]);

  if (carregando || !perfil) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  const informacoes = [
    { icone: Phone, label: "WhatsApp", valor: formatarTelefone(perfil.whatsapp) },
    { icone: Mail, label: "E-mail", valor: perfil.email },
    ...(perfil.cnpj ? [{ icone: IdCard, label: "CNPJ", valor: formatarCnpj(perfil.cnpj) }] : []),
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-20 sm:px-6 sm:pb-10 md:pt-10">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple">
          <LayoutDashboard className="h-6 w-6 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Visão geral</h1>
          <p className="text-sm text-gray-500">Seus dados de cadastro</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-[#00814e]">
          <TrendingUp className="h-3.5 w-3.5" />
          BoraMEI
        </span>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple text-2xl font-bold text-white">
            {perfil.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-gray-500">Olá,</p>
            <h2 className="text-lg font-bold tracking-tight">{perfil.nome}</h2>
          </div>
        </div>

        <dl className="divide-y divide-gray-100 border-t border-gray-100">
          {informacoes.map(({ icone: Icone, label, valor }) => (
            <div key={label} className="flex items-center gap-3 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-bgLight text-gray-500">
                <Icone className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="truncate text-sm font-medium text-[#111827]">{valor}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
