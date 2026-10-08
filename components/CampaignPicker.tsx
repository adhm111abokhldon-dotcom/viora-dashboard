"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Check, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/Pagination";
import { getCampaignCatalog, type CampaignReference } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";

const PAGE_SIZE = 20;

export default function CampaignPicker({
  value,
  onChange,
}: {
  value: CampaignReference[];
  onChange: (campaigns: CampaignReference[]) => void;
}) {
  const t = useTranslations("productCampaigns");
  const locale = useLocale() as "en" | "ar";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["campaignCatalog", "all", page, PAGE_SIZE, search],
    queryFn: () => getCampaignCatalog({ page, limit: PAGE_SIZE, search }),
  });
  const selectedKeys = new Set(value.map((campaign) => campaign.key));

  function toggle(campaign: CampaignReference) {
    if (selectedKeys.has(campaign.key)) {
      onChange(value.filter((selected) => selected.key !== campaign.key));
    } else {
      onChange([...value, campaign]);
    }
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="gap-3 border-b border-border">
        <div>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("search")}
            aria-label={t("search")}
            className="ps-9"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label={t("selected")}>
            {value.map((campaign) => (
              <span
                key={campaign.key}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-border px-3 py-1 text-xs"
              >
                <span className="max-w-56 truncate">{campaign.campaign}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-muted"
                  aria-label={t("remove", { name: campaign.campaign })}
                  onClick={() => toggle(campaign)}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : query.isError ? (
          <div className="flex items-center justify-between gap-3 text-sm text-destructive">
            <span>{t("loadError")}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
              {t("retry")}
            </Button>
          </div>
        ) : query.data?.campaigns.length ? (
          <>
            <ul className="divide-y divide-border rounded-md border border-border">
              {query.data.campaigns.map((campaign) => {
                const selected = selectedKeys.has(campaign.key);
                return (
                  <li key={campaign.key}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggle(campaign)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-3 text-start outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded border border-border">
                          {selected && <Check className="size-3.5" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{campaign.campaign}</span>
                          <span className="mt-1 block truncate text-xs text-muted-foreground">
                            {campaign.accountName} · {campaign.linkedProductCount
                              ? t("linkedCount", { count: formatNumber(campaign.linkedProductCount, locale) })
                              : t("notLinked")}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatCurrency(campaign.spend, locale)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Pagination
              currentPage={query.data.pagination.currentPage}
              totalPages={query.data.pagination.totalPages}
              hasNextPage={query.data.pagination.hasNextPage}
              hasPreviousPage={query.data.pagination.hasPreviousPage}
              onFirst={() => setPage(1)}
              onPrevious={() => setPage((current) => current - 1)}
              onNext={() => setPage((current) => current + 1)}
              onLast={() => setPage(query.data.pagination.totalPages)}
            />
          </>
        ) : (
          <p className="py-5 text-center text-sm text-muted-foreground">
            {search ? t("noResults") : t("noCampaigns")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
