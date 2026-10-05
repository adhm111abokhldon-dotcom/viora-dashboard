"use client";

import { motion } from "motion/react";
import {
  AlertTriangle,
  Boxes,
  ImageIcon,
  Package,
  Plus,
  Search,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  deleteProduct,
  getProducts,
  Product,
  type ProductPerformance,
} from "@/lib/api";
import { ProductActions } from "@/components/ProductActions";
import { Pagination } from "@/components/ui/Pagination";
import ProductsLoading from "@/components/ProductsLoading";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import { containerVariants, itemVariants } from "@/lib/motion";
import { formatCurrency, formatNumber } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import { isKnownCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 10;

/** Fallback when the API sends no performance block (e.g. a cached payload). */
const NO_PERFORMANCE: ProductPerformance = {
  unitsSold: 0,
  orders: 0,
  sales: 0,
  cost: 0,
  deliveryCost: 0,
  profit: 0,
  averageSellingPrice: 0,
  profitMargin: 0,
  realisedMargin: 0,
};

function getStockStatus(stock: number, t: (key: string) => string) {
  if (stock === 0) {
    return {
      label: t("outOfStock"),
      className: "text-destructive",
      dotClassName: "bg-destructive",
    };
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return {
      label: t("lowStock"),
      className: "text-warning",
      dotClassName: "bg-warning",
    };
  }

  return {
    label: t("inStock"),
    className: "text-success",
    dotClassName: "bg-success",
  };
}

function ProductThumbnail({
  product,
  size = "default",
}: {
  product: Product;
  size?: "default" | "mobile";
}) {
  const sizeClass = size === "mobile" ? "size-14" : "size-14";

  if (product.imageUrl) {
    return (
      <div
        className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface`}
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          width={50}
          height={50}
          className=" object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-muted`}
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
}: {
  label: string;
  value: string;
  icon: typeof Package;
  tone?: SummaryTone;
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
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const t = useTranslations("products");
  const te = useTranslations("errors");
  const locale = useLocale() as "en" | "ar";

  const categoryLabel = (value: string) =>
    isKnownCategory(value) ? t(`categories.${value}`) : value;

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
  });

  const limit = 10;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["products", page, limit, search],
    queryFn: () => getProducts(page, limit, search),
    placeholderData: keepPreviousData,
  });

  const products = data?.products ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats;

  function handleDelete(productId: string) {
    const product = products.find((item) => item._id === productId);

    const confirmed = window.confirm(
      t("deleteConfirm", {
        name: product?.name ?? t("thisProduct"),
      }),
    );

    if (confirmed) {
      deleteProductMutation.mutate(productId);
    }
  }

  if (isLoading) {
    return <ProductsLoading />;
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-400 space-y-6">
        <PageHeader title={t("title")} description={t("description")} />

        <ErrorState
          description={apiErrorMessage(error, te, te("products"))}
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
      className="mx-auto w-full max-w-400 space-y-7"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title={t("title")}
          description={t("description")}
          actions={
            <Button
              nativeButton={false}
              render={<Link href="/products/add-product" />}
              className="w-full sm:w-auto"
            >
              <Plus className="size-4" />
              {t("add")}
            </Button>
          }
        />
      </motion.div>

      {/* Delete Error */}
      {deleteProductMutation.isError && (
        <motion.div variants={itemVariants}>
          <div
            className="border-s-4 border-s-destructive bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground"
            role="alert"
          >
            {apiErrorMessage(
              deleteProductMutation.error,
              te,
              te("deleteProduct"),
            )}
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label={t("totalProducts")}
          value={formatNumber(stats?.totalProducts ?? 0, locale)}
          icon={Package}
          tone="primary"
        />

        <SummaryCard
          label={t("totalStock")}
          value={formatNumber(stats?.totalStock ?? 0, locale)}
          icon={Boxes}
          tone="success"
        />

        <SummaryCard
          label={t("lowOutOfStock")}
          value={formatNumber(stats?.lowStockCount ?? 0, locale)}
          icon={AlertTriangle}
          tone="warning"
        />
      </motion.div>

      {/* Products */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden rounded-lg border border-border shadow-none">
          <CardHeader className="gap-4 border-b border-border">
            <div>
              <CardTitle className="text-base font-semibold">
                {t("catalog")}
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {t("catalogDescription")}
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchAria")}
                className="ps-9"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="flex size-10 items-center justify-center rounded-md border border-border bg-surface">
                  <Package className="size-4 text-muted-foreground" />
                </div>

                <p className="text-sm font-medium">
                  {search ? t("noMatch", { search }) : t("empty")}
                </p>

                {!search && (
                  <Button
                    nativeButton={false}
                    render={<Link href="/products/add-product" />}
                    variant="outline"
                  >
                    <Plus className="size-4" />
                    {t("addFirst")}
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <div className="max-h-170 overflow-y-auto overflow-x-hidden">
                    {/* Table Header */}
                    <div className="sticky top-0 z-10 grid grid-cols-[minmax(200px,2fr)_minmax(80px,1fr)_minmax(95px,1fr)_minmax(95px,1fr)_minmax(95px,1fr)_minmax(90px,1fr)_48px] items-center gap-4 border-b border-border bg-card px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <span>{t("tableProduct")}</span>
                      <span className="text-end">{t("tableUnitsSold")}</span>
                      <span className="text-end">{t("tableSales")}</span>
                      <span className="text-end">{t("tableProfit")}</span>
                      <span className="text-end">{t("tableAvgPrice")}</span>
                      <span>{t("tableStock")}</span>
                      <span />
                    </div>

                    {products.map((product: Product) => {
                      const stockStatus = getStockStatus(product.stock, t);
                      const performance: ProductPerformance =
                        product.performance ?? NO_PERFORMANCE;
                      const hasSales = performance.unitsSold > 0;

                      return (
                        <div
                          key={product._id}
                          className="grid grid-cols-[minmax(200px,2fr)_minmax(80px,1fr)_minmax(95px,1fr)_minmax(95px,1fr)_minmax(95px,1fr)_minmax(90px,1fr)_48px] items-center gap-4 border-b border-border px-6 py-4 last:border-b-0"
                        >
                          {/* Product */}
                          <Link
                            href={`/products/${product._id}`}
                            className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <ProductThumbnail product={product} />

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {product.name}
                              </p>

                              <p className="truncate text-xs text-muted-foreground">
                                {categoryLabel(product.category)} ·{" "}
                                {formatCurrency(product.price, locale)}
                              </p>
                            </div>
                          </Link>

                          {/* Units sold */}
                          <span className="text-end text-sm font-medium tabular-nums">
                            {hasSales
                              ? formatNumber(performance.unitsSold, locale)
                              : "—"}
                          </span>

                          {/* Sales */}
                          <span className="text-end text-sm font-medium tabular-nums">
                            {hasSales
                              ? formatCurrency(performance.sales, locale)
                              : "—"}
                          </span>

                          {/* Profit */}
                          <span
                            className={cn(
                              "text-end text-sm font-semibold tabular-nums",
                              !hasSales && "text-muted-foreground",
                              hasSales &&
                                performance.profit >= 0 &&
                                "text-success",
                              hasSales &&
                                performance.profit < 0 &&
                                "text-destructive",
                            )}
                          >
                            {hasSales
                              ? formatCurrency(performance.profit, locale)
                              : "—"}
                          </span>

                          {/* Average selling price */}
                          <span className="text-end text-sm text-muted-foreground tabular-nums">
                            {hasSales
                              ? formatCurrency(
                                  performance.averageSellingPrice,
                                  locale,
                                )
                              : "—"}
                          </span>

                          {/* Stock */}
                          <div className="min-w-0">
                            <p className="text-sm font-medium tabular-nums">
                              {formatNumber(product.stock, locale)}
                            </p>

                            <div className="mt-1 flex items-center gap-1.5">
                              <span
                                className={`size-1.5 shrink-0 rounded-full ${stockStatus.dotClassName}`}
                              />

                              <span
                                className={`truncate text-xs ${stockStatus.className}`}
                              >
                                {stockStatus.label}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end">
                            <ProductActions
                              product={product}
                              onDelete={handleDelete}
                              isDeleting={deleteProductMutation.isPending}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile */}
                <div className="divide-y divide-border md:hidden">
                  {products.map((product: Product) => {
                    const stockStatus = getStockStatus(product.stock, t);
                    const performance: ProductPerformance =
                      product.performance ?? NO_PERFORMANCE;
                    const hasSales = performance.unitsSold > 0;

                    return (
                      <div key={product._id} className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/products/${product._id}`}
                            className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <ProductThumbnail product={product} size="mobile" />

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {product.name}
                              </p>

                              <p className="truncate text-xs text-muted-foreground">
                                {categoryLabel(product.category)} ·{" "}
                                {formatCurrency(product.price, locale)}
                              </p>
                            </div>
                          </Link>

                          <ProductActions
                            product={product}
                            onDelete={handleDelete}
                            isDeleting={deleteProductMutation.isPending}
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-px overflow-hidden rounded-md border border-border bg-border">
                          <div className="bg-card px-3 py-2.5">
                            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                              {t("tableUnitsSold")}
                            </p>

                            <p className="mt-1 text-sm font-medium tabular-nums">
                              {hasSales
                                ? formatNumber(performance.unitsSold, locale)
                                : "—"}
                            </p>
                          </div>

                          <div className="bg-card px-3 py-2.5">
                            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                              {t("tableSales")}
                            </p>

                            <p className="mt-1 text-sm font-medium tabular-nums">
                              {hasSales
                                ? formatCurrency(performance.sales, locale)
                                : "—"}
                            </p>
                          </div>

                          <div className="bg-card px-3 py-2.5">
                            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                              {t("tableProfit")}
                            </p>

                            <p
                              className={cn(
                                "mt-1 text-sm font-semibold tabular-nums",
                                hasSales &&
                                  performance.profit >= 0 &&
                                  "text-success",
                                hasSales &&
                                  performance.profit < 0 &&
                                  "text-destructive",
                              )}
                            >
                              {hasSales
                                ? formatCurrency(performance.profit, locale)
                                : "—"}
                            </p>
                          </div>

                          <div className="bg-card px-3 py-2.5">
                            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                              {t("tableStock")}
                            </p>

                            <p className="mt-1 text-sm font-medium tabular-nums">
                              {formatNumber(product.stock, locale)}
                            </p>

                            <div className="mt-1 flex items-center gap-1.5">
                              <span
                                className={`size-1.5 shrink-0 rounded-full ${stockStatus.dotClassName}`}
                              />

                              <span
                                className={`truncate text-xs ${stockStatus.className}`}
                              >
                                {stockStatus.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {(pagination?.totalPages ?? 1) > 1 && (
        <Pagination
          currentPage={pagination?.currentPage ?? page}
          totalPages={pagination?.totalPages ?? 1}
          hasPreviousPage={pagination?.hasPreviousPage ?? false}
          hasNextPage={pagination?.hasNextPage ?? false}
          onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
          onNext={() => setPage((current) => current + 1)}
        />
      )}
    </motion.div>
  );
}
