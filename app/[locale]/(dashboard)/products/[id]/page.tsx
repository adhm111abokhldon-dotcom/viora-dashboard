"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  ImageIcon,
  Pencil,
  ShoppingBag,
  Truck,
} from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import ProductsLoading from "@/components/ProductsLoading";
import { getProductStats, type ProductStatsResponse } from "@/lib/api";
import { containerVariants, itemVariants } from "@/lib/motion";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import { isKnownCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

const TREND_OPTIONS = [7, 30, 90] as const;
type TrendDays = (typeof TREND_OPTIONS)[number];

/**
 * The detail payload always includes performance, but keeping a typed default
 * means the page renders safely instead of crashing on an unexpected shape.
 */
const NO_PERFORMANCE: ProductStatsResponse["performance"] = {
  unitsSold: 0,
  orders: 0,
  sales: 0,
  cost: 0,
  deliveryCost: 0,
  profit: 0,
  profitMargin: 0,
  averageSellingPrice: 0,
  averageCost: 0,
  deliveryCostPerUnit: 0,
  deliveryCollected: 0,
};

/** One labelled money/number figure in a detail grid. */
function Metric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "destructive";
}) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      <p
        className={cn(
          "mt-1 text-base font-semibold tabular-nums",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>

      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** A row in the "where the money goes" breakdown. */
function MoneyLine({
  label,
  value,
  locale,
  kind,
}: {
  label: string;
  value: number;
  locale: "en" | "ar";
  kind: "plus" | "minus" | "total";
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-2.5",
        kind === "total" && "border-t border-border pt-3",
      )}
    >
      <span
        className={cn(
          "text-sm",
          kind === "total" ? "font-semibold" : "text-muted-foreground",
        )}
      >
        {label}
      </span>

      <span
        className={cn(
          "text-sm tabular-nums",
          kind === "total" && "text-base font-semibold",
          kind === "minus" && "text-muted-foreground",
          kind === "total" && value < 0 && "text-destructive",
          kind === "total" && value >= 0 && "text-success",
        )}
      >
        {kind === "minus" ? "-" : ""}
        {formatCurrency(Math.abs(value), locale)}
      </span>
    </div>
  );
}

/**
 * Product Detail - the business view of a single product.
 *
 * Every figure comes from GET /api/products/:id/stats, which counts Delivered
 * orders only and allocates each order's delivery cost across its items by
 * revenue share. The frontend never re-computes money, so this page and the
 * Products table can never disagree.
 */
