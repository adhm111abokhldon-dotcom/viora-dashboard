"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import {
  Clock3,
  DollarSign,
  Package,
  Plus,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
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
import { shortId, summarizeItems } from "@/lib/orders";
import { Pagination } from "@/components/ui/Pagination";
import ProductsLoading from "@/components/ProductsLoading";
import OrderActions from "@/components/OrderActions";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import { containerVariants, itemVariants } from "@/lib/motion";
import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";

// الربح: أخضر لو موجب، أحمر لو خسارة، وشرطة للملغى (ما بينحسب بالإيراد)
function ProfitText({ order, locale }: { order: Order; locale: "en" | "ar" }) {
  if (order.status === "Cancelled") {
    return <span className="text-muted-foreground">—</span>;
  }

  const isLoss = order.profit < 0;

  return (
    <span
      className={
        isLoss
          ? "font-medium text-destructive tabular-nums"
          : "font-medium text-success tabular-nums"
      }
    >
      {isLoss ? "-" : "+"}
      {formatCurrency(Math.abs(order.profit), locale)}
    </span>
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

  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ما منبعت طلب مع كل حرف: بنستنى 400ms بعد آخر ضغطة
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const limit = 10;

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["orders", page, limit, search, statusFilter],
    queryFn: () => getOrders(page, limit, { search, status: statusFilter }),
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

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
    updateOrderStatusMutation.mutate({ orderId, status });
  }

  if (isLoading) return <ProductsLoading />;

  if (isError) {
    return (
      <div className="space-y-6">
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
      className="space-y-6"
    >
      {/* Page Header */}
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

      {/* Summary (محسوبة على كل الأوردرات، مش بس الصفحة الحالية) */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label={t("totalOrders")}
          value={formatNumber(stats?.totalOrders ?? 0, locale)}
          icon={ShoppingBag}
        />

        <StatCard
          label={t("pending")}
          value={formatNumber(stats?.pendingOrders ?? 0, locale)}
          icon={Clock3}
          tone="warning"
        />

        <StatCard
          label={t("delivered")}
          value={formatNumber(stats?.deliveredOrders ?? 0, locale)}
          icon={Package}
          tone="success"
        />

        <StatCard
          label={t("revenue")}
          value={formatCurrency(stats?.revenue ?? 0, locale)}
          icon={DollarSign}
          hint={t("profitHint", {
            amount: formatCurrency(stats?.profit ?? 0, locale),
          })}
        />
      </motion.div>

      {/* Orders */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-none">
          <CardHeader className="gap-4 border-b">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">{t("allOrders")}</CardTitle>

              <p className="text-sm text-muted-foreground">
                {t("allOrdersDescription")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

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
                  <SelectItem value="Pending">
                    {tStatus("pending")}
                  </SelectItem>
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

          <CardContent
            className={`p-0 transition-opacity ${
              isFetching ? "opacity-60" : ""
            }`}
          >
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/40">
                  <ShoppingBag className="size-4 text-muted-foreground" />
                </div>

                <p className="text-sm font-medium">
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
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <div className="max-h-130 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background">
                        <TableRow>
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

                          return (
                            <TableRow key={order._id}>
                              <TableCell>
                                <p className="font-medium tabular-nums">
                                  <span dir="ltr">
                                    #{shortId(order._id)}
                                  </span>
                                </p>

                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {formatDate(order.createdAt, locale)}
                                </p>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex size-8 items-center justify-center rounded-full border bg-muted">
                                    <UserRound className="size-4 text-muted-foreground" />
                                  </div>

                                  <div>
                                    <p>{order.customer}</p>

                                    <p
                                      dir="ltr"
                                      className="mt-0.5 text-xs text-muted-foreground"
                                    >
                                      {order.phone}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <p>{label}</p>

                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {t("quantityShort", {
                                    quantity: formatNumber(quantity, locale),
                                  })}
                                </p>
                              </TableCell>

                              <TableCell>
                                <p className="font-medium tabular-nums">
                                  {formatCurrency(order.total, locale)}
                                </p>

                                {order.deliveryCharged > 0 && (
                                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                                    {t("inclDelivery", {
                                      amount: formatCurrency(
                                        order.deliveryCharged,
                                        locale,
                                      ),
                                    })}
                                  </p>
                                )}
                              </TableCell>

                              <TableCell>
                                <ProfitText order={order} locale={locale} />
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
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Mobile Orders */}
                <div className="md:hidden">
                  <div className="max-h-140 divide-y overflow-y-auto">
                    {orders.map((order) => {
                      const { label, quantity } = summarizeItems(order, t);

                      return (
                        <div key={order._id} className="space-y-4 p-4">
                          {/* Order Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold tabular-nums">
                                  <span dir="ltr">
                                    #{shortId(order._id)}
                                  </span>
                                </p>

                                <StatusBadge status={order.status} />
                              </div>

                              <p className="mt-1 text-xs text-muted-foreground">
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
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted">
                              <UserRound className="size-4 text-muted-foreground" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {order.customer}
                              </p>

                              <p
                                dir="ltr"
                                className="text-xs text-muted-foreground"
                              >
                                {order.phone}
                              </p>
                            </div>
                          </div>

                          {/* Order Details */}
                          <div className="rounded-md border p-3">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">
                                  {t("items")}
                                </p>

                                <p className="mt-1 truncate text-sm font-medium">
                                  {label}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground">
                                  {t("quantity")}
                                </p>

                                <p className="mt-1 text-sm font-medium tabular-nums">
                                  {formatNumber(quantity, locale)}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground">
                                  {t("total")}
                                </p>

                                <p className="mt-1 text-sm font-semibold tabular-nums">
                                  {formatCurrency(order.total, locale)}
                                </p>

                                {order.deliveryCharged > 0 && (
                                  <p className="text-xs text-muted-foreground tabular-nums">
                                    {t("inclDelivery", {
                                      amount: formatCurrency(
                                        order.deliveryCharged,
                                        locale,
                                      ),
                                    })}
                                  </p>
                                )}
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground">
                                  {t("profit")}
                                </p>

                                <p className="mt-1 text-sm">
                                  <ProfitText order={order} locale={locale} />
                                </p>
                              </div>
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
