/**
 * Formatting helpers for displaying lancamento data
 */

/**
 * Capitalizes the first letter of a string
 */
function capitalize(value: string): string {
  return value.length > 0 ? value[0]?.toUpperCase().concat(value.slice(1)) : value;
}

/**
 * Currency formatter for pt-BR locale (BRL)
 */
export const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Date formatter for pt-BR locale (dd/mm/yyyy)
 */
export const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * Month formatter for pt-BR locale (Month Year)
 */
export const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

/**
 * Formats a date string to localized format
 * @param value - ISO date string or null
 * @returns Formatted date string or "—"
 * @example formatDate("2024-01-15") => "15/01/2024"
 */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

/**
 * Formats a period (YYYY-MM) to localized month label
 * @param value - Period string (YYYY-MM) or null
 * @returns Formatted period string or "—"
 * @example formatPeriod("2024-01") => "Janeiro 2024"
 */
export function formatPeriod(value?: string | null): string {
  if (!value) return "—";
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  const date = new Date(year, month - 1, 1);
  return capitalize(monthFormatter.format(date));
}

/**
 * Formats a condition string with proper capitalization
 * @param value - Condition string or null
 * @returns Formatted condition string or "—"
 * @example formatCondition("vista") => "À vista"
 */
export function formatCondition(value?: string | null): string {
  if (!value) return "—";
  if (value.toLowerCase() === "vista") return "À vista";
  return capitalize(value);
}

/**
 * Gets the badge variant for a transaction type
 * @param type - Transaction type (Receita/Despesa)
 * @returns Badge variant
 */
export function getTransactionBadgeVariant(type?: string | null): "default" | "destructive" | "secondary" {
  if (!type) return "secondary";
  const normalized = type.toLowerCase();
  return normalized === "receita" || normalized === "saldo inicial"
    ? "default"
    : "destructive";
}

/**
 * Formats currency value
 * @param value - Numeric value
 * @returns Formatted currency string
 * @example formatCurrency(1234.56) => "R$ 1.234,56"
 */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}
