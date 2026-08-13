# API — Gestor de Fluxo de Caixa (`/api/categorias`, `/api/lancamentos`)

Rotas internas consumidas por [src/app/user/page.tsx](../src/app/user/page.tsx) (rota `/user`, componente `FinanceiroPage`) para o gestor financeiro do MEI. Todas exigem sessão válida (cookie `bora_session`, ver [src/lib/auth.ts](../src/lib/auth.ts)) e filtram os dados pelo `usuario_id` extraído do JWT — nunca aceitam `usuario_id` vindo do cliente.

Schema: `bora_mei_core` (Postgres). Tabelas: `categorias_financeiras` (já populada), `lancamentos`.

## Autenticação

Todas as rotas abaixo:
- Lêem o cookie `bora_session` via `getUsuarioLogado(request)`.
- Retornam **401** com `{ "mensagem": "Não autenticado." }` se não houver sessão válida.
- No front, um 401 em qualquer uma dessas chamadas deve redirecionar para `/login`.

## Nota sobre tipos

`categorias_financeiras.id`, `lancamentos.id` e `lancamentos.categoria_id` são `BIGINT` no Postgres. O driver `pg` devolve `BIGINT` como *string* por padrão; este projeto reconfigura o type parser em [src/lib/db.ts](../src/lib/db.ts) para devolver `number` (seguro nesta escala de dados). Ou seja: **todo `id` no JSON abaixo é `number`, não string.** `data` é sempre `"YYYY-MM-DD"` (string), nunca timestamp — mesma razão: o parser padrão do `pg` converteria `DATE` em objeto `Date` e o `JSON.stringify` deslocaria o dia conforme o fuso do servidor.

---

## `GET /api/categorias`

Lista as categorias financeiras ativas e relevantes para MEI, para popular o `<select>` de categoria do formulário.

**Query:** nenhuma.

**Filtro aplicado:** `ativo = true AND mei_relevante = true`, ordenado por `grupo, categoria`.

### Resposta — 200

