import { query } from '@/lib/db';
import { exigirAdmin } from '@/lib/dal';

// ─────────────────────────────────────────────────────────────
// Consultas das telas /admin, /admin/usuarios e /admin/usuarios/[id].
// Toda função começa com exigirAdmin() — ver src/lib/dal.ts.
//
// Datas de timestamp chegam já formatadas pelo Postgres (to_char), como
// string: o driver pg converteria TIMESTAMP em Date reinterpretando no fuso
// do servidor, e o dia exibido mudaria conforme onde o Next está rodando.
// ─────────────────────────────────────────────────────────────

/**
 * Chave para cruzar usuarios.whatsapp com mei_profiles.whatsapp_number (o
 * assistente do WhatsApp, alimentado pelo n8n). Os formatos não batem:
 *   - usuarios:     DDD + 9 + 8 dígitos  ("81999998888")
 *   - mei_profiles: 55 + DDD + 8 dígitos ("558199998888"), sem o nono dígito
 * Então comparamos DDD + últimos 8 dígitos dos dois lados. Só usado quando
 * mei_profiles.usuario_id não está preenchido (a maioria dos perfis).
 */
const CHAVE_WPP_USUARIO = `substr(regexp_replace(u.whatsapp, '\\D', '', 'g'), 1, 2) || right(regexp_replace(u.whatsapp, '\\D', '', 'g'), 8)`;
const CHAVE_WPP_PERFIL = `substr(regexp_replace(p.whatsapp_number, '\\D', '', 'g'), 3, 2) || right(regexp_replace(p.whatsapp_number, '\\D', '', 'g'), 8)`;

/** Perfis do WhatsApp (mei_profiles p) que pertencem ao usuário u. */
const PERFIL_DO_USUARIO = `(p.usuario_id = u.id OR (u.whatsapp IS NOT NULL AND ${CHAVE_WPP_PERFIL} = ${CHAVE_WPP_USUARIO}))`;

const FORMATO_DATA = `'DD/MM/YYYY'`;
const FORMATO_DATA_HORA = `'DD/MM/YYYY HH24:MI'`;

export const TAMANHO_PAGINA = 25;

// ── Visão geral ──────────────────────────────────────────────

export interface ResumoUsuarios {
  total: number;
  ativos: number;
  trial: number;
  semSenha: number;
  novos30Dias: number;
  /** Soma de valor_plano (centavos) dos usuários com status "ativo". */
  mrrCentavos: number;
  usandoFinanceiro30Dias: number;
  usandoWhatsapp30Dias: number;
}

export async function obterResumoUsuarios(): Promise<ResumoUsuarios> {
  await exigirAdmin();

  const [linha] = await query<ResumoUsuarios>(
    `SELECT
       count(*)::int                                                         AS total,
       count(*) FILTER (WHERE u.status = 'ativo')::int                       AS ativos,
       count(*) FILTER (WHERE u.status = 'trial')::int                       AS trial,
       count(*) FILTER (WHERE u.senha_hash IS NULL)::int                     AS "semSenha",
       count(*) FILTER (WHERE u.created_at >= NOW() - INTERVAL '30 days')::int AS "novos30Dias",
       COALESCE(sum(u.valor_plano) FILTER (WHERE u.status = 'ativo'), 0)::int AS "mrrCentavos",
       count(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM bora_mei_core.lancamentos l
          WHERE l.usuario_id = u.id AND l.criado_em >= NOW() - INTERVAL '30 days'
       ))::int                                                               AS "usandoFinanceiro30Dias",
       count(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM bora_mei_core.mei_profiles p
           JOIN bora_mei_core.chat_window c ON c.profile_id = p.id
          WHERE ${PERFIL_DO_USUARIO} AND c.created_at >= NOW() - INTERVAL '30 days'
       ))::int                                                               AS "usandoWhatsapp30Dias"
     FROM bora_mei_core.usuarios u`
  );

  return linha;
}

export interface CadastrosMes {
  /** "YYYY-MM" */
  mes: string;
  total: number;
}

/** Cadastros por mês nos últimos `meses` meses (incluindo o atual), com zeros nos meses vazios. */
export async function obterCadastrosPorMes(meses = 6): Promise<CadastrosMes[]> {
  await exigirAdmin();

  return query<CadastrosMes>(
    `SELECT to_char(m.inicio, 'YYYY-MM') AS mes, count(u.id)::int AS total
       FROM generate_series(
              date_trunc('month', NOW())::timestamp - make_interval(months => $1::int - 1),
              date_trunc('month', NOW())::timestamp,
              INTERVAL '1 month'
            ) AS m(inicio)
       LEFT JOIN bora_mei_core.usuarios u
              ON date_trunc('month', u.created_at) = m.inicio
      GROUP BY m.inicio
      ORDER BY m.inicio`,
    [meses]
  );
}

export interface DistribuicaoPlano {
  plano: string | null;
  status: string | null;
  total: number;
}

