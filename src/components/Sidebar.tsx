"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, ShieldCheck, Menu, X } from "lucide-react";

const ITENS = [
  { href: "/user", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/seguranca", label: "Segurança", icon: ShieldCheck },
];

/** "/user" só ativa em match exato; os demais também ativam em sub-rotas (ex.: /financeiro/dre). */
function itemAtivo(pathname: string, href: string): boolean {
  return href === "/user" ? pathname === href : pathname.startsWith(href);
}

interface ConteudoProps {
  pathname: string;
  onNavigate?: () => void;
}

function Conteudo({ pathname, onNavigate }: ConteudoProps) {
  return (
    <>
      <Link href="/user" onClick={onNavigate} className="mb-8 flex items-center px-2">
        <img src="/logo-com-nome.svg" alt="BoraMEI" className="h-8 w-auto" />
      </Link>

      <nav className="flex flex-col gap-1">
        {ITENS.map(({ href, label, icon: Icon }) => {
          const ativo = itemAtivo(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition active:scale-[0.98] ${
                ativo
                  ? "bg-brand-purple/10 font-semibold text-brand-purple"
                  : "font-medium text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      {/* Sidebar fixa — desktop */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-r md:border-gray-200 md:bg-white md:px-3 md:py-6">
        <Conteudo pathname={pathname} />
      </aside>

      {/* Botão flutuante que abre o menu — mobile */}
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir menu"
        className="fixed left-4 top-4 z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition active:scale-95 md:hidden"
      >
        <Menu className="h-5 w-5 text-[#111827]" />
      </button>

      {/* Menu em drawer — mobile */}
      {aberto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setAberto(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white px-3 py-6 shadow-xl">
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar menu"
              className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 active:scale-95"
            >
              <X className="h-4 w-4" />
            </button>
            <Conteudo pathname={pathname} onNavigate={() => setAberto(false)} />
          </div>
        </div>
      )}
    </>
  );
}
