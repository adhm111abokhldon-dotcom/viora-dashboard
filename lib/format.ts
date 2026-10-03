/*
 * Locale-aware formatting helpers.
 *
 * - Numbers always render with Latin digits (numberingSystem: "latn") in
 *   both languages, which is the normal convention for a Lebanese business
 *   dashboard and keeps prices/quantities easy to compare.
 * - Only presentation changes (separators, month names); values themselves
 *   are never altered.
 */

export type AppLocale = "en" | "ar";

export function formatNumber(
  value: number,
  locale: AppLocale,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, {
    numberingSystem: "latn",
    ...options,
  }).format(value);
}

export function formatCurrency(value: number, locale: AppLocale): string {
  return `$${formatNumber(value, locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/*
 * Formats a percentage given in the 0–100 range (e.g. 42.5 → "42.5%").
 */
export function formatPercent(
  value: number,
  locale: AppLocale,
  fractionDigits = 1,
): string {
  return `${formatNumber(value, locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`;
}

export function formatDate(value: string | Date, locale: AppLocale): string {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    numberingSystem: "latn",
  }).format(date);
}
