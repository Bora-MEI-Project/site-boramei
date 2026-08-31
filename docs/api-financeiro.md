# API — Gestor de Fluxo de Caixa (`/api/categorias`, `/api/lancamentos`, `/api/dre`)

Rotas internas consumidas por [src/app/financeiro/page.tsx](../src/app/financeiro/page.tsx) (rota `/financeiro`, aba "Fluxo de Caixa") e por [src/app/financeiro/dre/page.tsx](../src/app/financeiro/dre/page.tsx) (rota `/financeiro/dre`, aba "DRE Gerencial") para o gestor financeiro do MEI. Todas exigem sessão válida (cookie `bora_session`, ver [src/lib/auth.ts](../src/lib/auth.ts)) e filtram os dados pelo `usuario_id` extraído do JWT — nunca aceitam `usuario_id` vindo do cliente.

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

## `GET /api/dre`

Monta a Demonstração de Resultado do Exercício (DRE) do usuário logado, agrupando os lançamentos pelo `grupo` de `categorias_financeiras` (não pelo campo `conta_dre`, que está preenchido só em parte das categorias — ver comentário no início de [route.ts](../src/app/api/dre/route.ts)). Devolve o bloco calculado tanto para o mês selecionado quanto para o ano inteiro, lado a lado.

### Query params (opcionais)

| Param | Formato | Default |
|---|---|---|
| `ano` | inteiro (2000–2100) | ano atual |
| `mes` | inteiro (1–12) | mês atual |

Um valor fora da faixa é ignorado silenciosamente e o default é usado no lugar — não gera erro 400.

**Exemplo:** `GET /api/dre?ano=2026&mes=8`

### Resposta — 200

```json
{
  "periodo": { "ano": 2026, "mes": 8, "mesLabel": "Agosto de 2026" },
  "mensal": {
    "receitaBruta": 500,
    "receitas": [
      { "label": "Receita de Vendas e Serviços", "valor": 500, "avPercent": 100 },
      { "label": "Outras Receitas Operacionais", "valor": 0, "avPercent": 0 }
    ],
    "deducoes": [
      { "label": "Devoluções de Vendas", "valor": 0, "avPercent": 0 },
      { "label": "Impostos sobre a Receita (DAS)", "valor": 0, "avPercent": 0 }
    ],
    "totalDeducoes": 0,
    "receitaLiquida": 500,
    "custos": [{ "label": "Custo de Mercadorias/Serviços Vendidos", "valor": 0, "avPercent": 0 }],
    "totalCustos": 0,
    "lucroBruto": 500,
    "margemBruta": 100,
    "despesas": [
      { "label": "Despesas com Pessoal", "valor": 0, "avPercent": 0 },
      { "label": "Despesas Administrativas", "valor": 120, "avPercent": 24 },
      { "label": "Despesas Comerciais e Marketing", "valor": 0, "avPercent": 0 },
      { "label": "Outros Tributos", "valor": 0, "avPercent": 0 },
      { "label": "Outras Despesas Operacionais", "valor": 0, "avPercent": 0 }
    ],
    "totalDespesas": 120,
    "resultadoOperacional": 380,
    "receitasFinanceiras": 0,
    "despesasFinanceiras": 0,
    "investimentos": 0,
    "resultadoLiquido": 380
  },
  "anual": { "...": "mesmo shape do bloco mensal, somando o ano inteiro (Jan–Dez)" }
}
```

| Campo | Descrição |
|---|---|
| `receitaBruta` | soma de `Receitas Diretas` + `Outras Entradas` (grupos de `categorias_financeiras`) |
| `avPercent` | percentual da linha sobre `receitaBruta` do mesmo bloco (0 se `receitaBruta` for 0) |
| `margemBruta` | `lucroBruto / receitaLiquida * 100` (0 se `receitaLiquida` for 0) |
| `resultadoLiquido` | `resultadoOperacional + receitasFinanceiras − despesasFinanceiras − investimentos` |

Sem lançamentos no período → todos os totais vêm `0` e os arrays de linha vêm com `valor: 0` (nunca array vazio nem `null`).

### Erros

| Status | Corpo | Quando |
|---|---|---|
| 401 | `{ "mensagem": "Não autenticado." }` | sem cookie de sessão válido |

---

## `GET /api/gestao`

Indicadores da aba "Gestão" (`/financeiro/gestao`): Receita, Custos, Lucro estimado, Margem, Ponto de Equilíbrio, Projeção anual, Distância do limite do MEI e progresso da Meta de faturamento. Ao contrário de `/api/dre`, **não tem seletor de período** — sempre calcula com base no mês atual (dia 1 até hoje) e no ano corrente (1º de janeiro até hoje), igual ao Fluxo de Caixa.

**Query:** nenhuma.

### Resposta — 200

