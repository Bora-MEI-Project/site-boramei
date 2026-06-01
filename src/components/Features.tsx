

export default function Features() {
  return (
    <section id="solucoes" className="bg-white py-24 px-6"> {/* Seção agora é branca */}
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Gestão inteligente sem complicação
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Deixe a burocracia com a nossa inteligência artificial e foque no crescimento do seu negócio.
          </p>
        </div>

        {/* Grade de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Emissão Fácil de DAS */}
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col"> {/* Card agora é bg-gray-50 */}
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-700 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Emissão Fácil de DAS
            </h3>
            <p className="text-gray-500 leading-relaxed text-base">
              Solicite sua guia de pagamento mensal com uma simples mensagem no WhatsApp. Nossa IA cuida do resto.
            </p>
          </div>

          {/* Card 2: Lembretes Automáticos */}
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 relative overflow-hidden flex flex-col"> {/* Card agora é bg-gray-50 */}
            {/* Detalhe verde no fundo ajustado para destacar no card cinza */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-100/40 rounded-bl-[100px] pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-700 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Lembretes Automáticos
              </h3>
              <p className="text-gray-500 leading-relaxed text-base">
                Nunca mais pague multas por atraso. Receba notificações proativas antes do vencimento dos seus impostos.
              </p>
            </div>
          </div>

          {/* Card 3: Tira-Dúvidas 24/7 */}
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col"> {/* Card agora é bg-gray-50 */}
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-700 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Tira-Dúvidas 24/7
            </h3>
            <p className="text-gray-500 leading-relaxed text-base">
              Tem dúvidas sobre notas fiscais, benefícios do INSS ou limites de faturamento? Nossa IA responde na hora.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}