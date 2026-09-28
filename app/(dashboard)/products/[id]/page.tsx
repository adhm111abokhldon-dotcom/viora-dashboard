"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { getProductById } from "@/lib/api";
import EditProductForm from "@/components/EditProductForm";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();

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
        <p className="text-sm text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Product not found."}
        </p>
      </div>
    );
  }

  return <EditProductForm product={product} />;
}
