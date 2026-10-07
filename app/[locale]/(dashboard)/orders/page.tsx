"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Clock3,
  DollarSign,
  ImageIcon,
  Package,
  Plus,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

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
import { summarizeItems } from "@/lib/orders";
import { Pagination } from "@/components/ui/Pagination";
import ProductsLoading from "@/components/ProductsLoading";
import OrderActions from "@/components/OrderActions";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import { containerVariants, itemVariants } from "@/lib/motion";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import { useAppToast } from "@/lib/toast";
import { useInvalidateAll } from "@/lib/queries";

function ProfitText({ order, locale }: { order: Order; locale: "en" | "ar" }) {
  if (order.status === "Cancelled") {
    return <span className="text-text-muted">—</span>;
  }

  const isLoss = order.profit < 0;

  return (
    <span
      className={
        isLoss
          ? "font-semibold text-destructive tabular-nums"
          : "font-semibold text-success tabular-nums"
      }
    >
      {isLoss ? "-" : "+"}
      {formatCurrency(Math.abs(order.profit), locale)}
    </span>
  );
}

function ProductThumbnail({
  imageUrl,
  productName,
}: {
  imageUrl?: string;
  productName: string;
}) {
  if (imageUrl) {
    return (
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface">
        <Image
          src={imageUrl}
          alt={productName}
          width={56}
          height={56}
          loading="lazy"
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-muted"
      aria-hidden="true"
    >
      <ImageIcon className="size-5" />
    </div>
  );
}

type SummaryTone = "primary" | "success" | "warning";

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
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: string;
  icon: typeof ShoppingBag;
  tone?: SummaryTone;
  hint?: string;
}) {
  const styles = summaryStyles[tone];

  return (
    <div
      className={`flex min-w-0 items-center gap-4 rounded-lg border border-border border-s-4 bg-card px-5 py-5 ${styles.border}`}
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
          <p className="mt-1.5 truncate text-xs text-text-muted">{hint}</p>
        )}
      </div>
    </div>
  );
}

