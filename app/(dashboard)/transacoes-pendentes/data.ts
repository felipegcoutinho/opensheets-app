import { getUserId } from "@/lib/auth/server";
import { fetchTransacoesPendentes } from "@/lib/transacoes-pendentes/fetch-data";
import { db } from "@/lib/db";
import { contas, cartoes, categorias, pagadores } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Fetch all data needed for pending transactions page
 * Uses parallel fetching with Promise.all for better performance
 */
export async function fetchPageData() {
  const userId = await getUserId();

  const [transacoes, contasData, cartoesData, categoriasData, pagadoresData] =
    await Promise.all([
      fetchTransacoesPendentes(userId),
      db.select().from(contas).where(eq(contas.userId, userId)),
      db.select().from(cartoes).where(eq(cartoes.userId, userId)),
      db.select().from(categorias).where(eq(categorias.userId, userId)),
      db.select().from(pagadores).where(eq(pagadores.userId, userId)),
    ]);

  return {
    transacoes,
    contas: contasData,
    cartoes: cartoesData,
    categorias: categoriasData,
    pagadores: pagadoresData,
  };
}

export type PageData = Awaited<ReturnType<typeof fetchPageData>>;
