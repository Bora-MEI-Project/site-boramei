import React from 'react';

// 1. Definição estrita das propriedades do componente (TypeScript)
interface HeroProps {
  onStartClick?: () => void;
  onDemoClick?: () => void;
}

export default function Hero({ onStartClick, onDemoClick }: HeroProps): React.JSX.Element {
  return (
    <section className="relative overflow-hidden bg-brand-bgLight px-6 pt-2 pb-12 md:pt-2 pb-16">
      {/* Detalhe sutil de fundo para dar profundidade de design */}
      <div className="absolute top-0 right-0 z-0 h-[700px] w-[700px] rounded-full bg-brand-purple/20 blur-3xl"></div>
      
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2">
        
        {/* Lado Esquerdo: Conteúdo e Textos */}
        <div className="flex flex-col items-start text-left">
          {/* Badge de Destaque com o Verde Néon da marca */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-4 py-1.5 text-xs font-semibold text-brand-green ring-1 ring-inset ring-brand-green/20 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />
            Tecnologia Integrada ao WhatsApp
          </span>
          
          {/* Título Principal */}
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl leading-tight">
            O seu assistente de IA <br />
            <span className="text-gray-900">para MEI no WhatsApp</span>
          </h1>
          
          {/* Slogan - Correção de Alta Visibilidade Solicitada */}
          <p className="mt-4 text-lg font-black tracking-widest text-brand-purple uppercase sm:text-xl md:text-2xl">
            SIMPLIFICANDO A VIDA DO EMPREENDEDOR
          </p>
          
          {/* Descrição Comercial */}
          <p className="mt-6 text-base text-gray-600 sm:text-lg max-w-lg leading-relaxed">
            Esqueça a burocracia. O BoraMEI emite suas guias DAS, envia alertas de vencimento automáticos e resolve suas dúvidas fiscais direto pelo chat, em segundos.
          </p>
          
          {/* Ações / CTAs */}
          <div className="mt-10 flex flex-wrap gap-4 w-full sm:w-auto">
            <button
              onClick={onStartClick}
              type="button"
              className="w-full sm:w-auto justify-center inline-flex items-center bg-brand-purple hover:bg-opacity-90 text-white font-bold px-8 py-4 rounded-full transition-all duration-200 shadow-xl shadow-purple-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Começar Agora
            </button>
            <button
              onClick={onDemoClick}
              type="button"
              className="w-full sm:w-auto justify-center inline-flex items-center border-2 border-brand-green text-brand-green hover:bg-green-50 font-bold px-8 py-4 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Ver Demonstração
            </button>
          </div>
        </div>

        {/* Lado Direito: Container da Imagem do Robô/Mockup */}
        <div className="relative flex justify-center lg:justify-end">
          {/* Detalhe de luz atrás do robô */}
          <div className="absolute inset-0 m-auto h-72 w-72 rounded-full bg-green-200/20 blur-2xl -z-10" />
          
          <div className="relative w-full max-w-md lg:max-w-lg">
            <img 
              src="/foto-whatsapp.jpg" 
              alt="Integração do BoraMEI com o WhatsApp" 
              className="hidden md:block w-full h-auto object-contain rounded-2xl drop-shadow-[0_35px_35px_rgba(122,18,255,0.15)] m-4"
              loading="eager"
            />
            <img 
              src="/foto-mei.jpg" 
              alt="Microempreendedor individual após a simplificação com o BoraMEI" 
              className="hidden md:block w-full h-auto object-contain rounded-2xl drop-shadow-[0_35px_35px_rgba(122,18,255,0.15)] m-4"
              loading="eager"
            />
          </div>
        </div>

      </div>
    </section>
  );
}