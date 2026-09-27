"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Clock3,
  DollarSign,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type OrderStatus = "Delivered" | "Pending" | "Processing" | "Cancelled";

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

const statusStyles: Record<OrderStatus, string> = {
  Delivered:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400",
  Pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400",
  Processing:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400",
  Cancelled:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={`font-medium ${statusStyles[status]}`}>
      {status}
    </Badge>
  );
}

function OrderActions({ order }: { order: Order }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Actions for order ${order.id}`}
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem>View Order</DropdownMenuItem>
        <DropdownMenuItem>Edit Order</DropdownMenuItem>

        <DropdownMenuSeparator />

        {order.status === "Pending" && (
          <DropdownMenuItem>Mark as Processing</DropdownMenuItem>
        )}

        {order.status === "Processing" && (
          <DropdownMenuItem>Mark as Delivered</DropdownMenuItem>
        )}

        {order.status !== "Cancelled" && order.status !== "Delivered" && (
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            Cancel Order
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = useMemo(() => {
    const totalOrders = orders.length;

    const pendingOrders = orders.filter(
      (order) => order.status === "Pending",
    ).length;

    const processingOrders = orders.filter(
      (order) => order.status === "Processing",
    ).length;

    const revenue = orders
      .filter((order) => order.status !== "Cancelled")
      .reduce((total, order) => total + order.total, 0);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      revenue,
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
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Orders
          </h1>

          <p className="text-sm text-muted-foreground">
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

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
              <ShoppingBag className="size-5 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {stats.totalOrders}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-amber-50 dark:bg-amber-950/30">
              <Clock3 className="size-5 text-amber-600 dark:text-amber-400" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {stats.pendingOrders}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-blue-50 dark:bg-blue-950/30">
              <Package className="size-5 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Processing</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {stats.processingOrders}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
              <DollarSign className="size-5 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                ${stats.revenue.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders */}
      <Card className="shadow-none">
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">All Orders</CardTitle>

            <p className="text-sm text-muted-foreground">
              View and manage all customer orders.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 sm:max-w-sm">
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
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <div className="max-h-[520px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {order.date}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-full border bg-muted">
                              <UserRound className="size-4 text-muted-foreground" />
                            </div>

                            <span className="font-medium">
                              {order.customer}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <p>{order.product}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Qty: {order.quantity}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="font-medium tabular-nums">
                          ${order.total.toFixed(2)}
                        </TableCell>

                        <TableCell className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +${order.profit.toFixed(2)}
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>

                        <TableCell>
                          <OrderActions order={order} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-sm text-muted-foreground"
                      >
                        No orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Orders */}
          <div className="md:hidden">
            <div className="max-h-[560px] overflow-y-scroll">
              <div className="divide-y">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <div key={order.id} className="space-y-4 p-4">
                      {/* Order Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{order.id}</p>

                            <StatusBadge status={order.status} />
                          </div>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.date}
                          </p>
                        </div>

                        <OrderActions order={order} />
                      </div>

                      {/* Customer */}
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted">
                          <UserRound className="size-4 text-muted-foreground" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {order.customer}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Customer
                          </p>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="rounded-md border p-3">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              Product
                            </p>

                            <p className="mt-1 truncate text-sm font-medium">
                              {order.product}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Quantity
                            </p>

                            <p className="mt-1 text-sm font-medium tabular-nums">
                              {order.quantity}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Total
                            </p>

                            <p className="mt-1 text-sm font-semibold tabular-nums">
                              ${order.total.toFixed(2)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Profit
                            </p>

                            <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              +${order.profit.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex min-h-32 items-center justify-center p-6 text-sm text-muted-foreground">
                    No orders found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result count */}
      <div className="text-xs text-muted-foreground">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>
    </div>
  );
}
