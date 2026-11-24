import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { CORA_STATE_COOKIE, conectarComCodigo, stateConfere } from '@/lib/cora';

/**
 * Retorno da Cora depois que o cliente autoriza (ou recusa) o acesso.
 * Este caminho tem que bater exatamente com o "link de redirecionamento"
 * cadastrado no app da Cora e com CORA_REDIRECT_URI.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;

  const voltarPara = (resultado: string): NextResponse => {
    const resposta = NextResponse.redirect(new URL(`/user?cora=${resultado}`, request.url));
    // o state é de uso único
    resposta.cookies.delete({ name: CORA_STATE_COOKIE, path: '/cora' });
    return resposta;
  };

  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!stateConfere(request.cookies.get(CORA_STATE_COOKIE)?.value, params.get('state'))) {
    return voltarPara('erro');
  }

  // Cliente recusou na Cora (ou a Cora devolveu outro erro)
  if (params.get('error')) {
    return voltarPara('cancelado');
  }

  const code = params.get('code');
  if (!code) {
    return voltarPara('erro');
  }

  try {
    await conectarComCodigo(usuario.usuarioId, code);
  } catch (erro) {
    console.error('[cora/callback] falha ao trocar o code:', erro instanceof Error ? erro.message : erro);
    return voltarPara('erro');
  }

  return voltarPara('conectado');
}
