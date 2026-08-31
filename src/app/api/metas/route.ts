import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUsuarioLogado } from "@/lib/auth";
import { query } from "@/lib/db";

// ─────────────────────────────────────────────────────────────
// GET/PUT /api/metas — meta de faturamento mensal do usuário, exibida na
// aba Gestão (/financeiro/gestao). Uma linha por usuário em
// bora_mei_core.metas_usuario (upsert via ON CONFLICT).
// ─────────────────────────────────────────────────────────────

interface MetaRow {
  meta_faturamento_mensal: string; // NUMERIC volta como string
}

interface PutBody {
  metaFaturamentoMensal?: unknown;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: "Não autenticado." }, { status: 401 });
  }

  const linhas = await query<MetaRow>(
    `SELECT meta_faturamento_mensal FROM bora_mei_core.metas_usuario WHERE usuario_id = $1`,
    [usuario.usuarioId]
  );

  return NextResponse.json({
    metaFaturamentoMensal: linhas.length > 0 ? Number(linhas[0].meta_faturamento_mensal) : null,
  });
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.json({ mensagem: "Não autenticado." }, { status: 401 });
  }

  let body: PutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ mensagem: "Corpo da requisição inválido." }, { status: 400 });
  }

  const meta =
    typeof body.metaFaturamentoMensal === "number"
      ? body.metaFaturamentoMensal
      : Number(body.metaFaturamentoMensal);

  if (!Number.isFinite(meta) || meta <= 0) {
    return NextResponse.json(
      { mensagem: "Meta deve ser um número maior que zero." },
      { status: 400 }
    );
  }

  await query(
    `INSERT INTO bora_mei_core.metas_usuario (usuario_id, meta_faturamento_mensal, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (usuario_id) DO UPDATE
       SET meta_faturamento_mensal = $2, updated_at = NOW()`,
    [usuario.usuarioId, meta]
  );

  return NextResponse.json({ metaFaturamentoMensal: meta });
}