```json
{
  "periodo": { "inicioMes": "2026-08-01", "inicioAno": "2026-01-01", "hoje": "2026-08-27" },
  "receita": 2500,
  "custos": 900,
  "lucroEstimado": 1600,
  "margem": 64,
  "pontoEquilibrio": 1200,
  "temCategoriaNaoClassificada": false,
  "projecaoAnual": 20000,
  "limiteMeiAnual": 81000,
  "receitaAnoAcumulada": 13333.33,
  "distanciaLimiteMei": 67666.67,
  "projecaoUltrapassaLimite": false,
  "metaFaturamentoMensal": 3000,
  "progressoMetaPercent": 83.33,
  "serieMensal": [
    { "mes": 1, "mesLabel": "Jan", "realizado": 1800, "projecao": 0 },
    { "mes": 8, "mesLabel": "Ago", "realizado": 2500, "projecao": 1666.67 },
    { "mes": 9, "mesLabel": "Set", "realizado": 0, "projecao": 1666.67 }
  ]
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `receita` / `custos` | `number` | soma do mês atual, por `natureza` (inclui toda `natureza='receita'`, não só faturamento — ver `serieMensal` abaixo) |
| `lucroEstimado` | `number` | `receita - custos` |
| `margem` | `number` | `lucroEstimado/receita*100` (0 se `receita` for 0) |
| `pontoEquilibrio` | `number \| null` | `despesasFixas / (1 - custosVariaveis/receita)`; `null` se `receita` for 0 ou `custosVariaveis >= receita` (indeterminado) |
| `temCategoriaNaoClassificada` | `boolean` | `true` se houve gasto em alguma categoria sem `tipo_custo` definido — essas contam como fixas no cálculo acima |
| `projecaoAnual` | `number` | `receitaAnoAcumulada / mêsAtual * 12` |
| `limiteMeiAnual` | `number` | constante `81000`, sem proporcionalidade por mês de abertura |
| `distanciaLimiteMei` | `number` | `limiteMeiAnual - receitaAnoAcumulada` (pode ser negativo, se já ultrapassou) |
| `projecaoUltrapassaLimite` | `boolean` | `projecaoAnual > limiteMeiAnual` |
| `metaFaturamentoMensal` | `number \| null` | valor salvo em `/api/metas`, `null` se o usuário nunca definiu |
| `progressoMetaPercent` | `number \| null` | `receita/metaFaturamentoMensal*100`, `null` se não há meta definida |
| `serieMensal` | array (12 itens, Jan–Dez) | base do gráfico "Previsão de faturamento" — barras sobrepostas de **faturamento** (só grupo `Receitas Diretas`, mais estrito que `receita` acima, que também soma Outras Entradas/Receitas Indiretas). `realizado` = faturamento de fato lançado naquele mês (`0` em meses futuros, parcial no mês corrente). `projecao` = média de faturamento mensal do ano (`faturamentoAnoAcumulado / mêsAtual`) para o mês atual em diante; `0` em meses já fechados (não se projeta o que já passou) |

### Erros

| Status | Corpo | Quando |
|---|---|---|
| 401 | `{ "mensagem": "Não autenticado." }` | sem cookie de sessão válido |

---

## `GET/PUT /api/metas`

Meta de faturamento mensal do usuário, exibida como barra de progresso na aba Gestão. Uma linha por usuário em `bora_mei_core.metas_usuario` (tabela nova, ver `migrations/0002_add_classificacao_e_metas.sql`).

### `GET` — Resposta 200

```json
{ "metaFaturamentoMensal": 3000 }
```

`metaFaturamentoMensal` vem `null` se o usuário nunca definiu uma meta.

### `PUT` — Corpo da requisição

```json
{ "metaFaturamentoMensal": 3000 }
```

Faz upsert (`ON CONFLICT (usuario_id) DO UPDATE`) — sempre sobrescreve a meta anterior do usuário.

### `PUT` — Resposta 200

```json
{ "metaFaturamentoMensal": 3000 }
```

### Erros

| Status | Corpo | Quando |
|---|---|---|
| 400 | `{ "mensagem": "Corpo da requisição inválido." }` | JSON malformado (só no PUT) |
| 400 | `{ "mensagem": "Meta deve ser um número maior que zero." }` | `metaFaturamentoMensal` ausente, não numérico ou `<= 0` (só no PUT) |
| 401 | `{ "mensagem": "Não autenticado." }` | sem cookie de sessão válido |

---

## Referência rápida

| Rota | Método | Auth | Sucesso | Erros possíveis |
|---|---|---|---|---|
| `/api/categorias` | GET | sessão | 200 | 401 |
| `/api/lancamentos` | GET | sessão | 200 | 401 |
| `/api/lancamentos` | POST | sessão | 201 | 400, 401 |
| `/api/lancamentos/[id]` | DELETE | sessão | 200 | 401, 404 |
| `/api/dre` | GET | sessão | 200 | 401 |
| `/api/gestao` | GET | sessão | 200 | 401 |
| `/api/metas` | GET | sessão | 200 | 401 |
| `/api/metas` | PUT | sessão | 200 | 400, 401 |

As rotas `/api/admin/categorias` e `/api/admin/categorias/[id]` (usadas só pela tela interna `/admin/categorias`) não fazem parte deste contrato de cliente — exigem sessão **e** e-mail na allowlist de `src/lib/adminAuth.ts` (401 sem sessão, 403 se logado mas não for admin). Documentação delas fica no cabeçalho do próprio `src/app/api/admin/categorias/route.ts`.
