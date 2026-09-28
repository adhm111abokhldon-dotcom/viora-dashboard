"use client";

import { motion } from "motion/react";
import {
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { deleteProduct, getProducts, Product } from "@/lib/api";
import { ProductActions } from "@/components/ProductActions";
import { Pagination } from "@/components/ui/Pagination";
import ProductsLoading from "@/components/ProductsLoading";

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

function getStockStatus(stock: number) {
  if (stock === 0) {
    return {
      label: "Out of stock",
      className: "text-destructive",
      dotClassName: "bg-destructive",
    };
  }

  if (stock <= 10) {
    return {
      label: "Low stock",
      className: "text-amber-600 dark:text-amber-400",
      dotClassName: "bg-amber-500",
    };
  }

  return {
    label: "In stock",
    className: "text-emerald-600 dark:text-emerald-400",
    dotClassName: "bg-emerald-500",
  };
}
export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
  });

  const limit = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products", page, limit],
    queryFn: () => getProducts(page, limit),
  });

  const products = data?.products ?? [];
  const pagination = data?.pagination;

  if (isLoading) {
    return <ProductsLoading />;
  }

  if (isError) {
    return (
      <div className="mx-auto flex min-h-[400px] w-full max-w-[1600px] items-center justify-center">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load products."}
        </p>
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
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Products
          </h1>

          <p className="text-sm text-muted-foreground sm:text-[15px]">
            Manage your products, pricing, and inventory.
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/products/add-product" />}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Add Product
        </Button>
      </motion.div>

      {/* Product Summary */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
              <Package className="size-4 text-muted-foreground" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>

              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {pagination?.totalProducts ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Stock</p>

            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {products.reduce(
                (total: number, product: Product) => total + product.stock,
                0,
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Low / Out of Stock</p>

            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {
                products.filter((product: Product) => product.stock <= 10)
                  .length
              }
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Products */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-none">
          <CardHeader className="gap-4">
            <div>
              <CardTitle className="text-base font-semibold">
                Product Catalog
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Your current products and inventory levels.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input placeholder="Search products..." className="pl-9" />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Desktop */}
            <div className="hidden md:block">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_48px] items-center border-y bg-muted/20 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span>Product</span>
                <span>Price</span>
                <span>Cost</span>
                <span>Margin</span>
                <span>Stock</span>
                <span />
              </div>

              {products.map((product: Product) => {
                const margin = product.price - product.cost;
                const marginPercentage = (margin / product.price) * 100;

                const stockStatus = getStockStatus(product.stock);

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
                          {product.category}
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-medium tabular-nums">
                      ${product.price.toFixed(2)}
                    </span>

                    <span className="text-sm text-muted-foreground tabular-nums">
                      ${product.cost.toFixed(2)}
                    </span>

                    <div>
                      <p className="text-sm font-medium tabular-nums">
                        ${margin.toFixed(2)}
                      </p>

                      <p className="text-xs text-muted-foreground tabular-nums">
                        {marginPercentage.toFixed(0)}%
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium tabular-nums">
                        {product.stock}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`size-1.5 rounded-full ${stockStatus.dotClassName}`}
                        />

                        <span className={`text-xs ${stockStatus.className}`}>
                          {stockStatus.label}
                        </span>
                      </div>
                    </div>

                    <ProductActions
                      product={product}
                      onDelete={(productId) =>
                        deleteProductMutation.mutate(productId)
                      }
                      isDeleting={deleteProductMutation.isPending}
                    />
                  </div>
                );
              })}
            </div>

            {/* Mobile */}
            <div className="divide-y md:hidden">
              {products.map((product: Product) => {
                const margin = product.price - product.cost;
                const marginPercentage = (margin / product.price) * 100;

                const stockStatus = getStockStatus(product.stock);

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
                            {product.category}
                          </p>
                        </div>
                      </div>

                      <ProductActions
                        product={product}
                        onDelete={(productId) =>
                          deleteProductMutation.mutate(productId)
                        }
                        isDeleting={deleteProductMutation.isPending}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>

                        <p className="mt-1 text-sm font-medium tabular-nums">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Margin</p>

                        <p className="mt-1 text-sm font-medium tabular-nums">
                          ${margin.toFixed(2)}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {marginPercentage.toFixed(0)}%
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Stock</p>

                        <p className="mt-1 text-sm font-medium tabular-nums">
                          {product.stock}
                        </p>

                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`size-1.5 rounded-full ${stockStatus.dotClassName}`}
                          />

                          <span className={`text-xs ${stockStatus.className}`}>
                            {stockStatus.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination?.currentPage ?? page}
        totalPages={pagination?.totalPages ?? 1}
        hasPreviousPage={pagination?.hasPreviousPage ?? false}
        hasNextPage={pagination?.hasNextPage ?? false}
        onPrevious={() => setPage((current) => Math.max(current - 1, 1))}
        onNext={() => setPage((current) => current + 1)}
      />
    </motion.div>
  );
}
