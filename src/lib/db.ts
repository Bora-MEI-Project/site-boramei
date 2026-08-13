import { Pool, types, type QueryResultRow } from 'pg';

// Por padrão o driver devolve BIGINT (OID 20) como string, para não perder
// precisão em valores acima de Number.MAX_SAFE_INTEGER. As tabelas deste
// projeto (ex.: categorias_financeiras.id, lancamentos.id/categoria_id) nunca
// chegam perto disso, então convertemos para number — do contrário todo `id`
// vira string no JSON da API e quebra comparações com valores numéricos no front.
types.setTypeParser(20, (val: string) => parseInt(val, 10));

// DATE (OID 1082) viria como objeto Date, que o JSON.stringify converte para
// timestamp UTC — deslocando o dia dependendo do fuso do servidor. Mantemos a
// string 'YYYY-MM-DD' que o Postgres já devolve, sem reinterpretar como Date.
types.setTypeParser(1082, (val: string) => val);

// Em dev, o Next.js recarrega módulos a cada mudança de arquivo; guardar o
// Pool no objeto global evita abrir uma conexão nova a cada hot-reload.
declare global {
  var _boraMeiPgPool: Pool | undefined;
}

export const pool: Pool =
  global._boraMeiPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  global._boraMeiPgPool = pool;
}

/** Atalho para pool.query com tipagem do shape das linhas retornadas. */
export async function query<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const resultado = await pool.query<T>(text, params);
  return resultado.rows;
}
