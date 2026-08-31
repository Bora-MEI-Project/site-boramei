import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { isAdmin } from '@/lib/adminAuth';
import { query } from '@/lib/db';

// PATCH /api/admin/categorias/[id] — classifica uma categoria como
// fixo/variável. Só para /admin/categorias, ver nota em ../route.ts.

interface PatchBody {
  tipoCusto?: unknown;
}

interface AtualizadaRow {
  id: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: 'Não autenticado.' }, { status: 401 });
  }

  if (!(await isAdmin(usuario.usuarioId))) {
    return NextResponse.json({ mensagem: 'Acesso negado.' }, { status: 403 });
  }

  const { id } = await params;
  const categoriaId = Number(id);
  if (!Number.isInteger(categoriaId)) {
    return NextResponse.json({ mensagem: 'Categoria não encontrada.' }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ mensagem: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  if (body.tipoCusto !== 'fixo' && body.tipoCusto !== 'variavel') {
    return NextResponse.json(
      { mensagem: 'tipoCusto deve ser "fixo" ou "variavel".' },
      { status: 400 }
    );
  }

  const atualizada = await query<AtualizadaRow>(
    `UPDATE bora_mei_core.categorias_financeiras
     SET tipo_custo = $1
     WHERE id = $2
     RETURNING id`,
    [body.tipoCusto, categoriaId]
  );

  if (atualizada.length === 0) {
    return NextResponse.json({ mensagem: 'Categoria não encontrada.' }, { status: 404 });
  }

  return NextResponse.json({ sucesso: true });
}