export async function obterDistribuicaoPlanos(): Promise<DistribuicaoPlano[]> {
  await exigirAdmin();

  return query<DistribuicaoPlano>(
    `SELECT plano_ativo AS plano, status, count(*)::int AS total
       FROM bora_mei_core.usuarios
      GROUP BY plano_ativo, status
      ORDER BY total DESC`
  );
}

// ── Lista ────────────────────────────────────────────────────

export interface UsuarioListaItem {
  id: number;
  nome: string;
  email: string;
  whatsapp: string | null;
  plano: string | null;
  valorPlano: number | null;
  status: string | null;
  temSenha: boolean;
  cadastradoEm: string | null;
  /** "YYYY-MM-DD" (coluna DATE) */
  ultimoLancamento: string | null;
  ultimaMensagemWhatsapp: string | null;
}

export interface FiltrosUsuarios {
  busca: string;
  status: string;
  pagina: number;
}

export interface ResultadoListaUsuarios {
  usuarios: UsuarioListaItem[];
  total: number;
  /** Valores distintos de usuarios.status, para o filtro. */
  statusDisponiveis: string[];
}

/** Cada linha carrega o total geral do filtro (count(*) OVER ()), para paginar sem uma segunda consulta. */
interface UsuarioListaRow extends UsuarioListaItem {
  totalGeral?: number;
}

export async function listarUsuarios({ busca, status, pagina }: FiltrosUsuarios): Promise<ResultadoListaUsuarios> {
  await exigirAdmin();

  const termo = busca.trim();
  const digitos = termo.replace(/\D/g, '');
  const offset = (Math.max(pagina, 1) - 1) * TAMANHO_PAGINA;

  // Nome/e-mail por ILIKE; CPF, WhatsApp e CNPJ comparando só os dígitos
  // (são gravados em formatos diferentes conforme a origem do cadastro).
  const linhas = await query<UsuarioListaRow>(
    `SELECT
       u.id, u.nome, u.email, u.whatsapp,
       u.plano_ativo AS plano,
       u.valor_plano AS "valorPlano",
       u.status,
       (u.senha_hash IS NOT NULL) AS "temSenha",
       to_char(u.created_at, ${FORMATO_DATA}) AS "cadastradoEm",
       (SELECT max(l.data) FROM bora_mei_core.lancamentos l WHERE l.usuario_id = u.id) AS "ultimoLancamento",
       (SELECT to_char(max(c.created_at) AT TIME ZONE 'America/Sao_Paulo', ${FORMATO_DATA})
          FROM bora_mei_core.mei_profiles p
          JOIN bora_mei_core.chat_window c ON c.profile_id = p.id
         WHERE ${PERFIL_DO_USUARIO}) AS "ultimaMensagemWhatsapp",
       count(*) OVER ()::int AS "totalGeral"
     FROM bora_mei_core.usuarios u
     WHERE ($1 = '' OR u.nome ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%'
            OR ($2 <> '' AND (
                 regexp_replace(u.cpf, '\\D', '', 'g') LIKE '%' || $2 || '%'
              OR regexp_replace(COALESCE(u.whatsapp, ''), '\\D', '', 'g') LIKE '%' || $2 || '%'
              OR regexp_replace(COALESCE(u.cnpj, ''), '\\D', '', 'g') LIKE '%' || $2 || '%')))
       AND ($3 = '' OR u.status = $3)
     ORDER BY u.created_at DESC NULLS LAST, u.id DESC
     LIMIT $4 OFFSET $5`,
    [termo, digitos, status, TAMANHO_PAGINA, offset]
  );

  const statusLinhas = await query<{ status: string }>(
    `SELECT DISTINCT status FROM bora_mei_core.usuarios WHERE status IS NOT NULL ORDER BY status`
  );

  const total = linhas[0]?.totalGeral ?? 0;
  for (const linha of linhas) delete linha.totalGeral;

  return {
    usuarios: linhas,
    total,
    statusDisponiveis: statusLinhas.map((l) => l.status),
  };
}

/** Os 5 cadastros mais recentes, para a Visão geral. */
export async function listarUltimosCadastros(): Promise<UsuarioListaItem[]> {
  const { usuarios } = await listarUsuarios({ busca: '', status: '', pagina: 1 });
  return usuarios.slice(0, 5);
}

// ── Detalhe ──────────────────────────────────────────────────

export interface UsuarioDetalhe {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  whatsapp: string | null;
  cnpj: string | null;
  eMei: boolean;
  cep: string | null;
  enderecoNumero: string | null;
  temSenha: boolean;
  cadastradoEm: string | null;
  atualizadoEm: string | null;

  plano: string | null;
  valorPlano: number | null;
  status: string | null;
  statusAssinatura: string | null;
  trialExpiraEm: string | null;
  assinaturaAtivadaEm: string | null;
  /** "YYYY-MM-DD" (coluna DATE) */
  proximaCobranca: string | null;
  ultimoPagamento: string | null;
  ultimaFalhaCobranca: string | null;
  motivoFalha: string | null;
  tentativas: number | null;
  cartaoFinal: string | null;
  cartaoBandeira: string | null;

