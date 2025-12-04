# Plano de Implementação: Sistema de Transações Pendentes

> **Data**: 2025-12-03
> **Feature**: Captura e processamento de notificações bancárias do Android
> **Status**: 🟡 Em Planejamento

---

## 📋 Visão Geral

Implementar um sistema completo para capturar notificações de aplicativos bancários (via app Android separado) e processá-las manualmente no OpenSheets antes de virarem transações definitivas (lançamentos).

## 🎯 Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| **Autenticação API** | Bearer Token (Better Auth) | Mais seguro, reutiliza sistema existente |
| **Parsing de Notificações** | Backend (OpenSheets) | Centralizado, fácil de atualizar patterns |
| **Detecção de Duplicatas** | ❌ Não implementar agora | Simplificar MVP, adicionar depois |
| **Features Extras** | ✅ Auto-sugestão de categoria<br>✅ Widget dashboard<br>✅ Badge sidebar | Melhorar UX significativamente |

---

## 📦 Estrutura de Arquivos

### Novos Arquivos (19)

```
lib/transacoes-pendentes/
├── constants.ts                    # Status, tipos, bancos conhecidos
├── parser.ts                       # Parsing de notificações
├── fetch-data.ts                   # Data fetchers com relations
└── auto-suggest.ts                 # Sugestões inteligentes

lib/schemas/
└── transacoes-pendentes.ts         # Zod schemas de validação

app/api/transacoes-pendentes/
└── route.ts                        # API endpoints (POST, GET)

app/(dashboard)/transacoes-pendentes/
├── page.tsx                        # Página principal
├── loading.tsx                     # Loading skeleton
├── data.ts                         # Fetch de dados da página
└── actions.ts                      # Server actions

components/transacoes-pendentes/
├── page-content.tsx                # Container com tabs
├── transacao-card.tsx              # Card de transação
├── processar-dialog.tsx            # Dialog de processamento
├── empty-state.tsx                 # Estado vazio
└── index.ts                        # Exports

components/dashboard/
└── pending-transactions-widget.tsx # Widget do dashboard
```

### Arquivos Modificados (6)

```
db/schema.ts                        # + tabela transacoes_pendentes
lib/actions/helpers.ts              # + revalidation config
components/sidebar/nav-link.tsx     # + badge support + menu item
components/sidebar/nav-main.tsx     # + badge rendering
app/(dashboard)/layout.tsx          # + fetch pending count
lib/dashboard/fetch-dashboard-data.ts # + pending count
app/(dashboard)/dashboard/page.tsx  # + widget
```

---

## 🚀 Ordem de Implementação

### FASE 1: Database Layer ⚡ CRÍTICO

**Arquivo**: `db/schema.ts`

Adicionar tabela após linha 433:

```typescript
export const transacoesPendentes = pgTable("transacoes_pendentes", {
  // IDs e chaves
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),

  // Dados brutos da notificação
  appPackageName: text("app_package_name").notNull(),
  appName: text("app_name").notNull(),
  notificationText: text("notification_text").notNull(),
  notificationTitle: text("notification_title"),

  // Dados parseados
  valor: numeric("valor", { precision: 12, scale: 2 }),
  estabelecimento: text("estabelecimento"),
  dataHoraTransacao: timestamp("data_hora_transacao", { mode: "date" }),
  tipoTransacao: text("tipo_transacao"), // debito, credito, pix, transferencia

  // Campos de conversão
  categoriaId: uuid("categoria_id").references(() => categorias.id, { onDelete: "set null" }),
  contaId: uuid("conta_id").references(() => contas.id, { onDelete: "set null" }),
  cartaoId: uuid("cartao_id").references(() => cartoes.id, { onDelete: "set null" }),
  pagadorId: uuid("pagador_id").references(() => pagadores.id, { onDelete: "set null" }),
  descricaoEditada: text("descricao_editada"),
  observacoes: text("observacoes"),

  // Metadados
  status: text("status").notNull().default("pendente"), // pendente, processado, ignorado
  processadoEm: timestamp("processado_em", { mode: "date" }),
  lancamentoId: uuid("lancamento_id").references(() => lancamentos.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("transacoes_pendentes_user_id_idx").on(table.userId),
  statusIdx: index("transacoes_pendentes_status_idx").on(table.status),
}));

export type TransacaoPendente = typeof transacoesPendentes.$inferSelect;
export type NewTransacaoPendente = typeof transacoesPendentes.$inferInsert;

// Relations
export const transacoesPendentesRelations = relations(transacoesPendentes, ({ one }) => ({
  user: one(user, { fields: [transacoesPendentes.userId], references: [user.id] }),
  categoria: one(categorias, { fields: [transacoesPendentes.categoriaId], references: [categorias.id] }),
  conta: one(contas, { fields: [transacoesPendentes.contaId], references: [contas.id] }),
  cartao: one(cartoes, { fields: [transacoesPendentes.cartaoId], references: [cartoes.id] }),
  pagador: one(pagadores, { fields: [transacoesPendentes.pagadorId], references: [pagadores.id] }),
  lancamento: one(lancamentos, { fields: [transacoesPendentes.lancamentoId], references: [lancamentos.id] }),
}));
```

