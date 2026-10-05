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
  Trash2,
} from "lucide-react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
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
import { Pagination } from "@/components/ui/Pagination";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import PageHeader from "@/components/PageHeader";
import { containerVariants, itemVariants } from "@/lib/motion";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  deleteAdvertisingExpense,
  getAdvertisingExpenses,
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

  const queryClient = useQueryClient();

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

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["advertising"] });

  const deleteMutation = useMutation({
    mutationFn: deleteAdvertisingExpense,
    onSuccess: invalidate,
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
            <Button type="button" onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="size-4" />
              {t("add")}
            </Button>
          }
        />
      </motion.div>

      {/* Delete error */}
      {deleteMutation.isError && (
        <motion.div variants={itemVariants}>
          <div
            className="border-s-4 border-s-destructive bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground"
            role="alert"
          >
            {apiErrorMessage(deleteMutation.error, te, te("deleteAdvertising"))}
          </div>
        </motion.div>
      )}

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

                      <span className="truncate text-sm font-medium">
                        {expense.platform}
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
                          <p className="truncate text-sm font-semibold">
                            {expense.platform}
                          </p>

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
        onSaved={invalidate}
      />
    </motion.div>
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
