"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getCampaignCatalog, type AdAccountSummary } from "@/lib/api";
import { Link } from "@/i18n/navigation";

const PAGE_SIZE = 10;

/**
 * One business advertising account - Viora, Trendora — Facebook or
 * Trendora — Instagram - with its ALL-time totals and paginated campaigns.
 *
 * Campaigns are always grouped inside their account card, so spend from
 * different accounts is never mixed into one confusing table.
 */
export default function AdvertisingAccountCard({
  account,
}: {
  account: AdAccountSummary;
}) {
  const t = useTranslations("advertising");
  const locale = useLocale() as "en" | "ar";
  const [page, setPage] = useState(1);
  const campaignsQuery = useQuery({
    queryKey: ["campaignCatalog", account.key, page, PAGE_SIZE],
    queryFn: () =>
      getCampaignCatalog({
        page,
        limit: PAGE_SIZE,
        accountKey: account.key,
      }),
    enabled: account.configured && account.campaignCount > 0,
  });
  const campaignGroups = campaignsQuery.data
    ? (
        [
          "active",
          "paused",
          "historical",
          "deleted",
          "unverified",
          "other",
        ] as const
      )
        .map((state) => ({
          state,
          campaigns: campaignsQuery.data.campaigns.filter(
            (campaign) => campaign.catalogState === state,
          ),
        }))
        .filter((group) => group.campaigns.length > 0)
    : [];

  return (
    <Card className="flex flex-col rounded-lg border border-border shadow-none">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-base font-semibold">
          {t(`accounts.${account.key}`)}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5 p-5">
        {!account.configured ? (
          <p className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            {t("accountNotMapped")}
          </p>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("totalSpend")}
              </p>

              <p className="mt-1 text-2xl font-bold tabular-nums">
                {formatCurrency(account.spend, locale)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
              <AccountStat
                label={t("campaigns")}
                value={formatNumber(account.campaignCount, locale)}
              />
              <AccountStat
                label={t("messages")}
                value={formatNumber(account.messages, locale)}
              />
              <AccountStat
                label={t("clicks")}
                value={formatNumber(account.clicks, locale)}
              />
            </div>
            {account.campaignCount > 0 && (
              <div
                aria-label={t("campaignStateSummary")}
                className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"
              >
                {(
                  [
                    "active",
                    "paused",
                    "historical",
                    "deleted",
                    "unverified",
                    "other",
                  ] as const
                )
                  .filter((state) => account.campaignStateCounts[state] > 0)
                  .map((state) => (
                    <span key={state}>
                      {t(`campaignState.${state}`)}:{" "}
                      {formatNumber(account.campaignStateCounts[state], locale)}
                    </span>
                  ))}
              </div>
            )}

            <div className="flex flex-1 flex-col">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("campaigns")}
              </p>

              {account.campaignCount === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  {t("noCampaigns")}
                </p>
              ) : campaignsQuery.isLoading ? (
                <p className="py-4 text-sm text-muted-foreground">
                  {t("campaignsLoading")}
                </p>
              ) : campaignsQuery.isError || !campaignsQuery.data ? (
                <div className="flex items-center justify-between gap-3 py-4 text-sm text-destructive">
                  <span>{t("campaignsError")}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void campaignsQuery.refetch()}
                  >
                    {t("retry")}
                  </Button>
                </div>
              ) : campaignsQuery.data.campaigns.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {campaignGroups.map(({ state, campaigns }) => (
                      <section key={state}>
                        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t(`campaignState.${state}`)}
                        </h3>
                        <ul className="divide-y divide-border">
                          {campaigns.map((campaign) => (
                            <li key={campaign.key}>
                              <Link
                                href={`/advertising/campaigns/${encodeURIComponent(campaign.key)}`}
                                className="flex items-start justify-between gap-3 rounded-md py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <div className="min-w-0">
                                  <p
                                    className="truncate text-sm font-medium"
                                    title={campaign.campaign}
                                  >
                                    {campaign.campaign || "—"}
                                  </p>
                                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                                    {t("messagesAndClicks", {
                                      messages: formatNumber(campaign.messages, locale),
                                      clicks: formatNumber(campaign.clicks, locale),
                                    })}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {t(`providerState.${campaign.providerState}`)}
                                    {campaign.status
                                      ? ` · ${campaign.status.replaceAll("_", " ")}`
                                      : ""}
                                    {campaign.configuredStatus
                                      ? ` · ${campaign.configuredStatus.replaceAll("_", " ")}`
                                      : ""}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {t("allocationBreakdown", {
                                      allocated: formatCurrency(
                                        campaign.allocatedSpend,
                                        locale,
                                      ),
                                      unallocated: formatCurrency(
                                        campaign.unallocatedSpend,
                                        locale,
                                      ),
                                    })}
                                  </p>
                                </div>
                                <div className="shrink-0 text-end">
                                  <p className="text-sm font-semibold tabular-nums">
                                    {formatCurrency(campaign.spend, locale)}
                                  </p>
                                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                                    {t("cpmShort")}{" "}
                                    {campaign.costPerMessage === null
                                      ? "—"
                                      : formatCurrency(
                                          campaign.costPerMessage,
                                          locale,
                                        )}
                                  </p>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                  <Pagination
                    currentPage={campaignsQuery.data.pagination.currentPage}
                    totalPages={campaignsQuery.data.pagination.totalPages}
                    hasNextPage={campaignsQuery.data.pagination.hasNextPage}
                    hasPreviousPage={campaignsQuery.data.pagination.hasPreviousPage}
                    onFirst={() => setPage(1)}
                    onPrevious={() => setPage((current) => current - 1)}
                    onNext={() => setPage((current) => current + 1)}
                    onLast={() => setPage(campaignsQuery.data.pagination.totalPages)}
                    isFetching={campaignsQuery.isFetching}
                  />
                </>
              ) : (
                <p className="py-4 text-sm text-muted-foreground">
                  {t("noCampaigns")}
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AccountStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-3 py-2.5">
      <p className="text-[0.7rem] font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}