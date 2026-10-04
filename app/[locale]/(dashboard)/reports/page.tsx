"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import {
  BarChart3,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { getReports } from "@/lib/api";
import { containerVariants, itemVariants } from "@/lib/motion";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import PageHeader from "@/components/PageHeader";
import ReportsLoading from "@/components/ReportsLoading";

const statusColors: Record<string, string> = {
  Delivered: "var(--success)",
  Pending: "var(--warning)",
  Cancelled: "var(--destructive)",
};

type SummaryTone = "primary" | "success" | "warning" | "destructive";

const summaryStyles: Record<
  SummaryTone,
  {
    icon: string;
    border: string;
  }
> = {
  primary: {
    icon: "bg-primary text-primary-foreground",
    border: "border-s-primary",
  },
  success: {
    icon: "bg-success text-success-foreground",
    border: "border-s-success",
  },
  warning: {
    icon: "bg-warning text-warning-foreground",
    border: "border-s-warning",
  },
  destructive: {
    icon: "bg-destructive text-destructive-foreground",
    border: "border-s-destructive",
  },
};

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof DollarSign;
  tone?: SummaryTone;
}) {
  const styles = summaryStyles[tone];

  return (
    <div
      className={`flex min-w-0 items-start gap-4 rounded-lg border border-border border-s-4 bg-card px-5 py-5 ${styles.border}`}
    >
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-md ${styles.icon}`}
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-muted">{label}</p>

        <p className="mt-1 text-2xl font-bold leading-none tabular-nums text-text">
          {value}
        </p>

        {hint && (
          <p className="mt-2 truncate text-xs text-text-muted">{hint}</p>
        )}
      </div>
    </div>
  );
}

type TileTone = "success" | "warning" | "destructive" | "primary";

const tileToneClass: Record<TileTone, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  primary: "text-text",
};

function MetricTile({
  label,
  value,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: TileTone;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-4">
      <p className="truncate text-xs font-medium text-text-muted">{label}</p>

      <p
        className={`mt-1.5 truncate text-lg font-semibold tabular-nums ${tileToneClass[tone]}`}
      >
        {value}
      </p>

      {hint && <p className="mt-1 truncate text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const t = useTranslations("reports");
  const tStatus = useTranslations("status");
  const te = useTranslations("errors");
  const locale = useLocale() as "en" | "ar";

  const statusLabel: Record<string, string> = {
    Delivered: tStatus("delivered"),
    Pending: tStatus("pending"),
    Cancelled: tStatus("cancelled"),
  };

  const chartConfig = {
    sales: {
      label: t("chartSales"),
      color: "var(--chart-1)",
    },
    profit: {
      label: t("chartProfit"),
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  const statusChartConfig = {
    Delivered: {
      label: tStatus("delivered"),
      color: "var(--success)",
    },
    Pending: {
      label: tStatus("pending"),
      color: "var(--warning)",
    },
    Cancelled: {
      label: tStatus("cancelled"),
      color: "var(--destructive)",
    },
  } satisfies ChartConfig;

  const [range, setRange] = useState(7);

  const {
    data: reports,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["reports", range],
    queryFn: () => getReports(range),
    placeholderData: (previous) => previous,
  });

  if (isLoading) {
    return <ReportsLoading />;
  }

  if (isError || !reports) {
    return (
      <div className="mx-auto w-full max-w-400 space-y-6">
        <PageHeader title={t("title")} description={t("description")} />

        <ErrorState description={te("reports")} onRetry={() => refetch()} />
      </div>
    );
  }

  const { summary, salesData, topProducts, orderStatus } = reports;

  const totalStatusOrders = orderStatus.reduce(
    (total, status) => total + status.value,
    0,
  );

  const hasData = summary.totalOrders > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-400 space-y-7 overflow-x-hidden"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title={t("title")}
          description={t("description")}
          actions={
            <div className="inline-flex rounded-md border border-border p-0.5">
              {[7, 30].map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={range === value ? "secondary" : "ghost"}
                  onClick={() => setRange(value)}
                >
                  {t("days", { count: value })}
                </Button>
              ))}
            </div>
          }
        />
      </motion.div>

      {!hasData ? (
        <motion.div variants={itemVariants}>
          <Card className="rounded-lg border border-border bg-card shadow-none">
            <CardContent className="py-6">
              <EmptyState
                icon={BarChart3}
                title={t("emptyTitle")}
                description={t("emptyDescription")}
                action={
                  <Button
                    nativeButton={false}
                    render={<Link href="/orders/add-order" />}
                  >
                    {t("newOrder")}
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Summary */}
          <motion.div
            variants={itemVariants}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <SummaryCard
              label={t("totalSales")}
              value={formatCurrency(summary.totalSales, locale)}
              hint={t("activeOrdersHint", {
                count: formatNumber(summary.activeOrders, locale),
              })}
              icon={DollarSign}
              tone="primary"
            />

            <SummaryCard
              label={t("totalProfit")}
              value={formatCurrency(summary.totalProfit, locale)}
              hint={t("marginHint", {
                value: formatNumber(summary.profitMargin, locale, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }),
              })}
              icon={TrendingUp}
              tone={summary.totalProfit < 0 ? "destructive" : "success"}
            />

            <SummaryCard
              label={t("totalOrders")}
              value={formatNumber(summary.totalOrders, locale)}
              hint={t("pendingHint", {
                count: formatNumber(summary.pendingOrders, locale),
              })}
              icon={ShoppingBag}
              tone="primary"
            />

            <SummaryCard
              label={t("averageOrder")}
              value={formatCurrency(summary.averageOrderValue, locale)}
              hint={t("perActiveOrder")}
              icon={BarChart3}
              tone="primary"
            />
          </motion.div>

          {/* Sales & Profit */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-none">
              <CardHeader className="gap-1 border-b border-border">
                <CardTitle className="text-base font-semibold text-text">
                  {t("salesProfit")}
                </CardTitle>

                <p className="text-sm text-text-muted">
                  {t("salesProfitDescription", { range })}
                </p>
              </CardHeader>

              <CardContent className="pt-6">
                <ChartContainer config={chartConfig} className="h-80 w-full">
                  <BarChart
                    data={salesData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                    barGap={8}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />

                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />

                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      tickFormatter={(value) =>
                        `$${formatNumber(Number(value), locale, {
                          maximumFractionDigits: 0,
                        })}`
                      }
                    />

                    <ChartTooltip content={<ChartTooltipContent />} />

                    <Legend />

                    <Bar
                      dataKey="sales"
                      fill="var(--color-sales)"
                      radius={[3, 3, 0, 0]}
                    />

                    <Bar
                      dataKey="profit"
                      fill="var(--color-profit)"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Products + Order Status */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Products */}
            <motion.div variants={itemVariants}>
              <Card className="h-full rounded-lg border border-border bg-card shadow-none">
                <CardHeader className="gap-1 border-b border-border">
                  <CardTitle className="text-base font-semibold text-text">
                    {t("topProducts")}
                  </CardTitle>

                  <p className="text-sm text-text-muted">
                    {t("topProductsDescription")}
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
                  {topProducts.length === 0 ? (
                    <div className="py-8">
                      <EmptyState icon={Package} title={t("noProductsSold")} />
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {topProducts.map((product) => (
                        <div
                          key={product.name}
                          className="flex min-w-0 items-center gap-4 py-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-text">
                              {product.name}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-text-muted">
                              {t("unitsSold", {
                                units: formatNumber(product.units, locale),
                                orders: formatNumber(product.orders, locale),
                              })}
                            </p>
                          </div>

                          <div className="shrink-0 text-end">
                            <p className="text-sm font-semibold tabular-nums text-text">
                              {formatCurrency(product.revenue, locale)}
                            </p>

                            <p className="mt-0.5 text-xs font-medium text-success tabular-nums">
                              +{formatCurrency(product.profit, locale)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Status */}
            <motion.div variants={itemVariants}>
              <Card className="h-full rounded-lg border border-border bg-card shadow-none">
                <CardHeader className="gap-1 border-b border-border">
                  <CardTitle className="text-base font-semibold text-text">
                    {t("orderStatus")}
                  </CardTitle>

                  <p className="text-sm text-text-muted">
                    {t("orderStatusDescription")}
                  </p>
                </CardHeader>

                <CardContent className="pt-6">
                  {totalStatusOrders === 0 ? (
                    <EmptyState icon={ShoppingBag} title={t("noOrders")} />
                  ) : (
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                      <ChartContainer
                        config={statusChartConfig}
                        className="aspect-square h-48 shrink-0"
                      >
                        <PieChart>
                          <ChartTooltip
                            content={
                              <ChartTooltipContent nameKey="name" hideLabel />
                            }
                          />

                          <Pie
                            data={orderStatus.map((item) => ({
                              ...item,
                              name: statusLabel[item.name] ?? item.name,
                              color: statusColors[item.name],
                            }))}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={52}
                            outerRadius={82}
                            strokeWidth={2}
                          >
                            {orderStatus.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={statusColors[entry.name]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>

                      <div className="w-full space-y-4">
                        {orderStatus.map((item) => {
                          const percentage =
                            totalStatusOrders > 0
                              ? (item.value / totalStatusOrders) * 100
                              : 0;

                          return (
                            <div
                              key={item.name}
                              className="flex items-center gap-3 text-sm"
                            >
                              <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: statusColors[item.name],
                                }}
                              />

                              <span className="min-w-0 flex-1 truncate text-text">
                                {statusLabel[item.name] ?? item.name}
                              </span>

                              <span className="font-semibold tabular-nums text-text">
                                {formatNumber(item.value, locale)}
                              </span>

                              <span className="w-10 shrink-0 text-end text-xs text-text-muted tabular-nums">
                                {formatPercent(percentage, locale, 0)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Business Snapshot */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-lg border border-border bg-card shadow-none">
              <CardHeader className="gap-1 border-b border-border">
                <CardTitle className="text-base font-semibold text-text">
                  {t("businessSnapshot")}
                </CardTitle>

                <p className="text-sm text-text-muted">
                  {t("businessSnapshotDescription")}
                </p>
              </CardHeader>

              <CardContent className="pt-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <MetricTile
                    label={t("pendingOrders")}
                    value={formatNumber(summary.pendingOrders, locale)}
                    tone="warning"
                  />

                  <MetricTile
                    label={t("deliveredOrders")}
                    value={formatNumber(summary.deliveredOrders, locale)}
                    tone="success"
                  />

                  <MetricTile
                    label={t("cancelledOrders")}
                    value={formatNumber(summary.cancelledOrders, locale)}
                    tone="destructive"
                  />

                  <MetricTile
                    label={t("deliveryRate")}
                    value={formatPercent(summary.deliveryRate, locale)}
                    hint={t("deliveryRateHint", {
                      delivered: formatNumber(summary.deliveredOrders, locale),
                      total: formatNumber(summary.totalOrders, locale),
                    })}
                  />

                  <MetricTile
                    label={t("deliveryRevenue")}
                    value={formatCurrency(summary.deliveryRevenue, locale)}
                    hint={t("costHint", {
                      amount: formatCurrency(summary.deliveryCost, locale),
                    })}
                  />

                  <MetricTile
                    label={t("deliveryNet")}
                    value={formatCurrency(
                      summary.deliveryRevenue - summary.deliveryCost,
                      locale,
                    )}
                    tone={
                      summary.deliveryRevenue - summary.deliveryCost < 0
                        ? "destructive"
                        : "success"
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
