import { categorias, lancamentos, orcamentos, pagadores, contas } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX, INITIAL_BALANCE_NOTE } from "@/lib/accounts/constants";
import { db } from "@/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import { getPreviousPeriod } from "@/lib/utils/period";
import { calculatePercentageChange } from "@/lib/utils/math";
import { safeToNumber } from "@/lib/utils/number";
import { and, eq, isNull, or, sql, ne } from "drizzle-orm";

export type CategoryIncomeItem = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  currentAmount: number;
  previousAmount: number;
  percentageChange: number | null;
  percentageOfTotal: number;
  budgetAmount: number | null;
  budgetUsedPercentage: number | null;
};

export type IncomeByCategoryData = {
  categories: CategoryIncomeItem[];
  currentTotal: number;
  previousTotal: number;
};

export async function fetchIncomeByCategory(
  userId: string,
  period: string
): Promise<IncomeByCategoryData> {
  const previousPeriod = getPreviousPeriod(period);

  // Busca receitas do período atual agrupadas por categoria
  const currentPeriodRows = await db
    .select({
      categoryId: categorias.id,
      categoryName: categorias.name,
      categoryIcon: categorias.icon,
      total: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
      budgetAmount: orcamentos.amount,
    })
    .from(lancamentos)
    .innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
    .innerJoin(categorias, eq(lancamentos.categoriaId, categorias.id))
    .leftJoin(contas, eq(lancamentos.contaId, contas.id))
    .leftJoin(
      orcamentos,
      and(
        eq(orcamentos.categoriaId, categorias.id),
        eq(orcamentos.period, period),
        eq(orcamentos.userId, userId)
      )
    )
    .where(
      and(
        eq(lancamentos.userId, userId),
        eq(lancamentos.period, period),
        eq(lancamentos.transactionType, "Receita"),
        eq(pagadores.role, PAGADOR_ROLE_ADMIN),
        eq(categorias.type, "receita"),
        or(
          isNull(lancamentos.note),
          sql`${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`
        ),
        // Excluir saldos iniciais se a conta tiver o flag ativo
        or(
          ne(lancamentos.note, INITIAL_BALANCE_NOTE),
          isNull(contas.excludeInitialBalanceFromIncome),
          eq(contas.excludeInitialBalanceFromIncome, false)
        )
      )
    )
    .groupBy(categorias.id, categorias.name, categorias.icon, orcamentos.amount);

  // Busca receitas do período anterior agrupadas por categoria
  const previousPeriodRows = await db
    .select({
      categoryId: categorias.id,
      total: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
    })
    .from(lancamentos)
    .innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
    .innerJoin(categorias, eq(lancamentos.categoriaId, categorias.id))
    .leftJoin(contas, eq(lancamentos.contaId, contas.id))
    .where(
      and(
        eq(lancamentos.userId, userId),
        eq(lancamentos.period, previousPeriod),
        eq(lancamentos.transactionType, "Receita"),
        eq(pagadores.role, PAGADOR_ROLE_ADMIN),
        eq(categorias.type, "receita"),
        or(
          isNull(lancamentos.note),
          sql`${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`
        ),
        // Excluir saldos iniciais se a conta tiver o flag ativo
        or(
          ne(lancamentos.note, INITIAL_BALANCE_NOTE),
          isNull(contas.excludeInitialBalanceFromIncome),
          eq(contas.excludeInitialBalanceFromIncome, false)
        )
      )
    )
    .groupBy(categorias.id);

  // Cria um mapa do período anterior para busca rápida
  const previousMap = new Map<string, number>();
  let previousTotal = 0;

  for (const row of previousPeriodRows) {
    const amount = Math.abs(safeToNumber(row.total));
    previousMap.set(row.categoryId, amount);
    previousTotal += amount;
  }

  // Calcula o total do período atual
  let currentTotal = 0;
  for (const row of currentPeriodRows) {
    currentTotal += Math.abs(safeToNumber(row.total));
  }

  // Monta os dados de cada categoria
  const categories: CategoryIncomeItem[] = currentPeriodRows.map((row) => {
    const currentAmount = Math.abs(safeToNumber(row.total));
    const previousAmount = previousMap.get(row.categoryId) ?? 0;
    const percentageChange = calculatePercentageChange(
      currentAmount,
      previousAmount
    );
    const percentageOfTotal =
      currentTotal > 0 ? (currentAmount / currentTotal) * 100 : 0;

    const budgetAmount = row.budgetAmount ? safeToNumber(row.budgetAmount) : null;
    const budgetUsedPercentage =
      budgetAmount && budgetAmount > 0
        ? (currentAmount / budgetAmount) * 100
        : null;

    return {
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      categoryIcon: row.categoryIcon,
      currentAmount,
      previousAmount,
      percentageChange,
      percentageOfTotal,
      budgetAmount,
      budgetUsedPercentage,
    };
  });

  // Ordena por valor atual (maior para menor)
  categories.sort((a, b) => b.currentAmount - a.currentAmount);

  return {
    categories,
    currentTotal,
    previousTotal,
  };
}