export default function ProductDetailPage() {
  const t = useTranslations("products.detail");
  const tp = useTranslations("products");
  const te = useTranslations("errors");
  const locale = useLocale() as "en" | "ar";

  const params = useParams<{ id: string }>();
  const productId = params.id;

  const [trendDays, setTrendDays] = useState<TrendDays>(30);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["productStats", productId, trendDays],
    queryFn: () => getProductStats(productId, trendDays),
    enabled: Boolean(productId),
  });

  if (isLoading) {
    return <ProductsLoading />;
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-400 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

        <ErrorState
          description={apiErrorMessage(error, te, te("productNotFound"))}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { product, pricing, inventory, pending, attention } = data;
  const performance: ProductStatsResponse["performance"] =
    data.performance ?? NO_PERFORMANCE;

  const categoryLabel = isKnownCategory(product.category)
    ? tp(`categories.${product.category}`)
    : product.category;

  const trendTotalUnits = data.salesTrend.reduce(
    (sum, day) => sum + day.units,
    0,
  );
  const maxTrendUnits = Math.max(...data.salesTrend.map((day) => day.units), 1);

  const firstTrendDay = data.salesTrend[0]?.date ?? "";
  const lastTrendDay = data.salesTrend[data.salesTrend.length - 1]?.date ?? "";

  const showAttention =
    attention.outOfStock ||
    attention.lowStock ||
    attention.neverSold ||
    attention.soldBelowDefaultPrice ||
    attention.profitNegative;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-400 space-y-7"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Button
              nativeButton={false}
              variant="outline"
              size="icon"
              className="mt-1 shrink-0"
              render={<Link href="/products" />}
              aria-label={t("backAria")}
            >
              <ArrowLeft className="size-4 rtl:-scale-x-100" />
            </Button>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {product.name}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                <span dir="ltr">#{product.productNumber}</span>
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {categoryLabel} · {t("deliveredOnly")}
              </p>
            </div>
          </div>

          <Button
            nativeButton={false}
            variant="outline"
            className="shrink-0"
            render={<Link href={`/products/${productId}/edit`} />}
          >
            <Pencil className="size-4" />
            {tp("actions.edit")}
          </Button>
        </div>
      </motion.div>

      {/* Product overview */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden rounded-lg border border-border shadow-none">
          <CardContent className="p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex size-20 relative shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon
                    className="size-8 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
                <Metric
                  label={tp("sellingPrice")}
                  value={formatCurrency(product.price, locale)}
                />
                <Metric
                  label={tp("productCost")}
                  value={formatCurrency(product.cost, locale)}
                />
                <Metric
                  label={t("currentStock")}
                  value={formatNumber(inventory.currentStock, locale)}
                  hint={
                    inventory.outOfStock
                      ? tp("outOfStock")
                      : inventory.lowStock
                        ? tp("lowStock")
                        : undefined
                  }
                  tone={inventory.outOfStock ? "destructive" : "default"}
                />
                <Metric
                  label={t("pendingUnits")}
                  value={formatNumber(pending.units, locale)}
                  hint={
                    pending.orders > 0
                      ? t("pendingOrdersHint", {
                          count: formatNumber(pending.orders, locale),
                        })
                      : undefined
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Needs attention - only facts backed by real data */}
      {showAttention && (
        <motion.div variants={itemVariants}>
          <Card className="rounded-lg border-s-4 border-s-warning border-border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 size-5 shrink-0 text-warning"
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t("attentionTitle")}</p>

                  <ul className="mt-2 space-y-1.5">
                    {attention.outOfStock && (
                      <li className="text-sm text-muted-foreground">
                        • {t("attentionOutOfStock")}
                      </li>
                    )}

                    {attention.lowStock && (
                      <li className="text-sm text-muted-foreground">
                        •{" "}
                        {t("attentionLowStock", {
                          count: formatNumber(inventory.currentStock, locale),
                        })}
                      </li>
                    )}

                    {attention.neverSold && (
                      <li className="text-sm text-muted-foreground">
                        • {t("attentionNeverSold")}
                      </li>
                    )}

                    {attention.soldBelowDefaultPrice && (
                      <li className="text-sm text-muted-foreground">
                        •{" "}
                        {t("attentionSoldBelow", {
                          amount: formatCurrency(
                            Math.abs(pricing.difference),
                            locale,
                          ),
                        })}
                      </li>
                    )}

                    {attention.profitNegative && (
                      <li className="text-sm text-destructive">
                        • {t("attentionLoss")}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Sales performance */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-lg border border-border shadow-none">
          <CardHeader className="gap-1 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShoppingBag className="size-4 text-muted-foreground" />
              {t("performanceTitle")}
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              {t("performanceDescription")}
            </p>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
              <Metric
                label={t("unitsSold")}
                value={formatNumber(performance.unitsSold, locale)}
                hint={t("inOrders", {
                  count: formatNumber(performance.orders, locale),
                })}
              />

              <Metric
                label={t("productSales")}
                value={formatCurrency(performance.sales, locale)}
                hint={t("productSalesHint")}
              />

              <Metric
                label={t("averageSellingPrice")}
                value={formatCurrency(performance.averageSellingPrice, locale)}
                hint={t("aspHint")}
              />

              <Metric
                label={t("profitMargin")}
                value={formatPercent(performance.profitMargin, locale)}
                tone={performance.profit >= 0 ? "success" : "destructive"}
              />
            </div>

            <div className="px-4 py-4">
              <p className="text-sm font-semibold">{t("moneyFlowTitle")}</p>

              <div className="mt-2">
                <MoneyLine
                  label={t("productSales")}
                  value={performance.sales}
                  locale={locale}
                  kind="plus"
                />

                <MoneyLine
                  label={t("productCost")}
                  value={performance.cost}
                  locale={locale}
                  kind="minus"
                />

                <MoneyLine
                  label={t("deliveryCostAllocated")}
                  value={performance.deliveryCost}
                  locale={locale}
                  kind="minus"
                />

                <MoneyLine
                  label={t("productProfit")}
                  value={performance.profit}
                  locale={locale}
                  kind="total"
                />
              </div>

              {performance.deliveryCollected > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("deliveryCollectedNote", {
                    amount: formatCurrency(
                      performance.deliveryCollected,
                      locale,
                    ),
                  })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pricing + delivery */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-lg border border-border shadow-none">
            <CardHeader className="gap-1 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <DollarSign className="size-4 text-muted-foreground" />
                {t("pricingTitle")}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="grid grid-cols-2 gap-px bg-border">
                <Metric
                  label={t("defaultPrice")}
                  value={formatCurrency(pricing.defaultPrice, locale)}
                />

                <Metric
                  label={t("actualAveragePrice")}
                  value={formatCurrency(pricing.averageSellingPrice, locale)}
                  tone={pricing.soldBelowDefault ? "destructive" : "default"}
                />

                <Metric
                  label={t("priceDifference")}
                  value={formatCurrency(pricing.difference, locale)}
                  hint={
                    pricing.averageSellingPrice > 0
                      ? formatPercent(pricing.differencePercent, locale)
                      : undefined
                  }
                  tone={pricing.difference < 0 ? "destructive" : "success"}
                />

                <Metric
                  label={t("averageCostPerUnit")}
                  value={formatCurrency(performance.averageCost, locale)}
                  hint={t("capitalHint")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-border shadow-none">
            <CardHeader className="gap-1 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Truck className="size-4 text-muted-foreground" />
                {t("deliveryTitle")}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="grid grid-cols-2 gap-px bg-border">
                <Metric
                  label={t("deliveryCostAllocated")}
                  value={formatCurrency(performance.deliveryCost, locale)}
                  hint={t("deliveryShareHint")}
                />

                <Metric
                  label={t("deliveryCostPerUnit")}
                  value={formatCurrency(
                    performance.deliveryCostPerUnit,
                    locale,
                  )}
                  hint={
                    performance.unitsSold > 0
                      ? t("perUnitHint", {
                          count: formatNumber(performance.unitsSold, locale),
                        })
                      : undefined
                  }
                />

                <Metric
                  label={t("deliveryCollected")}
                  value={formatCurrency(performance.deliveryCollected, locale)}
                  hint={t("deliveryCollectedHint")}
                />

                <Metric
                  label={t("daysOfStockLeft")}
                  value={
                    inventory.daysOfStockLeft !== null
                      ? formatNumber(inventory.daysOfStockLeft, locale, {
                          maximumFractionDigits: 1,
                        })
                      : "-"
                  }
                  hint={t("daysOfStockHint", { days: String(trendDays) })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Sales trend - real daily units, no forecasting */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-lg border border-border shadow-none">
          <CardHeader className="gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                {t("trendTitle")}
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {t("trendDescription", {
                  count: formatNumber(trendTotalUnits, locale),
                })}
              </p>
            </div>

            <div
              className="flex gap-1 rounded-md border border-border p-1"
              role="group"
              aria-label={t("trendRangeAria")}
            >
              {TREND_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTrendDays(option)}
                  aria-pressed={trendDays === option}
                  className={cn(
                    "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                    trendDays === option
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t("trendDays", { days: String(option) })}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div
              className="flex h-32 items-end gap-1"
              role="img"
              aria-label={t("trendAria", {
                count: formatNumber(trendTotalUnits, locale),
              })}
            >
              {data.salesTrend.map((day) => (
                <div
                  key={day.date}
                  className="flex-1"
                  title={`${day.date}: ${formatNumber(day.units, locale)}`}
                >
                  <div
                    className={cn(
                      "w-full rounded-sm",
                      day.units > 0 ? "bg-primary" : "bg-border",
                    )}
                    style={{
                      height: `${Math.max(
                        (day.units / maxTrendUnits) * 100,
                        day.units > 0 ? 6 : 3,
                      )}%`,
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{firstTrendDay}</span>
              <span>{lastTrendDay}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent delivered orders */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-lg border border-border shadow-none">
          <CardHeader className="gap-1 border-b border-border">
            <CardTitle className="text-base font-semibold">
              {t("recentTitle")}
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              {t("recentDescription")}
            </p>
          </CardHeader>

          <CardContent className="p-0">
            {data.recentOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title={t("recentEmpty")}
                description={t("recentEmptyDescription")}
              />
            ) : (
              <ul className="divide-y divide-border">
                {data.recentOrders.map((order) => (
                  <li
                    key={order._id}
                    className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {order.customer}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt, locale)} -{" "}
                        {t("qtyTimesPrice", {
                          qty: formatNumber(order.quantity, locale),
                          price: formatCurrency(order.unitPrice, locale),
                        })}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4 text-sm">
                      <span className="text-muted-foreground tabular-nums">
                        {t("lineCost", {
                          amount: formatCurrency(order.unitCost, locale),
                        })}
                      </span>

                      <span className="font-semibold tabular-nums">
                        {formatCurrency(
                          order.quantity * order.unitPrice,
                          locale,
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
