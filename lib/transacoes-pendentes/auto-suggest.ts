import { db } from "@/lib/db";
import { lancamentos } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * Suggest category based on establishment name from previous transactions
 * Uses fuzzy matching with ILIKE for case-insensitive search
 */
export async function suggestCategoryForEstablishment(
  userId: string,
  estabelecimento: string
): Promise<string | null> {
  if (!estabelecimento || estabelecimento.length < 3) return null;

  // Busca transações similares por estabelecimento (case-insensitive, fuzzy)
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

/**
 * Suggest most used conta (bank account) for the user
 */
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

/**
 * Suggest most used cartao (credit card) for the user
 */
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
