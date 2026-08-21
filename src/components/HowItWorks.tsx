export default function HowItWorks() {
  return (
    <section className="bg-brand-bgLight py-20 px-6">
      <div className="max-w-7xl mx-auto text-center">
        {/* Título e Subtítulo da Seção */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Como funciona na prática?
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto mb-16 text-lg">
          Três passos simples para automatizar sua rotina administrativa.
        </p>

        {/* Grade de Passos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">

          {/* Linha conectora entre os passos (apenas desktop) */}
          <div className="hidden md:block absolute top-6 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-brand-purple/30 via-brand-green/30 to-brand-green/50 -z-10"></div>

          {/* Passo 1 */}
          <div className="flex flex-col items-center text-center relative">
            {/* O círculo roxo ganha ainda mais destaque com o fundo cinza de trás */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-brand-purple/10 text-brand-purple font-bold flex items-center justify-center text-lg mb-6 shadow-sm ring-8 ring-brand-bgLight">
              1
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Cadastre-se
            </h3>
            <p className="text-gray-500 text-base leading-relaxed max-w-xs">
              Inicie uma conversa no WhatsApp e faça um cadastro rápido em menos de 2 minutos.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="flex flex-col items-center text-center relative">
            <div className="relative z-10 w-12 h-12 rounded-full bg-brand-green/10 text-brand-green font-bold flex items-center justify-center text-lg mb-6 shadow-sm ring-8 ring-brand-bgLight">
              2
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Envie seu CNPJ
            </h3>
            <p className="text-gray-500 text-base leading-relaxed max-w-xs">
              Basta informar seu CNPJ para que a IA se conecte aos sistemas oficiais com segurança.
            </p>
          </div>

          {/* Passo 3 */}
          <div className="flex flex-col items-center text-center relative">
            <div className="relative z-10 w-12 h-12 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-lg mb-6 shadow-md shadow-green-500/20 ring-8 ring-brand-bgLight">
              ✓
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Receba Auxílio
            </h3>
            <p className="text-gray-500 text-base leading-relaxed max-w-xs">
              Pronto! Peça sua guia mensal e receba o código Pix para pagamento imediato ou declare sua renda anual e muito mais!
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}