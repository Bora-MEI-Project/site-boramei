"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import Modal from "./Modal";
import TermosContent from "./TermosContent";
import PrivacidadeContent from "./PrivacidadeContent";
import { processarCheckout, aguardarPagamento } from "@/lib/pagamentos";
import { gerarQrCodeDataUrl } from "@/lib/qrcode";
import { obterPlano, PLANOS } from "@/lib/planos";

const PIX_EXPIRACAO_PADRAO_SEGUNDOS = 20 * 60;

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "0x4AAAAAAD8KKEZx5RbTtcS4";

/** Segundos restantes até a expiração real do Pix (devolvida pelo PagBank). */
function segundosAteExpirar(expiraEm: string | null): number {
  if (!expiraEm) return PIX_EXPIRACAO_PADRAO_SEGUNDOS;
  const alvo = new Date(expiraEm).getTime();
  if (Number.isNaN(alvo)) return PIX_EXPIRACAO_PADRAO_SEGUNDOS;
  return Math.max(0, Math.round((alvo - Date.now()) / 1000));
}

/** Backoff do polling do Pix: mais frequente no início, mais espaçado perto do fim. */
function intervaloPixMs(decorridoMs: number): number {
  const minutos = decorridoMs / 60000;
  if (minutos < 3) return 3000;
  if (minutos < 5) return 5000;
  if (minutos < 15) return 10000;
  return 20000;
}

