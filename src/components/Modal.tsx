'use client';

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Se não estiver aberto, não renderiza nada na tela
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      
      {/* Card do Modal */}
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Cabeçalho */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-semibold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Conteúdo Injetado Dinamicamente */}
        <div className="p-6 overflow-y-auto text-sm text-gray-600 space-y-4 leading-relaxed">
          {children}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-[#A855F7] text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-opacity cursor-pointer"
          >
            Entendi e fechar
          </button>
        </div>

      </div>
    </div>
  );
}