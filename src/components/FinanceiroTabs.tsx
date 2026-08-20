"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/financeiro", label: "Fluxo de Caixa" },
  { href: "/financeiro/dre", label: "DRE Gerencial" },
];

export default function FinanceiroTabs() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-2">
      {ABAS.map((aba) => {
        const ativa = pathname === aba.href;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
              ativa
                ? "bg-brand-purple text-white"
                : "border border-gray-200 bg-white text-gray-500 hover:border-brand-purple/40"
            }`}
          >
            {aba.label}
          </Link>
        );
      })}
    </nav>
  );
}
