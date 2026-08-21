"use client";

import { useRouter } from "next/navigation";

interface NavbarProps {
  onSubscribeClick?: () => void;
}

export default function Navbar({ onSubscribeClick }: NavbarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Lado Esquerdo: Logo */}
        <div className="flex items-center">
          <img src="/logo-com-nome.svg" className="h-12 w-auto text-brand-purple" />
        </div>

        {/* Centro: Links de Navegação */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#solucoes" className="text-gray-600 hover:text-brand-purple font-medium transition-colors">
            Soluções
          </a>
          <a href="#mei" className="text-gray-600 hover:text-brand-purple font-medium transition-colors">
            MEI
          </a>
          <a href="#sobre" className="text-gray-600 hover:text-brand-purple font-medium transition-colors">
            Sobre
          </a>
          <a href="#planos" className="text-gray-600 hover:text-brand-green font-medium transition-colors">
            Preços
          </a>
        </nav>

        {/* Lado Direito: Botões */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/login")}
            className="text-brand-purple hover:bg-brand-purple/10 font-bold px-5 py-2.5 rounded-full transition-all duration-200 active:scale-95 cursor-pointer"
          >
            Área do Cliente
          </button>
          <button
            onClick={() => router.push("/#planos")}
            className="bg-brand-purple hover:bg-opacity-90 text-white font-bold px-7 py-2.5 rounded-full transition-all duration-200 active:scale-95 shadow-md shadow-purple-100 cursor-pointer"
          >
            Assinar Agora
          </button>
        </div>
      </div>
    </header>
  );
}