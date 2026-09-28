"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Clock3,
  DollarSign,
  MoreHorizontal,
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
import { Badge } from "@/components/ui/badge";
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
import { getDashboard, OrderStatus, updateOrderStatus } from "@/lib/api";
import OrderActions from "@/components/OrderActions";

const statusStyles: Record<string, string> = {
  Delivered:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400",

  Pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400",

  Cancelled:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400",
};

const statusBarStyles: Record<string, string> = {
  Delivered: "bg-emerald-500",
  Pending: "bg-amber-500",
  Cancelled: "bg-red-500",
};

const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--primary)",
  },
};

function calculatePercentageChange(today: number, yesterday: number) {
  if (yesterday === 0) {
    return today === 0 ? "0%" : "+100%";
  }

  const change = ((today - yesterday) / yesterday) * 100;

  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function calculateNumberChange(today: number, yesterday: number) {
  const change = today - yesterday;

  return `${change >= 0 ? "+" : ""}${change}`;
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
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
      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });

      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
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
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Failed to load dashboard.
        </p>
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

  const dashboardStats = [
    {
      title: "Today's Sales",
      value: `$${stats.todaySales.toFixed(2)}`,
      change: calculatePercentageChange(stats.todaySales, stats.yesterdaySales),
      description: "vs. yesterday",
      icon: DollarSign,
      isPositive: stats.todaySales >= stats.yesterdaySales,
    },
    {
      title: "Today's Profit",
      value: `$${stats.todayProfit.toFixed(2)}`,
      change: calculatePercentageChange(
        stats.todayProfit,
        stats.yesterdayProfit,
      ),
      description: "vs. yesterday",
      icon: TrendingUp,
      isPositive: stats.todayProfit >= stats.yesterdayProfit,
    },
    {
      title: "Orders Today",
      value: stats.todayOrders.toString(),
      change: calculateNumberChange(stats.todayOrders, stats.yesterdayOrders),
      description: "vs. yesterday",
      icon: ShoppingBag,
      isPositive: stats.todayOrders >= stats.yesterdayOrders,
    },
    {
      title: "Pending Orders",
      value: stats.todayPendingOrders.toString(),
      change: calculateNumberChange(
        stats.todayPendingOrders,
        stats.yesterdayPendingOrders,
      ),
      description: "vs. yesterday",
      icon: Clock3,
      isPositive: stats.todayPendingOrders <= stats.yesterdayPendingOrders,
    },
  ];

  const totalStatusOrders = orderStatus.reduce(
    (total, status) => total + status.value,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Track your sales, orders, and business performance.
        </p>
      </motion.header>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: index * 0.05,
              }}
            >
              <Card className="h-full shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">
                        {stat.title}
                      </p>

                      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                        {stat.value}
                      </p>
                    </div>

                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                  </div>

                  <p className="mt-3 text-xs">
                    <span
                      className={`font-medium ${
                        stat.isPositive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {stat.change}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {stat.description}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Sales Overview */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          delay: 0.2,
        }}
      >
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Sales Overview
            </CardTitle>

            <CardDescription>
              Sales performance over the last 7 days.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ChartContainer config={chartConfig} className="h-70 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesData}
                  margin={{
                    top: 10,
                    right: 8,
                    left: -20,
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
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            delay: 0.25,
          }}
        >
          <Card className="h-full shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Order Status
              </CardTitle>

              <CardDescription>Current order distribution.</CardDescription>
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
                              statusBarStyles[item.label]
                            }`}
                          />

                          <span className="truncate">{item.label}</span>
                        </div>

                        <span className="font-medium tabular-nums">
                          {item.value}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            statusBarStyles[item.label]
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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            delay: 0.3,
          }}
        >
          <Card className="h-full shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Recent Orders
                  </CardTitle>

                  <CardDescription>Your latest orders.</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden max-h-100 overflow-y-scroll md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="ps-6 text-xs font-medium text-muted-foreground">
                        Order
                      </TableHead>

                      <TableHead className="text-xs font-medium text-muted-foreground">
                        Product
                      </TableHead>

                      <TableHead className="text-xs font-medium text-muted-foreground">
                        Amount
                      </TableHead>

                      <TableHead className="text-xs font-medium text-muted-foreground">
                        Status
                      </TableHead>

                      <TableHead className="w-10 pe-6" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="ps-6 font-medium tabular-nums">
                          #{order._id.slice(-6)}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {order.product}
                        </TableCell>

                        <TableCell className="font-medium tabular-nums">
                          ${order.total.toFixed(2)}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusStyles[order.status]}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="pr-6">
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
              <div className="max-h-70 space-y-2 overflow-y-scroll p-4 md:hidden">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="rounded-lg border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium tabular-nums">
                          #{order._id.slice(-6)}
                        </p>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {order.product}
                        </p>
                      </div>

                      <OrderActions
                        order={order}
                        onStatusChange={handleStatusChange}
                        isUpdatingStatus={updateOrderStatusMutation.isPending}
                      />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="font-medium tabular-nums">
                        ${order.total.toFixed(2)}
                      </span>

                      <Badge
                        variant="outline"
                        className={statusStyles[order.status]}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
