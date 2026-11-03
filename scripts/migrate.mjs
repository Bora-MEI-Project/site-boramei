// ─────────────────────────────────────────────────────────────
// Aplica as migrations de migrations/*.sql que ainda não rodaram no banco.
//
// Roda sozinho a cada `npm start` (ver package.json), ou seja, a cada deploy
// no Easypanel, antes do Next subir. Se alguma migration falhar, o processo
// sai com erro e o site NÃO sobe — melhor do que subir um código que depende
// de uma coluna/tabela que não existe. Localmente: `npm run db:migrate`.
//
// Regras para escrever uma migration nova:
//   - nome NNNN_descricao.sql, numeração sequencial (a ordem é a do nome);
//   - nunca editar uma migration que já rodou em produção — o checksum muda e
//     o runner recusa subir; crie uma nova migration com a correção;
//   - cada arquivo roda numa transação: ou aplica tudo, ou nada.
// ─────────────────────────────────────────────────────────────

import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const PASTA_MIGRATIONS = path.resolve(import.meta.dirname, '..', 'migrations');

// Número arbitrário, só precisa ser fixo: impede que dois containers subindo
// ao mesmo tempo apliquem a mesma migration em paralelo.
const ADVISORY_LOCK_ID = 7_310_520_001;

function carregarEnvLocal() {
  // Em produção as variáveis vêm do Easypanel; localmente, do .env.
  if (process.env.DATABASE_URL || process.env.MIGRATIONS_DATABASE_URL) return;
  try {
    process.loadEnvFile(path.resolve(import.meta.dirname, '..', '.env'));
  } catch {
    // sem .env — o erro de "não configurado" abaixo explica o problema
  }
}

function checksum(conteudo) {
  // Normaliza CRLF -> LF: no Windows o git converte as quebras de linha no
  // checkout, e o mesmo arquivo não pode ter checksum diferente por isso.
  return createHash('sha256').update(conteudo.replace(/\r\n/g, '\n')).digest('hex');
}

async function main() {
  carregarEnvLocal();

  // MIGRATIONS_DATABASE_URL permite, no futuro, rodar as migrations com um
  // usuário com permissão de DDL e o site com um usuário mais restrito.
  const connectionString = process.env.MIGRATIONS_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL (ou MIGRATIONS_DATABASE_URL) não configurado.');
  }

  const arquivos = (await readdir(PASTA_MIGRATIONS)).filter((nome) => nome.endsWith('.sql')).sort();

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_ID]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bora_mei_core.schema_migrations (
        nome        TEXT PRIMARY KEY,
        checksum    TEXT NOT NULL,
        aplicada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await client.query('SELECT nome, checksum FROM bora_mei_core.schema_migrations');
    const aplicadas = new Map(rows.map((linha) => [linha.nome, linha.checksum]));

    let novas = 0;
    for (const nome of arquivos) {
      const sql = await readFile(path.join(PASTA_MIGRATIONS, nome), 'utf8');
      const hash = checksum(sql);

      if (aplicadas.has(nome)) {
        if (aplicadas.get(nome) !== hash) {
          throw new Error(
            `A migration ${nome} foi alterada depois de aplicada. ` +
              'Desfaça a alteração e crie uma migration nova com a correção.'
          );
        }
        continue;
      }

      console.log(`[migrate] aplicando ${nome}...`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO bora_mei_core.schema_migrations (nome, checksum) VALUES ($1, $2)', [
          nome,
          hash,
        ]);
        await client.query('COMMIT');
      } catch (erro) {
        await client.query('ROLLBACK');
        throw new Error(`Falha ao aplicar ${nome}: ${erro instanceof Error ? erro.message : String(erro)}`);
      }
      novas++;
    }

    console.log(novas > 0 ? `[migrate] ${novas} migration(s) aplicada(s).` : '[migrate] banco já está atualizado.');
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_ID]).catch(() => {});
    await client.end();
  }
}

main().catch((erro) => {
  console.error(`[migrate] ERRO: ${erro instanceof Error ? erro.message : String(erro)}`);
  process.exit(1);
});
