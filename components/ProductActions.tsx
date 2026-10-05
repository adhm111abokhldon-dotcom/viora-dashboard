"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/api";
import { BarChart3, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { DeleteProductDialog } from "./DeleteProductDialog";

export function ProductActions({
  product,
  onDelete,
  isDeleting,
}: {
  product: Product;
  onDelete: (productId: string) => void;
  isDeleting: boolean;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const t = useTranslations("products.actions");

  function handleDeleteClick() {
    setDeleteDialogOpen(true);
  }

  function handleDeleteConfirm() {
    onDelete(product._id);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={t("aria")}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={
              <Link
                href={`/products/${product._id}`}
                className="flex w-40 items-center gap-1"
              >
                <BarChart3 className="size-4" />
                {t("view")}
              </Link>
            }
          />

          <DropdownMenuItem
            render={
              <Link
                href={`/products/${product._id}/edit`}
                className="flex w-40 items-center gap-1"
              >
                <Pencil className="size-4" />
                {t("edit")}
              </Link>
            }
          />

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            <Trash2 className="size-4" />
            {isDeleting ? t("deleting") : t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteProductDialog
        open={deleteDialogOpen}
        productName={product.name}
        isDeleting={isDeleting}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
