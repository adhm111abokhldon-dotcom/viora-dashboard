"use client";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/api";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
export function ProductActions({
  product,
  onDelete,
  isDeleting,
}: {
  product: Product;
  onDelete: (productId: string) => void;
  isDeleting: boolean;
}) {
  const t = useTranslations("products.actions");

  return (
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
              className="w-40 flex items-center gap-1"
            >
              <Pencil className="size-4" />
              {t("edit")}
            </Link>
          }
        ></DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(product._id)}
          disabled={isDeleting}
        >
          <Trash2 className="size-4" />
          {isDeleting ? t("deleting") : t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

