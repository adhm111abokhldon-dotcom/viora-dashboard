"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { deleteOrder, getOrderById } from "@/lib/api";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { apiErrorMessage } from "@/lib/errors";
import { useAppToast } from "@/lib/toast";
import { useInvalidateAll } from "@/lib/queries";

export default function DeleteOrderPage() {
  const t = useTranslations("orders.delete");
  const tOrders = useTranslations("orders");
  const tStatus = useTranslations("status");
  const te = useTranslations("errors");
  const locale = useLocale() as "en" | "ar";

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const invalidateAll = useInvalidateAll();
  const toast = useAppToast();

  const orderId = params.id;

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  });

  const deleteOrderMutation = useMutation({
    mutationFn: () => deleteOrder(orderId),

    onSuccess: async () => {
      toast.success("orderDeleted");

      await invalidateAll();

      router.push("/orders");
      router.refresh();
    },

    onError: (error) => {
      toast.error(error, "deleteOrder");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {tOrders("loading")}
        </p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto flex min-h-[400px] w-full max-w-2xl items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-destructive">
            {apiErrorMessage(error, te, te("orderNotFound"))}
          </p>

          <Button
            nativeButton={false}
            variant="outline"
            className="mt-4"
            render={<Link href="/orders" />}
          >
            {t("backToOrders")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          nativeButton={false}
          variant="outline"
          size="icon"
          className="mt-0.5 shrink-0"
          render={<Link href="/orders" />}
          aria-label={t("backAria")}
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
        </Button>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </div>

      {/* Warning */}
      <Card className="border-red-200 shadow-none dark:border-red-900/50">
        <CardContent className="flex gap-4 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10">
            <AlertTriangle className="size-5 text-destructive" />
          </div>

          <div>
            <p className="font-medium">{t("warningTitle")}</p>

            <p className="mt-1 text-sm text-muted-foreground">
              {t("warningDescription")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">
            <span dir="ltr">
              {tOrders("orderHash", { id: order.orderNumber ?? "—" })}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="divide-y">
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">
                {t("customer")}
              </span>

              <span className="text-sm font-medium">{order.customer}</span>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">
                {t("phone")}
              </span>

              <span dir="ltr" className="text-sm font-medium">
                {order.phone}
              </span>
            </div>

            <div className="py-3">
              <span className="text-sm text-muted-foreground">
                {t("products")}
              </span>

              <div className="mt-2 space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm font-medium">
                      {item.name} × {formatNumber(item.quantity, locale)}
                    </span>

                    <span className="text-sm tabular-nums">
                      {formatCurrency(
                        item.quantity * item.unitPrice,
                        locale,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">
                {t("total")}
              </span>

              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(order.total, locale)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">
                {t("profit")}
              </span>

              <span className="text-sm font-semibold text-success tabular-nums">
                +{formatCurrency(order.profit, locale)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">
                {t("status")}
              </span>

              <span className="text-sm font-medium">
                {
                  {
                    Pending: tStatus("pending"),
                    Delivered: tStatus("delivered"),
                    Cancelled: tStatus("cancelled"),
                  }[order.status]
                }
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">
                {t("date")}
              </span>

              <span className="text-sm font-medium">
                {formatDate(order.createdAt, locale)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          nativeButton={false}
          variant="outline"
          className="w-full sm:w-auto"
          render={<Link href="/orders" />}
        >
          {t("cancel")}
        </Button>

        <Button
          variant="destructive"
          className="w-full sm:w-auto"
          disabled={deleteOrderMutation.isPending}
          onClick={() => deleteOrderMutation.mutate()}
        >
          <Trash2 className="size-4" />

          {deleteOrderMutation.isPending ? t("deleting") : t("confirm")}
        </Button>
      </div>

    </div>
  );
}
