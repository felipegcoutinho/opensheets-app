import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
    mode: "date",
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
    mode: "date",
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  }),
});

// ===================== PUBLIC TABLES =====================

export const contas = pgTable("contas", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("nome").notNull(),
  accountType: text("tipo_conta").notNull(),
  note: text("anotacao"),
  status: text("status").notNull(),
  logo: text("logo").notNull(),
  initialBalance: numeric("saldo_inicial", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  excludeFromBalance: boolean("excluir_do_saldo")
    .notNull()
    .default(false),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const categorias = pgTable("categorias", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("nome").notNull(),
  type: text("tipo").notNull(),
  icon: text("icone"),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const pagadores = pgTable(
  "pagadores",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("nome").notNull(),
    email: text("email"),
    avatarUrl: text("avatar_url"),
    status: text("status").notNull(),
    note: text("anotacao"),
    role: text("role"),
    isAutoSend: boolean("is_auto_send").notNull().default(false),
    shareCode: text("share_code")
      .notNull()
      .default(sql`substr(encode(gen_random_bytes(24), 'base64'), 1, 24)`),
    lastMailAt: timestamp("last_mail", {
      mode: "date",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueShareCode: uniqueIndex("pagadores_share_code_key").on(
      table.shareCode
    ),
  })
);

export const pagadorShares = pgTable(
  "pagador_shares",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    pagadorId: uuid("pagador_id")
      .notNull()
      .references(() => pagadores.id, { onDelete: "cascade" }),
    sharedWithUserId: text("shared_with_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    permission: text("permission").notNull().default("read"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniquePagadorShare: uniqueIndex("pagador_shares_unique").on(
      table.pagadorId,
      table.sharedWithUserId
    ),
  })
);

export const cartoes = pgTable("cartoes", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("nome").notNull(),
  closingDay: text("dt_fechamento").notNull(),
  dueDay: text("dt_vencimento").notNull(),
  note: text("anotacao"),
  limit: numeric("limite", { precision: 10, scale: 2 }),
  brand: text("bandeira"),
  logo: text("logo"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  contaId: uuid("conta_id")
    .notNull()
    .references(() => contas.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const faturas = pgTable("faturas", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  paymentStatus: text("status_pagamento"),
  period: text("periodo"),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  cartaoId: uuid("cartao_id").references(() => cartoes.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

export const orcamentos = pgTable("orcamentos", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  amount: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  period: text("periodo").notNull(),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoriaId: uuid("categoria_id").references(() => categorias.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

export const anotacoes = pgTable("anotacoes", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("titulo"),
  description: text("descricao"),
  type: text("tipo").notNull().default("nota"), // "nota" ou "tarefa"
  tasks: text("tasks"), // JSON stringificado com array de tarefas
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const savedInsights = pgTable(
  "saved_insights",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    modelId: text("model_id").notNull(),
    data: text("data").notNull(), // JSON stringificado com as análises
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userPeriodIdx: uniqueIndex("saved_insights_user_period_idx").on(
      table.userId,
      table.period
    ),
  })
);

export const installmentAnticipations = pgTable(
  "installment_anticipations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    seriesId: uuid("series_id").notNull(),
    anticipationPeriod: text("periodo_antecipacao").notNull(),
    anticipationDate: date("data_antecipacao", { mode: "date" }).notNull(),
    anticipatedInstallmentIds: jsonb("parcelas_antecipadas")
      .notNull()
      .$type<string[]>(),
    totalAmount: numeric("valor_total", { precision: 12, scale: 2 }).notNull(),
    installmentCount: smallint("qtde_parcelas").notNull(),
    discount: numeric("desconto", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    lancamentoId: uuid("lancamento_id")
      .notNull()
      .references(() => lancamentos.id, { onDelete: "cascade" }),
    pagadorId: uuid("pagador_id").references(() => pagadores.id, {
      onDelete: "cascade",
    }),
    categoriaId: uuid("categoria_id").references(() => categorias.id, {
      onDelete: "cascade",
    }),
    note: text("anotacao"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    seriesIdIdx: index("installment_anticipations_series_id_idx").on(
      table.seriesId
    ),
    userIdIdx: index("installment_anticipations_user_id_idx").on(table.userId),
  })
);

export const lancamentos = pgTable("lancamentos", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  condition: text("condicao").notNull(),
  name: text("nome").notNull(),
  paymentMethod: text("forma_pagamento").notNull(),
  note: text("anotacao"),
  amount: numeric("valor", { precision: 12, scale: 2 }).notNull(),
  purchaseDate: date("data_compra", { mode: "date" }).notNull(),
  transactionType: text("tipo_transacao").notNull(),
  installmentCount: smallint("qtde_parcela"),
  period: text("periodo").notNull(),
  currentInstallment: smallint("parcela_atual"),
  recurrenceCount: integer("qtde_recorrencia"),
  dueDate: date("data_vencimento", { mode: "date" }),
  boletoPaymentDate: date("dt_pagamento_boleto", { mode: "date" }),
  isSettled: boolean("realizado").default(false),
  isDivided: boolean("dividido").default(false),
  isAnticipated: boolean("antecipado").default(false),
  anticipationId: uuid("antecipacao_id").references(
    () => installmentAnticipations.id,
    { onDelete: "set null" }
  ),
  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  cartaoId: uuid("cartao_id").references(() => cartoes.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  contaId: uuid("conta_id").references(() => contas.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  categoriaId: uuid("categoria_id").references(() => categorias.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  pagadorId: uuid("pagador_id").references(() => pagadores.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  seriesId: uuid("series_id"),
  transferId: uuid("transfer_id"),
});

export const transacoesPendentes = pgTable(
  "transacoes_pendentes",
  {
    // IDs e chaves
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

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
    categoriaId: uuid("categoria_id").references(() => categorias.id, {
      onDelete: "set null",
    }),
    contaId: uuid("conta_id").references(() => contas.id, {
      onDelete: "set null",
    }),
    cartaoId: uuid("cartao_id").references(() => cartoes.id, {
      onDelete: "set null",
    }),
    pagadorId: uuid("pagador_id").references(() => pagadores.id, {
      onDelete: "set null",
    }),
    descricaoEditada: text("descricao_editada"),
    observacoes: text("observacoes"),

    // Metadados
    status: text("status").notNull().default("pendente"), // pendente, processado, ignorado
    processadoEm: timestamp("processado_em", { mode: "date" }),
    lancamentoId: uuid("lancamento_id").references(() => lancamentos.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index("transacoes_pendentes_user_id_idx").on(table.userId),
    statusIdx: index("transacoes_pendentes_status_idx").on(table.status),
  })
);

export const userRelations = relations(user, ({ many, one }) => ({
  accounts: many(account),
  sessions: many(session),
  anotacoes: many(anotacoes),
  cartoes: many(cartoes),
  categorias: many(categorias),
  contas: many(contas),
  faturas: many(faturas),
  lancamentos: many(lancamentos),
  orcamentos: many(orcamentos),
  pagadores: many(pagadores),
  installmentAnticipations: many(installmentAnticipations),
  transacoesPendentes: many(transacoesPendentes),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const contasRelations = relations(contas, ({ one, many }) => ({
  user: one(user, {
    fields: [contas.userId],
    references: [user.id],
  }),
  cartoes: many(cartoes),
  lancamentos: many(lancamentos),
}));

export const categoriasRelations = relations(categorias, ({ one, many }) => ({
  user: one(user, {
    fields: [categorias.userId],
    references: [user.id],
  }),
  lancamentos: many(lancamentos),
  orcamentos: many(orcamentos),
}));

export const pagadoresRelations = relations(pagadores, ({ one, many }) => ({
  user: one(user, {
    fields: [pagadores.userId],
    references: [user.id],
  }),
  lancamentos: many(lancamentos),
  shares: many(pagadorShares),
}));

export const pagadorSharesRelations = relations(pagadorShares, ({ one }) => ({
  pagador: one(pagadores, {
    fields: [pagadorShares.pagadorId],
    references: [pagadores.id],
  }),
  sharedWithUser: one(user, {
    fields: [pagadorShares.sharedWithUserId],
    references: [user.id],
  }),
  createdByUser: one(user, {
    fields: [pagadorShares.createdByUserId],
    references: [user.id],
  }),
}));

export const cartoesRelations = relations(cartoes, ({ one, many }) => ({
  user: one(user, {
    fields: [cartoes.userId],
    references: [user.id],
  }),
  conta: one(contas, {
    fields: [cartoes.contaId],
    references: [contas.id],
  }),
  faturas: many(faturas),
  lancamentos: many(lancamentos),
}));

export const faturasRelations = relations(faturas, ({ one }) => ({
  user: one(user, {
    fields: [faturas.userId],
    references: [user.id],
  }),
  cartao: one(cartoes, {
    fields: [faturas.cartaoId],
    references: [cartoes.id],
  }),
}));

export const orcamentosRelations = relations(orcamentos, ({ one }) => ({
  user: one(user, {
    fields: [orcamentos.userId],
    references: [user.id],
  }),
  categoria: one(categorias, {
    fields: [orcamentos.categoriaId],
    references: [categorias.id],
  }),
}));

export const anotacoesRelations = relations(anotacoes, ({ one }) => ({
  user: one(user, {
    fields: [anotacoes.userId],
    references: [user.id],
  }),
}));

export const savedInsightsRelations = relations(savedInsights, ({ one }) => ({
  user: one(user, {
    fields: [savedInsights.userId],
    references: [user.id],
  }),
}));

export const lancamentosRelations = relations(lancamentos, ({ one }) => ({
  user: one(user, {
    fields: [lancamentos.userId],
    references: [user.id],
  }),
  cartao: one(cartoes, {
    fields: [lancamentos.cartaoId],
    references: [cartoes.id],
  }),
  conta: one(contas, {
    fields: [lancamentos.contaId],
    references: [contas.id],
  }),
  categoria: one(categorias, {
    fields: [lancamentos.categoriaId],
    references: [categorias.id],
  }),
  pagador: one(pagadores, {
    fields: [lancamentos.pagadorId],
    references: [pagadores.id],
  }),
  anticipation: one(installmentAnticipations, {
    fields: [lancamentos.anticipationId],
    references: [installmentAnticipations.id],
  }),
}));

export const installmentAnticipationsRelations = relations(
  installmentAnticipations,
  ({ one, many }) => ({
    user: one(user, {
      fields: [installmentAnticipations.userId],
      references: [user.id],
    }),
    lancamento: one(lancamentos, {
      fields: [installmentAnticipations.lancamentoId],
      references: [lancamentos.id],
    }),
    pagador: one(pagadores, {
      fields: [installmentAnticipations.pagadorId],
      references: [pagadores.id],
    }),
    categoria: one(categorias, {
      fields: [installmentAnticipations.categoriaId],
      references: [categorias.id],
    }),
  })
);

/**
 * API Tokens para autenticação de apps externos (ex: Android app)
 */
export const apiTokens = pgTable("api_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Nome descritivo (ex: "Meu Celular")
  token: text("token").notNull().unique(), // Token gerado (hash)
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }), // Último uso
  expiresAt: timestamp("expires_at", { withTimezone: true }), // Expiração (opcional)
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }), // Token revogado?
});

export const apiTokensRelations = relations(apiTokens, ({ one }) => ({
  user: one(user, {
    fields: [apiTokens.userId],
    references: [user.id],
  }),
}));

export const transacoesPendentesRelations = relations(
  transacoesPendentes,
  ({ one }) => ({
    user: one(user, {
      fields: [transacoesPendentes.userId],
      references: [user.id],
    }),
    categoria: one(categorias, {
      fields: [transacoesPendentes.categoriaId],
      references: [categorias.id],
    }),
    conta: one(contas, {
      fields: [transacoesPendentes.contaId],
      references: [contas.id],
    }),
    cartao: one(cartoes, {
      fields: [transacoesPendentes.cartaoId],
      references: [cartoes.id],
    }),
    pagador: one(pagadores, {
      fields: [transacoesPendentes.pagadorId],
      references: [pagadores.id],
    }),
    lancamento: one(lancamentos, {
      fields: [transacoesPendentes.lancamentoId],
      references: [lancamentos.id],
    }),
  })
);

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Account = typeof account.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Conta = typeof contas.$inferSelect;
export type Categoria = typeof categorias.$inferSelect;
export type Pagador = typeof pagadores.$inferSelect;
export type Cartao = typeof cartoes.$inferSelect;
export type Fatura = typeof faturas.$inferSelect;
export type Orcamento = typeof orcamentos.$inferSelect;
export type Anotacao = typeof anotacoes.$inferSelect;
export type SavedInsight = typeof savedInsights.$inferSelect;
export type Lancamento = typeof lancamentos.$inferSelect;
export type InstallmentAnticipation =
  typeof installmentAnticipations.$inferSelect;
export type TransacaoPendente = typeof transacoesPendentes.$inferSelect;
export type NewTransacaoPendente = typeof transacoesPendentes.$inferInsert;
export type ApiToken = typeof apiTokens.$inferSelect;
export type NewApiToken = typeof apiTokens.$inferInsert;
