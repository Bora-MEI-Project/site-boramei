import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';
import { criarTokenSessao, SESSION_COOKIE } from '@/lib/auth';

interface CriarSenhaBody {
  cpf?: unknown;
  email?: unknown;
  senha?: unknown;
}

interface UsuarioPreCadastroRow {
  id: number;
  senha_hash: string | null;
}

const SENHA_MIN_LENGTH = 8;
const SESSION_MAX_AGE_SEGUNDOS = 60 * 60 * 24 * 7; // 7 dias

// Mensagem genérica: não revela se o que não bateu foi o CPF ou o e-mail,
// para não transformar o endpoint em um verificador de cadastro.
const MENSAGEM_NAO_ENCONTRADO =
  'Não encontramos um pré-cadastro com esse CPF e e-mail. Confira os dados informados.';

const MENSAGEM_SENHA_JA_DEFINIDA = 'Sua conta já tem uma senha definida! Faça o Login';

// TODO: aplicar rate limiting neste endpoint (ex.: por IP e/ou por CPF), igual
// ao /api/auth/login, antes de ir para produção.
/**
 * Define a senha de um usuário que veio do pré-cadastro (checkout/n8n) e ainda
 * não tem senha_hash. Só funciona uma vez por conta: se a senha já existe, o
 * fluxo correto é o login — assim CPF + e-mail não viram um caminho para
 * sobrescrever a senha de uma conta ativa.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: CriarSenhaBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ sucesso: false, mensagem: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const cpf = typeof body.cpf === 'string' ? body.cpf.replace(/\D/g, '') : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const senha = typeof body.senha === 'string' ? body.senha : '';

  if (cpf.length !== 11) {
    return NextResponse.json({ sucesso: false, mensagem: 'Informe um CPF válido, com 11 dígitos.' }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ sucesso: false, mensagem: 'Informe o e-mail do pré-cadastro.' }, { status: 400 });
  }
  if (senha.length < SENHA_MIN_LENGTH) {
    return NextResponse.json(
      { sucesso: false, mensagem: `A senha deve ter pelo menos ${SENHA_MIN_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  // O CPF é gravado em formatos diferentes conforme a origem do cadastro, por
  // isso comparamos só os dígitos dos dois lados.
  const resultado = await pool.query<UsuarioPreCadastroRow>(
    `SELECT id, senha_hash
       FROM bora_mei_core.usuarios
      WHERE lower(email) = $1
        AND regexp_replace(cpf, '[^0-9]', '', 'g') = $2
      LIMIT 1`,
    [email, cpf]
  );

  const usuario = resultado.rows[0];

  if (!usuario) {
    return NextResponse.json({ sucesso: false, mensagem: MENSAGEM_NAO_ENCONTRADO }, { status: 404 });
  }

  if (usuario.senha_hash) {
    return NextResponse.json(
      { sucesso: false, mensagem: MENSAGEM_SENHA_JA_DEFINIDA },
      { status: 409 }
    );
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  // A condição senha_hash IS NULL evita que dois envios simultâneos gravem
  // senhas diferentes: o segundo não atualiza nada e cai no 409.
  const atualizacao = await pool.query(
    `UPDATE bora_mei_core.usuarios
        SET senha_hash = $1, updated_at = NOW()
      WHERE id = $2 AND senha_hash IS NULL`,
    [senhaHash, usuario.id]
  );

  if (atualizacao.rowCount === 0) {
    return NextResponse.json(
      { sucesso: false, mensagem: MENSAGEM_SENHA_JA_DEFINIDA },
      { status: 409 }
    );
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
