import { EstabelecimentoLogo } from "@/components/lancamentos/shared/estabelecimento-logo";
import MoneyValues from "@/components/money-values";
import { CardContent } from "@/components/ui/card";
import type { RecurringExpensesData } from "@/lib/dashboard/expenses/recurring-expenses";
import { RiRefreshLine } from "@remixicon/react";
import { WidgetEmptyState } from "../widget-empty-state";

type RecurringExpensesWidgetProps = {
  data: RecurringExpensesData;
};

const formatOccurrences = (value: number | null) => {
  if (!value) {
    return "Recorrência contínua";
  }

  return `${value} recorrências`;
};

export function RecurringExpensesWidget({
  data,
}: RecurringExpensesWidgetProps) {
  if (data.expenses.length === 0) {
    return (
      <WidgetEmptyState
        icon={<RiRefreshLine className="size-6 text-muted-foreground" />}
        title="Nenhuma despesa recorrente"
        description="Lançamentos recorrentes aparecerão aqui conforme forem registrados."
      />
    );
  }

  return (
    <CardContent className="flex flex-col gap-4 px-0">
      <ul className="flex flex-col gap-2">
        {data.expenses.map((expense) => {
          return (
            <li
              key={expense.id}
              className="flex items-start gap-3 border-b border-dashed pb-2 last:border-b-0 last:pb-0"
            >
              <EstabelecimentoLogo name={expense.name} size={38} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-foreground text-sm font-medium">
                    {expense.name}
                  </p>

                  <MoneyValues amount={expense.amount} />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    {expense.paymentMethod}
                  </span>
                  -<span>{formatOccurrences(expense.recurrenceCount)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContent>
  );
}
