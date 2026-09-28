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
import Link from "next/link";
export function ProductActions({
  product,
  onDelete,
  isDeleting,
}: {
  product: Product;
  onDelete: (productId: string) => void;
  isDeleting: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Product actions"
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
              Edit
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
          {isDeleting ? "Deleting..." : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

