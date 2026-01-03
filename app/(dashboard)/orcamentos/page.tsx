import MonthPicker from "@/components/month-picker/month-picker";
import { BudgetsPage } from "@/components/orcamentos/budgets-page";
import { getUserId } from "@/lib/auth/server";
import { fetchUserPeriodPreferences } from "@/lib/user-preferences/period";
import { parsePeriodParam } from "@/lib/utils/period";
import { fetchBudgetsForUser } from "./data";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  searchParams?: PageSearchParams;
};

const getSingleParam = (
  params: Record<string, string | string[] | undefined> | undefined,
  key: string
) => {
  const value = params?.[key];
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
};

const capitalize = (value: string) =>
  value.length === 0 ? value : value[0]?.toUpperCase() + value.slice(1);

export default async function Page({ searchParams }: PageProps) {
  const userId = await getUserId();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const periodoParam = getSingleParam(resolvedSearchParams, "periodo");

  const {
    period: selectedPeriod,
    monthName: rawMonthName,
    year,
  } = parsePeriodParam(periodoParam);

  const periodLabel = `${capitalize(rawMonthName)} ${year}`;

  const [{ budgets, categoriesOptions }, periodPreferences] = await Promise.all([
    fetchBudgetsForUser(userId, selectedPeriod),
    fetchUserPeriodPreferences(userId),
  ]);

  return (
    <main className="flex flex-col gap-6">
      <MonthPicker />
      <BudgetsPage
        budgets={budgets}
        categories={categoriesOptions}
        selectedPeriod={selectedPeriod}
        periodLabel={periodLabel}
        periodPreferences={periodPreferences}
      />
    </main>
  );
}

