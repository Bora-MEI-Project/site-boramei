"use client";

import { Suspense } from "react";
import CheckoutForm from "@/components/CheckoutForm";

export default function CheckoutPage() {
  return (
    <div className="relative min-h-screen bg-brand-bgLight flex flex-col justify-center items-center p-4 md:p-8 overflow-hidden">
      {/* Mesh gradients: container relative + overflow-hidden evita barra de rolagem das "bolas de luz" */}

      {/* Reflexo verde discreto descendo do canto superior direito */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-green rounded-full blur-[120px] opacity-[0.09] z-0"></div>
      
      {/* Reflexo roxo bem suave subindo do canto inferior esquerdo */}
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-brand-purple rounded-full blur-[120px] opacity-[0.1] z-0"></div>

      {/* Conteúdo principal em z-10 para ficar acima do efeito de luz */}
      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={<div className="text-brand-purple font-bold">Carregando formulário...</div>}>
          <CheckoutForm />
        </Suspense>
      </div>
    </div>
  );
}