**⚡ Executar**: `npm run db:push`

---

### FASE 2: Constants & Schemas

#### `lib/transacoes-pendentes/constants.ts`

```typescript
export const TRANSACAO_PENDENTE_STATUS = ["pendente", "processado", "ignorado"] as const;
export const TRANSACAO_PENDENTE_TIPOS = ["debito", "credito", "pix", "transferencia"] as const;

export const KNOWN_BANK_PACKAGES = {
  "com.nu.production": "Nubank",
  "br.com.intermedium": "Inter",
  "com.itau": "Itaú",
  "com.bradesco": "Bradesco",
  "com.santander": "Santander",
  "com.bb.android": "Banco do Brasil",
  "com.caixa": "Caixa",
} as const;
```

#### `lib/schemas/transacoes-pendentes.ts`

```typescript
import { z } from "zod";
import { uuidSchema, amountSchema, requiredStringSchema, noteSchema } from "./common";

export const notificacaoBancariaSchema = z.object({
  appPackageName: requiredStringSchema("o package do app"),
  appName: requiredStringSchema("o nome do app"),
  notificationText: requiredStringSchema("o texto da notificação"),
  notificationTitle: z.string().optional(),
  valor: z.coerce.number().optional(),
  estabelecimento: z.string().optional(),
  dataHoraTransacao: z.string().optional(),
  tipoTransacao: z.enum(["debito", "credito", "pix", "transferencia"]).optional(),
});

export const processarTransacaoSchema = z.object({
  descricaoEditada: requiredStringSchema("a descrição"),
  valor: amountSchema,
  data: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data inválida",
  }),
  categoriaId: uuidSchema("Categoria"),
  contaId: uuidSchema("Conta").optional(),
  cartaoId: uuidSchema("Cartão").optional(),
  pagadorId: uuidSchema("Pagador").optional(),
  observacoes: noteSchema,
}).refine((data) => data.contaId || data.cartaoId, {
  message: "Selecione uma conta ou cartão",
  path: ["contaId"],
});

export const editarTransacaoPendenteSchema = z.object({
  categoriaId: uuidSchema("Categoria").optional(),
  contaId: uuidSchema("Conta").optional(),
  cartaoId: uuidSchema("Cartão").optional(),
  pagadorId: uuidSchema("Pagador").optional(),
  descricaoEditada: z.string().optional(),
  observacoes: noteSchema,
});

export type NotificacaoBancaria = z.infer<typeof notificacaoBancariaSchema>;
export type ProcessarTransacaoInput = z.infer<typeof processarTransacaoSchema>;
export type EditarTransacaoPendenteInput = z.infer<typeof editarTransacaoPendenteSchema>;
```

---

### FASE 3: Backend Parser

#### `lib/transacoes-pendentes/parser.ts`

