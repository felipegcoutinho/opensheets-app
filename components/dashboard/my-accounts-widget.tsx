import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { DashboardAccount } from "@/lib/dashboard/accounts";
import { formatPeriodForUrl } from "@/lib/utils/period";
import { RiBarChartBoxLine } from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import MoneyValues from "../money-values";
import { WidgetEmptyState } from "../widget-empty-state";

type MyAccountsWidgetProps = {
  accounts: DashboardAccount[];
  totalBalance: number;
  maxVisible?: number;
  period: string;
};

const resolveLogoSrc = (logo: string | null) => {
  if (!logo) {
    return null;
  }

  const fileName = logo.split("/").filter(Boolean).pop() ?? logo;
  return `/logos/${fileName}`;
};

const buildInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

export function MyAccountsWidget({
  accounts,
  totalBalance,
  maxVisible = 5,
  period,
}: MyAccountsWidgetProps) {
  const visibleAccounts = accounts.filter(
    (account) => !account.excludeFromBalance
  );
  const displayedAccounts = visibleAccounts.slice(0, maxVisible);
  const remainingCount = visibleAccounts.length - displayedAccounts.length;

  return (
    <>
      <CardHeader className="pb-4 px-0">
        <CardDescription>Saldo Total</CardDescription>
        <div className="text-2xl text-foreground">
          <MoneyValues amount={totalBalance} />
        </div>
      </CardHeader>

      <CardContent className="py-2 px-0">
        {displayedAccounts.length === 0 ? (
          <div className="-mt-10">
            <WidgetEmptyState
              icon={
                <RiBarChartBoxLine className="size-6 text-muted-foreground" />
              }
              title="Você ainda não adicionou nenhuma conta"
              description="Cadastre suas contas bancárias para acompanhar os saldos e movimentações."
            />
          </div>
        ) : (
          <ul className="flex flex-col">
            {displayedAccounts.map((account) => {
              const logoSrc = resolveLogoSrc(account.logo);
              const initials = buildInitials(account.name);

              return (
                <li
                  key={account.id}
                  className="flex items-center justify-between gap-2 border-b border-dashed py-2 last:border-0"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {logoSrc ? (
                      <div className="relative size-10 overflow-hidden">
                        <Image
                          src={logoSrc}
                          alt={`Logo da conta ${account.name}`}
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-sm font-semibold uppercase text-secondary-foreground">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0">
                      <Link
                        prefetch
                        href={`/contas/${
                          account.id
                        }/extrato?periodo=${formatPeriodForUrl(period)}`}
                        className="truncate font-medium text-foreground hover:text-primary hover:underline"
                      >
                        <span className="truncate text-sm">{account.name}</span>
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{account.accountType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-0.5 text-right">
                    <MoneyValues amount={account.balance} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {visibleAccounts.length > displayedAccounts.length ? (
        <CardFooter className="border-border/60 border-t pt-4 text-sm text-muted-foreground">
          +{remainingCount} contas não exibidas
        </CardFooter>
      ) : null}
    </>
  );
}
