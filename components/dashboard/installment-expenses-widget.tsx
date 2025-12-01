import MoneyValues from "@/components/money-values";
import { CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { InstallmentExpensesData } from "@/lib/dashboard/expenses/installment-expenses";
import {
  calculateLastInstallmentDate,
  formatLastInstallmentDate,
} from "@/lib/installments/utils";
import { RiNumbersLine } from "@remixicon/react";
import Image from "next/image";
import { Progress } from "../ui/progress";
import { WidgetEmptyState } from "../widget-empty-state";

type InstallmentExpensesWidgetProps = {
  data: InstallmentExpensesData;
};

const buildCompactInstallmentLabel = (
  currentInstallment: number | null,
  installmentCount: number | null
) => {
  if (currentInstallment && installmentCount) {
    return `${currentInstallment} de ${installmentCount}`;
  }
  return null;
};

const isLastInstallment = (
  currentInstallment: number | null,
  installmentCount: number | null
) => {
  if (!currentInstallment || !installmentCount) return false;
  return currentInstallment === installmentCount && installmentCount > 1;
};

const calculateRemainingInstallments = (
  currentInstallment: number | null,
  installmentCount: number | null
) => {
  if (!currentInstallment || !installmentCount) return 0;
  return Math.max(0, installmentCount - currentInstallment);
};

const calculateRemainingAmount = (
  amount: number,
  currentInstallment: number | null,
  installmentCount: number | null
) => {
  const remaining = calculateRemainingInstallments(
    currentInstallment,
    installmentCount
  );
  return amount * remaining;
};

const formatEndDate = (
  period: string,
  currentInstallment: number | null,
  installmentCount: number | null
) => {
  if (!currentInstallment || !installmentCount) return null;

  const lastDate = calculateLastInstallmentDate(
    period,
    currentInstallment,
    installmentCount
  );

  return formatLastInstallmentDate(lastDate);
};

const buildProgress = (
  currentInstallment: number | null,
  installmentCount: number | null
) => {
  if (!currentInstallment || !installmentCount || installmentCount <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, (currentInstallment / installmentCount) * 100)
  );
};

export function InstallmentExpensesWidget({
  data,
}: InstallmentExpensesWidgetProps) {
  if (data.expenses.length === 0) {
    return (
      <WidgetEmptyState
        icon={<RiNumbersLine className="size-6 text-muted-foreground" />}
        title="Nenhuma despesa parcelada"
        description="Lançamentos parcelados aparecerão aqui conforme forem registrados."
      />
    );
  }

  return (
    <CardContent className="flex flex-col gap-4 px-0">
      <ul className="flex flex-col gap-2">
        {data.expenses.map((expense) => {
          const compactLabel = buildCompactInstallmentLabel(
            expense.currentInstallment,
            expense.installmentCount
          );
          const isLast = isLastInstallment(
            expense.currentInstallment,
            expense.installmentCount
          );
          const remainingInstallments = calculateRemainingInstallments(
            expense.currentInstallment,
            expense.installmentCount
          );
          const remainingAmount = calculateRemainingAmount(
            expense.amount,
            expense.currentInstallment,
            expense.installmentCount
          );
          const endDate = formatEndDate(
            expense.period,
            expense.currentInstallment,
            expense.installmentCount
          );
          const progress = buildProgress(
            expense.currentInstallment,
            expense.installmentCount
          );

          return (
            <li
              key={expense.id}
              className="flex items-center gap-3 border-b border-dashed pb-3 last:border-b-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {expense.name}
                    </p>
                    {compactLabel && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
                        {compactLabel}
                        {isLast && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Image
                                  src="/icones/party.svg"
                                  alt="Última parcela"
                                  width={14}
                                  height={14}
                                  className="h-3.5 w-3.5"
                                />
                                <span className="sr-only">Última parcela</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Última parcela!
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                    )}
                  </div>
                  <MoneyValues amount={expense.amount} className="shrink-0" />
                </div>

                <p className="text-xs text-muted-foreground ">
                  {endDate && `Termina em ${endDate}`}
                  {` - Restante (${remainingInstallments}) `}
                  <MoneyValues
                    amount={remainingAmount}
                    className="inline-block font-medium"
                  />
                </p>

                <Progress value={progress} className="h-2 mt-1" />
              </div>
            </li>
          );
        })}
      </ul>
    </CardContent>
  );
}