```typescript
import { KNOWN_BANK_PACKAGES } from "./constants";

interface ParsedNotification {
  valor?: number;
  estabelecimento?: string;
  tipoTransacao?: "debito" | "credito" | "pix" | "transferencia";
}

export function parseNotificationText(text: string, title?: string): ParsedNotification {
  const result: ParsedNotification = {};

  // Parser de valor: R$ 123,45 ou R$123.45
  const valorMatch = text.match(/R\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
  if (valorMatch) {
    const valorStr = valorMatch[1].replace(/\./g, "").replace(",", ".");
    result.valor = parseFloat(valorStr);
  }

  // Parser de estabelecimento
  const estabelecimentoMatch = text.match(/(?:em|para|no|na)\s+([A-Za-zÀ-ú\s]+?)(?:\s+no valor|\s+R\$|$)/i);
  if (estabelecimentoMatch) {
    result.estabelecimento = estabelecimentoMatch[1].trim();
  }

  // Detecção de tipo
  const textLower = text.toLowerCase();
  if (textLower.includes("pix")) {
    result.tipoTransacao = "pix";
  } else if (textLower.includes("débito") || textLower.includes("debito")) {
    result.tipoTransacao = "debito";
  } else if (textLower.includes("crédito") || textLower.includes("credito")) {
    result.tipoTransacao = "credito";
  } else if (textLower.includes("transferência") || textLower.includes("transferencia")) {
    result.tipoTransacao = "transferencia";
  }

  return result;
}

export function sanitizeNotificationText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim();
}

export function getBankName(packageName: string): string {
  return KNOWN_BANK_PACKAGES[packageName as keyof typeof KNOWN_BANK_PACKAGES] || packageName;
}
```

---

### FASE 4: Data Fetchers

#### `lib/transacoes-pendentes/fetch-data.ts`

```typescript
import { db } from "@/lib/db";
import { transacoesPendentes } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function fetchTransacoesPendentes(userId: string) {
  return await db.query.transacoesPendentes.findMany({
    where: eq(transacoesPendentes.userId, userId),
    with: {
      categoria: true,
      conta: true,
      cartao: true,
      pagador: true,
      lancamento: true,
    },
    orderBy: [desc(transacoesPendentes.createdAt)],
  });
}

export async function fetchTransacoesPendentesPorStatus(
  userId: string,
  status: string
) {
  return await db.query.transacoesPendentes.findMany({
    where: and(
      eq(transacoesPendentes.userId, userId),
      eq(transacoesPendentes.status, status)
    ),
    with: {
      categoria: true,
      conta: true,
      cartao: true,
      pagador: true,
    },
    orderBy: [desc(transacoesPendentes.createdAt)],
  });
}

export async function contarTransacoesPendentes(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transacoesPendentes)
    .where(
      and(
        eq(transacoesPendentes.userId, userId),
        eq(transacoesPendentes.status, "pendente")
      )
    );

  return result[0]?.count ?? 0;
}

export async function fetchTransacaoPendenteById(id: string, userId: string) {
  return await db.query.transacoesPendentes.findFirst({
    where: and(
      eq(transacoesPendentes.id, id),
      eq(transacoesPendentes.userId, userId)
    ),
    with: {
      categoria: true,
      conta: true,
      cartao: true,
      pagador: true,
    },
  });
}

export type TransacaoPendenteComRelacoes = Awaited<
  ReturnType<typeof fetchTransacoesPendentes>
>[number];
```

---

### FASE 5: Auto-Suggestion 🎯 SMART FEATURE

#### `lib/transacoes-pendentes/auto-suggest.ts`

```typescript
import { db } from "@/lib/db";
import { lancamentos } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function suggestCategoryForEstablishment(
  userId: string,
  estabelecimento: string
): Promise<string | null> {
  if (!estabelecimento || estabelecimento.length < 3) return null;

  const similar = await db
    .select({
      categoriaId: lancamentos.categoriaId,
      count: sql<number>`count(*)::int`,
    })
    .from(lancamentos)
    .where(
      and(
        eq(lancamentos.userId, userId),
        sql`LOWER(${lancamentos.name}) LIKE LOWER(${`%${estabelecimento}%`})`
      )
    )
    .groupBy(lancamentos.categoriaId)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  return similar[0]?.categoriaId ?? null;
}

export async function suggestConta(userId: string): Promise<string | null> {
  const result = await db
    .select({
      contaId: lancamentos.contaId,
      count: sql<number>`count(*)::int`,
    })
    .from(lancamentos)
    .where(eq(lancamentos.userId, userId))
    .groupBy(lancamentos.contaId)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  return result[0]?.contaId ?? null;
}

export async function suggestCartao(userId: string): Promise<string | null> {
  const result = await db
    .select({
      cartaoId: lancamentos.cartaoId,
      count: sql<number>`count(*)::int`,
    })
    .from(lancamentos)
    .where(eq(lancamentos.userId, userId))
    .groupBy(lancamentos.cartaoId)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  return result[0]?.cartaoId ?? null;
}
```

