import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';
import { criarTokenSessao, SESSION_COOKIE } from '@/lib/auth';

interface LoginRequestBody {
  email: string;
  senha: string;
}

interface UsuarioAuthRow {
  id: number;
  senha_hash: string | null;
}

const MENSAGEM_CREDENCIAIS_INVALIDAS = 'Email ou senha inválidos.';
const SESSION_MAX_AGE_SEGUNDOS = 60 * 60 * 24 * 7; // 7 dias

// TODO: aplicar rate limiting neste endpoint (ex.: por IP e/ou por e-mail)
// para dificultar ataques de força bruta antes de ir para produção.
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: LoginRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ sucesso: false, mensagem: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const senha = body.senha;

  if (!email || typeof senha !== 'string') {
    return NextResponse.json({ sucesso: false, mensagem: MENSAGEM_CREDENCIAIS_INVALIDAS }, { status: 401 });
  }

  const resultado = await pool.query<UsuarioAuthRow>(
    'SELECT id, senha_hash FROM bora_mei_core.usuarios WHERE email = $1 LIMIT 1',
    [email]
  );

  const usuario = resultado.rows[0];

  if (!usuario || !usuario.senha_hash) {
    return NextResponse.json({ sucesso: false, mensagem: MENSAGEM_CREDENCIAIS_INVALIDAS }, { status: 401 });
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaCorreta) {
    return NextResponse.json({ sucesso: false, mensagem: MENSAGEM_CREDENCIAIS_INVALIDAS }, { status: 401 });
  }

  const token = await criarTokenSessao(usuario.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEGUNDOS,
  });

  return NextResponse.json({ sucesso: true });
}
