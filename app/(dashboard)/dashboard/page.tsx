"use client";

import { motion } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  DollarSign,
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Today's Sales",
    value: "$245.00",
    change: "+12.5%",
    description: "vs. yesterday",
    icon: DollarSign,
    positive: true,
  },
  {
    title: "Today's Profit",
    value: "$108.00",
    change: "+8.2%",
    description: "vs. yesterday",
    icon: TrendingUp,
    positive: true,
  },
  {
    title: "Orders Today",
    value: "12",
    change: "+3",
    description: "vs. yesterday",
    icon: ShoppingBag,
    positive: true,
  },
  {
    title: "Pending Orders",
    value: "4",
    change: "-2",
    description: "vs. yesterday",
    icon: Clock3,
    positive: false,
  },
];

const salesData = [
  { date: "Mon", sales: 85 },
  { date: "Tue", sales: 120 },
  { date: "Wed", sales: 95 },
  { date: "Thu", sales: 160 },
  { date: "Fri", sales: 135 },
  { date: "Sat", sales: 190 },
  { date: "Sun", sales: 245 },
];

const recentOrders = [
  {
    id: "#1024",
    product: "LED Bear",
    amount: "$21.00",
    status: "Delivered",
  },
  {
    id: "#1023",
    product: "Lipstick",
    amount: "$15.00",
    status: "Pending",
  },
  {
    id: "#1022",
    product: "LED Bear",
    amount: "$21.00",
    status: "Cancelled",
  },
  {
    id: "#1021",
    product: "Lipstick",
    amount: "$15.00",
    status: "Delivered",
  },
];

const orderStatus = [
  {
    label: "Delivered",
    value: 24,
    percentage: 71,
  },
  {
    label: "Pending",
    value: 7,
    percentage: 21,
  },
  {
    label: "Cancelled",
    value: 3,
    percentage: 8,
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Cancelled: "bg-destructive/10 text-destructive",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status as keyof typeof styles]
      }`}
    >
      {status}
    </span>
  );
}

export default function DashboardPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-[1600px] space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Dashboard
        </h1>

        <p className="text-sm text-muted-foreground sm:text-[15px]">
          Here&apos;s an overview of your business performance today.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <motion.div key={stat.title} variants={itemVariants}>
              <Card className="shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>

                      <p className="text-2xl font-semibold tracking-tight tabular-nums">
                        {stat.value}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs">
                        {stat.positive ? (
                          <ArrowUpRight className="size-3.5 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="size-3.5 text-muted-foreground" />
                        )}

                        <span
                          className={
                            stat.positive
                              ? "font-medium text-emerald-600 dark:text-emerald-400"
                              : "font-medium text-muted-foreground"
                          }
                        >
                          {stat.change}
                        </span>

                        <span className="text-muted-foreground">
                          {stat.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/40">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Analytics */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        {/* Sales Chart */}
        <motion.div variants={itemVariants}>
          <Card className="h-full shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">
                  Sales Overview
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                  Sales performance over the last 7 days
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-semibold tracking-tight tabular-nums">
                  $1,030
                </p>

                <p className="text-xs text-muted-foreground">Total sales</p>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <div className="h-[300px] w-full">
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
                    <defs>
                      <linearGradient
                        id="salesGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--primary)"
                          stopOpacity={0.2}
                        />

                        <stop
                          offset="100%"
                          stopColor="var(--primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border)"
                      strokeDasharray="4 4"
                    />

                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "var(--muted-foreground)",
                        fontSize: 12,
                      }}
                      dy={8}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "var(--muted-foreground)",
                        fontSize: 12,
                      }}
                      tickFormatter={(value) => `$${value}`}
                    />

                    <Tooltip
                      cursor={{
                        stroke: "var(--border)",
                      }}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        background: "var(--popover)",
                        color: "var(--popover-foreground)",
                        boxShadow: "none",
                      }}
                      formatter={(value) => [`$${value}`, "Sales"]}
                    />

                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#salesGradient)"
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: "var(--primary)",
                        stroke: "var(--background)",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Status */}
        <motion.div variants={itemVariants}>
          <Card className="h-full shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Order Status
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Current order distribution
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">
                  34
                </span>

                <span className="mb-1 text-sm text-muted-foreground">
                  total orders
                </span>
              </div>

              <div className="space-y-5">
                {orderStatus.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.label}</span>

                      <span className="tabular-nums text-muted-foreground">
                        {item.value} · {item.percentage}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${item.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold">
                Recent Orders
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Your latest customer orders
              </p>
            </div>

            <button className="text-sm font-medium text-primary transition-opacity hover:opacity-80">
              View all
            </button>
          </CardHeader>

          <CardContent className="p-0">
            {/* Desktop */}
            <div className="hidden md:block">
              <div className="grid grid-cols-[1fr_2fr_1fr_1fr] border-y px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Order</span>
                <span>Product</span>
                <span>Amount</span>
                <span>Status</span>
              </div>

              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-[1fr_2fr_1fr_1fr] items-center border-b px-6 py-4 last:border-b-0"
                >
                  <span className="text-sm font-medium">{order.id}</span>

                  <span className="text-sm text-muted-foreground">
                    {order.product}
                  </span>

                  <span className="text-sm font-medium tabular-nums">
                    {order.amount}
                  </span>

                  <div>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile */}
            <div className="divide-y md:hidden">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">{order.product}</p>

                    <p className="text-xs text-muted-foreground">{order.id}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-sm font-medium tabular-nums">
                      {order.amount}
                    </span>

                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
