"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Clock3,
  DollarSign,
  ImageIcon,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { getDashboard, updateOrderStatus, type OrderStatus } from "@/lib/api";
import { summarizeItems } from "@/lib/orders";
import { orderStatusDot } from "@/lib/status";
import { containerVariants, itemVariants } from "@/lib/motion";
import { formatCurrency, formatNumber } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import { useAppToast } from "@/lib/toast";
import { useInvalidateAll } from "@/lib/queries";
import ErrorState from "@/components/ErrorState";
import OrderActions from "@/components/OrderActions";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";

type Tone = "positive" | "negative" | "neutral";

function comparePercent(today: number, yesterday: number) {
  if (yesterday === 0) {
    return {
      change: null,
      tone: "neutral" as Tone,
    };
  }

  const diff = ((today - yesterday) / yesterday) * 100;

  return {
    change: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`,
    tone: (diff >= 0 ? "positive" : "negative") as Tone,
  };
}

function compareNumber(today: number, yesterday: number) {
  const diff = today - yesterday;

  return {
    change: `${diff >= 0 ? "+" : ""}${diff}`,
    tone: (diff >= 0 ? "positive" : "negative") as Tone,
  };
}

const toneStyles: Record<Tone, string> = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
};

const toneBorders: Record<Tone, string> = {
  positive: "border-s-success",
  negative: "border-s-destructive",
  neutral: "border-s-border",
};

const toneIconStyles: Record<Tone, string> = {
  positive: "bg-success text-success-foreground",
  negative: "bg-destructive text-destructive-foreground",
  neutral: "bg-primary text-primary-foreground",
};

function ProductThumbnail({
  imageUrl,
  productName,
}: {
  imageUrl?: string;
  productName: string;
}) {
  if (imageUrl) {
    return (
      <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
        <Image
          src={imageUrl}
          alt={productName}
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface-subtle text-text-muted"
      aria-hidden="true"
    >
      <ImageIcon className="size-4" />
    </div>
  );
}

function DashboardStat({
  title,
  value,
  change,
  tone,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string | null;
  tone: Tone;
  description: string;
  icon: typeof DollarSign;
}) {
  return (
    <Card
      className={`overflow-hidden rounded-lg border border-border border-s-4 ${toneBorders[tone]} bg-card shadow-none transition-colors hover:bg-surface-subtle`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-muted">{title}</p>

            <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {value}
            </p>
          </div>

          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-md ${toneIconStyles[tone]}`}
          >
            <Icon className="size-5" />
          </div>
        </div>

        <div className="mt-4 flex min-h-5 items-center gap-2 text-xs">
          {change !== null && (
            <span className={`font-semibold tabular-nums ${toneStyles[tone]}`}>
              {change}
            </span>
          )}

          <span className="text-text-muted">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tStatus = useTranslations("status");
  const tOrders = useTranslations("orders");
  const te = useTranslations("errors");
  const locale = useLocale() as "en" | "ar";

  const statusLabel: Record<string, string> = {
    Pending: tStatus("pending"),
    Delivered: tStatus("delivered"),
    Cancelled: tStatus("cancelled"),
  };

  const chartConfig = {
    sales: {
      label: t("chartSales"),
      color: "var(--primary)",
    },
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const invalidateAll = useInvalidateAll();
  const toast = useAppToast();

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }) => updateOrderStatus(orderId, status),

    onSuccess: async (_data, variables) => {
      toast.success(
        variables.status === "Delivered"
          ? "orderMarkedDelivered"
          : "orderCancelled",
      );

      await invalidateAll();
    },

    onError: (error) => {
      toast.error(error, "updateOrderStatus");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-7">
        <div className="space-y-3">
          <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-lg border border-border bg-card"
            />
          ))}
        </div>

        <div className="h-88 animate-pulse rounded-lg border border-border bg-card" />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="h-80 animate-pulse rounded-lg border border-border bg-card" />
          <div className="h-80 animate-pulse rounded-lg border border-border bg-card" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-7">
        <PageHeader title={t("title")} description={t("description")} />

        <ErrorState
          description={apiErrorMessage(error, te, te("dashboard"))}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  function handleStatusChange(orderId: string, status: OrderStatus) {
    updateOrderStatusMutation.mutate({
      orderId,
      status,
    });
  }

  const { stats, salesData, orderStatus, recentOrders } = data;

  const pendingTotal =
    orderStatus.find((item) => item.label === "Pending")?.value ?? 0;

  const salesCompare = comparePercent(stats.todaySales, stats.yesterdaySales);

  const profitCompare = comparePercent(
    stats.todayProfit,
    stats.yesterdayProfit,
  );

  const ordersCompare = compareNumber(stats.todayOrders, stats.yesterdayOrders);

  const dashboardStats = [
    {
      title: t("todaySales"),
      value: formatCurrency(stats.todaySales, locale),
      ...salesCompare,
      description:
        salesCompare.change === null ? t("noSalesYesterday") : t("vsYesterday"),
      icon: DollarSign,
    },
    {
      title: t("todayProfit"),
      value: formatCurrency(stats.todayProfit, locale),
      ...profitCompare,
      description:
        profitCompare.change === null
          ? t("noProfitYesterday")
          : t("vsYesterday"),
      icon: TrendingUp,
    },
    {
      title: t("ordersToday"),
      value: stats.todayOrders.toString(),
      ...ordersCompare,
      description: t("vsYesterday"),
      icon: ShoppingBag,
    },
    {
      title: t("pendingOrders"),
      value: pendingTotal.toString(),
      change: null,
      tone: "neutral" as Tone,
      description: t("awaitingDelivery"),
      icon: Clock3,
    },
  ];

  const totalStatusOrders = orderStatus.reduce(
    (total, status) => total + status.value,
    0,
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-400 space-y-7"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <PageHeader title={t("title")} description={t("description")} />
      </motion.div>

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <DashboardStat
              title={stat.title}
              value={stat.value}
              change={stat.change}
              tone={stat.tone}
              description={stat.description}
              icon={stat.icon}
            />
          </motion.div>
        ))}
      </div>

      {/* Sales Overview */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-lg border border-border bg-card shadow-none">
          <CardHeader className="border-b border-border px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base font-semibold">
                {t("salesOverview")}
              </CardTitle>

              <CardDescription className="text-sm text-text-muted">
                {t("salesOverviewDescription")}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-3 py-5 sm:px-6">
            <ChartContainer config={chartConfig} className="h-75 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesData}
                  margin={{
                    top: 12,
                    right: 12,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{
                      fill: "var(--text-muted)",
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    width={52}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `$${value}`}
                    tick={{
                      fill: "var(--text-muted)",
                      fontSize: 12,
                    }}
                  />

                  <Tooltip
                    content={<ChartTooltipContent />}
                    cursor={{
                      stroke: "var(--border)",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.12}
                    strokeWidth={3}
                    activeDot={{
                      r: 5,
                      fill: "var(--primary)",
                      stroke: "var(--background)",
                      strokeWidth: 3,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Order Status + Recent Orders */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Order Status */}
        <motion.div variants={itemVariants}>
          <Card className="h-full rounded-lg border border-border bg-card shadow-none">
            <CardHeader className="border-b border-border px-5 py-4 sm:px-6">
              <CardTitle className="text-base font-semibold">
                {t("orderStatus")}
              </CardTitle>

              <CardDescription className="text-sm text-text-muted">
                {t("orderStatusDescription")}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-5 py-6 sm:px-6">
              <div className="space-y-6">
                {orderStatus.map((item) => {
                  const percentage =
                    totalStatusOrders === 0
                      ? 0
                      : Math.round((item.value / totalStatusOrders) * 100);

                  const statusColor = orderStatusDot[item.label as OrderStatus];

                  return (
                    <div key={item.label} className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`size-3 shrink-0 rounded-sm ${statusColor}`}
                          />

                          <span className="truncate text-sm font-medium">
                            {statusLabel[item.label] ?? item.label}
                          </span>
                        </div>

                        <div className="shrink-0 text-sm tabular-nums">
                          <span className="font-bold">
                            {formatNumber(item.value, locale)}
                          </span>

                          <span className="ms-1 text-xs text-text-muted">
                            ({percentage}%)
                          </span>
                        </div>
                      </div>

                      <div className="h-2 overflow-hidden rounded-sm bg-surface-subtle">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${percentage}%`,
                          }}
                          transition={{
                            duration: 0.45,
                            ease: "easeOut",
                          }}
                          className={`h-full rounded-sm ${statusColor}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 border-t border-border pt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{t("totalOrders")}</span>

                  <span className="font-bold tabular-nums">
                    {formatNumber(totalStatusOrders, locale)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders */}
        <motion.div variants={itemVariants}>
          <Card className="h-full rounded-lg border border-border bg-card shadow-none">
            <CardHeader className="border-b border-border px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold">
                    {t("recentOrders")}
                  </CardTitle>

                  <CardDescription className="mt-1 text-sm text-text-muted">
                    {t("recentOrdersDescription")}
                  </CardDescription>
                </div>

                <Button
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  render={<Link href="/orders" />}
                  className="shrink-0"
                >
                  <span>{t("viewAll")}</span>
                  <ArrowUpRight className="size-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                  <ShoppingBag className="size-8 text-text-subtle" />

                  <p className="text-sm font-medium">{t("empty")}</p>
                </div>
              ) : (
                <>
                  {/* Desktop */}
                  <div className="hidden max-h-105 overflow-y-auto md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="ps-6 text-xs font-semibold text-text-muted">
                            {t("tableOrder")}
                          </TableHead>

                          <TableHead className="text-xs font-semibold text-text-muted">
                            {t("tableCustomer")}
                          </TableHead>

                          <TableHead className="text-xs font-semibold text-text-muted">
                            {t("tableItems")}
                          </TableHead>

                          <TableHead className="text-xs font-semibold text-text-muted">
                            {t("tableAmount")}
                          </TableHead>

                          <TableHead className="text-xs font-semibold text-text-muted">
                            {t("tableStatus")}
                          </TableHead>

                          <TableHead className="w-10 pe-6" />
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {recentOrders.map((order) => {
                          const firstItem = order.items[0];

                          const additionalItems = Math.max(
                            order.items.length - 1,
                            0,
                          );

                          return (
                            <TableRow key={order._id} className="group">
                              <TableCell className="ps-6 font-semibold tabular-nums">
                                <span dir="ltr">#{order.orderNumber ?? "—"}</span>
                              </TableCell>

                              <TableCell className="font-medium">
                                {order.customer}
                              </TableCell>

                              <TableCell>
                                <div className="flex min-w-0 items-center gap-3">
                                  {firstItem && (
                                    <ProductThumbnail
                                      imageUrl={firstItem.imageUrl}
                                      productName={firstItem.name}
                                    />
                                  )}

                                  <div className="flex min-w-0 items-center gap-1.5">
                                    <span className="max-w-32 truncate">
                                      {firstItem?.name ??
                                        summarizeItems(order, tOrders).label}
                                    </span>

                                    {additionalItems > 0 && (
                                      <span className="shrink-0 text-xs font-semibold text-text-muted">
                                        +{formatNumber(additionalItems, locale)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="font-bold tabular-nums">
                                {formatCurrency(order.total, locale)}
                              </TableCell>

                              <TableCell>
                                <StatusBadge status={order.status} />
                              </TableCell>

                              <TableCell className="pe-6">
                                <OrderActions
                                  order={order}
                                  onStatusChange={handleStatusChange}
                                  isUpdatingStatus={
                                    updateOrderStatusMutation.isPending
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile */}
                  <div className="max-h-105 space-y-3 overflow-y-auto p-4 md:hidden">
                    {recentOrders.map((order) => {
                      const firstItem = order.items[0];

                      const additionalItems = Math.max(
                        order.items.length - 1,
                        0,
                      );

                      return (
                        <div
                          key={order._id}
                          className="rounded-md border border-border bg-surface p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              {firstItem && (
                                <ProductThumbnail
                                  imageUrl={firstItem.imageUrl}
                                  productName={firstItem.name}
                                />
                              )}

                              <div className="min-w-0">
                                <p className="text-sm font-semibold">
                                  {order.customer}{" "}
                                  <span
                                    dir="ltr"
                                    className="text-xs font-normal text-text-muted tabular-nums"
                                  >
                                    #{order.orderNumber ?? "—"}
                                  </span>
                                </p>

                                <div className="mt-1 flex min-w-0 items-center gap-1.5">
                                  <p className="truncate text-sm text-text-muted">
                                    {firstItem?.name ??
                                      summarizeItems(order, tOrders).label}
                                  </p>

                                  {additionalItems > 0 && (
                                    <span className="shrink-0 text-xs font-semibold text-text-muted">
                                      +{formatNumber(additionalItems, locale)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <OrderActions
                              order={order}
                              onStatusChange={handleStatusChange}
                              isUpdatingStatus={
                                updateOrderStatusMutation.isPending
                              }
                            />
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                            <span className="font-bold tabular-nums">
                              {formatCurrency(order.total, locale)}
                            </span>

                            <StatusBadge status={order.status} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
