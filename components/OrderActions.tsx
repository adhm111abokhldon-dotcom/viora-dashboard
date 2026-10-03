"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, MoreHorizontal, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Link } from "@/i18n/navigation";
import type { Order, OrderStatus } from "@/lib/api";
import { orderStatusText as statusStyles } from "@/lib/status";

type OrderActionsProps = {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  isUpdatingStatus: boolean;
};

export default function OrderActions({
  order,
  onStatusChange,
  isUpdatingStatus,
}: OrderActionsProps) {
  const t = useTranslations("orders.actions");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={t("aria", { id: order._id })}
            disabled={isUpdatingStatus}
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {order.status === "Pending" && (
          <>
            <DropdownMenuItem
              render={<Link href={`/orders/${order._id}/edit`} />}
            >
              {t("edit")}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </>
        )}

        {order.status === "Pending" && (
          <>
            <DropdownMenuItem
              disabled={isUpdatingStatus}
              onClick={() => onStatusChange(order._id, "Delivered")}
            >
              <CheckCircle2 className={`size-4 ${statusStyles.Delivered}`} />
              {t("markDelivered")}
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={isUpdatingStatus}
              onClick={() => onStatusChange(order._id, "Cancelled")}
            >
              <XCircle className={`size-4 ${statusStyles.Cancelled}`} />
              {t("cancel")}
            </DropdownMenuItem>
          </>
        )}

        {order.status === "Delivered" && (
          <DropdownMenuItem
            disabled={isUpdatingStatus}
            onClick={() => onStatusChange(order._id, "Cancelled")}
          >
            <XCircle className={`size-4 ${statusStyles.Cancelled}`} />
            {t("cancel")}
          </DropdownMenuItem>
        )}

        {order.status === "Cancelled" && (
          <DropdownMenuItem disabled>{t("noChanges")}</DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={<Link href={`/orders/${order._id}/delete`} />}
          className="text-destructive focus:text-destructive"
        >
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
