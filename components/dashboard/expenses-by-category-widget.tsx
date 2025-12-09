import MoneyValues from "@/components/money-values";
import type { ExpensesByCategoryData } from "@/lib/dashboard/categories/expenses-by-category";
import { getIconComponent } from "@/lib/utils/icons";
import { formatPeriodForUrl } from "@/lib/utils/period";
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiExternalLinkLine,
  RiPieChartLine,
  RiWallet3Line,
} from "@remixicon/react";
import Link from "next/link";
import { WidgetEmptyState } from "../widget-empty-state";

type ExpensesByCategoryWidgetProps = {
  data: ExpensesByCategoryData;
  period: string;
};

const buildInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "CT";
  }
  if (parts.length === 1) {
    const firstPart = parts[0];
    return firstPart ? firstPart.slice(0, 2).toUpperCase() : "CT";
  }
  const firstChar = parts[0]?.[0] ?? "";
  const secondChar = parts[1]?.[0] ?? "";
  return `${firstChar}${secondChar}`.toUpperCase() || "CT";
};

const formatPercentage = (value: number) => {
  return `${Math.abs(value).toFixed(0)}%`;
};

export function ExpensesByCategoryWidget({
  data,
  period,
}: ExpensesByCategoryWidgetProps) {
  const periodParam = formatPeriodForUrl(period);

  if (data.categories.length === 0) {
    return (
      <WidgetEmptyState
        icon={<RiPieChartLine className="size-6 text-muted-foreground" />}
        title="Nenhuma despesa encontrada"
        description="Quando houver despesas registradas, elas aparecerão aqui."
      />
    );
  }

  return (
    <div className="flex flex-col px-0">
      {data.categories.map((category) => {
        const IconComponent = category.categoryIcon
          ? getIconComponent(category.categoryIcon)
          : null;
        const initials = buildInitials(category.categoryName);
        const hasIncrease =
          category.percentageChange !== null && category.percentageChange > 0;
        const hasDecrease =
          category.percentageChange !== null && category.percentageChange < 0;
        const hasBudget = category.budgetAmount !== null;
        const budgetExceeded =
          hasBudget &&
          category.budgetUsedPercentage !== null &&
          category.budgetUsedPercentage > 100;

        const formatCurrency = (value: number) =>
          new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(value);

        const exceededAmount =
          budgetExceeded && category.budgetAmount
            ? category.currentAmount - category.budgetAmount
            : 0;

        return (
          <div
            key={category.categoryId}
            className="flex flex-col py-2 border-b border-dashed last:border-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {IconComponent ? (
                    <IconComponent className="size-4 text-foreground" />
                  ) : (
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      {initials}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/categorias/${category.categoryId}?periodo=${periodParam}`}
                      className="flex max-w-full items-center gap-1 text-sm font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      <span className="truncate">{category.categoryName}</span>
                      <RiExternalLinkLine
                        className="size-3 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {formatPercentage(category.percentageOfTotal)} da despesa
                      total
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <MoneyValues
                  className="text-foreground"
                  amount={category.currentAmount}
                />
                {category.percentageChange !== null && (
                  <span
                    className={`flex items-center gap-0.5 text-xs ${
                      hasIncrease
                        ? "text-red-600 dark:text-red-500"
                        : hasDecrease
                        ? "text-green-600 dark:text-green-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {hasIncrease && <RiArrowUpLine className="size-3" />}
                    {hasDecrease && <RiArrowDownLine className="size-3" />}
                    {formatPercentage(category.percentageChange)}
                  </span>
                )}
              </div>
            </div>

            {hasBudget && category.budgetUsedPercentage !== null && (
              <div className="ml-11 flex items-center gap-1.5 text-xs">
                <RiWallet3Line
                  className={`size-3 ${
                    budgetExceeded
                      ? "text-red-600"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                />
                <span
                  className={
                    budgetExceeded
                      ? "text-red-600"
                      : "text-blue-600 dark:text-blue-400"
                  }
                >
                  {budgetExceeded ? (
                    <>
                      {formatPercentage(category.budgetUsedPercentage)} do
                      limite - excedeu em {formatCurrency(exceededAmount)}
                    </>
                  ) : (
                    <>
                      {formatPercentage(category.budgetUsedPercentage)} do
                      limite
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
