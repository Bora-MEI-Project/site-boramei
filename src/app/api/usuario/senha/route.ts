import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUsuarioLogado } from '@/lib/auth';
import { query } from '@/lib/db';

interface TrocarSenhaBody {
  senhaAtual?: unknown;
  novaSenha?: unknown;
}

const SENHA_MIN_LENGTH = 8;

/** Troca a senha do usuário logado — exige a senha atual, igual ao PATCH /api/usuario. */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: 'Não autenticado.' }, { status: 401 });
  }

  let body: TrocarSenhaBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ mensagem: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const senhaAtual = typeof body.senhaAtual === 'string' ? body.senhaAtual : '';
  const novaSenha = typeof body.novaSenha === 'string' ? body.novaSenha : '';

  if (!senhaAtual) {
    return NextResponse.json({ mensagem: 'Informe sua senha atual.' }, { status: 400 });
  }
  if (novaSenha.length < SENHA_MIN_LENGTH) {
    return NextResponse.json(
      { mensagem: `A nova senha deve ter pelo menos ${SENHA_MIN_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  const linhaSenha = await query<{ senha_hash: string | null }>(
    'SELECT senha_hash FROM bora_mei_core.usuarios WHERE id = $1 LIMIT 1',
    [usuario.usuarioId]
  );
  const senhaHash = linhaSenha[0]?.senha_hash;
  if (!senhaHash || !(await bcrypt.compare(senhaAtual, senhaHash))) {
    return NextResponse.json({ mensagem: 'Senha atual incorreta.' }, { status: 401 });
  }

  const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
  await query(
    'UPDATE bora_mei_core.usuarios SET senha_hash = $1, updated_at = NOW() WHERE id = $2',
    [novaSenhaHash, usuario.usuarioId]
  );

  return NextResponse.json({ sucesso: true });
}
