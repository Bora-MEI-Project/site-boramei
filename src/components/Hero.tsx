import Image from "next/image";

interface HeroProps {
  onStartClick?: () => void;
  onDemoClick?: () => void;
}

export default function Hero({ onStartClick, onDemoClick }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-brand-bgLight px-6 pt-10 pb-16 md:pt-14 md:pb-24">
      {/* Detalhes de fundo para dar profundidade e mais cor à seção */}
      <div className="absolute top-0 right-0 z-0 h-[380px] w-[380px] sm:h-[700px] sm:w-[700px] rounded-full bg-brand-purple/25 blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 z-0 h-[280px] w-[280px] sm:h-[500px] sm:w-[500px] rounded-full bg-brand-green/25 blur-3xl"></div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2">

        {/* Lado Esquerdo: Conteúdo e Textos */}
        <div className="flex flex-col items-start text-left">
          {/* Badge de Destaque com o Verde Néon da marca */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-4 py-1.5 text-xs font-semibold text-brand-green ring-1 ring-inset ring-brand-green/20 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />
            Tecnologia Integrada ao WhatsApp
          </span>

          {/* Título Principal */}
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl leading-tight">
            O seu assistente de <span className="text-brand-purple">IA</span> <br />
            para MEI no <span className="text-brand-green">WhatsApp</span>
          </h1>

          {/* Slogan - Correção de Alta Visibilidade Solicitada */}
          <p className="mt-4 text-lg font-black tracking-widest text-brand-purple uppercase sm:text-xl md:text-2xl">
            SIMPLIFICANDO A VIDA DO EMPREENDEDOR
          </p>

          {/* Descrição Comercial */}
          <p className="mt-6 text-base text-gray-600 sm:text-lg max-w-lg leading-relaxed">
            Esqueça a burocracia. O BoraMEI emite suas guias DAS, envia alertas de vencimento automáticos e resolve suas dúvidas fiscais direto pelo chat, em segundos. Ele veio para ser seu contador, assistente e consultor, tudo em um só lugar. Deixe a parte chata conosco e foque no que realmente importa: fazer seu negócio crescer.
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

        {/* Lado Direito: Composição visual com as fotos */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md mt-4 md:mt-0">

            {/* Imagem principal */}
            <div className="relative h-64 sm:h-80 md:h-[420px] w-full overflow-hidden rounded-3xl ring-4 ring-white shadow-2xl shadow-purple-200/60">
              <Image
                src="/foto-mei.jpg"
                alt="Microempreendedor individual após a simplificação com o BoraMEI"
                fill
                sizes="(min-width: 1024px) 448px, (min-width: 768px) 384px, 320px"
                className="object-cover"
                priority
              />
            </div>

            {/* Card flutuante: print do WhatsApp */}
            <div className="hidden sm:block absolute -bottom-8 -left-8 w-36 lg:w-44 h-24 lg:h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl -rotate-6">
              <Image
                src="/foto-whatsapp.jpg"
                alt="Integração do BoraMEI com o WhatsApp"
                fill
                sizes="176px"
                className="object-cover"
              />
            </div>

            {/* Badge flutuante de destaque */}
            <div className="hidden md:flex absolute -top-6 -right-6 items-center gap-2 bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 px-4 py-3">
              <span className="h-9 w-9 shrink-0 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green text-lg">
                ✓
              </span>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900 leading-none">DAS em segundos</p>
                <p className="text-xs text-gray-400 mt-1">Direto no WhatsApp</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
