"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { getProductById } from "@/lib/api";
import EditProductForm from "@/components/EditProductForm";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations("products");
  const te = useTranslations("errors");

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => getProductById(params.id),
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-destructive">
          {error instanceof Error && error.message
            ? error.message
            : te("productNotFound")}
        </p>
      </div>
    );
  }

  return <EditProductForm product={product} />;
}
