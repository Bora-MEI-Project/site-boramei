import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { query } from '@/lib/db';

interface DeletadoRow {
  id: number;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;
  const lancamentoId = Number(id);
  if (!Number.isInteger(lancamentoId)) {
    return NextResponse.json({ mensagem: 'Lançamento não encontrado.' }, { status: 404 });
  }

  const deletado = await query<DeletadoRow>(
    `DELETE FROM bora_mei_core.lancamentos
     WHERE id = $1 AND usuario_id = $2
     RETURNING id`,
    [lancamentoId, usuario.usuarioId]
  );

  if (deletado.length === 0) {
    return NextResponse.json({ mensagem: 'Lançamento não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ sucesso: true });
}
