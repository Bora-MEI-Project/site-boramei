import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { URL_CHECKOUT } from '@/lib/pagamentos';
import { isPlanoId } from '@/lib/planos';
import { buscarCampanhaValida, normalizarCodigoCampanha, registrarUsoCampanha } from '@/lib/campanhas';

interface ClienteCheckoutBody {
  nome: string;
  email: string;
  cpf: string;
  whatsapp: string;
  /** Opcional: só vem preenchido quando o MEI já está aberto. */
  cnpj?: string;
  endereco: { cep: string; numero: string };
}

interface CheckoutRequestBody {
  plano: string;
  metodo: 'cartao' | 'pix';
  turnstileToken?: string;
  senha: string;
  cliente: ClienteCheckoutBody;
  cardToken?: string;
  titular?: string;
  cpfTitular?: string;
  idempotencyKey?: string;
  /** Código do link promocional (?cupom=). Validado em src/lib/campanhas.ts. */
  cupom?: string;
}

const SENHA_MIN_LENGTH = 8;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function digitos(valor: unknown): string {
  return typeof valor === 'string' ? valor.replace(/\D/g, '') : '';
}

/**
 * Normaliza o cadastro antes de mandar ao n8n (que grava em usuarios). O front
 * já limpa as máscaras, mas o servidor não pode confiar nisso: e-mail com
 * maiúscula, por exemplo, quebrava o login — /api/auth/login compara com o
 * e-mail em minúsculas. Devolve uma mensagem de erro se algum campo for inválido.
 */
function normalizarCliente(cliente: ClienteCheckoutBody | undefined): ClienteCheckoutBody | string {
  const email = texto(cliente?.email).toLowerCase();
  const cpf = digitos(cliente?.cpf);
  const whatsapp = digitos(cliente?.whatsapp);
  const cnpj = digitos(cliente?.cnpj);

  if (!texto(cliente?.nome)) return 'Informe seu nome.';
  if (!REGEX_EMAIL.test(email)) return 'Informe um e-mail válido.';
  if (cpf.length !== 11) return 'Informe um CPF válido, com 11 dígitos.';
  if (whatsapp.length !== 11) return 'Informe um WhatsApp válido, com DDD (11 dígitos).';
  if (cnpj && cnpj.length !== 14) return 'Informe um CNPJ válido (14 dígitos) ou deixe em branco.';

  return {
    nome: texto(cliente?.nome).replace(/\s+/g, ' '),
    email,
    cpf,
    whatsapp,
    cnpj,
    endereco: {
      cep: digitos(cliente?.endereco?.cep),
      numero: texto(cliente?.endereco?.numero),
    },
  };
}

/**
 * Proxy do checkout: recebe a senha em texto puro do formulário, gera o hash
 * bcrypt aqui mesmo e repassa ao n8n só o senha_hash — a senha nunca sai
 * desta função (não é logada, salva, nem encaminhada adiante em texto puro).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: CheckoutRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { sucesso: false, mensagem: 'Corpo da requisição inválido.' },
      { status: 400 }
    );
  }

  const { senha, plano, metodo } = body;

  if (!isPlanoId(plano)) {
    return NextResponse.json(
      { sucesso: false, mensagem: 'Plano inválido.' },
      { status: 400 }
    );
  }

  if (metodo !== 'cartao' && metodo !== 'pix') {
    return NextResponse.json(
      { sucesso: false, mensagem: 'Forma de pagamento inválida.' },
      { status: 400 }
    );
  }

  if (typeof senha !== 'string' || senha.length < SENHA_MIN_LENGTH) {
    return NextResponse.json(
      { sucesso: false, mensagem: `A senha deve ter pelo menos ${SENHA_MIN_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  const cliente = normalizarCliente(body.cliente);
  if (typeof cliente === 'string') {
    return NextResponse.json({ sucesso: false, mensagem: cliente }, { status: 400 });
  }

  // O link promocional só traz o código; o efeito (ex.: trial_dias = 0) vem
  // do banco. Código informado mas inválido é erro — não pode cair calado no
  // fluxo normal, com trial, se o cliente entrou por um link "sem trial".
  const codigoCupom = normalizarCodigoCampanha(body.cupom);
  const campanha = codigoCupom ? await buscarCampanhaValida(codigoCupom, plano) : null;
  if (codigoCupom && !campanha) {
    return NextResponse.json(
      { sucesso: false, mensagem: 'Este link promocional não é válido ou expirou.' },
      { status: 400 }
    );
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  // Monta o corpo campo a campo, em vez de repassar o body inteiro: assim o
  // navegador não consegue injetar no n8n campos que só o servidor decide
  // (trial_dias, preço...).
  const n8nResponse = await fetch(URL_CHECKOUT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plano,
      metodo,
      turnstileToken: body.turnstileToken,
      cliente: { ...cliente, senha_hash },
      ...(metodo === 'cartao' && {
        cardToken: body.cardToken,
        titular: body.titular,
        cpfTitular: body.cpfTitular,
        idempotencyKey: body.idempotencyKey,
      }),
      ...(campanha && { cupom: campanha.codigo, trial_dias: campanha.trialDias }),
    }),
  });

  const data: unknown = await n8nResponse.json().catch(() => null);

  if (campanha && n8nResponse.ok && !pedidoRecusado(data)) {
    // Contagem é só estatística: se falhar, não pode derrubar um checkout já aceito.
    await registrarUsoCampanha(campanha.codigo).catch(() => {});
  }

  return NextResponse.json(data, { status: n8nResponse.status });
}

/** O n8n responde 200 também para recusas, com { sucesso: false } (objeto ou array de um item). */
function pedidoRecusado(data: unknown): boolean {
  const item: unknown = Array.isArray(data) ? data[0] : data;
  return typeof item === 'object' && item !== null && 'sucesso' in item && item.sucesso === false;
}
