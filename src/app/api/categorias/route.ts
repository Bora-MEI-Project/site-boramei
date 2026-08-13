import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { query } from '@/lib/db';

type Natureza = 'receita' | 'despesa';

interface CategoriaRow {
  id: number;
  natureza: Natureza;
  grupo: string;
  nome: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: 'Não autenticado.' }, { status: 401 });
  }

  const categorias = await query<CategoriaRow>(
    `SELECT id, natureza, grupo, categoria AS nome
     FROM bora_mei_core.categorias_financeiras
     WHERE ativo = true AND mei_relevante = true
     ORDER BY grupo, categoria`
  );

  return NextResponse.json({ categorias });
}
