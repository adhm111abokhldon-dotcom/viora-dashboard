"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Banknote,
  Megaphone,
  Pencil,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import AdvertisingExpenseForm from "@/components/AdvertisingExpenseForm";
import WindsorSyncDialog from "@/components/WindsorSyncDialog";
import { Pagination } from "@/components/ui/Pagination";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import PageHeader from "@/components/PageHeader";
import { containerVariants, itemVariants } from "@/lib/motion";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import { useAppToast } from "@/lib/toast";
import { useInvalidateAll } from "@/lib/queries";
import { cn } from "@/lib/utils";
import {
  deleteAdvertisingExpense,
  getAdInsights,
  getAdvertisingExpenses,
  type AdInsights,
  type AdVerdict,
  type AdvertisingExpense,
} from "@/lib/api";

const ALL_PLATFORMS = "all";
const PAGE_SIZE = 10;

/** Platforms offered as suggestions; any other value can be typed in. */
const SUGGESTED_PLATFORMS = ["Meta", "Facebook", "Instagram", "TikTok"] as const;

const EMPTY_FILTERS = { from: "", to: "", platform: ALL_PLATFORMS };

/**
 * Advertising Expenses.
 *
 * Ad spend is a standalone business expense: there is no attribution between
 * an ad and an order, so it is never mixed into product or order figures. It
 * only meets sales at the "Net Profit After Ads" line on the Reports page.
 */
