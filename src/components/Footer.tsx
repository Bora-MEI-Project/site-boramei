'use client';

import { useState } from 'react';
import Modal from '@/components/Modal'; // Garanta que o caminho do import está correto
import TermosContent from '@/components/TermosContent';
import PrivacidadeContent from '@/components/PrivacidadeContent';

export default function Footer() {
  // Estado local para controlar os modais do rodapé
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
              <h4 className="text-sm font-bold text-gray-900 mb-4">Produto</h4>
              <ul className="space-y-3">
                <li><a href="#solucoes" className="text-sm text-gray-500 hover:text-brand-purple transition-colors">Recursos</a></li>
                <li><a href="#precos" className="text-sm text-gray-500 hover:text-brand-purple transition-colors">Preços</a></li>
              </ul>
            </div>

            {/* Coluna 2: Suporte */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4">Suporte</h4>
              <ul className="space-y-3">
                <li><a href="#ajuda" className="text-sm text-gray-500 hover:text-brand-purple transition-colors">Central de Ajuda</a></li>
                <li><a href="#contato" className="text-sm text-gray-500 hover:text-brand-purple transition-colors">Contato</a></li>
              </ul>
            </div>

            {/* Coluna 3: Legal (Gatilhos do Modal) */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <button 
                    type="button"
                    onClick={() => setActiveModal('termos')}
                    className="text-sm text-gray-500 hover:text-brand-purple transition-colors text-left cursor-pointer"
                  >
                    Termos de Uso
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
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
      
      <Modal isOpen={activeModal === 'termos'} onClose={closeModal} title="Termos de Uso">
        <TermosContent />
      </Modal>

      <Modal isOpen={activeModal === 'privacidade'} onClose={closeModal} title="Política de Privacidade">
        <PrivacidadeContent />
      </Modal>
    </>
  );
}