---

### FASE 6-12: [Código completo no plano original]

Ver arquivo `/home/ubuntu/.claude/plans/nested-wiggling-rocket.md` para código completo de todas as fases.

---

## ✅ Checklist de Implementação

### 🗄️ Database
- [ ] Tabela `transacoes_pendentes` criada
- [ ] Relations configuradas
- [ ] Indexes adicionados
- [ ] `npm run db:push` executado com sucesso

### 🔧 Backend
- [ ] Constants definidas (`TRANSACAO_PENDENTE_STATUS`, `TRANSACAO_PENDENTE_TIPOS`, `KNOWN_BANK_PACKAGES`)
- [ ] Schemas Zod criados e testados
- [ ] Parser de notificações implementado (regex funcionando)
- [ ] Data fetchers criados com relations
- [ ] Auto-suggestion implementado (fuzzy match)

### 🌐 API
- [ ] POST `/api/transacoes-pendentes` criado
- [ ] GET `/api/transacoes-pendentes` criado
- [ ] Autenticação Bearer Token funcionando
- [ ] Parsing automático de notificações testado
- [ ] Tratamento de erros implementado

### ⚙️ Server Actions
- [ ] `processarTransacaoPendente` criada
- [ ] `ignorarTransacaoPendente` criada
- [ ] `editarTransacaoPendente` criada
- [ ] `excluirTransacaoPendente` criada
- [ ] Revalidation config atualizada
- [ ] User scoping validado

### 🎨 UI/UX
- [ ] Página principal criada (`/transacoes-pendentes`)
- [ ] Loading skeleton implementado
- [ ] Tabs de status (Pendentes/Processadas/Ignoradas)
- [ ] Cards de transação renderizando
- [ ] Dialog de processar funcionando
- [ ] Auto-suggestions carregando no dialog
- [ ] Empty states para cada tab
- [ ] Confirmação de delete (AlertDialog)
- [ ] Accordion de detalhes da notificação

### 🔗 Integração
- [ ] Dashboard widget adicionado
- [ ] Sidebar badge implementado
- [ ] Badge aparecendo quando count > 0
- [ ] Badge atualizando dinamicamente
- [ ] Navegação funcionando corretamente
- [ ] Revalidation atualizando UI automaticamente

### 🧪 Testes
- [ ] Testar POST via curl/Postman
- [ ] Testar parsing com notificações do Nubank
- [ ] Testar parsing com notificações do Inter
- [ ] Testar processamento completo (pendente → lançamento)
- [ ] Testar ignorar transação
- [ ] Testar excluir transação
- [ ] Testar auto-suggestions
- [ ] Testar responsividade mobile
- [ ] Testar com múltiplos usuários (isolamento)

---

## 🧪 Comandos de Teste

### 1. Testar API POST (Criar transação pendente)

```bash
# Primeiro, obter o Bearer Token da sessão (via DevTools ou auth.api.getSession)
# Depois executar:

curl -X POST http://localhost:3000/api/transacoes-pendentes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "appPackageName": "com.nu.production",
    "appName": "Nubank",
    "notificationText": "Compra aprovada no débito: R$ 45,90 em Padaria do João"
  }'
```

**Resposta esperada**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-id",
    "valor": "45.90",
    "estabelecimento": "Padaria do João",
    "tipoTransacao": "debito",
    "status": "pendente",
    ...
  }
}
```

### 2. Testar API GET (Listar transações)

```bash
curl http://localhost:3000/api/transacoes-pendentes \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### 3. Testar Parser Localmente

