"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  deleteAdvertisingExpense,
  getAdPerformance,
  getAdSummary,
  getAdvertisingExpenses,
  type AdAccountSummary,
  type AdvertisingExpense,
} from "@/lib/api";
import { Pagination } from "@/components/ui/Pagination";
import ProductsLoading from "@/components/ProductsLoading";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import AdvertisingAccountCard from "@/components/AdvertisingAccountCard";
import AdvertisingExpenseForm from "@/components/AdvertisingExpenseForm";
import WindsorSyncDialog from "@/components/WindsorSyncDialog";
import { containerVariants, itemVariants } from "@/lib/motion";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import { useAppToast } from "@/lib/toast";
import { useInvalidateAll } from "@/lib/queries";
const PAGE_SIZE = 10;

/** Colour scheme for the Ads performance verdict badge. */
const VERDICT_BADGE_CLASSES: Record<string, string> = {
  scale:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  watch: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  losing: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400",
  noData: "border-border bg-muted text-muted-foreground",
};

/**
 * Business-oriented Advertising overview.
 *
 * Data model:
 *   - `adSummary` (GET /advertising/insights) owns every headline number:
 *     the grand total, each business account (Viora / Trendora - Facebook /
 *     Trendora - Instagram) and the manual break-out. It always covers ALL
 *     available data - there are no date windows and page-2 never changes it.
 *   - the expense list (GET /advertising) owns the detailed records only:
 *     manual entries plus Windsor rows, newest first, user-controlled
 *     filters + server-side pagination.
 */
