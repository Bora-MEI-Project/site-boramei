import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';
import { criarTokenSessao, SESSION_COOKIE } from '@/lib/auth';
import { consumirTentativas, ipDoCliente, limparTentativas, respostaBloqueada } from '@/lib/rateLimit';

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

// Limites por janela de 10 minutos. O teto por IP é mais folgado porque vários
// assinantes podem sair do mesmo IP; o teto por e-mail é o que efetivamente
// trava a força bruta contra uma conta específica.
const LIMITE_POR_IP = 20;
const LIMITE_POR_EMAIL = 8;

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

  // Antes da consulta e do bcrypt, que são justamente o custo que o atacante
  // quer gastar do servidor a cada tentativa.
  const ip = ipDoCliente(request);
  const regras = [{ chave: `login:email:${email}`, limite: LIMITE_POR_EMAIL }];
  if (ip) regras.push({ chave: `login:ip:${ip}`, limite: LIMITE_POR_IP });

  const chaves = regras.map((regra) => regra.chave);
  const limite = await consumirTentativas(regras);
  if (limite.bloqueado) {
    const { corpo, init } = respostaBloqueada(limite.esperarSegundos);
    return NextResponse.json(corpo, init);
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

  await limparTentativas(chaves);

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
