"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Pricing() {
  const router = useRouter();
  const [activeCard, setActiveCard] = useState(0);

  return (
    <section className="py-20 bg-white" id="planos">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Cabeçalho da Seção */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Planos Simples e Transparentes
          </h2>
          <p className="text-gray-500 text-lg">
            Escolha o plano que melhor atende ao momento do seu negócio.
          </p>
        </div>

        {/* Container Principal */}
        <div className="flex items-center justify-center gap-2 mt-12">
          
          {/* SETA ESQUERDA (Some apenas no LG) */}
          <button 
            onClick={() => setActiveCard((prev) => Math.max(0, prev - 1))}
            disabled={activeCard === 0}
            className={`lg:hidden p-2 rounded-full bg-gray-100 text-brand-purple transition-all z-10 ${
              activeCard === 0 ? 'opacity-30 cursor-not-allowed' : 'active:scale-90 cursor-pointer hover:bg-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* ÁREA DOS CARDS */}
          <div className="w-full max-w-sm lg:max-w-none overflow-hidden lg:overflow-visible pt-6 -mt-6">
            
            {/* TRILHO DA ANIMAÇÃO */}
            <div 
              className={`flex transition-transform duration-500 ease-in-out lg:transform-none lg:justify-center lg:gap-8 ${
                activeCard === 0 
                  ? 'translate-x-0' 
                  : activeCard === 1 
                  ? '-translate-x-full' 
                  : '-translate-x-[200%]'
              }`}
            >

              {/* CARD 0: GRÁTIS */}
              <div className="w-full shrink-0 lg:w-[350px] px-2 lg:px-0">
                <div className="flex flex-col h-[480px] p-8 rounded-3xl border-2 border-gray-300 bg-white text-center">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Grátis</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-8">
                    <span className="text-3xl font-bold text-gray-900">R$</span>
                    <span className="text-6xl font-extrabold text-gray-900">0</span>
                    <span className="text-gray-500 font-medium">/mês</span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-grow mx-auto w-fit">
                    <li className="flex items-start gap-3 text-gray-600 text-left">
                      <span className="text-brand-green mt-0.5">✓</span>
                      <span className="text-base">Emissão de DAS via WhatsApp</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-400 text-left">
                      <span className="mt-0.5">○</span>
                      <span className="text-base">Sem lembretes de vencimento</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-400 text-left">
                      <span className="mt-0.5">○</span>
                      <span className="text-base">3 dúvidas com IA por dia</span>
                    </li>
                  </ul>

                  <button 
                    onClick={() => router.push('/checkout?plano=gratis')}
                    className="w-full py-4 rounded-full border-2 border-gray-300 text-gray-700 text-lg font-bold hover:bg-gray-100 transition-all active:scale-95 cursor-pointer mt-auto"
                  >
                    Assinar Grátis
                  </button>
                </div>
              </div>
              
              {/* CARD 1: ESSENCIAL */}
              <div className="w-full shrink-0 lg:w-[350px] px-2 lg:px-0">
                <div className="flex flex-col h-[480px] p-8 rounded-3xl border-2 border-brand-green bg-white text-center">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Essencial</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-8">
                    <span className="text-3xl font-bold text-gray-900">R$</span>
                    <span className="text-6xl font-extrabold text-gray-900">19</span>
                    <span className="text-gray-500 font-medium">/mês</span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-grow mx-auto w-fit">
                    <li className="flex items-start gap-3 text-gray-600 text-left">
                      <span className="text-brand-green mt-0.5">✓</span>
                      <span className="text-base">Emissão de DAS via WhatsApp</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-600 text-left">
                      <span className="text-brand-green mt-0.5">✓</span>
                      <span className="text-base">Lembretes de vencimento</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-400 text-left">
                      <span className="mt-0.5">○</span>
                      <span className="text-base">Dúvidas com IA limitadas</span>
                    </li>
                  </ul>

                  <button 
                    onClick={() => router.push('/checkout?plano=essencial')}
                    className="w-full py-4 rounded-full border-2 border-brand-green text-brand-green text-lg font-bold hover:bg-brand-green/10 transition-all active:scale-95 cursor-pointer mt-auto"
                  >
                    Assinar Essencial
                  </button>
                </div>
              </div>

              {/* CARD 2: PROFISSIONAL */}
              <div className="w-full shrink-0 lg:w-[350px] px-2 lg:px-0">
                <div className="flex flex-col h-[480px] p-8 rounded-3xl border-2 border-brand-purple shadow-xl relative bg-white text-center">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-purple text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                    Mais Popular
                  </div>

                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Profissional</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-8">
                    <span className="text-3xl font-bold text-gray-900">R$</span>
                    <span className="text-6xl font-extrabold text-gray-900">39</span>
                    <span className="text-gray-500 font-medium">/mês</span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-grow mx-auto w-fit">
                    <li className="flex items-start gap-3 text-gray-800 font-medium text-left">
                      <span className="text-brand-green mt-0.5 text-xl">✓</span>
                      <span className="text-base">Tudo do plano Essencial</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-800 font-medium text-left">
                      <span className="text-brand-green mt-0.5 text-xl">✓</span>
                      <span className="text-base">Suporte 24/7 com IA ilimitado</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-800 font-medium text-left">
                      <span className="text-brand-green mt-0.5 text-xl">✓</span>
                      <span className="text-base">Emissão de Nota Fiscal</span>
                    </li>
                  </ul>

                  <button 
                    onClick={() => router.push('/checkout?plano=profissional')}
                    className="w-full py-4 rounded-full bg-brand-purple text-white text-lg font-bold hover:bg-opacity-90 shadow-lg shadow-purple-200 transition-all active:scale-95 cursor-pointer mt-auto"
                  >
                    Assinar Profissional
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* SETA DIREITA (Some apenas no LG) */}
          <button 
            onClick={() => setActiveCard((prev) => Math.min(2, prev + 1))}
            disabled={activeCard === 2}
            className={`lg:hidden p-2 rounded-full bg-gray-100 text-brand-purple transition-all z-10 ${
              activeCard === 2 ? 'opacity-30 cursor-not-allowed' : 'active:scale-90 cursor-pointer hover:bg-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

        </div>
      </div>
    </section>
  );
}