export default function AdvertisingPage() {
  const t = useTranslations("advertising");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const locale = useLocale() as "en" | "ar";

  const toast = useAppToast();
  const invalidateAll = useInvalidateAll();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showSync, setShowSync] = useState(false);
  const [editing, setEditing] = useState<AdvertisingExpense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] =
    useState<AdvertisingExpense | null>(null);
  // All history is the default; shorter analysis windows are user-selected.
  const [range, setRange] = useState<"all" | 7 | 30>("all");

  // Debounced search: every keystroke resets to page 1 only once settled.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const summaryQuery = useQuery({
    queryKey: ["adSummary"],
    queryFn: () => getAdSummary(),
    placeholderData: keepPreviousData,
  });

  // Period-scoped verdict + funnel. keepPreviousData keeps the previous
  // window on screen while the new one loads, so the verdict badge never
  // flickers empty when the owner flips 7 <-> 30 days.
  const performanceQuery = useQuery({
    queryKey: ["adPerformance", range],
    queryFn: () => getAdPerformance(range),
    placeholderData: keepPreviousData,
  });

  const listQuery = useQuery({
    // Manual records only: the API pins source=manual, so Windsor rows can
    // never leak into this table and a sync can never disturb it.
    queryKey: ["advertising", "manual", page, PAGE_SIZE, search],
    queryFn: () =>
      getAdvertisingExpenses({
        page,
        limit: PAGE_SIZE,
        source: "manual",
        search: search || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => deleteAdvertisingExpense(expenseId),
    onSuccess: async () => {
      toast.success("adDeleted");
      setExpenseToDelete(null);
      await invalidateAll();
      // The row we removed may have been the only one on this page.
      // Step back so the list never sits on an empty page.
      const total = listQuery.data?.pagination.totalExpenses;
      if (typeof total === "number") {
        const lastPage = Math.max(1, Math.ceil((total - 1) / PAGE_SIZE));
        setPage((current) => Math.min(current, lastPage));
      }
    },
    onError: (error) => {
      toast.error(error, "deleteAdvertising");
    },
  });

  const summary = summaryQuery.data;
  const perf = performanceQuery.data;
  const expenses = useMemo(() => listQuery.data?.expenses ?? [], [listQuery.data]);
  const pagination = listQuery.data?.pagination;
  const hasFilters = search !== "";

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(expense: AdvertisingExpense) {
    setEditing(expense);
    setShowForm(true);
  }

  if (summaryQuery.isLoading) {
    return <ProductsLoading />;
  }

  if (summaryQuery.isError) {
    return (
      <div className="mx-auto w-full max-w-400 space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <ErrorState
          description={apiErrorMessage(summaryQuery.error, te, te("fetchInsights"))}
          onRetry={() => summaryQuery.refetch()}
        />
      </div>
    );
  }

  const accounts: AdAccountSummary[] = summary?.accounts ?? [];
  const manualSpend = summary?.manual.spend ?? 0;
  const manualCount = summary?.manual.count ?? 0;
  const grandTotal = summary?.grandTotal ?? 0;

  // Headline numbers always come from the summary (ALL data); this list
  // holds only the current page of manual records.

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-400 space-y-6"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title={t("title")}
          description={t("description")}
          actions={
            <>
              <Button variant="outline" onClick={() => setShowSync(true)}>
                <RefreshCw className="size-4" />
                {t("windsor.sync")}
              </Button>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                {t("add")}
              </Button>
            </>
          }
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="shadow-none">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("totalAdSpend")}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                {formatCurrency(grandTotal, locale)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("summaryNote")}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
              {accounts.map((account) => (
                <div key={account.key} className="bg-card px-4 py-3">
                  <dt className="text-xs text-muted-foreground">
                    {t(`accounts.${account.key}`)}
                  </dt>
                  <dd className="mt-1 text-base font-semibold tabular-nums">
                    {formatCurrency(account.spend, locale)}
                  </dd>
                </div>
              ))}
              <div className="bg-card px-4 py-3">
                <dt className="text-xs text-muted-foreground">
                  {t("manualTitle")}
                </dt>
                <dd className="mt-1 text-base font-semibold tabular-nums">
                  {formatCurrency(manualSpend, locale)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </motion.div>

      {/* Period verdict: is the ad spend paying for itself? 7/30 window. */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                {t("performanceTitle")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("performanceDescription")}
              </p>
            </div>
            <div
              role="group"
              aria-label={t("performanceTitle")}
              className="inline-flex rounded-md border border-border p-0.5"
            >
              {(["all", 7, 30] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={range === value ? "secondary" : "ghost"}
                  onClick={() => setRange(value)}
                >
                  {value === "all"
                    ? t("allAvailableData")
                    : t("days", { count: value })}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceQuery.isPending ? (
              <p className="text-sm text-muted-foreground">{tc("loading")}</p>
            ) : performanceQuery.isError || !perf ? (
              <ErrorState
                description={apiErrorMessage(
                  performanceQuery.error,
                  te,
                  te("fetchInsights"),
                )}
                onRetry={() => performanceQuery.refetch()}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      VERDICT_BADGE_CLASSES[perf.verdict.type] ??
                      VERDICT_BADGE_CLASSES.noData
                    }`}
                  >
                    {t(`verdict.${perf.verdict.type}`)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {perf.range === "all"
                      ? t("allAvailableData")
                      : t("days", { count: perf.range })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {perf.verdict.reason
                    ? t(`verdictReason.${perf.verdict.reason}`)
                    : t(`verdictNext.${perf.verdict.type}`)}
                </p>
                <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
                  <li className="tabular-nums">
                    {t("costPerOrder", {
                      amount:
                        perf.verdict.costPerOrder === null
                          ? "—"
                          : formatCurrency(perf.verdict.costPerOrder, locale),
                    })}
                  </li>
                  <li className="tabular-nums">
                    <span className="text-muted-foreground">
                      {t("profitPerOrder")}:{" "}
                    </span>
                    <span className="font-medium">
                      {perf.verdict.profitPerOrder === null
                        ? "—"
                        : formatCurrency(perf.verdict.profitPerOrder, locale)}
                    </span>
                  </li>
                  <li className="tabular-nums">
                    {t("breakEvenMessage", {
                      amount:
                        perf.verdict.adSpentPerMessage === null
                          ? "—"
                          : formatCurrency(
                              perf.verdict.adSpentPerMessage,
                              locale,
                            ),
                    })}
                  </li>
                  <li className="tabular-nums">
                    <span className="text-muted-foreground">
                      {t("deliveredOrders")}:{" "}
                    </span>
                    <span className="font-medium">
                      {formatNumber(perf.summary.deliveredOrders, locale)}
                    </span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground">
                  {t("profitBasisNote")}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Ads vs delivered orders funnel for the selected window. */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold">
              {t("funnelTitle")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {perf
                ? t("messageToOrderHint", {
                    messages: formatNumber(perf.summary.adMessages, locale),
                    orders: formatNumber(
                      perf.summary.deliveredOrders,
                      locale,
                    ),
                  })
                : "\u00A0"}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceQuery.isPending ? (
              <p className="text-sm text-muted-foreground">{tc("loading")}</p>
            ) : performanceQuery.isError || !perf ? (
              <ErrorState
                description={apiErrorMessage(
                  performanceQuery.error,
                  te,
                  te("fetchInsights"),
                )}
                onRetry={() => performanceQuery.refetch()}
              />
            ) : (
              <>
                <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
                  <div className="bg-card px-4 py-3">
                    <dt className="text-xs text-muted-foreground">
                      {t("spend")}
                    </dt>
                    <dd className="mt-1 text-base font-semibold tabular-nums">
                      {formatCurrency(perf.summary.adSpend, locale)}
                    </dd>
                  </div>
                  <div className="bg-card px-4 py-3">
                    <dt className="text-xs text-muted-foreground">
                      {t("messages")}
                    </dt>
                    <dd className="mt-1 text-base font-semibold tabular-nums">
                      {formatNumber(perf.summary.adMessages, locale)}
                    </dd>
                  </div>
                  <div className="bg-card px-4 py-3">
                    <dt className="text-xs text-muted-foreground">
                      {t("deliveredOrders")}
                    </dt>
                    <dd className="mt-1 text-base font-semibold tabular-nums">
                      {formatNumber(perf.summary.deliveredOrders, locale)}
                    </dd>
                  </div>
                  <div className="bg-card px-4 py-3">
                    <dt className="text-xs text-muted-foreground">
                      {t("messageToOrder")}
                    </dt>
                    <dd className="mt-1 text-base font-semibold tabular-nums">
                      {perf.summary.adMessages > 0 &&
                      perf.summary.deliveredOrders > 0
                        ? formatNumber(
                            perf.summary.deliveredOrders /
                              perf.summary.adMessages,
                            locale,
                            { maximumFractionDigits: 2 },
                          )
                        : "—"}
                    </dd>
                  </div>
                </dl>

                <ul className="divide-y divide-border rounded-md border border-border">
                  {perf.accounts.map((account) => {
                    const hasData = account.spend > 0 || account.messages > 0;

                    return (
                      <li
                        key={account.key}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {t(`accounts.${account.key}`)}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {hasData
                              ? `${t("messages")}: ${formatNumber(account.messages, locale)}`
                              : t("noDataForAccount")}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums">
                          {hasData ? formatCurrency(account.spend, locale) : "—"}
                        </p>
                      </li>
                    );
                  })}
                </ul>

                <p className="text-xs text-muted-foreground">
                  {t("noAttributionNote")}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("sourcesTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("allAvailableNote")}
          </p>
        </div>
      </motion.div>

      {accounts.length === 0 && manualCount === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="shadow-none">
            <EmptyState
              icon={Megaphone}
              title={t("empty")}
              description={t("emptyDescription")}
              action={<Button onClick={openCreate}>{t("add")}</Button>}
            />
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {accounts.map((account) => (
            <AdvertisingAccountCard key={account.key} account={account} />
          ))}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card className="shadow-none">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base font-semibold">
                {t("manualTitle")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("manualDescription")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">{t("manualTotal")}: </span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(manualSpend, locale)}
                </span>
              </p>
              <p className="text-muted-foreground tabular-nums">
                {t("manualCount", { count: manualCount })}
              </p>
            </div>
            <div className="relative" role="search" aria-label={t("filtersAria")}>
              <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground start-3" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="ps-9"
                aria-label={t("searchPlaceholder")}
              />
            </div>
            {hasFilters ? (
              <div>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  {t("clearFilters")}
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {listQuery.isLoading ? (
              <ProductsLoading />
            ) : listQuery.isError ? (
              <ErrorState
                description={apiErrorMessage(listQuery.error, te, te("fetchAdvertising"))}
                onRetry={() => listQuery.refetch()}
              />
            ) : expenses.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title={hasFilters ? t("noMatch") : t("manualEmpty")}
                description={hasFilters ? undefined : t("manualEmptyDescription")}
                action={
                  hasFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      {t("clearFilters")}
                    </Button>
                  ) : (
                    <Button onClick={openCreate}>{t("add")}</Button>
                  )
                }
              />
            ) : (
              <>
                <div className={listQuery.isFetching ? "opacity-60" : undefined}>
                  {/* Mobile: stacked rows. Desktop: table. */}
                  <ul className="divide-y divide-border rounded-md border border-border sm:hidden">
                    {expenses.map((row) => (
                      <li key={row._id} className="space-y-1 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">
                            {row.platform} · {formatDate(row.date, locale)}
                          </p>
                          <p className="text-sm font-semibold tabular-nums">
                            {formatCurrency(row.amount, locale)}
                          </p>
                        </div>
                        {row.campaign ? (
                          <p className="text-xs text-muted-foreground">{row.campaign}</p>
                        ) : null}
                        {row.note ? (
                          <p className="text-xs text-muted-foreground">{row.note}</p>
                        ) : null}
                        <div className="flex gap-1 pt-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                            <Pencil className="size-4" />
                            {t("edit")}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setExpenseToDelete(row)}>
                            <Trash2 className="size-4" />
                            {t("delete")}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto rounded-md border border-border sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("date")}</TableHead>
                          <TableHead>{t("amount")}</TableHead>
                          <TableHead>{t("platform")}</TableHead>
                          <TableHead>{t("campaign")}</TableHead>
                          <TableHead>{t("note")}</TableHead>
                          <TableHead className="text-end">{t("actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((row) => (
                          <TableRow key={row._id}>
                            <TableCell className="whitespace-nowrap tabular-nums">
                              {formatDate(row.date, locale)}
                            </TableCell>
                            <TableCell className="font-semibold tabular-nums">
                              {formatCurrency(row.amount, locale)}
                            </TableCell>
                            <TableCell>{row.platform}</TableCell>
                            <TableCell className="max-w-45 truncate">{row.campaign || "\u2014"}</TableCell>
                            <TableCell className="max-w-55 truncate">{row.note || "\u2014"}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1" role="group" aria-label={t("actionsAria")}>
                                <Button variant="ghost" size="sm" aria-label={t("edit")} onClick={() => openEdit(row)}>
                                  <Pencil className="size-4" />
                                  {t("edit")}
                                </Button>
                                <Button variant="ghost" size="sm" aria-label={t("delete")} onClick={() => setExpenseToDelete(row)}>
                                  <Trash2 className="size-4" />
                                  {t("delete")}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                {(pagination?.totalPages ?? 1) > 1 ? (
                  <Pagination
                    currentPage={pagination?.currentPage ?? page}
                    totalPages={pagination?.totalPages ?? 1}
                    hasPreviousPage={pagination?.hasPreviousPage ?? false}
                    hasNextPage={pagination?.hasNextPage ?? false}
                    onPrevious={() => setPage((c) => Math.max(c - 1, 1))}
                    onNext={() => setPage((c) => c + 1)}
                    onFirst={() => setPage(1)}
                    onLast={() => setPage(pagination?.totalPages ?? page)}
                    isFetching={listQuery.isFetching}
                  />
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <WindsorSyncDialog open={showSync} onOpenChange={setShowSync} />

      <AdvertisingExpenseForm
        open={showForm}
        expense={editing}
        onOpenChange={setShowForm}
      />

      {expenseToDelete ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label={t("deleteConfirm", {
            amount: formatCurrency(expenseToDelete.amount, locale),
          })}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!deleteMutation.isPending) setExpenseToDelete(null);
          }}
        >
          <div
            role="document"
            className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium">
              {t("deleteConfirm", {
                amount: formatCurrency(expenseToDelete.amount, locale),
              })}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setExpenseToDelete(null)}
                disabled={deleteMutation.isPending}
              >
                {tc("cancel")}
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(expenseToDelete._id)}
              >
                {deleteMutation.isPending ? tc("deleting") : tc("delete")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
