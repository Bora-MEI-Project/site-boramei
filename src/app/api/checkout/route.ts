import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { URL_CHECKOUT } from '@/lib/pagamentos';
import { isPlanoId } from '@/lib/planos';

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
}

const SENHA_MIN_LENGTH = 8;

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

  const { senha, ...dadosCheckout } = body;

  if (!isPlanoId(dadosCheckout.plano)) {
    return NextResponse.json(
      { sucesso: false, mensagem: 'Plano inválido.' },
      { status: 400 }
    );
  }

  if (typeof senha !== 'string' || senha.length < SENHA_MIN_LENGTH) {
    return NextResponse.json(
      { sucesso: false, mensagem: `A senha deve ter pelo menos ${SENHA_MIN_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  const n8nResponse = await fetch(URL_CHECKOUT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...dadosCheckout,
      cliente: { ...dadosCheckout.cliente, senha_hash },
    }),
  });

  const data: unknown = await n8nResponse.json().catch(() => null);
  return NextResponse.json(data, { status: n8nResponse.status });
}
