"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { deleteOrder, getOrderById } from "@/lib/api";

export default function DeleteOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

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

    onSuccess: () => {
      router.push("/orders");
      router.refresh();
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading order...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto flex min-h-[400px] w-full max-w-2xl items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Order not found."}
          </p>

          <Button
            nativeButton={false}
            variant="outline"
            className="mt-4"
            render={<Link href="/orders" />}
          >
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
          aria-label="Back to orders"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Delete Order
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Review the order before permanently deleting it.
          </p>
        </div>
      </div>

      {/* Warning */}
      <Card className="border-red-200 shadow-none dark:border-red-900/50">
        <CardContent className="flex gap-4 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30">
            <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
          </div>

          <div>
            <p className="font-medium">Delete this order?</p>

            <p className="mt-1 text-sm text-muted-foreground">
              This action cannot be undone. The order will be permanently
              removed from your records.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">
            Order #{order._id.slice(-6)}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="divide-y">
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">Customer</span>

              <span className="text-sm font-medium">{order.customer}</span>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">Phone</span>

              <span className="text-sm font-medium">{order.phone}</span>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">Product</span>

              <span className="text-sm font-medium">{order.product}</span>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">Quantity</span>

              <span className="text-sm font-medium tabular-nums">
                {order.quantity}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">Total</span>

              <span className="text-sm font-semibold tabular-nums">
                ${order.total.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">Profit</span>

              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                +${order.profit.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">Status</span>

              <span className="text-sm font-medium">{order.status}</span>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-muted-foreground">Date</span>

              <span className="text-sm font-medium">
                {formatDate(order.createdAt)}
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
          Cancel
        </Button>

        <Button
          variant="destructive"
          className="w-full sm:w-auto"
          disabled={deleteOrderMutation.isPending}
          onClick={() => deleteOrderMutation.mutate()}
        >
          <Trash2 className="size-4" />

          {deleteOrderMutation.isPending ? "Deleting..." : "Delete Order"}
        </Button>
      </div>

      {deleteOrderMutation.isError && (
        <p className="text-center text-sm text-destructive">
          {deleteOrderMutation.error instanceof Error
            ? deleteOrderMutation.error.message
            : "Failed to delete order."}
        </p>
      )}
    </div>
  );
}