export default function AdvertisingPage() {
  const t = useTranslations("advertising");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale() as "en" | "ar";

  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdvertisingExpense | null>(null);

  /* 7/30 window, same default as the Reports page. */
  /* Only the funnel (ads vs orders) is windowed; Windsor data is all-time. */
  const [funnelRange, setFunnelRange] = useState<7 | 30>(30);
  const [windsorOpen, setWindsorOpen] = useState(false);


  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["advertising", page, filters.from, filters.to, filters.platform],
    queryFn: () =>
      getAdvertisingExpenses({
        page,
        limit: PAGE_SIZE,
        from: filters.from || undefined,
        to: filters.to || undefined,
        platform:
          filters.platform === ALL_PLATFORMS ? undefined : filters.platform,
      }),
    placeholderData: keepPreviousData,
  });

  const {
    data: insights,
    isLoading: insightsLoading,
    isError: insightsError,
    error: insightsErrorDetail,
    refetch: refetchInsights,
  } = useQuery({
    queryKey: ["adInsights", funnelRange],
    queryFn: () => getAdInsights(funnelRange),
  });

  const invalidateAll = useInvalidateAll();
  const toast = useAppToast();

  const deleteMutation = useMutation({
    mutationFn: deleteAdvertisingExpense,

    onSuccess: async () => {
      toast.success("adDeleted");

      await invalidateAll();
    },

    onError: (error) => {
      toast.error(error, "deleteAdvertising");
    },
  });

  const expenses = data?.expenses ?? [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const hasFilters =
    filters.from !== "" || filters.to !== "" || filters.platform !== ALL_PLATFORMS;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(expense: AdvertisingExpense) {
    setEditing(expense);
    setFormOpen(true);
  }

  function handleDelete(expense: AdvertisingExpense) {
    const confirmed = window.confirm(
      t("deleteConfirm", { amount: formatCurrency(expense.amount, locale) }),
    );

    if (confirmed) {
      deleteMutation.mutate(expense._id);
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-400 space-y-7"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title={t("title")}
          description={t("description")}
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setWindsorOpen(true)}
                className="w-full sm:w-auto"
              >
                <Sparkles className="size-4" />
                {t("windsor.sync")}
              </Button>

              <Button
                type="button"
                onClick={openCreate}
                className="w-full sm:w-auto"
              >
                <Plus className="size-4" />
                {t("add")}
              </Button>
            </>
          }
        />
      </motion.div>


      {/* Summary */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-3"
      >
        <SummaryTile
          label={t("totalSpend")}
          value={formatCurrency(summary?.totalSpend ?? 0, locale)}
          icon={Banknote}
          tone="primary"
        />

        <SummaryTile
          label={t("expenseCount")}
          value={formatNumber(summary?.expenseCount ?? 0, locale)}
          icon={Receipt}
          tone="default"
        />

        <SummaryTile
          label={t("averageExpense")}
          value={formatCurrency(summary?.averageExpense ?? 0, locale)}
          icon={Megaphone}
          tone="default"
        />
      </motion.div>

      {/* Ad performance - the decision card */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-lg border border-border shadow-none">
          <CardHeader className="gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                {t("performanceTitle")}
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {t("performanceDescription")}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              {t("allAvailableNote")}
            </p>
          </CardHeader>

          <CardContent className="p-5">
            {insightsLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {tc("loading")}
              </p>
            ) : insightsError || !insights ? (
              <ErrorState
                description={apiErrorMessage(
                  insightsErrorDetail,
                  te,
                  te("fetchInsights"),
                )}
                onRetry={() => refetchInsights()}
              />
            ) : (
              <AdPerformance
                insights={insights}
                onFunnelRangeChange={setFunnelRange}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-lg border border-border shadow-none">
          <CardHeader className="gap-1 border-b border-border">
            <CardTitle className="text-base font-semibold">
              {t("filters")}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="ads-from">{t("from")}</Label>
                <Input
                  id="ads-from"
                  type="date"
                  value={draft.from}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      from: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ads-to">{t("to")}</Label>
                <Input
                  id="ads-to"
                  type="date"
                  value={draft.to}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      to: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ads-platform">{t("platform")}</Label>
                <Select
                  value={draft.platform}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      platform: value ?? ALL_PLATFORMS,
                    }))
                  }
                >
                  <SelectTrigger id="ads-platform" className="w-full">
                    <SelectValue placeholder={t("allPlatforms")} />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={ALL_PLATFORMS}>
                      {t("allPlatforms")}
                    </SelectItem>

                    {SUGGESTED_PLATFORMS.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}

                    {(summary?.byPlatform ?? [])
                      .filter(
                        (row) =>
                          !SUGGESTED_PLATFORMS.includes(
                            row.platform as (typeof SUGGESTED_PLATFORMS)[number],
                          ),
                      )
                      .map((row) => (
                        <SelectItem key={row.platform} value={row.platform}>
                          {row.platform}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setFilters(draft);
                    setPage(1);
                  }}
                >
                  {t("filters")}
                </Button>

                {hasFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setDraft(EMPTY_FILTERS);
                      setFilters(EMPTY_FILTERS);
                      setPage(1);
                    }}
                  >
                    {t("clearFilters")}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* List */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden rounded-lg border border-border shadow-none">
          <CardHeader className="gap-1 border-b border-border">
            <CardTitle className="text-base font-semibold">
              {t("listTitle")}
            </CardTitle>

            {summary && (
              <p className="text-sm text-muted-foreground">
                {t("totalLabel", {
                  count: formatNumber(summary.expenseCount, locale),
                })}
              </p>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                {tc("loading")}
              </p>
            ) : isError ? (
              <div className="p-6">
                <ErrorState
                  description={apiErrorMessage(
                    error,
                    te,
                    te("fetchAdvertising"),
                  )}
                  onRetry={() => refetch()}
                />
              </div>
            ) : expenses.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title={hasFilters ? t("noMatch") : t("empty")}
                description={hasFilters ? undefined : t("emptyDescription")}
                action={
                  hasFilters ? undefined : (
                    <Button type="button" variant="outline" onClick={openCreate}>
                      <Plus className="size-4" />
                      {t("add")}
                    </Button>
                  )
                }
              />
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-[minmax(120px,1fr)_minmax(140px,1.4fr)_minmax(110px,1fr)_minmax(110px,1fr)_minmax(150px,2fr)_88px] items-center gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span>{t("date")}</span>
                    <span>{t("platform")}</span>
                    <span>{t("campaign")}</span>
                    <span className="text-end">{t("amount")}</span>
                    <span>{t("note")}</span>
                    <span>{t("actions")}</span>
                  </div>

                  {expenses.map((expense) => (
                    <div
                      key={expense._id}
                      className="grid grid-cols-[minmax(120px,1fr)_minmax(140px,1.4fr)_minmax(110px,1fr)_minmax(110px,1fr)_minmax(150px,2fr)_88px] items-center gap-4 border-b border-border px-6 py-4 last:border-b-0"
                    >
                      <span className="text-sm tabular-nums">
                        {formatDate(expense.date, locale)}
                      </span>

                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {expense.platform}
                        </span>

                        <SourceBadge source={expense.source} />
                      </span>

                      <span className="truncate text-sm text-muted-foreground">
                        {expense.campaign || "-"}
                      </span>

                      <span className="text-end text-sm font-semibold tabular-nums">
                        {formatCurrency(expense.amount, locale)}
                      </span>

                      <span className="truncate text-sm text-muted-foreground">
                        {expense.note || "-"}
                      </span>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(expense)}
                          aria-label={t("edit")}
                        >
                          <Pencil className="size-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(expense)}
                          disabled={deleteMutation.isPending}
                          aria-label={t("delete")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile */}
                <ul className="divide-y divide-border md:hidden">
                  {expenses.map((expense) => (
                    <li key={expense._id} className="space-y-2 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold">
                              {expense.platform}
                            </p>

                            <SourceBadge source={expense.source} />
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {formatDate(expense.date, locale)}
                            {expense.campaign ? ` - ${expense.campaign}` : ""}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <span className="text-sm font-semibold tabular-nums">
                            {formatCurrency(expense.amount, locale)}
                          </span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(expense)}
                            aria-label={t("edit")}
                          >
                            <Pencil className="size-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(expense)}
                            aria-label={t("delete")}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>

                      {expense.note && (
                        <p className="text-xs text-muted-foreground">
                          {expense.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {(pagination?.totalPages ?? 0) > 1 && (
        <motion.div variants={itemVariants}>
          <Pagination
            currentPage={pagination?.currentPage ?? page}
            totalPages={pagination?.totalPages ?? 1}
            hasPreviousPage={pagination?.hasPreviousPage ?? false}
            hasNextPage={pagination?.hasNextPage ?? false}
            onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
            onNext={() => setPage((current) => current + 1)}
          />
        </motion.div>
      )}

      <AdvertisingExpenseForm
        open={formOpen}
        expense={editing}
        onOpenChange={setFormOpen}
      />

      <WindsorSyncDialog
        open={windsorOpen}
        onOpenChange={setWindsorOpen}
      />
    </motion.div>
  );
}

/**
 * Manual / Windsor origin. A missing `source` means the row predates the
 * field, so it is manual.
 */
function SourceBadge({ source }: { source?: "manual" | "windsor" }) {
  const t = useTranslations("advertising");
  const isWindsor = source === "windsor";

  return (
    <span
      className={cn(
        "shrink-0 rounded-sm border px-1.5 py-0.5 text-[0.65rem] font-medium",
        isWindsor
          ? "border-primary/40 text-primary"
          : "border-border text-muted-foreground",
      )}
    >
      {isWindsor ? t("source.windsor") : t("source.manual")}
    </span>
  );
}

/** null renders as "-", never "NaN" or "Infinity". */
function nullableMoney(value: number | null, locale: "en" | "ar"): string {
  return value === null ? "-" : formatCurrency(value, locale);
}

/** Store name for display. Only the two real stores exist. */
function storeLabel(store: string): string {
  if (store === "viora") return "Viora";
  if (store === "trendora") return "Trendora";

  return store;
}

/** null (no data / divide by zero) renders as an em dash, never NaN. */
function Money({
  value,
  locale,
}: {
  value: number | null;
  locale: "en" | "ar";
}) {
  return (
    <span className="text-base font-semibold tabular-nums">
      {nullableMoney(value, locale)}
    </span>
  );
}

function PerformanceMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      <p className="mt-1">{value}</p>

      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const VERDICT_TONE: Record<
  AdVerdict,
  { border: string; text: string }
> = {
  scale: { border: "border-s-success", text: "text-success" },
  watch: { border: "border-s-warning", text: "text-warning" },
  losing: { border: "border-s-destructive", text: "text-destructive" },
  noData: { border: "border-s-border", text: "text-muted-foreground" },
};

const VERDICT_ICON: Record<AdVerdict, typeof TrendingUp> = {
  scale: TrendingUp,
  watch: TrendingUp,
  losing: TrendingDown,
  noData: Megaphone,
};

/**
 * Ad performance.
 *
 * Two separate blocks, because they answer different questions:
 *
 *  1. WINDSOR (all available data) - what the ads did across BOTH stores.
 *     No 7/30 limit here; the period shown is the period Windsor returned.
 *  2. FUNNEL (period-scoped) - ads vs delivered orders and profit, where
 *     the message -> order rate is a PERIOD-LEVEL ratio, NOT attribution.
 */
function AdPerformance({
  insights,
  onFunnelRangeChange,
}: {
  insights: AdInsights;
  onFunnelRangeChange: (value: 7 | 30) => void;
}) {
  const t = useTranslations("advertising");
  const locale = useLocale() as "en" | "ar";

  const { windsor, manual, total, funnel, campaigns } = insights;
  const period =
    insights.availablePeriod.from && insights.availablePeriod.to
      ? `${insights.availablePeriod.from} → ${insights.availablePeriod.to}`
      : null;

  const tone = VERDICT_TONE[funnel.verdict];
  const VerdictIcon = VERDICT_ICON[funnel.verdict];

  return (
    <div className="space-y-6">
      {/* ---------- 1. Windsor, all available data ---------- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">{t("windsorSection")}</p>

          <p className="text-xs text-muted-foreground">
            {period
              ? t("availablePeriod", { period })
              : t("noWindsorData")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
          <PerformanceMetric
            label={t("totalAdSpend")}
            value={<Money value={total.adSpend} locale={locale} />}
            hint={t("spendSplit", {
              windsor: formatCurrency(windsor.spend, locale),
              manual: formatCurrency(manual.spend, locale),
            })}
          />

          <PerformanceMetric
            label={t("windsorSource")}
            value={<Money value={windsor.sourceSpend} locale={locale} />}
            hint={t("convertedAt", {
              currency: insights.sourceCurrency,
              rate: insights.rate,
            })}
          />

          <PerformanceMetric
            label={t("messages")}
            value={
              <span className="text-base font-semibold tabular-nums">
                {formatNumber(windsor.messages, locale)}
              </span>
            }
            hint={t("clicksHint", {
              clicks: formatNumber(windsor.clicks, locale),
            })}
          />

          <PerformanceMetric
            label={t("costPerMessage")}
            value={<Money value={total.costPerMessage} locale={locale} />}
            hint={t("costPerMessageHint", {
              spend: formatCurrency(total.adSpend, locale),
            })}
          />
        </div>

        {/* Source / ad-account breakdown */}
        {insights.connections.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold">{t("sourcesTitle")}</p>

            <div className="grid grid-cols-[minmax(120px,1.4fr)_minmax(100px,1fr)_minmax(80px,1fr)_minmax(70px,1fr)_minmax(80px,1fr)] items-center gap-3 border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>{t("source")}</span>
              <span className="text-end">{t("spend")}</span>
              <span className="text-end">{t("messages")}</span>
              <span className="text-end">{t("clicks")}</span>
              <span className="text-end">{t("costPerMessage")}</span>
            </div>

            {insights.connections.map((conn) => (
              <ConnectionGroup key={conn.id} connection={conn} insights={insights} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- 2. Period funnel ---------- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">{t("funnelTitle")}</p>

          <div
            className="inline-flex rounded-md border border-border p-0.5"
            role="group"
            aria-label={t("funnelTitle")}
          >
            {([7, 30] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onFunnelRangeChange(value)}
                aria-pressed={funnel.range === value}
                className={cn(
                  "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                  funnel.range === value
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t("days", { count: value })}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
          <PerformanceMetric
            label={t("spend")}
            value={<Money value={funnel.adSpend} locale={locale} />}
            hint={t("spendSplit", {
              windsor: formatCurrency(funnel.windsorSpend, locale),
              manual: formatCurrency(funnel.manualSpend, locale),
            })}
          />

          <PerformanceMetric
            label={t("deliveredOrders")}
            value={
              <span className="text-base font-semibold tabular-nums">
                {formatNumber(funnel.deliveredOrders, locale)}
              </span>
            }
            hint={t("costPerOrder", {
              amount: nullableMoney(funnel.costPerOrder, locale),
            })}
          />

          <PerformanceMetric
            label={t("messageToOrder")}
            value={<Money value={funnel.messageToOrderRate} locale={locale} />}
            hint={t("messageToOrderHint", {
              messages: formatNumber(funnel.messages, locale),
              orders: formatNumber(funnel.deliveredOrders, locale),
            })}
          />

          <PerformanceMetric
            label={t("profitPerOrder")}
            value={
              <Money value={funnel.profitPerOrderBeforeAds} locale={locale} />
            }
            hint={t("breakEvenMessage", {
              amount: nullableMoney(funnel.breakEvenCostPerMessage, locale),
            })}
          />
        </div>

        {/* Verdict + the single next step */}
        <div className={cn("border-s-4 ps-4 pe-4 py-3", tone.border)}>
          <p
            className={cn(
              "flex items-center gap-2 text-sm font-semibold",
              tone.text,
            )}
          >
            <VerdictIcon className="size-4 shrink-0" />
            {t(`verdict.${funnel.verdict}`)}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {t(`verdictNext.${funnel.verdict}`)}
          </p>

          {funnel.verdict === "noData" && funnel.verdictReason && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t(`verdictReason.${funnel.verdictReason}`)}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{t("profitBasisNote")}</p>

        <p className="text-xs text-muted-foreground">
          {t("currencyBasisNote", {
            rate: insights.rate,
            currency: insights.sourceCurrency,
          })}
        </p>

        <p className="text-xs text-muted-foreground">{t("noAttributionNote")}</p>
      </section>

      {/* ---------- Campaigns ---------- */}
      {campaigns.length > 0 && (
        <section>
          <p className="mb-2 text-sm font-semibold">{t("campaigns")}</p>

          <div className="grid grid-cols-[minmax(140px,2fr)_minmax(110px,1.4fr)_minmax(80px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(90px,1fr)] items-center gap-3 border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>{t("campaign")}</span>
            <span>{t("source")}</span>
            <span className="text-end">{t("spend")}</span>
            <span className="text-end">{t("messages")}</span>
            <span className="text-end">{t("clicks")}</span>
            <span className="text-end">{t("costPerMessage")}</span>
          </div>

          {campaigns.map((campaign) => (
            <div
              key={`${campaign.store}|${campaign.accountId}|${campaign.campaign}`}
              className={cn(
                "grid grid-cols-[minmax(140px,2fr)_minmax(110px,1.4fr)_minmax(80px,1fr)_minmax(70px,1fr)_minmax(70px,1fr)_minmax(90px,1fr)] items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0",
                campaign.flagged && "bg-surface",
              )}
            >
              <span className="truncate text-sm" title={campaign.campaign}>
                {campaign.campaign}
              </span>

              <span
                className="truncate text-xs text-muted-foreground"
                title={campaign.accountName}
              >
                {storeLabel(campaign.store)} ·{" "}
                {campaign.accountName || campaign.accountId}
              </span>

              <span className="text-end text-sm tabular-nums">
                {formatCurrency(campaign.spend, locale)}
              </span>

              <span className="text-end text-sm tabular-nums">
                {formatNumber(campaign.messages, locale)}
              </span>

              <span className="text-end text-sm tabular-nums">
                {formatNumber(campaign.clicks, locale)}
              </span>

              <span
                className={cn(
                  "text-end text-sm font-medium tabular-nums",
                  campaign.flagged ? "text-destructive" : "text-text",
                )}
              >
                {campaign.costPerMessage === null
                  ? "-"
                  : formatCurrency(campaign.costPerMessage, locale)}
              </span>
            </div>
          ))}

          {campaigns.some((c) => c.flagged) && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("campaignFlagged")}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

/** All ad accounts belonging to one Windsor connection. */
function ConnectionGroup({
  connection,
  insights,
}: {
  connection: AdInsights["connections"][number];
  insights: AdInsights;
}) {
  const t = useTranslations("advertising");
  const locale = useLocale() as "en" | "ar";

  const sources = insights.sources.filter(
    (s) => s.connectionId === connection.id,
  );

  if (sources.length === 0) return null;

  return (
    <>
      <p className="bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
        {connection.label}
      </p>

      {sources.map((source) => (
        <div
          key={`${source.connectionId}|${source.accountId}`}
          className="grid grid-cols-[minmax(120px,1.4fr)_minmax(100px,1fr)_minmax(80px,1fr)_minmax(70px,1fr)_minmax(80px,1fr)] items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm">
              {source.accountName || source.accountId}
            </span>

            {source.from ? (
              <span className="block text-xs text-muted-foreground">
                {t("availablePeriod", {
                  period: `${source.from} → ${source.to}`,
                })}
              </span>
            ) : null}
          </span>

          <span className="text-end text-sm font-medium tabular-nums">
            {formatCurrency(source.spend, locale)}
          </span>

          <span className="text-end text-sm tabular-nums">
            {formatNumber(source.messages, locale)}
          </span>

          <span className="text-end text-sm tabular-nums">
            {formatNumber(source.clicks, locale)}
          </span>

          <span className="text-end text-sm tabular-nums">
            {source.costPerMessage === null
              ? "-"
              : formatCurrency(source.costPerMessage, locale)}
          </span>
        </div>
      ))}
    </>
  );
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Banknote;
  tone: "primary" | "default";
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-lg border border-border bg-card px-5 py-5">
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-md",
          tone === "primary"
            ? "bg-primary text-primary-foreground"
            : "border bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>

        <p className="mt-1 text-2xl font-bold leading-none tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}