```json
{
  "categorias": [
    { "id": 47, "natureza": "despesa", "grupo": "Despesas Administrativas", "nome": "Advogados" },
    { "id": 37, "natureza": "despesa", "grupo": "Despesas Administrativas", "nome": "Aluguel" },
    { "id": 61, "natureza": "despesa", "grupo": "Impostos e Taxas", "nome": "Simples Nacional (DAS)" },
    { "id": 2,  "natureza": "receita", "grupo": "Receitas Diretas", "nome": "Clientes - Serviços Prestados" }
  ]
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `number` | id da categoria (`categorias_financeiras.id`) |
| `natureza` | `"receita" \| "despesa"` | usado para decidir se o lançamento soma em entradas ou saídas |
| `grupo` | `string` | usado para agrupar o `<select>` em `<optgroup>` |
| `nome` | `string` | nome de exibição (coluna `categoria`) |

### Erros

| Status | Corpo | Quando |
|---|---|---|
| 401 | `{ "mensagem": "Não autenticado." }` | sem cookie de sessão válido |

---

## `GET /api/lancamentos`

Lista os lançamentos do usuário logado em um período, já com os totais calculados em SQL.

### Query params (opcionais)

| Param | Formato | Default |
|---|---|---|
| `inicio` | `YYYY-MM-DD` | primeiro dia do mês atual |
| `fim` | `YYYY-MM-DD` | último dia do mês atual |

Um parâmetro que não bate com `YYYY-MM-DD` é ignorado silenciosamente e o default (mês atual) é usado no lugar dele — não gera erro 400.

**Exemplo:** `GET /api/lancamentos?inicio=2026-07-01&fim=2026-07-31`

### Resposta — 200

```json
{
  "periodo": { "inicio": "2026-08-01", "fim": "2026-08-31" },
  "lancamentos": [
    {
      "id": 2,
      "descricao": "Isolamento teste",
      "valor": 42,
      "data": "2026-08-13",
      "categoriaId": 2,
      "categoriaNome": "Clientes - Serviços Prestados",
      "natureza": "receita"
    }
  ],
  "totais": { "entradas": 42, "saidas": 0, "saldo": 42 }
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `periodo.inicio` / `periodo.fim` | `string (YYYY-MM-DD)` | período efetivamente aplicado (após resolver defaults) |
| `lancamentos[].id` | `number` | id do lançamento |
| `lancamentos[].descricao` | `string` | |
| `lancamentos[].valor` | `number` | sempre positivo — o sinal (entrada/saída) vem de `natureza` |
| `lancamentos[].data` | `string (YYYY-MM-DD)` | |
| `lancamentos[].categoriaId` | `number` | FK para `categorias_financeiras.id` |
| `lancamentos[].categoriaNome` | `string` | nome da categoria (via `JOIN`) |
| `lancamentos[].natureza` | `"receita" \| "despesa"` | via `JOIN` |
| `totais.entradas` | `number` | `SUM(valor)` onde `natureza = 'receita'`, calculado em SQL |
| `totais.saidas` | `number` | `SUM(valor)` onde `natureza = 'despesa'`, calculado em SQL |
| `totais.saldo` | `number` | `entradas - saidas`, calculado em SQL |

Lista vazia no período → `"lancamentos": []` e `"totais": { "entradas": 0, "saidas": 0, "saldo": 0 }` (nunca `null`).

Ordenação: `data DESC, id DESC` (mais recentes primeiro).

### Erros

| Status | Corpo | Quando |
|---|---|---|
| 401 | `{ "mensagem": "Não autenticado." }` | sem cookie de sessão válido |

---

## `POST /api/lancamentos`

Cria um lançamento vinculado ao usuário da sessão.

### Corpo da requisição

```json
{
  "descricao": "Venda de serviço",
  "valor": 150.5,
  "categoriaId": 2,
  "data": "2026-08-10"
}
```

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `descricao` | `string` | sim | não pode ser vazia (após `trim()`) |
| `valor` | `number` | sim | deve ser finito e `> 0` |
| `categoriaId` | `number` | sim | deve existir em `categorias_financeiras` com `ativo = true AND mei_relevante = true` |
| `data` | `string (YYYY-MM-DD)` | não | se omitido ou em formato inválido, usa `CURRENT_DATE` do banco |

`usuario_id` **nunca** é lido do corpo — sempre vem da sessão (`getUsuarioLogado`).

### Resposta — 201

```json
{
  "lancamento": {
    "id": 3,
    "descricao": "Venda de serviço",
    "valor": 150.5,
    "data": "2026-08-10",
    "categoriaId": 2,
    "categoriaNome": "Clientes - Serviços Prestados",
    "natureza": "receita"
  }
}
```

Mesmo shape de um item de `lancamentos[]` no `GET`, então pode ser inserido diretamente no estado local (`[lancamento, ...itens]`) sem precisar re-buscar a lista.

### Erros

| Status | Corpo | Quando |
|---|---|---|
| 400 | `{ "mensagem": "Corpo da requisição inválido." }` | JSON malformado |
| 400 | `{ "mensagem": "Descrição é obrigatória." }` | `descricao` vazia/ausente |
| 400 | `{ "mensagem": "Valor deve ser um número maior que zero." }` | `valor` ausente, não numérico, `NaN`/`Infinity` ou `<= 0` |
| 400 | `{ "mensagem": "Categoria inválida." }` | `categoriaId` não é inteiro, não existe, ou está `ativo=false`/`mei_relevante=false` |
| 401 | `{ "mensagem": "Não autenticado." }` | sem cookie de sessão válido |

---

## `DELETE /api/lancamentos/[id]`

Remove um lançamento — **apenas se pertencer ao usuário da sessão**.

**Exemplo:** `DELETE /api/lancamentos/3`

### Resposta — 200

```json
{ "sucesso": true }
```

### Erros

| Status | Corpo | Quando |
|---|---|---|
| 401 | `{ "mensagem": "Não autenticado." }` | sem cookie de sessão válido |
| 404 | `{ "mensagem": "Lançamento não encontrado." }` | id não existe, **ou** existe mas pertence a outro usuário |

Por design, tentar deletar o lançamento de outro usuário devolve **404** (nunca 403) — a rota não revela se o registro existe para outra conta. Verificado manualmente: usuário B tentando deletar um lançamento do usuário A recebe 404 e o registro permanece intacto para o usuário A.

---

## Referência rápida

| Rota | Método | Auth | Sucesso | Erros possíveis |
|---|---|---|---|---|
| `/api/categorias` | GET | sessão | 200 | 401 |
| `/api/lancamentos` | GET | sessão | 200 | 401 |
| `/api/lancamentos` | POST | sessão | 201 | 400, 401 |
| `/api/lancamentos/[id]` | DELETE | sessão | 200 | 401, 404 |
