import type { PlanoId } from "./planos";

declare global {
  interface Window {
    PagSeguro?: any;
  }
}

// --- CONFIGURAÇÃO ---
// Troque por variáveis de ambiente antes de ir para produção.
// A chave pública e a URL da API mudam entre sandbox e produção.
const PUBLIC_KEY = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw6wDPz05WyzykEqQszzhVFR7o7WFwmOCiJLmNAPr4y2ab7stEe6H6OoRB1GUKAjIW0o/tgIcU25SpFdur6oU7TZKMUbv5vQB66FBcP80Tnbef5By+EQklqUUZYDt2iLYog+Y6RyxkvNHyPPgwJY26ZQed5zkVCcMbzDVMeg5nUtem0BpO0sV/01Zzg93V+Ak5qj10okW/4YXCaZd5g95w1kxSL64AK8LH1u+ewHzg5E+D4ScE9OCTaM+EAHjkZccJEPdxfqVcHzIIDEtvWpFmGZVgBRuMJ/h89j02kIoKj8RtkvX7GgqV9e3hEDs5twWkJzpk+9OIs7g34hd5LBACQIDAQAB`;

const N8N_BASE = "https://n8n.boramei.cloud/webhook";
/** URL real do n8n — usada só pela rota interna /api/checkout (server-side), nunca chamada direto do navegador. */
export const URL_CHECKOUT = `${N8N_BASE}/boramei-checkout`;
const URL_STATUS = `${N8N_BASE}/boramei-status-pedido`;
/** O checkout do navegador fala com a nossa API route, que hasheia a senha antes de repassar ao n8n. */
const URL_CHECKOUT_PROXY = "/api/checkout";

// --- TIPAGENS ---
export interface ClienteData {
  nome: string;
  email: string;
  cpf: string;
  whatsapp: string;
  /** Opcional: preenchido só quando o MEI já está aberto. */
  cnpj?: string;
  cep: string;
  numero: string;
}

export interface CartaoData {
  nome: string;
  cpf: string;
  numero: string;
  validade: string;
  cvv: string;
}

export interface ProcessCheckoutParams {
  plano: PlanoId;
  metodo: 'cartao' | 'pix';
  cliente: ClienteData;
  /** Senha definida pelo MEI no checkout, usada depois para entrar na área do cliente. */
  senha: string;
  cartao?: CartaoData;
  turnstileToken?: string;
}

export type CardStatus = 'aprovado' | 'recusado' | 'analise';

export interface CheckoutResult {
  sucesso: boolean;
  mensagem?: string;
  /** EMAIL_DUPLICADO, CPF_DUPLICADO, WHATSAPP_DUPLICADO, ou outro código vindo do n8n. */
  codigo?: string;
  cardStatus?: CardStatus;
  pixData?: {
    orderId: string;
    qrCodeUrl: string;
    copiaECola: string;
    expiraEm: string | null;
  };
}

export interface StatusPedido {
  pago: boolean;
  status: string;
}

// --- CARREGADOR DO SDK ---
let scriptLoadingPromise: Promise<void> | null = null;

const loadPagBankScript = (): Promise<void> => {
  if (window.PagSeguro) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existente = document.querySelector('script[src*="pagseguro.min.js"]');
    if (existente) {
      // A tag existe, mas pode ainda não ter carregado.
      if (window.PagSeguro) {
        resolve();
      } else {
        existente.addEventListener('load', () => resolve());
        existente.addEventListener('error', () => {
          scriptLoadingPromise = null;
          reject(new Error("Não foi possível carregar o SDK do PagBank."));
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadingPromise = null;
      reject(new Error("Não foi possível carregar o SDK do PagBank."));
    };
    document.body.appendChild(script);
  });

  return scriptLoadingPromise;
};

// --- HELPERS ---

/** Remove acentos, força maiúsculas e corta em 30 caracteres (limite do PagBank). */
function normalizarTitular(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, 30);
}

/** Aceita objeto ou array de um item, para tolerar mudanças no Respond do n8n. */
function primeiroItem(data: any): any {
  return Array.isArray(data) ? data[0] : data;
}

// --- CHAVE DE IDEMPOTÊNCIA ---
// Vive no módulo, então sobrevive entre chamadas de processarCheckout.
let chaveAtual: string | null = null;

function obterChave(): string {
  if (!chaveAtual) chaveAtual = crypto.randomUUID();
  return chaveAtual;
}

/** Chame quando a próxima tentativa for uma cobrança legitimamente nova. */
function renovarChave(): void {
  chaveAtual = null;
}

// --- CRIPTOGRAFIA DO CARTÃO ---
async function encryptCardData(cartao: CartaoData): Promise<string> {
  await loadPagBankScript();

  const [expMonth, rawExpYear] = cartao.validade.trim().split("/");
  if (!expMonth || !rawExpYear) {
    throw new Error("Informe a validade no formato MM/AA.");
  }

  const cleanNumber = cartao.numero.replace(/\D/g, "");
  const cleanYear = rawExpYear.trim();
  const expYear = cleanYear.length === 2 ? `20${cleanYear}` : cleanYear;

  const card = window.PagSeguro.encryptCard({
    publicKey: PUBLIC_KEY,
    holder: normalizarTitular(cartao.nome),
    number: cleanNumber,
    securityCode: cartao.cvv.trim(),
    expMonth: expMonth.trim(),
    expYear: expYear,
  });

  if (card.hasErrors) {
    const erro = card.errors?.[0]?.message || "Verifique os dados do cartão.";
    throw new Error(erro);
  }

  return card.encryptedCard;
}

// --- CHECKOUT ---
export async function processarCheckout({
  plano,
  metodo,
  cliente,
  senha,
  cartao,
  turnstileToken
}: ProcessCheckoutParams): Promise<CheckoutResult> {
  try {
    let cardToken = "";
    let titular = "";
    let cpfTitular = "";

    if (metodo === 'cartao') {
      if (!cartao) throw new Error("Preencha os dados do cartão.");
      cardToken = await encryptCardData(cartao);
      titular = normalizarTitular(cartao.nome);
      cpfTitular = cartao.cpf.replace(/\D/g, "");
    }

    const payload = {
      plano,
      metodo,
      turnstileToken,
      senha,
      cliente: {
        nome: cliente.nome.trim(),
        email: cliente.email.trim(),
        cpf: cliente.cpf.replace(/\D/g, ""),
        whatsapp: cliente.whatsapp.replace(/\D/g, ""),
        cnpj: cliente.cnpj ? cliente.cnpj.replace(/\D/g, "") : "",
        endereco: {
          cep: cliente.cep.replace(/\D/g, ""),
          numero: cliente.numero.trim()
        }
      },
      // titular e cpfTitular vão junto para que o body do n8n use os dados
      // digitados no cartão, e não os dados do cadastro.
      ...(metodo === 'cartao' && { cardToken, titular, cpfTitular, idempotencyKey: obterChave() })
    };

    const response = await fetch(URL_CHECKOUT_PROXY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = primeiroItem(await response.json());

    if (!response.ok) {
      return {
        sucesso: false,
        codigo: data?.codigo,
        mensagem: data?.mensagem || "Não foi possível concluir o pagamento. Tente novamente."
      };
    }

    // --- PIX ---
    if (metodo === 'pix') {
      // Cadastro duplicado (e-mail/CPF/WhatsApp) é rejeitado antes de gerar o Pix.
      if (data?.sucesso === false) {
        return {
          sucesso: false,
          codigo: data?.codigo,
          mensagem: data?.mensagem || "Não foi possível concluir o cadastro. Tente novamente."
        };
      }

      const orderId: string = data?.id || '';
      const qr = data?.qr_codes?.[0];
      const copiaECola: string = qr?.text || '';
      const qrCodeUrl: string =
        qr?.links?.find((l: any) => l.rel === 'QRCODE.PNG')?.href || '';

      if (!copiaECola || !orderId) {
        return {
          sucesso: false,
          mensagem: "O Pix não pôde ser gerado. Tente novamente em instantes."
        };
      }

      return {
        sucesso: true,
        pixData: {
          orderId,
          qrCodeUrl,
          copiaECola,
          expiraEm: qr?.expiration_date || null
        }
      };
    }

    // --- CARTÃO ---
    // O n8n devolve { sucesso, status, mensagem, orderId, chargeId }.
    const status = String(data?.status || '').toUpperCase();

    if (status === 'IN_ANALYSIS') {
      return {
        sucesso: true,
        cardStatus: 'analise',
        mensagem: data?.mensagem || 'Estamos confirmando seu pagamento.'
      };
    }

    if (data?.sucesso !== true) {
      renovarChave();          // ← recusado: próxima é cobrança nova
      return {
        sucesso: false,
        codigo: data?.codigo,
        cardStatus: 'recusado',
        mensagem: data?.mensagem || 'Pagamento não autorizado. Tente outro cartão.'
      };
    }

    renovarChave();            // ← aprovado: encerrou, não reaproveitar
    return { sucesso: true, cardStatus: 'aprovado' };

  } catch (error: any) {
    return {
      sucesso: false,
      mensagem: error?.message || "Não foi possível falar com o servidor de pagamento."
    };
  }
}

// --- CONSULTA DE STATUS ---

/** Consulta única. Serve para Pix e para cartão em análise. */
export async function consultarStatus(orderId: string): Promise<StatusPedido> {
  if (!orderId) return { pago: false, status: 'NOT_FOUND' };

  try {
    const response = await fetch(`${URL_STATUS}?id=${encodeURIComponent(orderId)}`);
    if (!response.ok) return { pago: false, status: 'ERRO' };

    const data = primeiroItem(await response.json());
    return {
      pago: data?.pago === true,
      status: String(data?.status || 'WAITING')
    };
  } catch {
    return { pago: false, status: 'ERRO' };
  }
}

/** Mantido por compatibilidade com o código que já usa esta função. */
export async function checarStatusPix(orderId: string): Promise<boolean> {
  return (await consultarStatus(orderId)).pago;
}

/**
 * Faz polling até o pagamento cair ou o tempo acabar.
 * Devolve uma função de cancelamento para você chamar no cleanup do componente.
 */
export function aguardarPagamento(
  orderId: string,
  opcoes: {
    /** Fixo (ms) ou função do tempo decorrido (ms) para um polling com backoff. */
    intervaloMs?: number | ((decorridoMs: number) => number);
    limiteMs?: number;
    onTick?: (status: StatusPedido) => void;
  } = {}
): { promessa: Promise<boolean>; cancelar: () => void } {
  const intervaloOpcao = opcoes.intervaloMs;
  const calcularIntervalo: (decorridoMs: number) => number = typeof intervaloOpcao === 'function'
    ? intervaloOpcao
    : () => intervaloOpcao ?? 3000;
  const limite = opcoes.limiteMs ?? 5 * 60 * 1000;

  let cancelado = false;
  const cancelar = () => { cancelado = true; };

  const promessa = (async () => {
    const inicio = Date.now();
    const fim = inicio + limite;

    while (!cancelado && Date.now() < fim) {
      const status = await consultarStatus(orderId);
      opcoes.onTick?.(status);
      if (status.pago) return true;
      await new Promise(res => setTimeout(res, calcularIntervalo(Date.now() - inicio)));
    }

    return false;
  })();

  return { promessa, cancelar };
}