import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { query } from '@/lib/db';

type Natureza = 'receita' | 'despesa';

interface LancamentoRow {
  id: number;
  descricao: string;
  valor: string;
  data: string;
  categoriaId: number;
  categoriaNome: string;
  natureza: Natureza;
}

interface TotaisRow {
  entradas: string;
  saidas: string;
  saldo: string;
}

interface LancamentoResponse {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  categoriaId: number;
  categoriaNome: string;
  natureza: Natureza;
}

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Primeiro e último dia do mês atual, no formato YYYY-MM-DD. */
function periodoMesAtual(): { inicio: string; fim: string } {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const inicio = new Date(ano, mes, 1);
  const fim = new Date(ano, mes + 1, 0);
  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { inicio: fmt(inicio), fim: fmt(fim) };
}

function resolverPeriodo(request: NextRequest): { inicio: string; fim: string } {
  const params = request.nextUrl.searchParams;
  const inicioParam = params.get('inicio');
  const fimParam = params.get('fim');
  const padrao = periodoMesAtual();

  const inicio = inicioParam && REGEX_DATA.test(inicioParam) ? inicioParam : padrao.inicio;
  const fim = fimParam && REGEX_DATA.test(fimParam) ? fimParam : padrao.fim;
  return { inicio, fim };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: 'Não autenticado.' }, { status: 401 });
  }

  const { inicio, fim } = resolverPeriodo(request);

  const [linhas, totais] = await Promise.all([
    query<LancamentoRow>(
      `SELECT l.id, l.descricao, l.valor, l.data,
              l.categoria_id AS "categoriaId",
              c.categoria AS "categoriaNome",
              c.natureza
       FROM bora_mei_core.lancamentos l
       JOIN bora_mei_core.categorias_financeiras c ON c.id = l.categoria_id
       WHERE l.usuario_id = $1 AND l.data BETWEEN $2 AND $3
       ORDER BY l.data DESC, l.id DESC`,
      [usuario.usuarioId, inicio, fim]
    ),
    query<TotaisRow>(
      `SELECT
         COALESCE(SUM(CASE WHEN c.natureza = 'receita' THEN l.valor ELSE 0 END), 0) AS entradas,
         COALESCE(SUM(CASE WHEN c.natureza = 'despesa' THEN l.valor ELSE 0 END), 0) AS saidas,
         COALESCE(SUM(CASE WHEN c.natureza = 'receita' THEN l.valor ELSE -l.valor END), 0) AS saldo
       FROM bora_mei_core.lancamentos l
       JOIN bora_mei_core.categorias_financeiras c ON c.id = l.categoria_id
       WHERE l.usuario_id = $1 AND l.data BETWEEN $2 AND $3`,
      [usuario.usuarioId, inicio, fim]
    ),
  ]);

  const lancamentos: LancamentoResponse[] = linhas.map((l) => ({
    ...l,
    valor: Number(l.valor),
  }));

  const totaisRow = totais[0];
  const resumo = {
    entradas: Number(totaisRow?.entradas ?? 0),
    saidas: Number(totaisRow?.saidas ?? 0),
    saldo: Number(totaisRow?.saldo ?? 0),
  };

  return NextResponse.json({ periodo: { inicio, fim }, lancamentos, totais: resumo });
}

interface CriarLancamentoBody {
  descricao?: unknown;
  valor?: unknown;
  categoriaId?: unknown;
  data?: unknown;
}

interface CategoriaValidaRow {
  id: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: 'Não autenticado.' }, { status: 401 });
  }

  let body: CriarLancamentoBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ mensagem: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
  const valor = typeof body.valor === 'number' ? body.valor : Number(body.valor);
  const categoriaId = typeof body.categoriaId === 'number' ? body.categoriaId : Number(body.categoriaId);
  const data = typeof body.data === 'string' && REGEX_DATA.test(body.data) ? body.data : null;

  if (!descricao) {
    return NextResponse.json({ mensagem: 'Descrição é obrigatória.' }, { status: 400 });
  }
  if (!Number.isFinite(valor) || valor <= 0) {
    return NextResponse.json({ mensagem: 'Valor deve ser um número maior que zero.' }, { status: 400 });
  }
  if (!Number.isInteger(categoriaId)) {
    return NextResponse.json({ mensagem: 'Categoria inválida.' }, { status: 400 });
  }

  const categoriaValida = await query<CategoriaValidaRow>(
    `SELECT id FROM bora_mei_core.categorias_financeiras
     WHERE id = $1 AND ativo = true AND mei_relevante = true`,
    [categoriaId]
  );
  if (categoriaValida.length === 0) {
    return NextResponse.json({ mensagem: 'Categoria inválida.' }, { status: 400 });
  }

  const inserido = await query<LancamentoRow>(
    `WITH novo AS (
       INSERT INTO bora_mei_core.lancamentos (usuario_id, categoria_id, descricao, valor, data)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE))
       RETURNING id, descricao, valor, data, categoria_id
     )
     SELECT novo.id, novo.descricao, novo.valor, novo.data,
            novo.categoria_id AS "categoriaId",
            c.categoria AS "categoriaNome",
            c.natureza
     FROM novo
     JOIN bora_mei_core.categorias_financeiras c ON c.id = novo.categoria_id`,
    [usuario.usuarioId, categoriaId, descricao, valor, data]
  );

  const criado = inserido[0];
  const resposta: LancamentoResponse = { ...criado, valor: Number(criado.valor) };

  return NextResponse.json({ lancamento: resposta }, { status: 201 });
}
