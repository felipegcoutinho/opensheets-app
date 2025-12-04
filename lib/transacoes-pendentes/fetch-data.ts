import { db } from "@/lib/db";
import { transacoesPendentes } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Fetch all pending transactions for a user with relations
 */
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

/**
 * Fetch pending transactions filtered by status
 */
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

/**
 * Count pending transactions with status 'pendente'
 */
export async function contarTransacoesPendentes(
  userId: string
): Promise<number> {
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

/**
 * Fetch a single pending transaction by ID
 */
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

/**
 * Type for pending transaction with all relations
 */
export type TransacaoPendenteComRelacoes = Awaited<
  ReturnType<typeof fetchTransacoesPendentes>
>[number];
