import { cache } from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { SESSION_COOKIE, verificarTokenSessao, type SessaoUsuario } from './auth';
import { isAdmin } from './adminAuth';

// ─────────────────────────────────────────────────────────────
// Data Access Layer das telas de /admin (Server Components e Server Actions).
//
// Toda função que lê ou altera dados do admin deve chamar exigirAdmin()
// antes — não basta a checagem do layout de /admin: na navegação client-side
// o Next pode renderizar só a página, sem rodar o layout de novo.
//
// cache() memoriza o resultado durante uma mesma renderização, então o layout
// e as várias consultas de uma página fazem uma única ida ao banco para
// conferir a allowlist.
// ─────────────────────────────────────────────────────────────

/** Sessão do usuário logado, lida do cookie bora_session (sem NextRequest). */
export const getSessaoAtual = cache(async (): Promise<SessaoUsuario | null> => {
  const cookieStore = await cookies();
  return verificarTokenSessao(cookieStore.get(SESSION_COOKIE)?.value);
});

/**
 * Garante que quem está vendo a tela é admin (e-mail na allowlist de
 * src/lib/adminAuth.ts). Sem sessão, manda para /login; logado mas sem
 * permissão, responde 404 — para não revelar que a área /admin existe.
 */
export const exigirAdmin = cache(async (): Promise<SessaoUsuario> => {
  const sessao = await getSessaoAtual();
  if (!sessao) redirect('/login');

  if (!(await isAdmin(sessao.usuarioId))) notFound();

  return sessao;
});