export default function CheckoutForm() {
  const searchParams = useSearchParams();
  const plano = obterPlano(searchParams.get("plano"));

  const preco = PLANOS[plano].preco;
  const precoExibicao = preco.replace(".", ",");
  
  // Estados do Formulário
  const [metodoPagamento, setMetodoPagamento] = useState<"cartao" | "pix">("cartao");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cep, setCep] = useState("");
  const [numero, setNumero] = useState(""); 
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardCpf, setCardCpf] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [checkoutModal, setCheckoutModal] = useState<null | "termos" | "privacidade">(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Estados de Controle, Carregamento e PIX
  const [isLoading, setIsLoading] = useState(false);
  const [pixData, setPixData] = useState<{ orderId: string; copiaECola: string; idRec: string; expiraEm: string | null } | null>(null);
  const [qrCodeImagem, setQrCodeImagem] = useState<string | null>(null);
  const [pixSegundosRestantes, setPixSegundosRestantes] = useState(PIX_EXPIRACAO_PADRAO_SEGUNDOS);
  const pixDuracaoTotalRef = useRef(PIX_EXPIRACAO_PADRAO_SEGUNDOS);
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);
  const [pagamentoAnalise, setPagamentoAnalise] = useState(false);
  const [pagamentoErro, setPagamentoErro] = useState<string | null>(null);
  const [erroCodigo, setErroCodigo] = useState<string | null>(null);

  // Verificação anti-robô (Cloudflare Turnstile)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  const closeCheckoutModal = () => setCheckoutModal(null);

  // 🔄 POLLING + EXPIRAÇÃO: Aguarda a aprovação do PIX até ele expirar de verdade
  useEffect(() => {
    if (!pixData?.orderId) return;
    let ignorar = false;

    const { promessa, cancelar } = aguardarPagamento(pixData.orderId, {
      idRec: pixData.idRec,
      intervaloMs: intervaloPixMs,
      limiteMs: segundosAteExpirar(pixData.expiraEm) * 1000,
    });

    promessa.then((resultado) => {
      if (ignorar) return;

      if (resultado === 'pago') {
        setPagamentoConfirmado(true);
      } else if (resultado === 'rejeitado') {
        setPixData(null);
        setPagamentoErro("O pagamento PIX foi rejeitado. Gere um novo código para tentar novamente.");
      } else {
        setPixData(null);
        setPagamentoErro("O código PIX expirou. Gere um novo código para continuar.");
      }
    });

    return () => {
      ignorar = true;
      cancelar();
    };
  }, [pixData]);

  // 🖼️ QR CODE: Gera a imagem no navegador a partir do copia-e-cola (a Efí não manda a imagem pronta)
  useEffect(() => {
    if (!pixData?.copiaECola) {
      setQrCodeImagem(null);
      return;
    }
    let ignorar = false;

    gerarQrCodeDataUrl(pixData.copiaECola)
      .then((dataUrl) => { if (!ignorar) setQrCodeImagem(dataUrl); })
      .catch(() => { if (!ignorar) setQrCodeImagem(null); });

    return () => { ignorar = true; };
  }, [pixData?.copiaECola]);

  // ⏳ CONTAGEM REGRESSIVA: Atualiza a barrinha com base na expiração real do Pix
  useEffect(() => {
    if (!pixData) return;

    const restanteInicial = segundosAteExpirar(pixData.expiraEm);
    pixDuracaoTotalRef.current = restanteInicial || PIX_EXPIRACAO_PADRAO_SEGUNDOS;
    setPixSegundosRestantes(restanteInicial);

    const tick = setInterval(() => {
      setPixSegundosRestantes(segundosAteExpirar(pixData.expiraEm));
    }, 1000);

    return () => clearInterval(tick);
  }, [pixData]);

  const formatarTempo = (totalSegundos: number) => {
    const minutos = Math.floor(totalSegundos / 60).toString().padStart(2, "0");
    const segundos = (totalSegundos % 60).toString().padStart(2, "0");
    return `${minutos}:${segundos}`;
  };

  // 📝 MÁSCARAS
  const formatarCpf = (raw: string) => {
    let v = raw.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    return v;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity("");
    setCpf(formatarCpf(e.target.value));
  };

  const handleCardCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity("");
    setCardCpf(formatarCpf(e.target.value));
  };

  const formatarCnpj = (raw: string) => {
    let v = raw.replace(/\D/g, "");
    if (v.length > 14) v = v.slice(0, 14);
    if (v.length > 12) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5");
    else if (v.length > 8) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, "$1.$2.$3/$4");
    else if (v.length > 5) v = v.replace(/(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,3})/, "$1.$2");
    return v;
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity("");
    setCnpj(formatarCnpj(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(""); 
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    setPhone(v);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity("");
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length > 5) v = v.replace(/(\d{5})(\d{1,3})/, "$1-$2");
    setCep(v);
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(""); 
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 16) v = v.slice(0, 16);
    v = v.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(v);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(""); 
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 4) v = v.slice(0, 4);
    if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    setExpiry(v);
  };

  // 🚀 SUBMIT DO FORMULÁRIO (Usando o pagamentos.ts)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    // --- VALIDAÇÕES DE FRONTEND ---
    const digitsCpf = cpf.replace(/\D/g, "");
    const cpfInput = form.elements.namedItem("cpf") as HTMLInputElement;
    if (digitsCpf.length !== 11) {
      cpfInput.setCustomValidity("Por favor, insira um CPF válido com 11 dígitos.");
      cpfInput.reportValidity(); return;
    }

    const digitsPhone = phone.replace(/\D/g, "");
    const phoneInput = form.elements.namedItem("phone") as HTMLInputElement;
    if (digitsPhone.length !== 11) {
      phoneInput.setCustomValidity("Por favor, insira o número de WhatsApp completo com 11 dígitos (DDD + 9 e o número).");
      phoneInput.reportValidity(); return;
    }

    const digitsCnpj = cnpj.replace(/\D/g, "");
    const cnpjInput = form.elements.namedItem("cnpj") as HTMLInputElement;
    if (digitsCnpj.length > 0 && digitsCnpj.length !== 14) {
      cnpjInput.setCustomValidity("Por favor, insira um CNPJ válido com 14 dígitos, ou deixe em branco.");
      cnpjInput.reportValidity(); return;
    }

    const digitsCep = cep.replace(/\D/g, "");
    const cepInput = form.elements.namedItem("cep") as HTMLInputElement;
    if (digitsCep.length !== 8) {
      cepInput.setCustomValidity("Por favor, insira um CEP válido com 8 dígitos.");
      cepInput.reportValidity(); return;
    }

    const senhaInput = form.elements.namedItem("senha") as HTMLInputElement;
    if (senha.length < 8) {
      senhaInput.setCustomValidity("A senha deve ter pelo menos 8 caracteres.");
      senhaInput.reportValidity(); return;
    }

    const confirmarSenhaInput = form.elements.namedItem("confirmarSenha") as HTMLInputElement;
    if (senha !== confirmarSenha) {
      confirmarSenhaInput.setCustomValidity("As senhas não coincidem.");
      confirmarSenhaInput.reportValidity(); return;
    }

    if (metodoPagamento === "cartao") {
      const digitsCardCpf = cardCpf.replace(/\D/g, "");
      const cardCpfInput = form.elements.namedItem("cardCpf") as HTMLInputElement;
      if (digitsCardCpf.length !== 11) {
        cardCpfInput.setCustomValidity("Por favor, insira o CPF do titular do cartão, com 11 dígitos.");
        cardCpfInput.reportValidity(); return;
      }

      const digitsCard = cardNumber.replace(/\D/g, "");
      const cardInput = form.elements.namedItem("cardNumber") as HTMLInputElement;
      if (digitsCard.length < 16) {
        cardInput.setCustomValidity("Número do cartão incompleto. Certifique-se de preencher os 16 dígitos.");
        cardInput.reportValidity(); return;
      }

      const digitsExpiry = expiry.replace(/\D/g, "");
      const expiryInput = form.elements.namedItem("expiry") as HTMLInputElement;
      if (digitsExpiry.length < 4) {
        expiryInput.setCustomValidity("Data de validade incompleta. Preencha o mês e o ano (MM/AA).");
        expiryInput.reportValidity(); return;
      }

      const digitsCvv = cvv.replace(/\D/g, "");
      const cvvInput = form.elements.namedItem("cvv") as HTMLInputElement;
      if (digitsCvv.length < 3) {
        cvvInput.setCustomValidity("Código CVV incompleto. Insira os 3 ou 4 dígitos de segurança.");
        cvvInput.reportValidity(); return;
      }
    }

    if (!turnstileToken) {
      setPagamentoErro("Não foi possível confirmar que você não é um robô. Aguarde a verificação abaixo do formulário e tente novamente.");
      return;
    }

    // --- EXECUÇÃO DO CHECKOUT ---
    setIsLoading(true);
    setPagamentoErro(null);
    setErroCodigo(null);

    const resultado = await processarCheckout({
      plano,
      metodo: metodoPagamento,
      turnstileToken,
      senha,
      cliente: {
        nome: name,
        email,
        cpf,
        whatsapp: phone,
        cnpj,
        cep,
        numero
      },
      cartao: metodoPagamento === "cartao" ? {
        nome: cardName,
        cpf: cardCpf,
        numero: cardNumber,
        validade: expiry,
        cvv
      } : undefined
    });

    setIsLoading(false);

    if (!resultado.sucesso) {
      // Token do Turnstile é de uso único: renova o desafio para a próxima tentativa.
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setErroCodigo(resultado.codigo ?? null);
      setPagamentoErro(resultado.mensagem || "Ocorreu um erro ao processar o pagamento. Tente novamente.");
      return;
    }

    if (resultado.pixData) {
      setPixData(resultado.pixData);
    } else if (resultado.cardStatus === "analise") {
      setPagamentoAnalise(true);
    } else {
      setPagamentoConfirmado(true);
    }
  };

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* COLUNA DA ESQUERDA: Formulário */}
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100 md:col-span-7 space-y-6">
        
        {/* Assim que o pagamento (cartão ou PIX) é confirmado, mostra a tela de sucesso */}
        {pagamentoConfirmado ? (
          <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-4xl">✅</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pagamento confirmado!</h2>
              <p className="text-gray-500 mt-2">
                Seu plano <span className="capitalize font-medium">{plano}</span> foi ativado com sucesso. Enviamos os detalhes para o seu WhatsApp.
              </p>
            </div>
            <button
              onClick={() => window.location.href = `https://wa.me/558186195043?text=${encodeURIComponent("Olá, sou o mais novo usuario do BoraMEI!")}`}
              className="w-full py-4 rounded-xl font-bold text-white text-base bg-brand-purple hover:bg-opacity-90 active:scale-95 cursor-pointer transition-all shadow-lg shadow-purple-200"
            >
              Continuar
            </button>
          </div>
        ) : pagamentoAnalise ? (
          <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-4xl">⏳</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pagamento em análise</h2>
              <p className="text-gray-500 mt-2">
                O pagamento do seu plano <span className="capitalize font-medium">{plano}</span> está sendo analisado. Assim que for aprovado, você será avisado pelo WhatsApp.
              </p>
            </div>
            <div className="w-full p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800 flex items-start gap-2 text-left">
              <span className="text-lg leading-none">⚠️</span>
              <p>Isso pode levar alguns minutos. Não é necessário tentar novamente.</p>
            </div>
            <button
              onClick={() => window.location.href = `https://wa.me/558186195043?text=${encodeURIComponent("Olá, meu pagamento no BoraMEI está em análise!")}`}
              className="w-full py-4 rounded-xl font-bold text-white text-base bg-brand-purple hover:bg-opacity-90 active:scale-95 cursor-pointer transition-all shadow-lg shadow-purple-200"
            >
              Falar com o suporte
            </button>
          </div>
        ) : pixData ? (
          <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Finalize seu pagamento</h2>
            <p className="text-gray-500">Escaneie o QR Code abaixo com o app do seu banco ou use a chave Copia e Cola.</p>

            <div className="w-full space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Tempo restante para pagar</span>
                <span className="font-semibold text-brand-purple">{formatarTempo(pixSegundosRestantes)}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-purple transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(pixSegundosRestantes / pixDuracaoTotalRef.current) * 100}%` }}
                />
              </div>
            </div>

            {qrCodeImagem ? (
              <img src={qrCodeImagem} alt="QR Code PIX" className="w-64 h-64 border-2 border-brand-purple rounded-xl p-2" />
            ) : (
              <div className="w-64 h-64 border-2 border-brand-purple rounded-xl flex items-center justify-center text-sm text-gray-400">
                Gerando QR Code...
              </div>
            )}

            <div className="w-full space-y-2">
              <label className="text-sm font-medium text-gray-700">PIX Copia e Cola:</label>
              <input 
                readOnly 
                value={pixData.copiaECola} 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-brand-bgLight text-xs text-gray-600 focus:outline-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(pixData.copiaECola)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors text-sm cursor-pointer active:scale-95"
              >
                📋 Copiar Código
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => setPixData(null)}
              className="w-full py-3 rounded-xl font-bold text-white text-sm bg-red-500 hover:bg-red-600 active:scale-95 cursor-pointer transition-all mt-4"
            >
              Cancelar
            </button>

            <p className="text-xs text-brand-green font-semibold animate-pulse">
              Aguardando confirmação do pagamento...
            </p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dados do pagamento</h1>
              <p className="text-gray-500 text-sm mt-1">Preencha com seus dados para ativar sua assinatura.</p>
            </div>

            {/* Abas de Método de Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMetodoPagamento("cartao")}
                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                  metodoPagamento === "cartao"
                    ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                    : "border-gray-200 bg-brand-bgLight text-gray-400 hover:border-gray-300"
                }`}
              >
                💳 Cartão de crédito
              </button>
              <button
                type="button"
                onClick={() => setMetodoPagamento("pix")}
                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                  metodoPagamento === "pix"
                    ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                    : "border-gray-200 bg-brand-bgLight text-gray-400 hover:border-gray-300"
                }`}
              >
                🔸 Pagar com PIX
              </button>
            </div>

            {/* Formulário Principal */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Nome Completo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                  <input 
                    type="text" name="name" value={name}
                    onChange={(e) => { e.target.setCustomValidity(""); setName(e.target.value); }}
                    placeholder="João Silva" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                    required disabled={isLoading}
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email" name="email" value={email}
                    onChange={(e) => { e.target.setCustomValidity(""); setEmail(e.target.value); }}
                    placeholder="joao@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm"
                    required disabled={isLoading}
                  />
                </div>

                {/* CPF e WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                    <input 
                      type="text" name="cpf" value={cpf} onChange={handleCpfChange}
                      placeholder="000.000.000-00" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                      required disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Celular</label>
                    <div className="flex w-full rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-brand-purple focus-within:border-brand-purple transition-all overflow-hidden bg-white">
                      <span className="flex items-center justify-center px-4 bg-brand-bgLight border-r border-gray-300 text-gray-500 font-medium select-none text-sm">
                        +55
                      </span>
                      <input
                        type="tel" name="phone" value={phone} onChange={handlePhoneChange}
                        placeholder="(11) 99999-9999"
                        className="w-full px-4 py-3 outline-none bg-transparent text-sm disabled:bg-brand-bgLight"
                        required disabled={isLoading}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Este será o número usado pelo chatbot para falar com você.</p>
                  </div>
                </div>

                {/* CNPJ (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ (opcional)</label>
                  <input
                    type="text" name="cnpj" value={cnpj} onChange={handleCnpjChange}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-400 mt-1">Caso já tenha o MEI aberto, informe o CNPJ aqui.</p>
                </div>

                {/* CEP e Número */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <input 
                      type="text" name="cep" value={cep} onChange={handleCepChange}
                      placeholder="00000-000" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                      required disabled={isLoading}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <input 
                      type="text" name="numero" value={numero}
                      onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
                      placeholder="123" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                      required disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Senha de acesso à área do cliente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crie uma senha</label>
                    <input
                      type="password" name="senha" value={senha}
                      onChange={(e) => { e.target.setCustomValidity(""); setSenha(e.target.value); }}
                      placeholder="Mínimo de 8 caracteres"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm"
                      required minLength={8} disabled={isLoading}
                    />
                    <p className="text-xs text-gray-400 mt-1">Você vai usar essa senha para entrar na área do cliente.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirme a senha</label>
                    <input
                      type="password" name="confirmarSenha" value={confirmarSenha}
                      onChange={(e) => { e.target.setCustomValidity(""); setConfirmarSenha(e.target.value); }}
                      placeholder="Repita a senha"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm"
                      required minLength={8} disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Campos do Cartão ou Mensagem PIX */}
              {metodoPagamento === "cartao" ? (
                <div className="space-y-4 pt-4 border-t border-gray-100 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome no cartão</label>
                    <input
                      type="text" name="cardName" value={cardName}
                      onChange={(e) => { e.target.setCustomValidity(""); setCardName(e.target.value); }}
                      placeholder="Como impresso no cartão"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm"
                      required disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF do titular do cartão</label>
                    <input
                      type="text" name="cardCpf" value={cardCpf} onChange={handleCardCpfChange}
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm"
                      required disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número do cartão</label>
                    <input 
                      type="text" name="cardNumber" value={cardNumber} onChange={handleCardChange}
                      placeholder="1234 5678 9012 3456" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                      required disabled={isLoading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
                      <input 
                        type="text" name="expiry" value={expiry} onChange={handleExpiryChange}
                        placeholder="MM/AA" 
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                        required disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input 
                        type="text" name="cvv" value={cvv}
                        onChange={(e) => { e.target.setCustomValidity(""); setCvv(e.target.value.replace(/\D/g, "").slice(0, 4)); }}
                        placeholder="123" 
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm" 
                        required disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-brand-bgLight rounded-xl border border-gray-200 text-sm text-gray-600 space-y-2 pt-2 mt-4">
                  <p>⚡ O código QR do PIX será gerado assim que clicar no botão abaixo.</p>
                  <p>Aprovação instantânea para liberar os seus superpoderes do BoraMEI!</p>
                </div>
              )}

              {/* Mensagem de erro / recusa do pagamento */}
              {pagamentoErro && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 flex flex-col gap-2 mt-4">
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-none">⚠️</span>
                    <p>{pagamentoErro}</p>
                  </div>

                  {(erroCodigo === "EMAIL_DUPLICADO" ||
                    erroCodigo === "CPF_DUPLICADO" ||
                    erroCodigo === "WHATSAPP_DUPLICADO") && (
                    <a
                      href={`https://wa.me/558186195043?text=${encodeURIComponent("Olá, já tenho cadastro no BoraMEI e preciso de ajuda!")}`}
                      className="self-start text-sm font-semibold text-brand-purple hover:underline"
                    >
                      Já tem conta? Fale com o suporte →
                    </a>
                  )}
                </div>
              )}

              {/* Termos e Condições */}
              <div className="flex items-start space-x-3 my-6 p-1">
                <div className="flex items-center h-5">
                  <input
                    id="aceita-termos" type="checkbox" checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple transition-colors cursor-pointer"
                    disabled={isLoading}
                  />
                </div>
                <div className="text-sm leading-tight">
                  <label htmlFor="aceita-termos" className="text-gray-600 cursor-pointer select-none">
                    Li e aceito os{" "}
                    <button type="button" onClick={() => setCheckoutModal("termos")} className="text-sm text-brand-purple hover:underline font-medium cursor-pointer active:scale-95 transition-colors">Termos de Uso</button>
                    {" "}e a{" "}
                    <button type="button" onClick={() => setCheckoutModal("privacidade")} className="text-sm text-brand-purple hover:underline font-medium cursor-pointer active:scale-95 transition-colors">Privacidade</button>
                  </label>
                </div>
              </div>

              {/* Verificação anti-robô, exibida antes do botão de compra */}
              <div className="flex justify-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={!acceptedTerms || isLoading}
                className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all shadow-lg flex justify-center items-center ${
                  acceptedTerms && !isLoading
                    ? "bg-brand-purple hover:bg-opacity-90 cursor-pointer active:scale-95 shadow-purple-200"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                }`}
              >
                {isLoading ? (
                  <span className="animate-pulse">Processando...</span>
                ) : (
                  "Finalizar Assinatura"
                )}
              </button>

              {/* Aviso de cobrança, visível no momento da compra */}
              <p className="text-xs text-gray-500 text-center">
                {metodoPagamento === "cartao"
                  ? `Teste grátis de 90 dias disponível apenas no cartão de crédito. Assinatura mensal de R$ ${precoExibicao}, com a primeira cobrança no dia 91 e renovação automática. Cancele quando quiser.`
                  : `Pagamento via PIX de R$ ${precoExibicao} referente ao ciclo atual. Sem período de teste e sem renovação automática — vale só para este ciclo.`}
              </p>

              {/* Modais de Termos e Privacidade */}
              <Modal isOpen={checkoutModal === "termos"} onClose={closeCheckoutModal} title="Termos de Uso">
                <TermosContent />
              </Modal>

              <Modal isOpen={checkoutModal === "privacidade"} onClose={closeCheckoutModal} title="Política de Privacidade">
                <PrivacidadeContent />
              </Modal>
            </form>
          </>
        )}
      </div>

      {/* COLUNA DA DIREITA: Resumo */}
      <div className="bg-gray-900 text-white p-6 md:p-10 rounded-3xl shadow-xl md:col-span-5 space-y-8">
        <div className="py-2 border-b border-white/10 pb-6">
          <Link href="/">
            <img src="/logo-com-nome.svg" alt="Logo BoraMEI" className="h-11 cursor-pointer hover:opacity-80 transition-opacity filter drop-shadow-[0_5px_5px_rgba(255,255,255,0.1)]" />
          </Link>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center gap-4">
          <div className="min-w-0">
            <p className="font-bold text-lg capitalize text-white leading-tight">Plano {plano}</p>
            <p className="text-sm text-gray-400 mt-1">Acesso liberado</p>
          </div>
          <div className="flex items-baseline gap-1 whitespace-nowrap flex-shrink-0 text-right">
            <span className="text-2xl font-extrabold text-brand-green">
              R$ {precoExibicao}
            </span>
            <span className="text-xs text-gray-400">/mês</span>
          </div>
        </div>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>R$ {precoExibicao}</span>
          </div>
          <div className="flex justify-between text-brand-green font-bold">
            <span>Taxa de adesão</span>
            <span>Grátis</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-white border-t border-white/10 pt-4 mt-2">
            <span>Total a pagar</span>
            <span>R$ {precoExibicao}</span>
          </div>
        </div>
      </div>
    </div>
  );
}