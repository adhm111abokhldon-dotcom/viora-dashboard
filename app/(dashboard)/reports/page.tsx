"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

const salesData = [
  { day: "Mon", sales: 85, profit: 42 },
  { day: "Tue", sales: 120, profit: 58 },
  { day: "Wed", sales: 95, profit: 46 },
  { day: "Thu", sales: 160, profit: 78 },
  { day: "Fri", sales: 135, profit: 65 },
  { day: "Sat", sales: 190, profit: 91 },
  { day: "Sun", sales: 245, profit: 108 },
];

const topProducts = [
  {
    name: "LED Bear",
    orders: 18,
    revenue: 378,
    profit: 270,
  },
  {
    name: "Lipstick",
    orders: 12,
    revenue: 180,
    profit: 120,
  },
  {
    name: "Mini Perfume",
    orders: 8,
    revenue: 144,
    profit: 88,
  },
  {
    name: "Phone Stand",
    orders: 5,
    revenue: 60,
    profit: 40,
  },
];

const orderStatusData = [
  {
    name: "Delivered",
    value: 24,
  },
  {
    name: "Pending",
    value: 7,
  },
  {
    name: "Processing",
    value: 5,
  },
  {
    name: "Cancelled",
    value: 3,
  },
];

const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--chart-1)",
  },
  profit: {
    label: "Profit",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const statusColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-5)",
];

export default function ReportsPage() {
  const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);

  const totalProfit = salesData.reduce((sum, item) => sum + item.profit, 0);

  const totalOrders = orderStatusData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Reports
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Review your sales, profit, and order performance.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard
          title="Total Sales"
          value={`$${totalSales.toFixed(2)}`}
          description="+12.5% vs previous period"
          icon={DollarSign}
          positive
        />

        <ReportCard
          title="Total Profit"
          value={`$${totalProfit.toFixed(2)}`}
          description="+8.2% vs previous period"
          icon={TrendingUp}
          positive
        />

        <ReportCard
          title="Total Orders"
          value={totalOrders.toString()}
          description="+6 orders vs previous period"
          icon={ShoppingBag}
          positive
        />

        <ReportCard
          title="Average Order"
          value={`$${averageOrderValue.toFixed(2)}`}
          description="-2.1% vs previous period"
          icon={BarChart3}
          positive={false}
        />
      </div>

      {/* Sales Chart */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Sales & Profit</CardTitle>

          <p className="text-sm text-muted-foreground">
            Daily sales and profit performance.
          </p>
        </CardHeader>

        <CardContent>
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
                tickMargin={8}
                tickFormatter={(value) => `$${value}`}
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      `$${Number(value).toFixed(2)}`,
                      name === "sales" ? "Sales" : "Profit",
                    ]}
                  />
                }
              />

              <Bar
                dataKey="sales"
                fill="var(--color-sales)"
                radius={[4, 4, 0, 0]}
              />

              <Bar
                dataKey="profit"
                fill="var(--color-profit)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>

            <p className="text-sm text-muted-foreground">
              Products generating the most revenue.
            </p>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-sm font-medium tabular-nums">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {product.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.orders} orders
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">
                      ${product.revenue.toFixed(2)}
                    </p>

                    <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +${product.profit.toFixed(2)} profit
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Order Status</CardTitle>

            <p className="text-sm text-muted-foreground">
              Current distribution of your orders.
            </p>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <ChartContainer
                config={chartConfig}
                className="h-55 w-full max-w-55"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />

                  <Pie
                    data={orderStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={statusColors[index % statusColors.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              <div className="w-full space-y-4">
                {orderStatusData.map((item, index) => {
                  const percentage = (item.value / totalOrders) * 100;

                  return (
                    <div key={item.name} className="flex items-center gap-3">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            statusColors[index % statusColors.length],
                        }}
                      />

                      <span className="flex-1 text-sm">{item.name}</span>

                      <span className="text-sm font-medium tabular-nums">
                        {item.value}
                      </span>

                      <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Snapshot */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Business Snapshot</CardTitle>

          <p className="text-sm text-muted-foreground">
            A quick overview of your current performance.
          </p>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SnapshotItem
              icon={Package}
              label="Delivered Orders"
              value="24"
              description="Successfully completed"
            />

            <SnapshotItem
              icon={CheckCircle2}
              label="Delivery Rate"
              value="77.4%"
              description="Of all created orders"
            />

            <SnapshotItem
              icon={TrendingUp}
              label="Profit Margin"
              value="45.7%"
              description="Average across sales"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportCard({
  title,
  value,
  description,
  icon: Icon,
  positive,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof DollarSign;
  positive: boolean;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>

            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </p>
          </div>

          <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/50">
            <Icon className="size-5 text-muted-foreground" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs">
          {positive ? (
            <ArrowUpRight className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowDownRight className="size-3.5 text-muted-foreground" />
          )}

          <span
            className={
              positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            }
          >
            {description}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SnapshotItem({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted/50">
          <Icon className="size-4 text-muted-foreground" />
        </div>

        <p className="text-sm font-medium">{label}</p>
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