  totalLancamentos: number;
  lancamentos30Dias: number;
  ultimoLancamento: string | null;
  metaFaturamentoMensal: string | null;

  totalNfse: number;
  certificadoStatus: string | null;
  /** "YYYY-MM-DD" (coluna DATE) */
  certificadoValidoAte: string | null;

  perfilWhatsapp: boolean;
  onboardingCompleto: boolean | null;
  ramoAtuacao: string | null;
  municipio: string | null;
  uf: string | null;
  mensagensWhatsapp: number;
  mensagensWhatsapp30Dias: number;
  ultimaMensagemWhatsapp: string | null;
}

export async function obterUsuario(id: number): Promise<UsuarioDetalhe | null> {
  await exigirAdmin();

  const linhas = await query<UsuarioDetalhe>(
    `WITH perfis AS (
       SELECT p.*
         FROM bora_mei_core.usuarios u
         JOIN bora_mei_core.mei_profiles p ON ${PERFIL_DO_USUARIO}
        WHERE u.id = $1
     ),
     mensagens AS (
       SELECT count(*)::int AS total,
              count(*) FILTER (WHERE c.created_at >= NOW() - INTERVAL '30 days')::int AS ultimos30,
              max(c.created_at) AS ultima
         FROM bora_mei_core.chat_window c
        WHERE c.profile_id IN (SELECT id FROM perfis)
     )
     SELECT
       u.id, u.nome, u.email, u.cpf, u.whatsapp, u.cnpj,
       u.e_mei AS "eMei",
       u.cep, u.endereco_numero AS "enderecoNumero",
       (u.senha_hash IS NOT NULL) AS "temSenha",
       to_char(u.created_at, ${FORMATO_DATA_HORA}) AS "cadastradoEm",
       to_char(u.updated_at, ${FORMATO_DATA_HORA}) AS "atualizadoEm",

       u.plano_ativo AS plano,
       u.valor_plano AS "valorPlano",
       u.status,
       u.status_assinatura AS "statusAssinatura",
       to_char(u.trial_expira_em, ${FORMATO_DATA}) AS "trialExpiraEm",
       to_char(u.assinatura_ativada_em, ${FORMATO_DATA_HORA}) AS "assinaturaAtivadaEm",
       u.data_proxima_cobranca AS "proximaCobranca",
       to_char(u.ultimo_pagamento, ${FORMATO_DATA_HORA}) AS "ultimoPagamento",
       to_char(u.ultima_falha_cobranca, ${FORMATO_DATA_HORA}) AS "ultimaFalhaCobranca",
       u.motivo_falha AS "motivoFalha",
       u.tentativas,
       u.card_final AS "cartaoFinal",
       u.card_bandeira AS "cartaoBandeira",

       (SELECT count(*)::int FROM bora_mei_core.lancamentos l WHERE l.usuario_id = u.id) AS "totalLancamentos",
       (SELECT count(*)::int FROM bora_mei_core.lancamentos l
         WHERE l.usuario_id = u.id AND l.criado_em >= NOW() - INTERVAL '30 days') AS "lancamentos30Dias",
       (SELECT max(l.data) FROM bora_mei_core.lancamentos l WHERE l.usuario_id = u.id) AS "ultimoLancamento",
       (SELECT m.meta_faturamento_mensal FROM bora_mei_core.metas_usuario m WHERE m.usuario_id = u.id) AS "metaFaturamentoMensal",

       (SELECT count(*)::int FROM bora_mei_core.nfse_emitidas n WHERE n.usuario_id = u.id) AS "totalNfse",
       cert.status AS "certificadoStatus",
       cert.valido_ate AS "certificadoValidoAte",

       EXISTS (SELECT 1 FROM perfis) AS "perfilWhatsapp",
       (SELECT bool_or(onboarding_complete) FROM perfis) AS "onboardingCompleto",
       (SELECT ramo_atuacao FROM perfis WHERE ramo_atuacao IS NOT NULL LIMIT 1) AS "ramoAtuacao",
       (SELECT municipio FROM perfis WHERE municipio IS NOT NULL LIMIT 1) AS municipio,
       (SELECT uf FROM perfis WHERE uf IS NOT NULL LIMIT 1) AS uf,
       mensagens.total AS "mensagensWhatsapp",
       mensagens.ultimos30 AS "mensagensWhatsapp30Dias",
       to_char(mensagens.ultima AT TIME ZONE 'America/Sao_Paulo', ${FORMATO_DATA_HORA}) AS "ultimaMensagemWhatsapp"
     FROM bora_mei_core.usuarios u
     CROSS JOIN mensagens
     LEFT JOIN LATERAL (
       SELECT c.status, c.valido_ate
         FROM bora_mei_core.certificados_digitais c
        WHERE c.usuario_id = u.id
        ORDER BY c.criado_em DESC
        LIMIT 1
     ) cert ON TRUE
     WHERE u.id = $1`,
    [id]
  );

  return linhas[0] ?? null;
}
