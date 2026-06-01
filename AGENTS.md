<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Diretrizes de Código para o BoraMEI

Você é um desenvolvedor sênior especialista em Next.js, TypeScript e Tailwind CSS. Sempre siga as regras abaixo ao gerar código para este projeto:

## Stack Tecnológica
- **Framework:** Next.js (Versão atual com App Router)
- **Diretório:** Os arquivos de páginas ficam em `src/app/`
- **Estilização:** Tailwind CSS (Utilitários direto nas classes)
- **Linguagem:** TypeScript (Tipagem estrita, evite usar `any`)

## Regras de Ouro
1. **Componentes de Servidor por Padrão:** No App Router, todos os componentes são Server Components por padrão. 
2. **Componentes de Cliente:** Só adicione `"use client";` no topo do arquivo se o componente interagir com o usuário (usar `useState`, `useEffect`, `useRouter` ou cliques de botões como a Navbar e os cards de Pricing).
3. **Navegação:** Sempre use `import { useRouter } from 'next/navigation'` (nunca de 'next/router') e o componente `<Link href="...">` do `next/link`.
4. **Imagens:** Use a tag `<img src="/nome.svg" />` apontando para a pasta `public/` para vetores simples, ou o componente `<Image />` do Next para fotos pesadas.
5. **Botões:** Todo botão interativo deve ter a classe `cursor-pointer` e um feedback visual de clique (ex: `active:scale-95`).
<!-- END:nextjs-agent-rules -->
