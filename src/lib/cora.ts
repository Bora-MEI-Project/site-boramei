import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto';
import { pool, query } from './db';

// ─────────────────────────────────────────────────────────────
// Integração com a Cora no modo "parceiro" (OAuth2 authorization code):
// o cliente autoriza o BoraMEI a acessar a conta Cora DELE.
//
//   /cora/conectar  → manda o cliente para a tela de autorização da Cora
//   /cora/callback  → recebe ?code=..., troca pelo token aqui no servidor e
//                     grava em bora_mei_core.cora_conexoes (cifrado)
//
// As URLs de autorização e de token NÃO estão na documentação pública da
// Cora, por isso vêm de variáveis de ambiente em vez de ficarem fixas aqui.
// Confirme os valores com a Cora (suporteapi@cora.com.br) para cada ambiente.
//
// Variáveis:
//   CORA_CLIENT_ID      client-id da integração (app Cora > Integrações via APIs)
//   CORA_CLIENT_SECRET  client-secret (muda entre teste e produção)
//   CORA_AUTHORIZE_URL  tela de autorização da Cora
//   CORA_TOKEN_URL      endpoint que troca o code / renova o token
//   CORA_REDIRECT_URI   idêntico ao cadastrado no app (ex.: https://boramei.cloud/cora/callback)
//   CORA_SCOPE          opcional; escopos pedidos na autorização
//   CORA_TOKEN_KEY      32 bytes em base64 para cifrar os tokens no banco
//                       (gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
// ─────────────────────────────────────────────────────────────

export const CORA_STATE_COOKIE = 'cora_oauth_state';

/** Renova o access_token se faltar menos que isso para vencer. */
const MARGEM_RENOVACAO_MS = 60_000;
const TIMEOUT_CORA_MS = 15_000;

interface ConfigCora {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope: string | undefined;
}

function exigirEnv(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`${nome} não configurado.`);
  return valor;
}

function getConfig(): ConfigCora {
  return {
    clientId: exigirEnv('CORA_CLIENT_ID'),
    clientSecret: exigirEnv('CORA_CLIENT_SECRET'),
    authorizeUrl: exigirEnv('CORA_AUTHORIZE_URL'),
    tokenUrl: exigirEnv('CORA_TOKEN_URL'),
    redirectUri: exigirEnv('CORA_REDIRECT_URI'),
    scope: process.env.CORA_SCOPE || undefined,
  };
}

// ── Cifra dos tokens (AES-256-GCM) ───────────────────────────

function getChave(): Buffer {
  const chave = Buffer.from(exigirEnv('CORA_TOKEN_KEY'), 'base64');
  if (chave.length !== 32) throw new Error('CORA_TOKEN_KEY precisa ter 32 bytes (base64).');
  return chave;
}

function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getChave(), iv);
  const dados = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), dados.toString('base64')].join(':');
}

function decifrar(valor: string): string {
  const [versao, iv, tag, dados] = valor.split(':');
  if (versao !== 'v1' || !iv || !tag || !dados) throw new Error('Token Cora em formato inválido.');
  const decipher = createDecipheriv('aes-256-gcm', getChave(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dados, 'base64')), decipher.final()]).toString('utf8');
}

// ── state (proteção contra CSRF no retorno da Cora) ──────────

export function gerarState(): string {
  return randomBytes(32).toString('hex');
}

