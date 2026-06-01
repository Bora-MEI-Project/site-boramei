"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function CheckoutForm() {
  const searchParams = useSearchParams();
  const plano = searchParams.get('plano') || 'essencial';
  const preco = plano === 'profissional' ? '39' : '19';
  
  // Estados para controlar o método e as máscaras dos inputs
  const [metodoPagamento, setMetodoPagamento] = useState<'cartao' | 'pix'>('cartao');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // 📝 MÁSCARA DO WHATSAPP: (11) 99999-9999
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    } else if (v.length > 0) {
      v = `(${v}`;
    }
    setPhone(v);
  };

  // 📝 MÁSCARA DO CARTÃO: 0000 0000 0000 0000
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 16) v = v.slice(0, 16);
    v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(v);
  };

  // 📝 MÁSCARA DA VALIDADE: MM/AA
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 4) v = v.slice(0, 4);
    if (v.length > 2) {
      v = `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    setExpiry(v);
  };

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* COLUNA DA ESQUERDA: Formulário */}
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100 md:col-span-7 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dados do pagamento</h1>
          <p className="text-gray-500 text-sm mt-1">Preencha com seus dados para ativar sua assinatura.</p>
        </div>

        {/* 🎨 CORREÇÃO 1: Status das Abas com peso visual correto (Ativa vs Inativa) */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMetodoPagamento('cartao')}
            className={`py-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
              metodoPagamento === 'cartao' 
                ? 'border-brand-purple bg-brand-purple/10 text-brand-purple' 
                : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300'
            }`}
          >
            💳 Cartão de crédito
          </button>
          <button
            type="button"
            onClick={() => setMetodoPagamento('pix')}
            className={`py-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
              metodoPagamento === 'pix' 
                ? 'border-brand-purple bg-brand-purple/10 text-brand-purple' 
                : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300'
            }`}
          >
            🔸 Pagar com PIX
          </button>
        </div>

        {/* Formulário */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          
          {/* 🎨 CORREÇÃO 2: Labels em Sentence Case (Sem gritar com o usuário) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input type="text" placeholder="João Silva" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Celular</label>
              <div className="flex w-full rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-brand-purple focus-within:border-brand-purple transition-all overflow-hidden bg-white">
                <span className="flex items-center justify-center px-4 bg-gray-50 border-r border-gray-300 text-gray-500 font-medium select-none text-sm">
                  +55
                </span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999" 
                  className="w-full px-4 py-3 outline-none bg-transparent text-sm" 
                  required 
                />
              </div>
              {/* 🎨 CORREÇÃO 3: Micro-legenda explicativa para o WhatsApp */}
              <p className="text-xs text-gray-400 mt-1.5 pl-1">
                Use o mesmo número onde deseja receber o assistente IA.
              </p>
            </div>
          </div>

          {metodoPagamento === 'cartao' ? (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número do cartão</label>
                <input 
                  type="text" 
                  value={cardNumber}
                  onChange={handleCardChange}
                  placeholder="0000 0000 0000 0000" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
                  <input 
                    type="text" 
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/AA" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input 
                    type="text" 
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                    required 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600 space-y-2 pt-2">
              <p>⚡ O código QR do PIX será gerado assim que você clicar no botão abaixo.</p>
              <p>Aprovação instantânea para liberar seus superpoderes do BoraMEI!</p>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-4 rounded-full bg-brand-green text-white text-lg font-bold hover:bg-opacity-90 shadow-lg shadow-green-100 transition-all active:scale-95 cursor-pointer mt-4 text-center block"
          >
            {metodoPagamento === 'cartao' ? 'Finalizar assinatura' : 'Gerar código PIX'}
          </button>
        </form>
      </div>

      {/* COLUNA DA DIREITA: Resumo */}
      <div className="bg-gray-900 text-white p-6 md:p-10 rounded-3xl shadow-xl md:col-span-5 space-y-8">
        
        {/* 🎨 CORREÇÃO 4: Mais "respiro" (margem) acima e abaixo da logo do branding */}
        <div className="py-2 border-b border-white/10 pb-6">
          <Link href="/">
            <img 
              src="/logo-com-nome.svg" 
              alt="Logo BoraMEI" 
              className="h-11 cursor-pointer hover:opacity-80 transition-opacity filter drop-shadow-[0_5px_5px_rgba(255,255,255,0.1)]" 
            />
          </Link>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center gap-4">
          <div className="min-w-0">
            <p className="font-bold text-lg capitalize text-white leading-tight">Plano {plano}</p>
            <p className="text-sm text-gray-400 mt-1">Cobrança mensal</p>
          </div>
          
          {/* Adicionado whitespace-nowrap e flex-shrink-0 para blindar o preço contra quebras */}
          <div className="flex items-baseline gap-1 whitespace-nowrap flex-shrink-0 text-right">
            <span className="text-2xl font-extrabold text-brand-green">R$ {preco},00</span>
            <span className="text-xs text-gray-400">/mês</span>
          </div>
        </div>

        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>R$ {preco},00</span>
          </div>
          <div className="flex justify-between text-brand-green font-bold">
            <span>Taxa de adesão</span>
            <span>Grátis</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-white border-t border-white/10 pt-4 mt-2">
            <span>Total a pagar</span>
            <span>R$ {preco},00</span>
          </div>
        </div>
      </div>

    </div>
  );
}