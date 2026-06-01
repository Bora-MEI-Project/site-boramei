

export default function About() {
  return (
    <section id="sobre" className="bg-white py-24 px-6 border-t border-gray-100">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Coluna da Esquerda: Texto e Missão */}
        <div>
          {/* Mantido em ROXO conforme o seu pedido */}
          <span className="text-brand-purple font-bold text-sm uppercase tracking-wider block mb-3">
            Sobre Nós
          </span>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            Criado para simplificar a vida de quem faz o Brasil andar
          </h2>
          <p className="text-gray-500 text-lg mb-6 leading-relaxed">
            O BoraMEI nasceu com um propósito claro: transformar a burocracia complexa do Microempreendedor Individual em uma conversa simples e direta no WhatsApp.
          </p>
          <p className="text-gray-500 text-lg mb-8 leading-relaxed">
            Sabemos que o dia a dia de quem trabalha por conta própria é corrido. Cuidar de guias DAS, prazos e declarações não deveria roubar o tempo que você precisa para vender e crescer. Por isso, unimos inteligência artificial e tecnologia para criar o assistente de negócios ideal.
          </p>

          {/* Pequenos Indicadores de Confiança */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div>
              {/* Trocado para VERDE */}
              <h4 className="text-2xl font-extrabold text-emerald-500 mb-1">24/7</h4>
              <p className="text-sm font-bold text-gray-900">Sempre Disponível</p>
              <p className="text-xs text-gray-400">Tire dúvidas e emita guias a qualquer hora do dia ou da noite.</p>
            </div>
            <div>
              {/* Trocado para VERDE */}
              <h4 className="text-2xl font-extrabold text-emerald-500 mb-1">100%</h4>
              <p className="text-sm font-bold text-gray-900">Seguro e Direto</p>
              <p className="text-xs text-gray-400">Conexão criptografada focada na privacidade dos seus dados fiscais.</p>
            </div>
          </div>
        </div>

        {/* Coluna da Direita: Elemento Visual / Caixa de Destaque */}
        <div className="relative flex justify-center">
          
          {/* Card Flutuante Estilizado */}
          <div className="bg-gray-50 border border-gray-200/60 p-8 rounded-3xl shadow-xl max-w-md relative z-10">
            {/* Detalhe de três pontinhos simulando uma janela de app */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
            </div>
            
            <blockquote className="text-gray-700 italic text-lg mb-6 leading-relaxed">
              "Nossa missão é dar superpoderes administrativos para o MEI, deixando o gerenciamento da empresa tão fácil quanto mandar uma mensagem de bom dia no WhatsApp."
            </blockquote>
            
            {/* Rodapé do card com o novo Avatar Circular */}
            <div className="flex items-center gap-4 mt-6">
              
              {/* Novo contêiner circular com a bordinha verde */}
              <div className="h-16 w-16 rounded-full border-2 border-brand-green bg-white flex items-center justify-center p-3 shadow-inner">
                {/* A logo real, ajustada para caber no contêiner sem distorção */}
                <img 
                  src="/logo-bm.svg" // Certifique-se de que a Logo.svg está dentro da pasta public
                  alt="Logo BoraMEI" 
                  className="h-full w-auto object-contain" 
                />
              </div>
              
              <div>
                <h4 className="font-bold text-gray-900 text-base leading-tight">Equipe BoraMEI</h4>
                <p className="text-xs text-gray-400">Tecnologia Humana & Inteligente</p>
              </div>

            </div>
          </div>
          
          {/* Círculos de luz de fundo (Glow effects) trocados para VERDE */}
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

      </div>
    </section>
  );
}