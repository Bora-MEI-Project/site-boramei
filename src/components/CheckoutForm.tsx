"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import Modal from './Modal';

export default function CheckoutForm() {
  const searchParams = useSearchParams();
  const plano = searchParams.get('plano') || 'profissional';
  
  // Identifica se é o plano gratuito
  const isGratis = plano === 'gratis';
  
  // Define o preço dinamicamente baseado no plano recebido
  const preco = plano === 'profissional' ? '39' : isGratis ? '0' : '19';
  
  // Estados para controlar o método e as máscaras dos inputs
  const [metodoPagamento, setMetodoPagamento] = useState<'cartao' | 'pix'>('cartao');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [checkoutModal, setCheckoutModal] = useState<null | 'termos' | 'privacidade'>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const closeCheckoutModal = () => setCheckoutModal(null);

  // 📝 MÁSCARA DO CPF: 000.000.000-00
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(''); // Limpa o erro nativo ao digitar
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    
    if (v.length > 9) {
      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (v.length > 6) {
      v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    } else if (v.length > 3) {
      v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    }
    
    setCpf(v);
  };

  // 📝 MÁSCARA DO WHATSAPP: (11) 99999-9999
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(''); 
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
    e.target.setCustomValidity(''); 
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 16) v = v.slice(0, 16);
    v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(v);
  };

  // 📝 MÁSCARA DA VALIDADE: MM/AA
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(''); 
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 4) v = v.slice(0, 4);
    if (v.length > 2) {
      v = `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    setExpiry(v);
  };

  // 🔥 VALIDAÇÃO COM BALÃO NATIVO DO NAVEGADOR
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    // 1. Validação do CPF (Exige 11 dígitos numéricos)
    const digitsCpf = cpf.replace(/\D/g, '');
    const cpfInput = form.elements.namedItem('cpf') as HTMLInputElement;
    if (digitsCpf.length !== 11) {
      cpfInput.setCustomValidity("Por favor, insira um CPF válido com 11 dígitos.");
      cpfInput.reportValidity();
      return;
    }

    // 2. Validação do WhatsApp (Exige exatamente 11 dígitos numéricos limpos)
    const digitsPhone = phone.replace(/\D/g, '');
    const phoneInput = form.elements.namedItem('phone') as HTMLInputElement;
    if (digitsPhone.length !== 11) {
      phoneInput.setCustomValidity("Por favor, insira o número de WhatsApp completo com 11 dígitos (DDD + 9 e o número).");
      phoneInput.reportValidity(); 
      return;
    }

    // 3. Validações exclusivas para Planos Pagos com Cartão de Crédito
    if (!isGratis && metodoPagamento === 'cartao') {
      const digitsCard = cardNumber.replace(/\D/g, '');
      const cardInput = form.elements.namedItem('cardNumber') as HTMLInputElement;
      if (digitsCard.length < 16) {
        cardInput.setCustomValidity("Número do cartão incompleto. Certifique-se de preencher os 16 dígitos.");
        cardInput.reportValidity(); 
        return;
      }

      const digitsExpiry = expiry.replace(/\D/g, '');
      const expiryInput = form.elements.namedItem('expiry') as HTMLInputElement;
      if (digitsExpiry.length < 4) {
        expiryInput.setCustomValidity("Data de validade incompleta. Preencha o mês e o ano (MM/AA).");
        expiryInput.reportValidity(); 
        return;
      }

      const digitsCvv = cvv.replace(/\D/g, '');
      const cvvInput = form.elements.namedItem('cvv') as HTMLInputElement;
      if (digitsCvv.length < 3) {
        cvvInput.setCustomValidity("Código CVV incompleto. Insira os 3 ou 4 dígitos de segurança.");
        cvvInput.reportValidity(); 
        return;
      }
    }

    // Se passar em tudo com sucesso:
    if (isGratis) {
      alert(`Conta grátis criada com sucesso para ${name} (CPF: ${cpf})! Liberando acesso ao seu assistente WhatsApp...`);
    } else {
      alert("Pronto! Enviando os dados de pagamento para processamento...");
    }
  };

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* COLUNA DA ESQUERDA: Formulário */}
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100 md:col-span-7 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isGratis ? "Ativação de conta" : "Dados do pagamento"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isGratis ? "Preencha seus dados para criar sua conta grátis." : "Preencha com seus dados para ativar sua assinatura."}
          </p>
        </div>

        {/* Status das Abas - Só exibe se NÃO for grátis */}
        {!isGratis && (
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
        )}

        {/* Formulário */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          
          <div className="space-y-4">
            {/* Nome Completo - Largura total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input 
                type="text" 
                name="name"
                value={name}
                onChange={(e) => { e.target.setCustomValidity(''); setName(e.target.value); }}
                placeholder="João Silva" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                required 
              />
            </div>
            
            {/* CPF e WhatsApp lado a lado em ecrãs maiores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input 
                  type="text" 
                  name="cpf"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Celular</label>
                <div className="flex w-full rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-brand-purple focus-within:border-brand-purple transition-all overflow-hidden bg-white">
                  <span className="flex items-center justify-center px-4 bg-gray-50 border-r border-gray-300 text-gray-500 font-medium select-none text-sm">
                    +55
                  </span>
                  <input 
                    type="tel" 
                    name="phone"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999" 
                    className="w-full px-4 py-3 outline-none bg-transparent text-sm" 
                    required 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gerenciamento das seções de pagamento baseadas no tipo de plano */}
          {isGratis ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-sm text-emerald-800 pt-2 mt-4">
              <p>🎉 Selecionou o **Plano Grátis**. Nenhum cartão de crédito ou método de pagamento é necessário!</p>
            </div>
          ) : metodoPagamento === 'cartao' ? (
            <div className="space-y-4 pt-4 border-t border-gray-100 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número do cartão</label>
                <input 
                  type="text" 
                  name="cardNumber"
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
                    name="expiry"
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
                    name="cvv"
                    value={cvv}
                    onChange={(e) => { e.target.setCustomValidity(''); setCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); }}
                    placeholder="123" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                    required 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600 space-y-2 pt-2 mt-4">
              <p>⚡ O código QR do PIX será gerado assim que clicar no botão abaixo.</p>
              <p>Aprovação instantânea para liberar os seus superpoderes do BoraMEI!</p>
            </div>
          )}

          <div className="flex items-start space-x-3 my-6 p-1">
            <div className="flex items-center h-5">
              <input
                id="aceita-termos"
                name="aceita-termos"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#A855F7] focus:ring-[#A855F7] transition-colors cursor-pointer"
              />
            </div>
            <div className="text-sm leading-tight">
              <label htmlFor="aceita-termos" className="text-gray-600 cursor-pointer select-none">
                Li e aceito os{' '}
                <button 
                  type="button"
                  onClick={() => setCheckoutModal('termos')}
                  className="text-sm text-brand-purple hover:underline font-medium cursor-pointer transition-colors"
                >
                  Termos de Uso
                </button>
                {' '}e a{' '}
                <button 
                  type="button"
                  onClick={() => setCheckoutModal('privacidade')}
                  className="text-sm text-brand-purple hover:underline font-medium cursor-pointer transition-colors"
                >
                  Privacidade
                </button>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={!acceptedTerms}
            className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all shadow-lg ${
              acceptedTerms
                ? 'bg-[#A855F7] hover:bg-opacity-90 cursor-pointer shadow-purple-200'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
            }`}
          >
            {isGratis ? 'Criar Conta Grátis' : 'Finalizar Assinatura'}
          </button>

          <Modal isOpen={checkoutModal === 'termos'} onClose={closeCheckoutModal} title="Termos de Uso">
            <p className="text-xs text-gray-400">Última atualização: Junho de 2026</p>
            <p>Bem-vindo ao BoraMEI. Ao utilizar nossos serviços de assistência de Inteligência Artificial via WhatsApp, você concorda de forma integral com os presentes Termos de Uso.</p>
            <h4 className="font-semibold text-gray-900 mt-4">1. Objeto do Serviço</h4>
            <p>O BoraMEI oferece uma ferramenta de automação e consulta assistida baseada em IA para Microempreendedores Individuais (MEI), facilitando o acesso a guias DAS, declaração anual, consultas cadastrais e esclarecimento de dúvidas fiscais de rotina.</p>
            <h4 className="font-semibold text-gray-900 mt-4">2. Responsabilidade pelos Dados do CNPJ</h4>
            <p>Ao informar um CNPJ para consulta dentro do nosso sistema ou no chat de WhatsApp, você declara e garante que é o titular legítimo da empresa ou que possui autorização expressa do proprietário legal para gerenciar tais informações.</p>
            <h4 className="font-semibold text-gray-900 mt-4">3. Limitação de Responsabilidade</h4>
            <p>O BoraMEI atua como um facilitador de consultas a dados públicos. Não nos responsabilizamos por eventuais instabilidades nos sistemas do Governo Federal (Receita Federal, Simples Nacional) ou por atrasos no pagamento de guias fiscais por parte do utilizador.</p>
          </Modal>

          <Modal isOpen={checkoutModal === 'privacidade'} onClose={closeCheckoutModal} title="Política de Privacidade">
            <p className="text-xs text-gray-400">Última atualização: Junho de 2026</p>
            <p>A sua privacidade é uma prioridade para o BoraMEI. Esta política descreve de forma transparente como coletamos, armazenamos e tratamos os seus dados em total conformidade com a LGPD.</p>
            <h4 className="font-semibold text-gray-900 mt-4">1. Quais dados coletamos?</h4>
            <p>
              • <strong>Número de WhatsApp:</strong> Utilizado estritamente como canal de entrega do assistente de IA e envio de notificações importantes.<br />
              • <strong>Número do CNPJ e CPF:</strong> Utilizados em tempo real para consultar a situação fiscal, gerar as guias DAS necessárias e validar a titularidade da conta.
            </p>
            <h4 className="font-semibold text-gray-900 mt-4">2. Compartilhamento de Dados</h4>
            <p>Seus dados cadastrais corporativos são transmitidos de forma segura para nossa API parceira homologada (<strong>Infosimples</strong>) unicamente para realizar a busca automatizada nos órgãos governamentais. Nós <strong>nunca</strong> vendemos ou compartilhamos seus dados com terceiros para fins comerciais ou de publicidade.</p>
            <h4 className="font-semibold text-gray-900 mt-4">3. Seus Direitos (LGPD)</h4>
            <p>Você pode, a qualquer momento, solicitar a exclusão definitiva do seu número de telefone e dados de CNPJ/CPF da nossa base de dados entrando em contato direto através do nosso e-mail de suporte institucional.</p>
          </Modal>
        </form>
      </div>

      {/* COLUNA DA DIREITA: Resumo */}
      <div className="bg-gray-900 text-white p-6 md:p-10 rounded-3xl shadow-xl md:col-span-5 space-y-8">
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
            <p className="text-sm text-gray-400 mt-1">Acesso liberado</p>
          </div>
          <div className="flex items-baseline gap-1 whitespace-nowrap flex-shrink-0 text-right">
            <span className="text-2xl font-extrabold text-brand-green">
              {isGratis ? "Grátis" : `R$ ${preco},00`}
            </span>
            {!isGratis && <span className="text-xs text-gray-400">/mês</span>}
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