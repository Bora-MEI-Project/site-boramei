import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';

// Prefixos de rota que exigem sessão válida. Adicione novos aqui conforme
// novas áreas do cliente forem criadas.
// "/admin" só garante sessão logada aqui — a checagem de "é o admin mesmo"
// (e-mail na allowlist) é feita dentro das próprias rotas/páginas de admin.
const PROTECTED_ROUTES = ['/user', '/financeiro', '/seguranca', '/admin'];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const exigeSessao = PROTECTED_ROUTES.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );

  if (!exigeSessao) {
    return NextResponse.next();
  }

  const usuario = await getUsuarioLogado(request);
  if (!usuario) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/user', '/user/:path*',
    '/financeiro', '/financeiro/:path*',
    '/seguranca', '/seguranca/:path*',
    '/admin', '/admin/:path*',
  ],
};
