'use client';

import { useState } from 'react';

export default function Footer() {
  // Estado para controlar qual modal está aberto
  const [activeModal, setActiveModal] = useState<'termos' | 'privacidade' | null>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <footer className="bg-gray-50 border-t border-gray-100 py-16 px-6 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          
          {/* Coluna da Esquerda: Logo e Copyright */}
          <div className="md:col-span-5 flex flex-col max-w-sm">
            <div className="mb-4">
              <img src="/logo-com-nome.svg" className="h-10 w-auto text-brand-purple" alt="BoraMEI Logo" />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              A inteligência artificial que simplifica a vida do microempreendedor individual.
            </p>
            <p className="text-gray-900 text-xs font-bold">
              © MN Software. Todos os direitos reservados.
            </p>
          </div>

          {/* Colunas da Direita: Links Rápidos */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 md:justify-items-start">
            
            {/* Coluna 1: Produto */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4">
                Produto
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#solucoes" className="text-sm text-gray-500 hover:text-brand-purple transition-colors">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="#precos" className="text-sm text-gray-500 hover:text-brand-purple transition-colors">
                    Preços
                  </a>
                </li>
              </ul>
            </div>

            {/* Coluna 2: Suporte */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4">
                Suporte
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#ajuda" className="text-sm text-gray-500 hover:text-brand-purple transition-colors">
                    Central de Ajuda
                  </a>
                </li>
                <li>
                  <a href="#contato" className="text-sm text-gray-500 hover:text-brand-purple transition-colors">
                    Contato
                  </a>
                </li>
              </ul>
            </div>

            {/* Coluna 3: Legal (AQUI ESTÁ A MÁGICA DOS MODAIS) */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => setActiveModal('termos')}
                    className="text-sm text-gray-500 hover:text-brand-purple transition-colors text-left cursor-pointer"
                  >
                    Termos de Uso
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveModal('privacidade')}
                    className="text-sm text-gray-500 hover:text-brand-purple transition-colors text-left cursor-pointer"
                  >
                    Privacidade
                  </button>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </footer>

      {/* TELA ACIMA DO RESTO (MODAL) */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
            
            {/* Cabeçalho do Modal */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">
                {activeModal === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-semibold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Conteúdo do Texto */}
            <div className="p-6 overflow-y-auto text-sm text-gray-600 space-y-4 leading-relaxed">
              {activeModal === 'termos' ? (
                <>
                  <p className="text-xs text-gray-400">Última atualização: Junho de 2026</p>
                  <p>Bem-vindo ao BoraMEI. Ao utilizar nossos serviços de assistência de Inteligência Artificial via WhatsApp, você concorda de forma integral com os presentes Termos de Uso.</p>
                  
                  <h4 className="font-semibold text-gray-900 mt-4">1. Objeto do Serviço</h4>
                  <p>O BoraMEI oferece uma ferramenta de automação e consulta assistida baseada em IA para Microempreendedores Individuais (MEI), facilitando o acesso a guias DAS, declaração anual DASN, consultas cadastrais e esclarecimento de dúvidas fiscais de rotina.</p>
                  
                  <h4 className="font-semibold text-gray-900 mt-4">2. Responsabilidade pelos Dados do CNPJ</h4>
                  <p>Ao informar um CNPJ para consulta dentro do nosso sistema ou no chat de WhatsApp, você declara e garante que é o titular legítimo da empresa ou que possui autorização expressa do proprietário legal para gerenciar tais informações.</p>
                  
                  <h4 className="font-semibold text-gray-900 mt-4">3. Limitação de Responsabilidade</h4>
                  <p>O BoraMEI atua como um facilitador de consultas a dados públicos. Não nos responsabilizamos por eventuais instabilidades nos sistemas do Governo Federal (Receita Federal, Simples Nacional) ou por atrasos no pagamento de guias fiscais por parte do usuário.</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400">Última atualização: Junho de 2026</p>
                  <p>A sua privacidade é uma prioridade para o BoraMEI. Esta política descreve de forma transparente como coletamos, armazenamos e tratamos os seus dados em total conformidade com a LGPD.</p>
                  
                  <h4 className="font-semibold text-gray-900 mt-4">1. Quais dados coletamos?</h4>
                  <p>• <strong>Número de WhatsApp:</strong> Utilizado estritamente como canal de entrega do assistente de IA e envio de notificações importantes.<br />• <strong>Número do CNPJ:</strong> Utilizado em tempo real para consultar a situação fiscal e gerar as guias DAS necessárias e declaração anual DASN.</p>
                  
                  <h4 className="font-semibold text-gray-900 mt-4">2. Compartilhamento de Dados</h4>
                  <p>Seus dados cadastrais corporativos são transmitidos de forma segura para nossa API parceira homologada (<strong>Infosimples</strong>) unicamente para realizar a busca automatizada nos órgãos governamentais. Nós <strong>nunca</strong> vendemos ou compartilhamos seus dados com terceiros para fins comerciais ou de publicidade.</p>
                  
                  <h4 className="font-semibold text-gray-900 mt-4">3. Seus Direitos (LGPD)</h4>
                  <p>Você pode, a qualquer momento, solicitar a exclusão definitiva do seu número de telefone e dados de CNPJ da nossa base de dados entrando em contato direto através do nosso e-mail de suporte institucional.</p>
                </>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
              <button 
                onClick={closeModal}
                className="px-5 py-2 bg-[#A855F7] text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-opacity cursor-pointer"
              >
                Entendi e fechar
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}