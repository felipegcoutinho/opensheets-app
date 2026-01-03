import { lancamentos, pagadores, contas } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX, INITIAL_BALANCE_NOTE } from "@/lib/accounts/constants";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/dashboard/common";
import { and, eq, sql, or, isNull, ne } from "drizzle-orm";

export type MonthData = {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
};

export type IncomeExpenseBalanceData = {
  months: MonthData[];
};

const MONTH_LABELS: Record<string, string> = {
  "01": "jan",
  "02": "fev",
  "03": "mar",
  "04": "abr",
  "05": "mai",
  "06": "jun",
  "07": "jul",
  "08": "ago",
  "09": "set",
  "10": "out",
  "11": "nov",
  "12": "dez",
};

const generateLast6Months = (currentPeriod: string): string[] => {
  const [yearStr, monthStr] = currentPeriod.split("-");
  let year = Number.parseInt(yearStr ?? "", 10);
  let month = Number.parseInt(monthStr ?? "", 10);

  if (Number.isNaN(year) || Number.isNaN(month)) {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const periods: string[] = [];

  for (let i = 5; i >= 0; i--) {
    let targetMonth = month - i;
    let targetYear = year;

    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }

    periods.push(`${targetYear}-${String(targetMonth).padStart(2, "0")}`);
  }

  return periods;
};

export async function fetchIncomeExpenseBalance(
  userId: string,
  currentPeriod: string
): Promise<IncomeExpenseBalanceData> {
  const periods = generateLast6Months(currentPeriod);

  const results = await Promise.all(
    periods.map(async (period) => {
      // Busca receitas do período
      const [incomeRow] = await db
        .select({
          total: sql<number>`
            coalesce(
              sum(${lancamentos.amount}),
              0
            )
          `,
        })
        .from(lancamentos)
        .innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
        .leftJoin(contas, eq(lancamentos.contaId, contas.id))
        .where(
          and(
            eq(lancamentos.userId, userId),
            eq(lancamentos.period, period),
            eq(lancamentos.transactionType, "Receita"),
            eq(pagadores.role, "admin"),
            sql`(${lancamentos.note} IS NULL OR ${
              lancamentos.note
            } NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`})`,
            // Excluir saldos iniciais se a conta tiver o flag ativo
            or(
              ne(lancamentos.note, INITIAL_BALANCE_NOTE),
              isNull(contas.excludeInitialBalanceFromIncome),
              eq(contas.excludeInitialBalanceFromIncome, false)
            )
          )
        );

      // Busca despesas do período
      const [expenseRow] = await db
        .select({
          total: sql<number>`
            coalesce(
              sum(${lancamentos.amount}),
              0
            )
          `,
        })
        .from(lancamentos)
        .innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
        .where(
          and(
            eq(lancamentos.userId, userId),
            eq(lancamentos.period, period),
            eq(lancamentos.transactionType, "Despesa"),
            eq(pagadores.role, "admin"),
            sql`(${lancamentos.note} IS NULL OR ${
              lancamentos.note
            } NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`})`
          )
        );

      const income = Math.abs(toNumber(incomeRow?.total));
      const expense = Math.abs(toNumber(expenseRow?.total));
      const balance = income - expense;

      const [, monthPart] = period.split("-");
      const monthLabel = MONTH_LABELS[monthPart ?? "01"] ?? monthPart;

      return {
        month: period,
        monthLabel: monthLabel ?? "",
        income,
        expense,
        balance,
      };
    })
  );

  return {
    months: results,
  };
}