function OrderProduct({
  order,
  label,
  additionalItems,
  quantity,
  locale,
  t,
}: {
  order: Order;
  label: string;
  additionalItems: number;
  quantity: number;
  locale: "en" | "ar";
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const firstItem = order.items[0];

  return (
    <div className="flex min-w-0 items-center gap-3">
      {firstItem && (
        <ProductThumbnail
          imageUrl={firstItem.imageUrl}
          productName={firstItem.name}
        />
      )}

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-sm font-medium text-text">{label}</p>

          {additionalItems > 0 && (
            <span className="shrink-0 text-xs font-semibold text-text-muted">
              +{formatNumber(additionalItems, locale)}
            </span>
          )}
        </div>

        <p className="mt-0.5 text-xs text-text-muted">
          {t("quantityShort", {
            quantity: formatNumber(quantity, locale),
          })}
        </p>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const t = useTranslations("orders");
  const tStatus = useTranslations("status");
  const te = useTranslations("errors");
  const locale = useLocale() as "en" | "ar";

  const statusLabel: Record<string, string> = {
    Pending: tStatus("pending"),
    Delivered: tStatus("delivered"),
    Cancelled: tStatus("cancelled"),
  };

  const invalidateAll = useInvalidateAll();
  const toast = useAppToast();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const limit = 10;

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["orders", page, limit, search, statusFilter],
    queryFn: () =>
      getOrders(page, limit, {
        search,
        status: statusFilter,
      }),
    placeholderData: keepPreviousData,
  });

  const orders = data?.orders ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats;

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

  const hasFilters = search !== "" || statusFilter !== "all";

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  }

  function handleStatusChange(orderId: string, status: OrderStatus) {
    updateOrderStatusMutation.mutate({
      orderId,
      status,
    });
  }

  if (isLoading) {
    return <ProductsLoading />;
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-400 space-y-6">
        <PageHeader title={t("title")} description={t("description")} />

        <ErrorState
          description={apiErrorMessage(error, te, te("orders"))}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

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
            <Button
              nativeButton={false}
              render={<Link href="/orders/add-order" />}
              className="w-full sm:w-auto"
            >
              <Plus className="size-4" />
              {t("newOrder")}
            </Button>
          }
        />
      </motion.div>


      {/* Summary */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          label={t("totalOrders")}
          value={formatNumber(stats?.totalOrders ?? 0, locale)}
          icon={ShoppingBag}
          tone="primary"
        />

        <SummaryCard
          label={t("pending")}
          value={formatNumber(stats?.pendingOrders ?? 0, locale)}
          icon={Clock3}
          tone="warning"
        />

        <SummaryCard
          label={t("delivered")}
          value={formatNumber(stats?.deliveredOrders ?? 0, locale)}
          icon={Package}
          tone="success"
        />

        <SummaryCard
          label={t("revenue")}
          value={formatCurrency(stats?.revenue ?? 0, locale)}
          icon={DollarSign}
          tone="primary"
          hint={t("profitHint", {
            amount: formatCurrency(stats?.profit ?? 0, locale),
          })}
        />
      </motion.div>

      {/* Orders */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-none">
          <CardHeader className="gap-4 border-b border-border">
            <div>
              <CardTitle className="text-base font-semibold text-text">
                {t("allOrders")}
              </CardTitle>

              <p className="mt-1 text-sm text-text-muted">
                {t("allOrdersDescription")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />

                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchAria")}
                  className="ps-9"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value ?? "all");
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="w-full sm:w-40"
                  aria-label={tStatus("filterAria")}
                >
                  <SelectValue placeholder={tStatus("filterPlaceholder")}>
                    {statusFilter === "all"
                      ? tStatus("all")
                      : (statusLabel[statusFilter] ?? statusFilter)}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">{tStatus("all")}</SelectItem>

                  <SelectItem value="Pending">{tStatus("pending")}</SelectItem>

                  <SelectItem value="Delivered">
                    {tStatus("delivered")}
                  </SelectItem>

                  <SelectItem value="Cancelled">
                    {tStatus("cancelled")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="flex size-10 items-center justify-center rounded-md border border-border bg-surface text-text-muted">
                  <ShoppingBag className="size-4" />
                </div>

                <p className="text-sm font-medium text-text">
                  {hasFilters ? t("emptyFiltered") : t("empty")}
                </p>

                {hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    {t("clearFilters")}
                  </Button>
                ) : (
                  <Button
                    nativeButton={false}
                    variant="outline"
                    render={<Link href="/orders/add-order" />}
                  >
                    <Plus className="size-4" />
                    {t("createFirst")}
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <div
                    className={`max-h-170 overflow-y-auto overflow-x-hidden transition-opacity ${
                      isFetching ? "opacity-60" : ""
                    }`}
                  >
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-card">
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead>{t("tableOrder")}</TableHead>

                          <TableHead>{t("tableCustomer")}</TableHead>

                          <TableHead>{t("tableItems")}</TableHead>

                          <TableHead>{t("tableTotal")}</TableHead>

                          <TableHead>{t("tableProfit")}</TableHead>

                          <TableHead>{t("tableStatus")}</TableHead>

                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {orders.map((order) => {
                          const { label, quantity } = summarizeItems(order, t);

                          const additionalItems = Math.max(
                            order.items.length - 1,
                            0,
                          );

                          return (
                            <TableRow
                              key={order._id}
                              className="border-b border-border last:border-b-0"
                            >
                              {/* Order */}
                              <TableCell className="py-4">
                                <p className="font-semibold tabular-nums text-text">
                                  <span dir="ltr">#{order.orderNumber ?? "—"}</span>
                                </p>

                                <p className="mt-1 text-xs text-text-muted">
                                  {formatDate(order.createdAt, locale)}
                                </p>
                              </TableCell>

                              {/* Customer */}
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-muted">
                                    <UserRound className="size-4" />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-text">
                                      {order.customer}
                                    </p>

                                    <p
                                      dir="ltr"
                                      className="mt-0.5 text-xs text-text-muted"
                                    >
                                      {order.phone}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Items */}
                              <TableCell className="py-4">
                                <OrderProduct
                                  order={order}
                                  label={label}
                                  additionalItems={additionalItems}
                                  quantity={quantity}
                                  locale={locale}
                                  t={t}
                                />
                              </TableCell>

                              {/* Total */}
                              <TableCell className="py-4">
                                <p className="font-semibold tabular-nums text-text">
                                  {formatCurrency(order.total, locale)}
                                </p>

                                {order.deliveryCharged > 0 && (
                                  <p className="mt-1 text-xs text-text-muted tabular-nums">
                                    {t("inclDelivery", {
                                      amount: formatCurrency(
                                        order.deliveryCharged,
                                        locale,
                                      ),
                                    })}
                                  </p>
                                )}
                              </TableCell>

                              {/* Profit */}
                              <TableCell className="py-4">
                                <ProfitText order={order} locale={locale} />
                              </TableCell>

                              {/* Status */}
                              <TableCell className="py-4">
                                <StatusBadge status={order.status} />
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="py-4">
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
                </div>

                {/* Mobile */}
                <div className="md:hidden">
                  <div
                    className={`max-h-170 divide-y divide-border overflow-y-auto overflow-x-hidden transition-opacity ${
                      isFetching ? "opacity-60" : ""
                    }`}
                  >
                    {orders.map((order) => {
                      const { label, quantity } = summarizeItems(order, t);

                      const additionalItems = Math.max(
                        order.items.length - 1,
                        0,
                      );

                      return (
                        <div key={order._id} className="space-y-5 p-5">
                          {/* Order Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold tabular-nums text-text">
                                  <span dir="ltr">#{order.orderNumber ?? "—"}</span>
                                </p>

                                <StatusBadge status={order.status} />
                              </div>

                              <p className="mt-1 text-xs text-text-muted">
                                {formatDate(order.createdAt, locale)}
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
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-muted">
                              <UserRound className="size-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-text">
                                {order.customer}
                              </p>

                              <p
                                dir="ltr"
                                className="mt-0.5 text-xs text-text-muted"
                              >
                                {order.phone}
                              </p>
                            </div>
                          </div>

                          {/* Order Metrics */}
                          <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border">
                            {/* Product */}
                            <div className="border-e border-b border-border p-3.5">
                              <p className="text-xs font-medium text-text-muted">
                                {t("items")}
                              </p>

                              <div className="mt-2">
                                <OrderProduct
                                  order={order}
                                  label={label}
                                  additionalItems={additionalItems}
                                  quantity={quantity}
                                  locale={locale}
                                  t={t}
                                />
                              </div>
                            </div>

                            {/* Quantity */}
                            <div className="border-b border-border p-3.5">
                              <p className="text-xs font-medium text-text-muted">
                                {t("quantity")}
                              </p>

                              <p className="mt-2 text-sm font-semibold tabular-nums text-text">
                                {formatNumber(quantity, locale)}
                              </p>
                            </div>

                            {/* Total */}
                            <div className="border-e border-border p-3.5">
                              <p className="text-xs font-medium text-text-muted">
                                {t("total")}
                              </p>

                              <p className="mt-2 text-sm font-semibold tabular-nums text-text">
                                {formatCurrency(order.total, locale)}
                              </p>

                              {order.deliveryCharged > 0 && (
                                <p className="mt-0.5 text-xs text-text-muted tabular-nums">
                                  {t("inclDelivery", {
                                    amount: formatCurrency(
                                      order.deliveryCharged,
                                      locale,
                                    ),
                                  })}
                                </p>
                              )}
                            </div>

                            {/* Profit */}
                            <div className="p-3.5">
                              <p className="text-xs font-medium text-text-muted">
                                {t("profit")}
                              </p>

                              <p className="mt-2 text-sm">
                                <ProfitText order={order} locale={locale} />
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {(pagination?.totalPages ?? 1) > 1 && (
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
      )}
    </motion.div>
  );
}
