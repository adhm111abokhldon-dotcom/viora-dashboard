"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import EditProductForm from "@/components/EditProductForm";
import ErrorState from "@/components/ErrorState";
import ProductsLoading from "@/components/ProductsLoading";
import PageHeader from "@/components/PageHeader";
import { getProductById } from "@/lib/api";
import { apiErrorMessage } from "@/lib/errors";

/**
 * Editing route for a product.
 *
 * The business view lives at /products/[id]; this page only edits the product
 * record (name, category, price, cost, stock, image). All monetary history
 * shown elsewhere comes from the order snapshots and is never written here.
 */
export default function EditProductPage() {
  const t = useTranslations("products");
  const te = useTranslations("errors");

  const params = useParams<{ id: string }>();
  const productId = params.id;

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductById(productId),
    enabled: Boolean(productId),
  });

  if (isLoading) {
    return <ProductsLoading />;
  }

  if (isError || !product) {
    return (
      <div className="mx-auto w-full max-w-400 space-y-6">
        <PageHeader title={t("editTitle")} description={t("editDescription")} />

        <ErrorState
          description={apiErrorMessage(error, te, te("productNotFound"))}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-400 space-y-6">
      <PageHeader
        title={t("editTitle")}
        description={product.name}
      />

      <EditProductForm product={product} />
    </div>
  );
}
