"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Clock3, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
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
import { shortId, summarizeItems } from "@/lib/orders";
import { orderStatusDot } from "@/lib/status";
import { containerVariants, itemVariants } from "@/lib/motion";
import { formatCurrency } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import ErrorState from "@/components/ErrorState";
import OrderActions from "@/components/OrderActions";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";

type Tone = "positive" | "negative" | "neutral";

// لو أمس ما كان في مبيعات، النسبة ما إلها معنى (قبل كانت بتطلع +100% عشوائياً)
function comparePercent(today: number, yesterday: number) {
  if (yesterday === 0) {
    return { change: null, tone: "neutral" as Tone };
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

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tStatus = useTranslations("status");
  const tOrders = useTranslations("orders");
  const te = useTranslations("errors");
  const locale = useLocale() as "en" | "ar";

  // API statuses stay English; this map only translates them for display.
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
  const queryClient = useQueryClient();

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }) => updateOrderStatus(orderId, status),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl border bg-card"
            />
          ))}
        </div>

        <div className="h-96 animate-pulse rounded-xl border bg-card" />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="h-80 animate-pulse rounded-xl border bg-card" />
          <div className="h-80 animate-pulse rounded-xl border bg-card" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
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

  // الأوردرات المعلّقة الكلية (مش بس اللي انعملت اليوم):
  // أوردر معلّق من أمس لسا لازم يتسلّم، وهاد الرقم اللي بيهمك تشوفو
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
        salesCompare.change === null
          ? t("noSalesYesterday")
          : t("vsYesterday"),
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
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <PageHeader title={t("title")} description={t("description")} />
      </motion.div>

      {/* لو تغيير الحالة فشل (مثلاً مخزون ما كفى لإعادة أوردر ملغى) */}
      {updateOrderStatusMutation.isError && (
        <p className="text-sm text-destructive" role="alert">
          {apiErrorMessage(
            updateOrderStatusMutation.error,
            te,
            te("updateOrderStatus"),
          )}
        </p>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <StatCard
              label={stat.title}
              value={stat.value}
              icon={stat.icon}
              hint={
                <>
                  {stat.change !== null && (
                    <>
                      <span className={`font-medium ${toneStyles[stat.tone]}`}>
                        {stat.change}
                      </span>{" "}
                    </>
                  )}

                  <span>{stat.description}</span>
                </>
              }
            />
          </motion.div>
        ))}
      </div>

      {/* Sales Overview */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              {t("salesOverview")}
            </CardTitle>

            <CardDescription>{t("salesOverviewDescription")}</CardDescription>
          </CardHeader>

          <CardContent>
            <ChartContainer config={chartConfig} className="h-70 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesData}
                  margin={{
                    top: 10,
                    right: 8,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid vertical={false} stroke="var(--border)" />

                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{
                      fill: "var(--muted-foreground)",
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    width={48}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `$${value}`}
                    tick={{
                      fill: "var(--muted-foreground)",
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
                    fillOpacity={0.08}
                    strokeWidth={2}
                    activeDot={{
                      r: 4,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Section */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        {/* Order Status */}
        <motion.div variants={itemVariants}>
          <Card className="h-full shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {t("orderStatus")}
              </CardTitle>

              <CardDescription>{t("orderStatusDescription")}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-5">
                {orderStatus.map((item) => {
                  const percentage =
                    totalStatusOrders === 0
                      ? 0
                      : Math.round((item.value / totalStatusOrders) * 100);

                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`size-2 shrink-0 rounded-full ${
                              orderStatusDot[item.label as OrderStatus]
                            }`}
                          />

                          <span className="truncate">
                            {statusLabel[item.label] ?? item.label}
                          </span>
                        </div>

                        <span className="tabular-nums">
                          <span className="font-medium">{item.value}</span>{" "}
                          <span className="text-xs text-muted-foreground">
                            · {percentage}%
                          </span>
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            orderStatusDot[item.label as OrderStatus]
                          }`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Orders */}
        <motion.div variants={itemVariants}>
          <Card className="h-full shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {t("recentOrders")}
                  </CardTitle>

                  <CardDescription>{t("recentOrdersDescription")}</CardDescription>
                </div>

                <Button
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  render={<Link href="/orders" />}
                >
                  {t("viewAll")}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center p-6 text-sm text-muted-foreground">
                  {t("empty")}
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden max-h-100 overflow-y-auto md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="ps-6 text-xs font-medium text-muted-foreground">
                            {t("tableOrder")}
                          </TableHead>

                          <TableHead className="text-xs font-medium text-muted-foreground">
                            {t("tableCustomer")}
                          </TableHead>

                          <TableHead className="text-xs font-medium text-muted-foreground">
                            {t("tableItems")}
                          </TableHead>

                          <TableHead className="text-xs font-medium text-muted-foreground">
                            {t("tableAmount")}
                          </TableHead>

                          <TableHead className="text-xs font-medium text-muted-foreground">
                            {t("tableStatus")}
                          </TableHead>

                          <TableHead className="w-10 pe-6" />
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {recentOrders.map((order) => (
                          <TableRow key={order._id}>
                            <TableCell className="ps-6 font-medium tabular-nums">
                              <span dir="ltr">#{shortId(order._id)}</span>
                            </TableCell>

                            <TableCell>{order.customer}</TableCell>

                            <TableCell className="max-w-40 truncate text-muted-foreground">
                              {summarizeItems(order, tOrders).label}
                            </TableCell>

                            <TableCell className="font-medium tabular-nums">
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="max-h-70 space-y-2 overflow-y-auto p-4 md:hidden">
                    {recentOrders.map((order) => (
                      <div
                        key={order._id}
                        className="rounded-lg border bg-card p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {order.customer}{" "}
                              <span
                                dir="ltr"
                                className="text-xs font-normal text-muted-foreground tabular-nums"
                              >
                                #{shortId(order._id)}
                              </span>
                            </p>

                            <p className="mt-1 truncate text-sm text-muted-foreground">
                              {summarizeItems(order, tOrders).label}
                            </p>
                          </div>

                          <OrderActions
                            order={order}
                            onStatusChange={handleStatusChange}
                            isUpdatingStatus={
                              updateOrderStatusMutation.isPending
                            }
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="font-medium tabular-nums">
                            {formatCurrency(order.total, locale)}
                          </span>

                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    ))}
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
