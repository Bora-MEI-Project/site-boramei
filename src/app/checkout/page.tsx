"use client";

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CheckoutForm from '@/components/CheckoutForm';

export default function CheckoutPage() {
  return (
    <div className="relative min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 md:p-8 overflow-hidden">
      {/* 1. Transformamos o container pai em relative e colocamos overflow-hidden para as "bolas de luz" não criarem barra de rolagem */}
      
      {/* 🎨 MESH GRADIENTS (Efeito de luz no fundo) */}
      
      {/* Reflexo verde discreto descendo do canto superior direito */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-green rounded-full blur-[120px] opacity-[0.09] z-0"></div>
      
      {/* Reflexo roxo bem suave subindo do canto inferior esquerdo */}
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-brand-purple rounded-full blur-[120px] opacity-[0.1] z-0"></div>

      {/* 2. O conteúdo principal precisa estar com z-10 para ficar por cima do efeito de luz */}
      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={<div className="text-brand-purple font-bold">Carregando formulário...</div>}>
          <CheckoutForm />
        </Suspense>
      </div>
      
    </div>
  );
}