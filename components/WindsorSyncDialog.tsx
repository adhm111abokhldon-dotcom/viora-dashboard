"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { RefreshCw, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { previewWindsorSync, syncWindsorAds, type WindsorPreview } from "@/lib/api";
import { useAppToast } from "@/lib/toast";
import { useInvalidateAll } from "@/lib/queries";
import { formatCurrency, formatNumber } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

/**
 * Windsor (Meta) sync.
 *
 * There is NO date picker: Windsor is asked for its FULL available period and
 * the dialog reports the period it actually returned. Two steps on purpose -
 * Preview (read-only) then Confirm - and the dialog only closes once the
 * mutation settles.
 */
export default function WindsorSyncDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("advertising.windsor");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const locale = useLocale() as "en" | "ar";

  const toast = useAppToast();
  const invalidateAll = useInvalidateAll();

  const [preview, setPreview] = useState<WindsorPreview | null>(null);

  const previewMutation = useMutation({
    mutationFn: () => previewWindsorSync(),

    onSuccess: (result) => {
      setPreview(result);
    },

    onError: (error) => {
      setPreview(null);
      toast.error(error, "previewWindsor");
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => syncWindsorAds(),

    onSuccess: async () => {
      toast.success("windsorSyncDone");

      await invalidateAll();

      setPreview(null);
      onOpenChange(false);
    },

    onError: (error) => {
      toast.error(error, "syncWindsor");
    },
  });

  const isPending = previewMutation.isPending || syncMutation.isPending;

  function handleOpenChange(next: boolean) {
    /* Never allow closing mid-flight, so the outcome is always reported. */
    if (isPending) return;

    if (!next) setPreview(null);

    onOpenChange(next);
  }

  const period =
    preview?.availableFrom && preview?.availableTo
      ? `${preview.availableFrom} → ${preview.availableTo}`
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-lg border border-border bg-card"
        {...(isPending ? { onEscapeKeyDown: (e: Event) => e.preventDefault() } : {})}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            {t("title")}
          </DialogTitle>

          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Per-connection / per-account summary */}
          {preview && (
            <>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
                <div className="bg-card px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    {t("totalSpendUsd")}
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatCurrency(preview.totals.spend, locale)}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {t("totalSpendAed", {
                      amount: formatNumber(preview.totals.sourceSpend, locale),
                      currency: preview.currency,
                    })}
                  </p>
                </div>

                <div className="bg-card px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">{t("messages")}</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatNumber(preview.totals.messages, locale)}
                  </p>
                </div>

                <div className="bg-card px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">{t("clicks")}</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatNumber(preview.totals.clicks, locale)}
                  </p>
                </div>

                <div className="bg-card px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">{t("willAdd")}</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatNumber(preview.created, locale)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {period
                  ? t("availablePeriod", { period })
                  : t("noPeriod")}
              </p>

              <p className="text-xs text-muted-foreground">
                {t("currencyNote", {
                  currency: preview.currency,
                  rate: preview.rate,
                  amount: formatNumber(preview.totals.sourceSpend, locale),
                })}
              </p>

              {/* One block per Windsor connection, one row per ad account */}
              {preview.sources.map((source) => (
                <div
                  key={`${source.connectionId}|${source.accountId}`}
                  className="rounded-md border border-border"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-3 py-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {source.connectionLabel}
                    </p>

                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(source.spend, locale)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
                    <span className="min-w-0 truncate text-sm">
                      {source.accountName || source.accountId}
                    </span>

                    <span className="text-xs text-muted-foreground tabular-nums">
                      {source.empty
                        ? t("noDataForAccount")
                        : `${formatNumber(source.messages, locale)} ${t("messages").toLowerCase()} · ${formatNumber(source.clicks, locale)} ${t("clicks").toLowerCase()}`}
                    </span>
                  </div>
                </div>
              ))}

              {preview.errors.length > 0 && (
                <ul className="space-y-1" role="alert">
                  {preview.errors.map((err) => (
                    <li key={err.connectionId} className="text-sm text-destructive">
                      {t("connectionError", { message: err.message })}
                    </li>
                  ))}
                </ul>
              )}

              {preview.manual.count > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("manualCoexist", {
                    count: formatNumber(preview.manual.count, locale),
                    amount: formatCurrency(preview.manual.total, locale),
                  })}
                </p>
              )}

              {preview.rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noRows")}</p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                  <div className="sticky top-0 grid grid-cols-[minmax(90px,1fr)_minmax(140px,2fr)_minmax(90px,1fr)_minmax(70px,1fr)] items-center gap-3 border-b border-border bg-card px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span>{t("date")}</span>
                    <span>{t("campaign")}</span>
                    <span className="text-end">{t("spend")}</span>
                    <span className="text-end">{t("messages")}</span>
                  </div>

                  {preview.rows.map((row) => (
                    <div
                      key={`${row.store}|${row.accountId}|${row.date}|${row.campaign}`}
                      className="grid grid-cols-[minmax(90px,1fr)_minmax(140px,2fr)_minmax(90px,1fr)_minmax(70px,1fr)] items-center gap-3 border-b border-border px-3 py-2 last:border-b-0"
                    >
                      <span className="text-xs tabular-nums">{row.date}</span>

                      <span className="truncate text-xs" title={row.campaign}>
                        {row.campaign}
                      </span>

                      <span
                        className="text-end text-xs font-medium tabular-nums"
                        title={t("rowAed", {
                          amount: formatNumber(row.sourceSpend, locale),
                          currency: preview.currency,
                        })}
                      >
                        {formatCurrency(row.spend, locale)}
                      </span>

                      <span className="text-end text-xs tabular-nums">
                        {formatNumber(row.messages, locale)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!preview && !previewMutation.isPending && (
            <p className="text-sm text-muted-foreground">
              {t("fullPeriodHint")}
            </p>
          )}

          {previewMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {apiErrorMessage(previewMutation.error, te, te("previewWindsor"))}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {tc("cancel")}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPreview(null);
              previewMutation.mutate();
            }}
            disabled={isPending}
          >
            <RefreshCw
              className={cn("size-4", previewMutation.isPending && "animate-spin")}
            />
            {t("preview")}
          </Button>

          <Button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={isPending || !preview || preview.rows.length === 0}
          >
            {syncMutation.isPending ? tc("loading") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
