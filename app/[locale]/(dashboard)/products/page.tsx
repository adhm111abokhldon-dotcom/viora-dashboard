"use client";

import { motion } from "motion/react";
import { AlertTriangle, Boxes, Package, Plus, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { deleteProduct, getProducts, Product } from "@/lib/api";
import { ProductActions } from "@/components/ProductActions";
import { Pagination } from "@/components/ui/Pagination";
import ProductsLoading from "@/components/ProductsLoading";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import StatCard from "@/components/StatCard";
import { containerVariants, itemVariants } from "@/lib/motion";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import { isKnownCategory } from "@/lib/categories";

// نفس الرقم مستخدم بالباك إند لحساب "Low stock"
const LOW_STOCK_THRESHOLD = 10;

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

function getMargin(product: Product) {
  const margin = product.price - product.cost;
  const percentage = product.price > 0 ? (margin / product.price) * 100 : 0;

  return { margin, percentage };
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

  // ما منبعت طلب مع كل حرف: بنستنى 400ms بعد آخر ضغطة
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

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["products", page, limit, search],
    queryFn: () => getProducts(page, limit, search),
    // بيضل يعرض النتايج القديمة لحد ما تجي الجديدة،
    // وإلا الصفحة كلها بتصير skeleton وحقل البحث بيختفي وانت عم تكتب
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
      <div className="space-y-6">
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
      className="mx-auto w-full max-w-[1600px] space-y-6"
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

      {deleteProductMutation.isError && (
        <p className="text-sm text-destructive" role="alert">
          {apiErrorMessage(
            deleteProductMutation.error,
            te,
            te("deleteProduct"),
          )}
        </p>
      )}

      {/* Product Summary (محسوبة على كل المنتجات، مش بس الصفحة الحالية) */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("totalProducts")}
          value={formatNumber(stats?.totalProducts ?? 0, locale)}
          icon={Package}
        />

        <StatCard
          label={t("totalStock")}
          value={formatNumber(stats?.totalStock ?? 0, locale)}
          icon={Boxes}
        />

        <StatCard
          label={t("lowOutOfStock")}
          value={formatNumber(stats?.lowStockCount ?? 0, locale)}
          icon={AlertTriangle}
          tone={stats?.lowStockCount ? "warning" : "default"}
        />
      </motion.div>

      {/* Products */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-none">
          <CardHeader className="gap-4">
            <div>
              <CardTitle className="text-base font-semibold">
                {t("catalog")}
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {t("catalogDescription")}
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchAria")}
                className="ps-9"
              />
            </div>
          </CardHeader>

          <CardContent
            className={`p-0 transition-opacity ${
              isFetching ? "opacity-60" : ""
            }`}
          >
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/40">
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
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_48px] items-center border-y bg-muted/20 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span>{t("tableProduct")}</span>
                    <span>{t("tablePrice")}</span>
                    <span>{t("tableCost")}</span>
                    <span>{t("tableMargin")}</span>
                    <span>{t("tableStock")}</span>
                    <span />
                  </div>

                  {products.map((product: Product) => {
                    const { margin, percentage } = getMargin(product);
                    const stockStatus = getStockStatus(product.stock, t);

                    return (
                      <div
                        key={product._id}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_48px] items-center border-b px-6 py-4 last:border-b-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                            <Package className="size-4 text-muted-foreground" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {product.name}
                            </p>

                            <p className="truncate text-xs text-muted-foreground">
                              {categoryLabel(product.category)}
                            </p>
                          </div>
                        </div>

                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(product.price, locale)}
                        </span>

                        <span className="text-sm text-muted-foreground tabular-nums">
                          {formatCurrency(product.cost, locale)}
                        </span>

                        <div>
                          <p className="text-sm font-medium tabular-nums">
                            {formatCurrency(margin, locale)}
                          </p>

                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatPercent(percentage, locale, 0)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium tabular-nums">
                            {formatNumber(product.stock, locale)}
                          </p>

                          <div className="mt-1 flex items-center gap-1.5">
                            <span
                              className={`size-1.5 rounded-full ${stockStatus.dotClassName}`}
                            />

                            <span
                              className={`text-xs ${stockStatus.className}`}
                            >
                              {stockStatus.label}
                            </span>
                          </div>
                        </div>

                        <ProductActions
                          product={product}
                          onDelete={handleDelete}
                          isDeleting={deleteProductMutation.isPending}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Mobile */}
                <div className="divide-y md:hidden">
                  {products.map((product: Product) => {
                    const { margin, percentage } = getMargin(product);
                    const stockStatus = getStockStatus(product.stock, t);

                    return (
                      <div key={product._id} className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                              <Package className="size-4 text-muted-foreground" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {product.name}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {categoryLabel(product.category)}
                              </p>
                            </div>
                          </div>

                          <ProductActions
                            product={product}
                            onDelete={handleDelete}
                            isDeleting={deleteProductMutation.isPending}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t("tablePrice")}
                            </p>

                            <p className="mt-1 text-sm font-medium tabular-nums">
                              {formatCurrency(product.price, locale)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t("tableMargin")}
                            </p>

                            <p className="mt-1 text-sm font-medium tabular-nums">
                              {formatCurrency(margin, locale)}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {formatPercent(percentage, locale, 0)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              {t("tableStock")}
                            </p>

                            <p className="mt-1 text-sm font-medium tabular-nums">
                              {formatNumber(product.stock, locale)}
                            </p>

                            <div className="mt-1 flex items-center gap-1.5">
                              <span
                                className={`size-1.5 rounded-full ${stockStatus.dotClassName}`}
                              />

                              <span
                                className={`text-xs ${stockStatus.className}`}
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
