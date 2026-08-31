import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { isAdmin } from '@/lib/adminAuth';
import { query } from '@/lib/db';

// ─────────────────────────────────────────────────────────────
// GET /api/admin/categorias — só para telas internas (/admin/categorias).
// Não faz parte do contrato de API do cliente MEI (não documentado em
// docs/api-financeiro.md). Lista TODAS as categorias (não filtra por
// ativo/mei_relevante, como /api/categorias faz) para permitir classificar
// tipo_custo (fixo/variável) em qualquer uma — usado no cálculo de Ponto de
// Equilíbrio da aba Gestão. Exige sessão + e-mail na allowlist de admin
// (ver src/lib/adminAuth.ts).
// ─────────────────────────────────────────────────────────────

type Natureza = 'receita' | 'despesa';
type TipoCusto = 'fixo' | 'variavel' | null;

interface CategoriaAdminRow {
  id: number;
  grupo: string;
  nome: string;
  natureza: Natureza;
  tipoCusto: TipoCusto;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: 'Não autenticado.' }, { status: 401 });
  }

  if (!(await isAdmin(usuario.usuarioId))) {
    return NextResponse.json({ mensagem: 'Acesso negado.' }, { status: 403 });
  }

  const categorias = await query<CategoriaAdminRow>(
    `SELECT id, grupo, categoria AS nome, natureza, tipo_custo AS "tipoCusto"
     FROM bora_mei_core.categorias_financeiras
     ORDER BY natureza, grupo, categoria`
  );

  return NextResponse.json({ categorias });
}
