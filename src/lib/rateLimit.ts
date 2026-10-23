import type { NextRequest } from 'next/server';
import { pool } from './db';

/** Uma chave de contagem e o teto dela dentro da janela. */
export interface RegraLimite {
  chave: string;
  limite: number;
}

export interface ResultadoLimite {
  bloqueado: boolean;
  /** Segundos até a janela virar — vai no header Retry-After. */
  esperarSegundos: number;
}

const JANELA_SEGUNDOS = 10 * 60;

interface LinhaContador {
  tentativas: number;
  esperar_segundos: number;
}

/**
 * Extrai o IP do cliente. NextRequest.ip foi removido no Next 15, então o valor
 * vem do x-forwarded-for colocado pelo proxy da hospedagem — o primeiro item da
 * lista é o cliente original.
 *
 * Devolve null quando não há header: nesse caso a rota deve simplesmente pular
 * a regra por IP. Se todo mundo caísse em uma chave "desconhecido" comum, o
 * limite viraria global e um punhado de tentativas derrubaria o login de todos
 * os assinantes de uma vez. O limite por identidade (e-mail/CPF) continua de pé.
 */
export function ipDoCliente(request: NextRequest): string | null {
  const encaminhado = request.headers.get('x-forwarded-for');
  const primeiro = encaminhado?.split(',')[0]?.trim();
  return primeiro || request.headers.get('x-real-ip')?.trim() || null;
}

/**
 * Conta mais uma tentativa em cada chave e diz se alguma estourou o limite.
 *
 * A contagem acontece em uma única escrita atômica por chave (INSERT ... ON
 * CONFLICT), então requisições simultâneas não se sobrescrevem. Chame ANTES do
 * trabalho caro da rota (bcrypt, consultas) — é ele que o limite protege.
 *
 * Fail-open: se o banco estiver fora ou a migration 0003 ainda não tiver
 * rodado, a requisição passa. Derrubar o login inteiro por causa do contador
 * seria um estrago maior do que ficar sem a proteção.
 */
export async function consumirTentativas(regras: RegraLimite[]): Promise<ResultadoLimite> {
  let bloqueado = false;
  let esperarSegundos = 0;

  for (const regra of regras) {
    try {
      const { rows } = await pool.query<LinhaContador>(
        `INSERT INTO bora_mei_core.rate_limit_auth (chave, janela_inicio, tentativas)
              VALUES ($1, NOW(), 1)
         ON CONFLICT (chave) DO UPDATE
                SET tentativas = CASE
                      WHEN rate_limit_auth.janela_inicio < NOW() - make_interval(secs => $2::int) THEN 1
                      ELSE rate_limit_auth.tentativas + 1
                    END,
                    janela_inicio = CASE
                      WHEN rate_limit_auth.janela_inicio < NOW() - make_interval(secs => $2::int) THEN NOW()
                      ELSE rate_limit_auth.janela_inicio
                    END
          RETURNING tentativas,
                    CEIL(EXTRACT(EPOCH FROM (
                      janela_inicio + make_interval(secs => $2::int) - NOW()
                    )))::int AS esperar_segundos`,
        [regra.chave, JANELA_SEGUNDOS]
      );

      const linha = rows[0];
      if (linha && linha.tentativas > regra.limite) {
        bloqueado = true;
        esperarSegundos = Math.max(esperarSegundos, linha.esperar_segundos, 1);
      }
    } catch (erro) {
      console.error('[rateLimit] falha ao contar tentativa, liberando requisicao:', erro);
    }
  }

  return { bloqueado, esperarSegundos };
}

/**
 * Zera os contadores depois de uma autenticação bem-sucedida, para que um
 * usuário legítimo não seja bloqueado por acertar a senha várias vezes no
 * mesmo dia (vários acessos saindo do mesmo IP de escritório, por exemplo).
 */
export async function limparTentativas(chaves: string[]): Promise<void> {
  try {
    await pool.query('DELETE FROM bora_mei_core.rate_limit_auth WHERE chave = ANY($1)', [chaves]);

    // Sem cron no projeto, a limpeza das janelas vencidas pega carona aqui de
    // vez em quando — só para a tabela não crescer sem limite com IPs antigos.
    if (Math.random() < 0.05) {
      await pool.query(
        `DELETE FROM bora_mei_core.rate_limit_auth
          WHERE janela_inicio < NOW() - make_interval(secs => $1::int)`,
        [JANELA_SEGUNDOS * 6]
      );
    }
  } catch (erro) {
    console.error('[rateLimit] falha ao limpar tentativas:', erro);
  }
}

/** Corpo + headers padrão da resposta 429. */
export function respostaBloqueada(esperarSegundos: number): {
  corpo: { sucesso: false; mensagem: string };
  init: { status: 429; headers: Record<string, string> };
} {
  const minutos = Math.max(1, Math.ceil(esperarSegundos / 60));
  return {
    corpo: {
      sucesso: false,
      mensagem: `Muitas tentativas seguidas. Aguarde ${minutos} minuto${minutos > 1 ? 's' : ''} e tente de novo.`,
    },
    init: { status: 429, headers: { 'Retry-After': String(esperarSegundos) } },
  };
}
