"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  ShoppingBag,
  UserRound,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

import {
  getOrders,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from "@/lib/api";
import { Pagination } from "@/components/ui/Pagination";
import ProductsLoading from "@/components/ProductsLoading";
import OrderActions from "@/components/OrderActions";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut" as const,
    },
  },
};

const statusStyles: Record<OrderStatus, string> = {
  Delivered:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400",

  Pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400",

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

export default function OrdersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const limit = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["orders", page, limit],
    queryFn: () => getOrders(page, limit),
  });

  const orders = data?.orders ?? [];
  const pagination = data?.pagination;

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
        queryKey: ["orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
  });

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order._id.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.product.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const totalOrders = pagination?.totalOrders ?? 0;

    const pendingOrders = orders.filter(
      (order) => order.status === "Pending",
    ).length;

    const deliveredOrders = orders.filter(
      (order) => order.status === "Delivered",
    ).length;

    const revenue = orders
      .filter((order) => order.status !== "Cancelled")
      .reduce((total, order) => total + order.total, 0);

    return {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      revenue,
    };
  }, [orders, pagination]);

  if (isLoading) return <ProductsLoading />;

  if (isError) return <p>Failed to load orders.</p>;

  function handleStatusChange(orderId: string, status: OrderStatus) {
    updateOrderStatusMutation.mutate({
      orderId,
      status,
    });
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Orders
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage your orders and track their status.
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/orders/add-order" />}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" />
          New Order
        </Button>
      </motion.div>

      {/* Summary */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
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
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-emerald-50 dark:bg-emerald-950/30">
              <Package className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Delivered</p>

              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {stats.deliveredOrders}
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
      </motion.div>

      {/* Orders */}
      <motion.div variants={itemVariants}>
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
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search orders..."
                  className="pl-9"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value ?? "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>

                  <SelectItem value="Pending">Pending</SelectItem>

                  <SelectItem value="Delivered">Delivered</SelectItem>

                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="max-h-130 overflow-y-auto">
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
                        filteredOrders.map((order, index) => {
                          const orderNumber =
                            (pagination?.currentPage
                              ? (pagination.currentPage - 1) * pagination.limit
                              : 0) +
                            index +
                            1;

                          return (
                            <TableRow key={order._id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">#{orderNumber}</p>

                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {formatDate(order.createdAt)}
                                  </p>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex size-8 items-center justify-center rounded-full border bg-muted">
                                    <UserRound className="size-4 text-muted-foreground" />
                                  </div>

                                  <div>
                                    <p>{order.customer}</p>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      {order.phone}
                                    </p>
                                  </div>
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
                        })
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
                <div className="max-h-140 overflow-y-auto">
                  <div className="divide-y">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order, index) => {
                        const orderNumber =
                          (pagination?.currentPage
                            ? (pagination.currentPage - 1) * pagination.limit
                            : 0) +
                          index +
                          1;

                        return (
                          <div key={order._id} className="space-y-4 p-4">
                            {/* Order Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold">
                                    #{orderNumber}
                                  </p>

                                  <StatusBadge status={order.status} />
                                </div>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatDate(order.createdAt)}
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
                        );
                      })
                    ) : (
                      <div className="flex min-h-32 items-center justify-center p-6 text-sm text-muted-foreground">
                        No orders found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      <motion.div variants={itemVariants}>
        <Pagination
          currentPage={pagination?.currentPage ?? page}
          totalPages={pagination?.totalPages ?? 1}
          hasPreviousPage={pagination?.hasPreviousPage ?? false}
          hasNextPage={pagination?.hasNextPage ?? false}
          onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
          onNext={() => setPage((current) => current + 1)}
        />
      </motion.div>
    </motion.div>
  );
}
