"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Megaphone, Package } from "lucide-react";
import { Link } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorState from "@/components/ErrorState";
import ProductsLoading from "@/components/ProductsLoading";
import { Pagination } from "@/components/ui/Pagination";
import { getProductProfitability } from "@/lib/api";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";

const PAGE_SIZE = 10;
const FILTERS = ["Delivered", "Pending", "Cancelled", "all"] as const;
type OrderFilter = (typeof FILTERS)[number];

export default function ProductPerformancePage() {
  const t = useTranslations("productProfitability");
  const te = useTranslations("errors");
  const locale = useLocale() as "en" | "ar";
  const params = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderFilter>("Delivered");

  const query = useQuery({
    queryKey: ["productProfitability", params.id, page, status],
    queryFn: () => getProductProfitability(params.id, page, PAGE_SIZE, status),
    enabled: Boolean(params.id),
  });

  if (query.isLoading) return <ProductsLoading />;
  if (query.isError || !query.data) {
    return (
      <div className="mx-auto w-full max-w-400 space-y-6">
        <ErrorState
          description={apiErrorMessage(query.error, te, te("productPerformance"))}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const { product, overview, sales, campaigns, profit, orders, inventory } =
    query.data;
  const profitTone =
    profit.netProfit > 0
      ? "text-success"
      : profit.netProfit < 0
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="mx-auto w-full max-w-400 space-y-6">
      <div className="space-y-4">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          render={<Link href="/products" />}
          className="-ms-2 w-fit"
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {t("back")}
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("lifetime")}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.category} · {t("ordersCount", { count: formatNumber(overview.totalOrders, locale) })}
            </p>
          </div>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href={`/products/${product._id}`} />}
          >
            <Package className="size-4" />
            {t("productDetails")}
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t("currentPrice")} value={formatCurrency(product.price, locale)} />
        <Metric label={t("currentCost")} value={formatCurrency(product.cost, locale)} />
        <Metric label={t("currentStock")} value={formatNumber(product.stock, locale)} />
        <Metric label={t("linkedCampaignCount")} value={formatNumber(overview.campaignCount, locale)} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t("revenue")} value={formatCurrency(profit.revenue, locale)} />
        <Metric label={t("productCost")} value={formatCurrency(profit.productCost, locale)} />
        <Metric label={t("deliveryCost")} value={formatCurrency(profit.deliveryCost, locale)} />
        <Metric label={t("advertisingCost")} value={formatCurrency(profit.advertisingCost, locale)} />
      </section>

      <Card className="shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t("netProfit")}</p>
            <p className={`mt-1 text-3xl font-bold tabular-nums ${profitTone}`}>
              {formatCurrency(profit.netProfit, locale)}
            </p>
            <p className="mt-1 text-sm font-medium">{t(`states.${profit.state}`)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("margin")}: {profit.marginPercent.toLocaleString(locale)}%
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <span className="text-muted-foreground">{t("deliveredOrders")}</span>
            <span className="text-end font-medium tabular-nums">{formatNumber(sales.deliveredOrders, locale)}</span>
            <span className="text-muted-foreground">{t("unitsSold")}</span>
            <span className="text-end font-medium tabular-nums">{formatNumber(sales.unitsSold, locale)}</span>
            <span className="text-muted-foreground">{t("inventoryValue")}</span>
            <span className="text-end font-medium tabular-nums">{formatCurrency(inventory.inventoryValue, locale)}</span>
            <span className="text-muted-foreground">{t("pendingOrders")}</span>
            <span className="text-end font-medium tabular-nums">{formatNumber(sales.pendingOrders, locale)}</span>
            <span className="text-muted-foreground">{t("cancelledOrders")}</span>
            <span className="text-end font-medium tabular-nums">{formatNumber(sales.cancelledOrders, locale)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">{t("campaigns")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("campaignsDescription")}</p>
        </CardHeader>
        <CardContent className="p-0">
          {campaigns.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">{t("noCampaigns")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {campaigns.map((campaign) => (
                <li key={campaign.key}>
                  <Link
                    href={`/advertising/campaigns/${encodeURIComponent(campaign.key)}`}
                    className="flex flex-col gap-3 p-4 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Megaphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{campaign.campaign}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {campaign.accountName} · {t("linkedProducts", { count: formatNumber(campaign.linkedProductCount, locale) })}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t(
                            campaign.currentlyLinked
                              ? "currentlyLinked"
                              : "historicallyLinked",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:text-end">
                      <span className="text-muted-foreground">{t("campaignSpend")}</span>
                      <span className="font-medium tabular-nums">{formatCurrency(campaign.spend, locale)}</span>
                      <span className="text-muted-foreground">{t("productAllocation")}</span>
                      <span className="font-semibold tabular-nums">{formatCurrency(campaign.allocation, locale)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden shadow-none">
        <CardHeader className="gap-4 border-b border-border">
          <div>
            <CardTitle className="text-base">{t("orders")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t("ordersDescription")}</p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label={t("filterOrders")}>
            {FILTERS.map((filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={status === filter ? "default" : "outline"}
                onClick={() => {
                  setStatus(filter);
                  setPage(1);
                }}
              >
                {t(`statuses.${filter}`)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {orders.rows.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <>
              <div className="divide-y divide-border md:hidden">
                {orders.rows.map((order) => (
                  <div key={order.orderId} className="space-y-2 p-4">
                    <div className="flex justify-between gap-3">
                      <span dir="ltr" className="font-medium">#{order.orderNumber ?? "—"}</span>
                      <span className="text-sm text-muted-foreground">{t(`statuses.${order.status}`)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{formatDate(order.createdAt, locale)}</span>
                      <span>{t("unitsValue", { count: formatNumber(order.quantity, locale) })}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{t("historicalUnitPrice")}</span>
                      <span className="tabular-nums">{formatCurrency(order.unitPrice, locale)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{t("orderRevenue")}</span>
                      <span className="tabular-nums">{formatCurrency(order.revenue, locale)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{t("orderProductCost")}</span>
                      <span className="tabular-nums">{formatCurrency(order.cost, locale)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-start text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 text-start">{t("order")}</th>
                      <th className="px-5 py-3 text-start">{t("date")}</th>
                      <th className="px-5 py-3 text-start">{t("status")}</th>
                      <th className="px-5 py-3 text-end">{t("quantity")}</th>
                      <th className="px-5 py-3 text-end">{t("historicalUnitPrice")}</th>
                      <th className="px-5 py-3 text-end">{t("historicalUnitCost")}</th>
                      <th className="px-5 py-3 text-end">{t("orderRevenue")}</th>
                      <th className="px-5 py-3 text-end">{t("orderProductCost")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.rows.map((order) => (
                      <tr key={order.orderId}>
                        <td className="px-5 py-3 font-medium"><span dir="ltr">#{order.orderNumber ?? "—"}</span></td>
                        <td className="px-5 py-3">{formatDate(order.createdAt, locale)}</td>
                        <td className="px-5 py-3">{t(`statuses.${order.status}`)}</td>
                        <td className="px-5 py-3 text-end tabular-nums">{formatNumber(order.quantity, locale)}</td>
                        <td className="px-5 py-3 text-end tabular-nums">{formatCurrency(order.unitPrice, locale)}</td>
                        <td className="px-5 py-3 text-end tabular-nums">{formatCurrency(order.unitCost, locale)}</td>
                        <td className="px-5 py-3 text-end tabular-nums">{formatCurrency(order.revenue, locale)}</td>
                        <td className="px-5 py-3 text-end tabular-nums">{formatCurrency(order.cost, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border p-4">
                <Pagination
                  currentPage={orders.pagination.currentPage}
                  totalPages={orders.pagination.totalPages}
                  hasNextPage={orders.pagination.hasNextPage}
                  hasPreviousPage={orders.pagination.hasPreviousPage}
                  onFirst={() => setPage(1)}
                  onPrevious={() => setPage((current) => current - 1)}
                  onNext={() => setPage((current) => current + 1)}
                  onLast={() => setPage(orders.pagination.totalPages)}
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