export function stateConfere(esperado: string | undefined, recebido: string | null): boolean {
  if (!esperado || !recebido) return false;
  const a = Buffer.from(esperado);
  const b = Buffer.from(recebido);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ── Fluxo OAuth ──────────────────────────────────────────────

/** URL da tela da Cora onde o cliente entra e autoriza o BoraMEI. */
export function montarUrlAutorizacao(state: string): string {
  const config = getConfig();
  const url = new URL(config.authorizeUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('state', state);
  if (config.scope) url.searchParams.set('scope', config.scope);
  return url.toString();
}

interface TokensCora {
  accessToken: string;
  refreshToken: string | null;
  expiraEm: Date;
  escopo: string | null;
}

export class ErroCora extends Error {}

async function chamarEndpointToken(params: Record<string, string>): Promise<TokensCora> {
  const config = getConfig();
  const resposta = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      ...params,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    signal: AbortSignal.timeout(TIMEOUT_CORA_MS),
    cache: 'no-store',
  });

  const corpo: unknown = await resposta.json().catch(() => null);
  const dados = (corpo && typeof corpo === 'object' ? corpo : {}) as Record<string, unknown>;

  if (!resposta.ok) {
    // Só o código do erro: o corpo pode ecoar dados da requisição.
    const codigo = typeof dados.error === 'string' ? dados.error : 'sem_codigo';
    throw new ErroCora(`Cora recusou a requisição de token (HTTP ${resposta.status}, ${codigo}).`);
  }

  if (typeof dados.access_token !== 'string' || !dados.access_token) {
    throw new ErroCora('Resposta da Cora sem access_token.');
  }
  const expiraEmSegundos = typeof dados.expires_in === 'number' ? dados.expires_in : 0;

  return {
    accessToken: dados.access_token,
    refreshToken: typeof dados.refresh_token === 'string' ? dados.refresh_token : null,
    expiraEm: new Date(Date.now() + expiraEmSegundos * 1000),
    escopo: typeof dados.scope === 'string' ? dados.scope : null,
  };
}

/** Troca o code recebido no /cora/callback pelos tokens e grava a conexão do usuário. */
export async function conectarComCodigo(usuarioId: number, code: string): Promise<void> {
  const tokens = await chamarEndpointToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getConfig().redirectUri,
  });

  await query(
    `INSERT INTO bora_mei_core.cora_conexoes (usuario_id, access_token, refresh_token, expira_em, escopo)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (usuario_id) DO UPDATE
       SET access_token = EXCLUDED.access_token,
           refresh_token = EXCLUDED.refresh_token,
           expira_em = EXCLUDED.expira_em,
           escopo = EXCLUDED.escopo,
           updated_at = NOW()`,
    [
      usuarioId,
      cifrar(tokens.accessToken),
      tokens.refreshToken ? cifrar(tokens.refreshToken) : null,
      tokens.expiraEm,
      tokens.escopo,
    ]
  );
}

interface ConexaoRow {
  access_token: string;
  refresh_token: string | null;
  expira_em: Date;
}

/**
 * Access token válido da conta Cora do usuário, renovando se estiver vencendo.
 * Devolve null se o usuário nunca conectou (ou a conexão foi removida).
 *
 * A renovação roda numa transação com SELECT ... FOR UPDATE: se duas
 * requisições do mesmo usuário chegarem juntas, só uma chama a Cora — a outra
 * espera e já lê o token novo. Sem isso, se a Cora girar o refresh_token a
 * cada uso, a segunda renovação usaria um refresh_token já invalidado.
 */
export async function obterAccessToken(usuarioId: number): Promise<string | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<ConexaoRow>(
      `SELECT access_token, refresh_token, expira_em
         FROM bora_mei_core.cora_conexoes
        WHERE usuario_id = $1
        FOR UPDATE`,
      [usuarioId]
    );
    const conexao = rows[0];
    if (!conexao) {
      await client.query('ROLLBACK');
      return null;
    }

    if (conexao.expira_em.getTime() - Date.now() > MARGEM_RENOVACAO_MS) {
      await client.query('COMMIT');
      return decifrar(conexao.access_token);
    }

    if (!conexao.refresh_token) {
      await client.query('ROLLBACK');
      throw new ErroCora('Token da Cora vencido e sem refresh_token: o cliente precisa conectar de novo.');
    }

    const tokens = await chamarEndpointToken({
      grant_type: 'refresh_token',
      refresh_token: decifrar(conexao.refresh_token),
    });

    await client.query(
      `UPDATE bora_mei_core.cora_conexoes
          SET access_token = $2,
              refresh_token = COALESCE($3, refresh_token),
              expira_em = $4,
              updated_at = NOW()
        WHERE usuario_id = $1`,
      [
        usuarioId,
        cifrar(tokens.accessToken),
        tokens.refreshToken ? cifrar(tokens.refreshToken) : null,
        tokens.expiraEm,
      ]
    );
    await client.query('COMMIT');
    return tokens.accessToken;
  } catch (erro) {
    await client.query('ROLLBACK').catch(() => {});
    throw erro;
  } finally {
    client.release();
  }
}
