import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUsuarioLogado } from '@/lib/auth';
import { query } from '@/lib/db';

interface UsuarioRow {
  nome: string;
  email: string;
  whatsapp: string;
  cnpj: string | null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: 'Não autenticado.' }, { status: 401 });
  }

  const linhas = await query<UsuarioRow>(
    'SELECT nome, email, whatsapp, cnpj FROM bora_mei_core.usuarios WHERE id = $1 LIMIT 1',
    [usuario.usuarioId]
  );

  const dados = linhas[0];
  if (!dados) {
    return NextResponse.json({ mensagem: 'Usuário não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({
    nome: dados.nome,
    email: dados.email,
    whatsapp: dados.whatsapp,
    cnpj: dados.cnpj,
  });
}

interface AtualizarUsuarioBody {
  senhaAtual?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  cnpj?: unknown;
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Atualiza e-mail, WhatsApp e CNPJ do usuário logado. Exige a senha atual no
 * corpo (mesma verificação por bcrypt do login) — sem isso, uma sessão
 * roubada seria suficiente para trocar o e-mail/WhatsApp de contato de outra
 * pessoa, sem nunca ter tido acesso à senha dela.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: 'Não autenticado.' }, { status: 401 });
  }

  let body: AtualizarUsuarioBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ mensagem: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const senhaAtual = typeof body.senhaAtual === 'string' ? body.senhaAtual : '';
  if (!senhaAtual) {
    return NextResponse.json(
      { mensagem: 'Informe sua senha atual para confirmar a alteração.' },
      { status: 400 }
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.replace(/\D/g, '') : '';
  const cnpjDigitos = typeof body.cnpj === 'string' ? body.cnpj.replace(/\D/g, '') : '';

  if (!REGEX_EMAIL.test(email)) {
    return NextResponse.json({ mensagem: 'Informe um e-mail válido.' }, { status: 400 });
  }
  if (whatsapp.length !== 11) {
    return NextResponse.json(
      { mensagem: 'Informe um WhatsApp válido, com DDD (11 dígitos).' },
      { status: 400 }
    );
  }
  if (cnpjDigitos && cnpjDigitos.length !== 14) {
    return NextResponse.json(
      { mensagem: 'Informe um CNPJ válido (14 dígitos) ou deixe em branco.' },
      { status: 400 }
    );
  }
  const cnpj = cnpjDigitos || null;

  const linhaSenha = await query<{ senha_hash: string | null }>(
    'SELECT senha_hash FROM bora_mei_core.usuarios WHERE id = $1 LIMIT 1',
    [usuario.usuarioId]
  );
  const senhaHash = linhaSenha[0]?.senha_hash;
  if (!senhaHash || !(await bcrypt.compare(senhaAtual, senhaHash))) {
    return NextResponse.json({ mensagem: 'Senha atual incorreta.' }, { status: 401 });
  }

  const emailEmUso = await query<{ id: number }>(
    'SELECT id FROM bora_mei_core.usuarios WHERE email = $1 AND id != $2 LIMIT 1',
    [email, usuario.usuarioId]
  );
  if (emailEmUso.length > 0) {
    return NextResponse.json(
      { mensagem: 'Este e-mail já está em uso por outra conta.', codigo: 'EMAIL_DUPLICADO' },
      { status: 409 }
    );
  }

  const whatsappEmUso = await query<{ id: number }>(
    'SELECT id FROM bora_mei_core.usuarios WHERE whatsapp = $1 AND id != $2 LIMIT 1',
    [whatsapp, usuario.usuarioId]
  );
  if (whatsappEmUso.length > 0) {
    return NextResponse.json(
      { mensagem: 'Este WhatsApp já está em uso por outra conta.', codigo: 'WHATSAPP_DUPLICADO' },
      { status: 409 }
    );
  }

  try {
    await query(
      `UPDATE bora_mei_core.usuarios
       SET email = $1, whatsapp = $2, cnpj = $3, updated_at = NOW()
       WHERE id = $4`,
      [email, whatsapp, cnpj, usuario.usuarioId]
    );
  } catch (erro) {
    // usuarios.email tem UNIQUE no banco (whatsapp não) — o SELECT acima já
    // cobre o caso comum, isso aqui só pega a corrida rara de duas
    // requisições simultâneas tentando o mesmo e-mail ao mesmo tempo.
    if (erro instanceof Error && 'code' in erro && erro.code === '23505') {
      return NextResponse.json(
        { mensagem: 'Este e-mail já está em uso por outra conta.', codigo: 'EMAIL_DUPLICADO' },
        { status: 409 }
      );
    }
    throw erro;
  }

  return NextResponse.json({ sucesso: true, email, whatsapp, cnpj });
}
