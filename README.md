# site-boramei

Site e área do cliente do BoraMEI — Next.js (App Router), TypeScript, Tailwind CSS e Postgres (schema `bora_mei_core`).

## Rodando localmente

```bash
npm install
npm run dev
```

Variáveis de ambiente (`.env`, fora do git): `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_PAGBANK_PUBLIC_KEY`.

## Banco de dados

As mudanças de estrutura ficam em `migrations/` (`NNNN_descricao.sql`) e são aplicadas por `scripts/migrate.mjs`:

- em produção, automaticamente a cada `npm start` (deploy no Easypanel), antes do site subir;
- localmente, com `npm run db:migrate`.

Nunca edite uma migration que já rodou — crie uma nova com a correção.

## Estrutura

- `src/app/` — páginas e rotas de API (`/api/*`)
- `src/app/(painel)/` — área do cliente (visão geral, financeiro, segurança)
- `src/app/admin/` — dashboard administrativo (acesso pela allowlist em `src/lib/adminAuth.ts`)
- `src/lib/` — banco, autenticação, pagamentos, campanhas
- `docs/` — contratos das APIs internas

Pagamentos e cadastro passam pelos workflows do n8n (`n8n.boramei.cloud`).
