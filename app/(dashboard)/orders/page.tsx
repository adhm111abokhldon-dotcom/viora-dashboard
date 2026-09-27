"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  Eye,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type OrderStatus = "Pending" | "Processing" | "Delivered" | "Cancelled";

type Order = {
  id: string;
  customer: string;
  product: string;
  quantity: number;
  total: number;
  profit: number;
  status: OrderStatus;
  date: string;
};

const orders: Order[] = [
  {
    id: "#1024",
    customer: "Ahmad Khalil",
    product: "LED Bear",
    quantity: 1,
    total: 21,
    profit: 15,
    status: "Delivered",
    date: "Sep 27, 2026",
  },
  {
    id: "#1023",
    customer: "Sara Ahmad",
    product: "Lipstick",
    quantity: 2,
    total: 30,
    profit: 20,
    status: "Pending",
    date: "Sep 27, 2026",
  },
  {
    id: "#1022",
    customer: "Mohammad Ali",
    product: "LED Bear",
    quantity: 1,
    total: 21,
    profit: 15,
    status: "Cancelled",
    date: "Sep 26, 2026",
  },
  {
    id: "#1021",
    customer: "Lina Hassan",
    product: "Mini Perfume",
    quantity: 2,
    total: 36,
    profit: 22,
    status: "Delivered",
    date: "Sep 26, 2026",
  },
  {
    id: "#1020",
    customer: "Omar Saleh",
    product: "Phone Stand",
    quantity: 2,
    total: 24,
    profit: 16,
    status: "Processing",
    date: "Sep 25, 2026",
  },
  {
    id: "#1019",
    customer: "Rana Samir",
    product: "LED Bear",
    quantity: 2,
    total: 42,
    profit: 30,
    status: "Delivered",
    date: "Sep 25, 2026",
  },
  {
    id: "#1018",
    customer: "Tarek Nasser",
    product: "Lipstick",
    quantity: 1,
    total: 15,
    profit: 10,
    status: "Pending",
    date: "Sep 24, 2026",
  },
  {
    id: "#1017",
    customer: "Maya Fares",
    product: "Mini Perfume",
    quantity: 1,
    total: 18,
    profit: 11,
    status: "Processing",
    date: "Sep 24, 2026",
  },
];

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    className: string;
    icon: typeof Clock3;
  }
> = {
  Pending: {
    label: "Pending",
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: Clock3,
  },
  Processing: {
    label: "Processing",
    className:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon: Truck,
  },
  Delivered: {
    label: "Delivered",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  Cancelled: {
    label: "Cancelled",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
    icon: XCircle,
  },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((order) => order.status !== "Cancelled")
      .reduce((sum, order) => sum + order.total, 0);

    const totalOrders = orders.length;

    const pending = orders.filter((order) => order.status === "Pending").length;

    const processing = orders.filter(
      (order) => order.status === "Processing",
    ).length;

    const delivered = orders.filter(
      (order) => order.status === "Delivered",
    ).length;

    return {
      totalRevenue,
      totalOrders,
      pending,
      processing,
      delivered,
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.product.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        order.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Orders
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your orders and track their status.
          </p>
        </div>

        <Button
          render={<Link href="/orders/add-order" />}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" />
          New Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>

              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {stats.totalOrders}
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/50">
              <ShoppingBag className="size-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>

              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {stats.pending}
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/50">
              <Clock3 className="size-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Processing</p>

              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {stats.processing}
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/50">
              <PackageCheck className="size-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>

              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                ${stats.totalRevenue.toFixed(2)}
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/50">
              <DollarSign className="size-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders */}
      <Card className="shadow-none">
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle className="text-base">All Orders</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              View and manage all customer orders.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search orders..."
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value ?? "all")}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>

                <SelectItem value="pending">Pending</SelectItem>

                <SelectItem value="processing">Processing</SelectItem>

                <SelectItem value="delivered">Delivered</SelectItem>

                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                    Order
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                    Product
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">
                    Total
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">
                    Profit
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">
                    Date
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-5 py-4">
                      <span className="font-medium tabular-nums">
                        {order.id}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm">{order.customer}</span>
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium">{order.product}</p>

                        <p className="text-xs text-muted-foreground">
                          Qty: {order.quantity}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-medium tabular-nums">
                        ${order.total.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +${order.profit.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="text-sm text-muted-foreground">
                        {order.date}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <OrderActions />
                    </td>
                  </tr>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/50">
                          <Search className="size-5 text-muted-foreground" />
                        </div>

                        <p className="mt-3 text-sm font-medium">
                          No orders found
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Try changing your search or filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Orders */}
          <div className="divide-y md:hidden">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium tabular-nums">
                        {order.id}
                      </span>

                      <StatusBadge status={order.status} />
                    </div>

                    <p className="mt-1 truncate text-sm font-medium">
                      {order.customer}
                    </p>
                  </div>

                  <OrderActions />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Product</p>

                    <p className="mt-1 text-sm font-medium">{order.product}</p>

                    <p className="text-xs text-muted-foreground">
                      Qty: {order.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>

                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      ${order.total.toFixed(2)}
                    </p>

                    <p className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +${order.profit.toFixed(2)} profit
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    {order.date}
                  </span>

                  <Button variant="ghost" size="sm" className="h-8">
                    <Eye className="size-3.5" />
                    View
                  </Button>
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-lg border bg-muted/50">
                  <Search className="size-5 text-muted-foreground" />
                </div>

                <p className="mt-3 text-sm font-medium">No orders found</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Try changing your search or filter.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Order actions"
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem>
          <Eye className="size-4" />
          View Order
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Truck className="size-4" />
          Update Status
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <XCircle className="size-4" />
          Cancel Order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
