"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Link2, Link2Off, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ErrorState from "@/components/ErrorState";
import ProductsLoading from "@/components/ProductsLoading";
import { Pagination } from "@/components/ui/Pagination";
import {
  getCampaignProducts,
  linkProductCampaign,
  unlinkProductCampaign,
} from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import { useAppToast } from "@/lib/toast";
import { useInvalidateAll } from "@/lib/queries";

const PAGE_SIZE = 20;

export default function CampaignDetailsPage() {
  const t = useTranslations("campaignDetails");
  const te = useTranslations("errors");
  const locale = useLocale() as "en" | "ar";
  const params = useParams<{ key: string }>();
  const key = params.key;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const toast = useAppToast();
  const invalidateAll = useInvalidateAll();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const query = useQuery({
    queryKey: ["campaignProducts", key, page, search],
    queryFn: () => getCampaignProducts(key, page, PAGE_SIZE, search),
    enabled: Boolean(key),
  });

  const linkMutation = useMutation({
    mutationFn: (productId: string) =>
      linkProductCampaign(productId, query.data!.campaign),
    onSuccess: async () => {
      await invalidateAll();
    },
    onError: (error) => toast.error(error, "campaignLink"),
  });

  const unlinkMutation = useMutation({
    mutationFn: (productId: string) =>
      unlinkProductCampaign(productId, query.data!.campaign),
    onSuccess: async () => {
      await invalidateAll();
    },
    onError: (error) => toast.error(error, "campaignUnlink"),
  });

  if (query.isLoading) return <ProductsLoading />;
  if (query.isError || !query.data) {
    return (
      <div className="mx-auto w-full max-w-400 space-y-6">
        <ErrorState
          description={apiErrorMessage(query.error, te, te("campaignDetails"))}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const { campaign, products, pagination } = query.data;

  return (
    <div className="mx-auto w-full max-w-400 space-y-6">
      <div className="space-y-4">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          render={<Link href="/advertising" />}
          className="-ms-2 w-fit"
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {t("back")}
        </Button>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t(`accounts.${campaign.accountKey ?? "trendora_other"}`)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {campaign.campaign}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaign.accountName} · {campaign.platform}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label={t("spend")} value={formatCurrency(campaign.spend, locale)} />
        <Metric label={t("messages")} value={formatNumber(campaign.messages, locale)} />
        <Metric label={t("clicks")} value={formatNumber(campaign.clicks, locale)} />
        <Metric
          label={t("costPerMessage")}
          value={
            campaign.costPerMessage === null
              ? "—"
              : formatCurrency(campaign.costPerMessage, locale)
          }
        />
        <Metric label={t("linkedCount")} value={formatNumber(campaign.linkedProductCount, locale)} />
      </div>

      <Card className="overflow-hidden shadow-none">
        <CardHeader className="gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">{t("productsTitle")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t("productsDescription")}</p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className="ps-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              {search ? t("noResults") : t("noProducts")}
            </p>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {products.map((product) => {
                  const pending =
                    linkMutation.isPending || unlinkMutation.isPending;
                  return (
                    <li
                      key={product._id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <Link
                        href={`/products/${product._id}`}
                        className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {product.category} · {formatCurrency(product.price, locale)} ·{" "}
                          {t("stock", { count: formatNumber(product.stock, locale) })}
                          {product.linked && product.allocation !== null
                            ? ` · ${t("productAllocation")}: ${formatCurrency(product.allocation, locale)}`
                            : ""}
                        </p>
                      </Link>
                      <Button
                        type="button"
                        variant={product.linked ? "outline" : "default"}
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          product.linked
                            ? unlinkMutation.mutate(product._id)
                            : linkMutation.mutate(product._id)
                        }
                      >
                        {product.linked ? (
                          <Link2Off className="size-4" />
                        ) : (
                          <Link2 className="size-4" />
                        )}
                        {product.linked ? t("unlink") : t("link")}
                      </Button>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-border p-4">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  hasNextPage={pagination.hasNextPage}
                  hasPreviousPage={pagination.hasPreviousPage}
                  onFirst={() => setPage(1)}
                  onPrevious={() => setPage((current) => current - 1)}
                  onNext={() => setPage((current) => current + 1)}
                  onLast={() => setPage(pagination.totalPages)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
