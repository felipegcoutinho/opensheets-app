/**
 * Data fetching functions for Pré-Lançamentos
 */

import { db } from "@/lib/db";
import { inboxItems, categorias, contas, cartoes, lancamentos } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import type { InboxItem, SelectOption } from "@/components/pre-lancamentos/types";
import {
  fetchLancamentoFilterSources,
  buildSluggedFilters,
  buildOptionSets,
} from "@/lib/lancamentos/page-helpers";

export async function fetchInboxItems(
  userId: string,
  status: "pending" | "processed" | "discarded" = "pending"
): Promise<InboxItem[]> {
  const items = await db
    .select()
    .from(inboxItems)
    .where(and(eq(inboxItems.userId, userId), eq(inboxItems.status, status)))
    .orderBy(desc(inboxItems.createdAt));

  return items;
}

export async function fetchInboxItemById(
  userId: string,
  itemId: string
): Promise<InboxItem | null> {
  const [item] = await db
    .select()
    .from(inboxItems)
    .where(and(eq(inboxItems.id, itemId), eq(inboxItems.userId, userId)))
    .limit(1);

  return item ?? null;
}

export async function fetchCategoriasForSelect(
  userId: string,
  type?: string
): Promise<SelectOption[]> {
  const query = db
    .select({ id: categorias.id, name: categorias.name })
    .from(categorias)
    .where(
      type
        ? and(eq(categorias.userId, userId), eq(categorias.type, type))
        : eq(categorias.userId, userId)
    )
    .orderBy(categorias.name);

  return query;
}

export async function fetchContasForSelect(userId: string): Promise<SelectOption[]> {
  const items = await db
    .select({ id: contas.id, name: contas.name })
    .from(contas)
    .where(and(eq(contas.userId, userId), eq(contas.status, "ativo")))
    .orderBy(contas.name);

  return items;
}

export async function fetchCartoesForSelect(
  userId: string
): Promise<(SelectOption & { lastDigits?: string })[]> {
  const items = await db
    .select({ id: cartoes.id, name: cartoes.name })
    .from(cartoes)
    .where(and(eq(cartoes.userId, userId), eq(cartoes.status, "ativo")))
    .orderBy(cartoes.name);

  return items;
}

export async function fetchPendingInboxCount(userId: string): Promise<number> {
  const items = await db
    .select({ id: inboxItems.id })
    .from(inboxItems)
    .where(and(eq(inboxItems.userId, userId), eq(inboxItems.status, "pending")));

  return items.length;
}

/**
 * Fetch all data needed for the LancamentoDialog in inbox context
 */
export async function fetchInboxDialogData(userId: string): Promise<{
  pagadorOptions: SelectOption[];
  splitPagadorOptions: SelectOption[];
  defaultPagadorId: string | null;
  contaOptions: SelectOption[];
  cartaoOptions: SelectOption[];
  categoriaOptions: SelectOption[];
  estabelecimentos: string[];
}> {
  const filterSources = await fetchLancamentoFilterSources(userId);
  const sluggedFilters = buildSluggedFilters(filterSources);

  const {
    pagadorOptions,
    splitPagadorOptions,
    defaultPagadorId,
    contaOptions,
    cartaoOptions,
    categoriaOptions,
  } = buildOptionSets({
    ...sluggedFilters,
    pagadorRows: filterSources.pagadorRows,
  });

  // Fetch recent establishments (same approach as getRecentEstablishmentsAction)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentEstablishments = await db
    .select({ name: lancamentos.name })
    .from(lancamentos)
    .where(
      and(
        eq(lancamentos.userId, userId),
        gte(lancamentos.purchaseDate, threeMonthsAgo)
      )
    )
    .orderBy(desc(lancamentos.purchaseDate));

  // Remove duplicates and filter empty names
  const filteredNames: string[] = recentEstablishments
    .map((r: { name: string }) => r.name)
    .filter(
      (name: string | null): name is string =>
        name != null &&
        name.trim().length > 0 &&
        !name.toLowerCase().startsWith("pagamento fatura")
    );
  const estabelecimentos = Array.from<string>(new Set(filteredNames)).slice(
    0,
    100
  );

  return {
    pagadorOptions,
    splitPagadorOptions,
    defaultPagadorId,
    contaOptions,
    cartaoOptions,
    categoriaOptions,
    estabelecimentos,
  };
}
