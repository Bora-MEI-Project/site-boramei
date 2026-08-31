import { query } from "./db";

/**
 * E-mails com acesso às telas de /admin (ex.: classificação fixo/variável das
 * categorias financeiras, em /admin/categorias). Não existe um "papel" de
 * admin no banco — é uma allowlist simples, suficiente enquanto só o dono do
 * BoraMEI acessa essas telas.
 */
const ADMIN_EMAILS = ["contato@boramei.cloud"];

interface EmailRow {
  email: string;
}

/** getUsuarioLogado() só devolve o usuarioId (vem do JWT) — o e-mail precisa de uma consulta à parte. */
export async function isAdmin(usuarioId: number): Promise<boolean> {
  const linhas = await query<EmailRow>(
    `SELECT email FROM bora_mei_core.usuarios WHERE id = $1`,
    [usuarioId]
  );
  const email = linhas[0]?.email;
  return typeof email === "string" && ADMIN_EMAILS.includes(email.toLowerCase());
}
