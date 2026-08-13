import { jwtVerify, SignJWT } from 'jose';
import type { NextRequest } from 'next/server';

export const SESSION_COOKIE = 'bora_session';
const SESSION_DURATION = '7d';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado.');
  }
  return new TextEncoder().encode(secret);
}

export interface SessaoUsuario {
  usuarioId: number;
}

/** Assina o JWT de sessão gravado no cookie bora_session após um login bem-sucedido. */
export async function criarTokenSessao(usuarioId: number): Promise<string> {
  return new SignJWT({ usuarioId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getJwtSecret());
}

/**
 * Lê e valida o cookie bora_session de uma requisição.
 * Usada tanto pelo proxy (proteção de rotas) quanto pelas API routes
 * (ex.: /api/lancamentos, /api/categorias) para filtrar dados por usuário.
 */
export async function getUsuarioLogado(request: NextRequest): Promise<SessaoUsuario | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (typeof payload.usuarioId !== 'number') return null;
    return { usuarioId: payload.usuarioId };
  } catch {
    return null;
  }
}
