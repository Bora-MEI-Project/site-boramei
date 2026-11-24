import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { CORA_STATE_COOKIE, gerarState, montarUrlAutorizacao } from '@/lib/cora';

/**
 * Início do "conectar Cora": gera um state aleatório, guarda num cookie
 * httpOnly e manda o cliente para a tela de autorização da Cora. O callback
 * só aceita o retorno se o state voltar igual ao do cookie.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const state = gerarState();
  const resposta = NextResponse.redirect(montarUrlAutorizacao(state));
  resposta.cookies.set(CORA_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    // lax: o cookie precisa voltar quando a Cora redireciona o cliente de volta
    sameSite: 'lax',
    path: '/cora',
    maxAge: 10 * 60,
  });
  return resposta;
}