Adicionar ao arquivo `parser.ts` temporariamente:

```typescript
// Para testar manualmente
if (import.meta.url === `file://${process.argv[1]}`) {
  const exemplos = [
    "Compra aprovada no débito: R$ 45,90 em Padaria do João",
    "PIX enviado: R$ 120,00 para Maria Silva",
    "Pagamento por crédito: R$ 1.234,56 em Magazine Luiza",
  ];

  exemplos.forEach(texto => {
    console.log("\nTexto:", texto);
    console.log("Parseado:", parseNotificationText(texto));
  });
}
```

---

## 🎯 Arquivos Críticos

| Arquivo | Propósito | Importância |
|---------|-----------|-------------|
| `db/schema.ts` | Estrutura de dados | 🔴 CRÍTICO |
| `lib/transacoes-pendentes/parser.ts` | Lógica de parsing | 🔴 CRÍTICO |
| `app/api/transacoes-pendentes/route.ts` | API endpoints | 🔴 CRÍTICO |
| `app/(dashboard)/transacoes-pendentes/actions.ts` | Lógica de negócio | 🔴 CRÍTICO |
| `components/transacoes-pendentes/processar-dialog.tsx` | UX principal | 🟡 IMPORTANTE |
| `lib/transacoes-pendentes/auto-suggest.ts` | Features inteligentes | 🟢 NICE TO HAVE |

---

## 📊 Métricas de Sucesso

- ✅ Notificações parseadas com >80% de precisão
- ✅ Auto-sugestão de categoria funciona em >50% dos casos
- ✅ Tempo de processamento < 2 segundos
- ✅ Zero vazamento de dados entre usuários
- ✅ UI responsiva (mobile + desktop)
- ✅ Badge atualiza em tempo real após ações

---

## 🔮 Próximos Passos (Futuro)

Funcionalidades planejadas para futuras iterações:

1. **Detecção de Duplicatas** (v2)
   - Hash de notificações
   - Verificação de similaridade temporal
   - Aviso ao usuário antes de processar

2. **Parser Inteligente** (v3)
   - Integração com NLP/AI
   - Aprendizado com correções do usuário
   - Suporte para mais bancos automaticamente

3. **Notificações Web** (v4)
   - WebSockets para updates em tempo real
   - Notificações push quando nova pendente chega

4. **App Android** (v5)
   - Captura de notificações
   - Sistema de API Keys
   - Sincronização em background

5. **Analytics** (v6)
   - Dashboards de automação
   - Taxa de acerto do parser
   - Bancos mais usados

---

## 🚨 Considerações Importantes

### Segurança
- ⚠️ Sempre filtrar queries por `userId`
- ⚠️ Validar Bearer Token em API routes
- ⚠️ Sanitizar texto de notificações (XSS)
- ⚠️ Nunca expor dados de outros usuários

### Performance
- ⚡ Usar indexes em `userId` e `status`
- ⚡ Parallel fetching com `Promise.all()`
- ⚡ Considerar paginação se >100 pendentes

### UX
- 💡 Loading states em todas ações assíncronas
- 💡 Toasts para feedback imediato
- 💡 Confirmação para ações destrutivas
- 💡 Auto-suggestions economizam tempo

---

## 📝 Notas de Desenvolvimento

### Convenções de Código
- **Nomes**: inglês (código) + português (UI)
- **Tabelas**: snake_case (`transacoes_pendentes`)
- **Componentes**: Kebab case (`transacao-card`)
- **Funções**: camelCase (`fetchTransacoesPendentes`)

### Padrões de Erro
```typescript
// ✅ BOM
return errorResult("Transação pendente não encontrada");

// ❌ RUIM
throw new Error("Not found");
```

### Padrões de Revalidação
```typescript
// ✅ BOM - Revalida múltiplas paths
const revalidate = () => {
  revalidateForEntity("transacoesPendentes");
  revalidateForEntity("lancamentos");
};

// ❌ RUIM - Apenas uma path
revalidatePath("/transacoes-pendentes");
```

---

**Versão**: 1.0
**Última Atualização**: 2025-12-03
**Autor**: Claude (Plan Mode)
**Aprovado por**: Usuário
