"use client";

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

const stats = [
  {
    title: "Today's Sales",
    value: "$245.00",
    change: "+12.5%",
    description: "vs. yesterday",
    icon: DollarSign,
  },
  {
    title: "Today's Profit",
    value: "$108.00",
    change: "+8.2%",
    description: "vs. yesterday",
    icon: TrendingUp,
  },
  {
    title: "Orders Today",
    value: "12",
    change: "+3",
    description: "vs. yesterday",
    icon: ShoppingBag,
  },
  {
    title: "Pending Orders",
    value: "4",
    change: "-2",
    description: "vs. yesterday",
    icon: Clock3,
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
  {
    id: "#1029",
    product: "Lipstick",
    amount: "$15.00",
    status: "Delivered",
  },
  {
    id: "#1025",
    product: "Lipstick",
    amount: "$15.00",
    status: "Delivered",
  },
  {
    id: "#1026",
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

const statusStyles: Record<string, string> = {
  Delivered:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400",

  Pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400",

  Processing:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400",

  Cancelled:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400",
};

const statusBarStyles: Record<string, string> = {
  Delivered: "bg-emerald-500",
  Pending: "bg-amber-500",
  Processing: "bg-blue-500",
  Cancelled: "bg-red-500",
};

const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--primary)",
  },
};

export default function DashboardPage() {
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
        {stats.map((stat, index) => {
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
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
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
                {orderStatus.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`size-2 shrink-0 rounded-full ${statusBarStyles[item.label]}`}
                        />

                        <span className="truncate">{item.label}</span>
                      </div>

                      <span className="font-medium tabular-nums">
                        {item.value}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${statusBarStyles[item.label]}`}
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
              <div className="hidden md:block max-h-100 overflow-y-scroll">
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
                      <TableRow key={order.id}>
                        <TableCell className="ps-6 font-medium tabular-nums">
                          {order.id}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {order.product}
                        </TableCell>

                        <TableCell className="font-medium tabular-nums">
                          {order.amount}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Actions for ${order.id}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-2 p-4 md:hidden max-h-70 overflow-y-scroll">
                {recentOrders.map((order) => (
                  <div key={order.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium tabular-nums">
                          {order.id}
                        </p>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {order.product}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        aria-label={`Actions for ${order.id}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="font-medium tabular-nums">
                        {order.amount}
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
