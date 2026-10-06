"use client";

import { useLocale, useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { AdAccountSummary } from "@/lib/api";

/**
 * One business advertising account - Viora, Trendora — Facebook or
 * Trendora — Instagram - with its ALL-time totals and its own campaigns.
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

  return (
    <Card className="flex flex-col rounded-lg border border-border shadow-none">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-base font-semibold">
          {t(`accounts.${account.key}`)}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5 p-5">
        {/* The headline number for this account. */}
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

        {/* Campaigns, highest spend first (order comes from the API). */}
        <div className="flex flex-1 flex-col">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("campaigns")}
          </p>

          {account.campaigns.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              {t("noCampaigns")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {account.campaigns.map((campaign) => (
                <li
                  key={campaign.campaign}
                  className="flex items-start justify-between gap-3 py-3"
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
                  </div>

                  <div className="shrink-0 text-end">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(campaign.spend, locale)}
                    </p>

                    <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                      {t("cpmShort")}{" "}
                      {campaign.costPerMessage === null
                        ? "—"
                        : formatCurrency(campaign.costPerMessage, locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
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