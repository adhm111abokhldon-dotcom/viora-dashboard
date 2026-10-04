"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type DeleteProductDialogProps = {
  open: boolean;
  productName: string;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteProductDialog({
  open,
  productName,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteProductDialogProps) {
  const t = useTranslations("products");
  const tc = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-lg border border-border bg-card p-0 shadow-none">
        <DialogHeader className="px-6 pt-6 pb-5 text-start">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive text-destructive-foreground">
              <AlertTriangle className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="break-words text-base font-semibold leading-6">
                {tc("delete")} {t("thisProduct")}
              </DialogTitle>

              <DialogDescription className="mt-1 break-words text-sm leading-5 text-text-muted [overflow-wrap:anywhere]">
                {t("deleteConfirm", {
                  name: productName,
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="flex-row justify-center gap-2 px-6 pb-6">
          <DialogClose
            render={
              <Button type="button" variant="outline" disabled={isDeleting} />
            }
          >
            {tc("cancel")}
          </DialogClose>

          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            <Trash2 className="size-4" />
            {isDeleting ? t("actions.deleting") : tc("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
