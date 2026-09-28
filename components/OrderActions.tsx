"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Order, OrderStatus } from "@/lib/api";

type OrderActionsProps = {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  isUpdatingStatus: boolean;
};

const statusStyles: Record<OrderStatus, string> = {
  Pending: "text-amber-600 dark:text-amber-400",
  Delivered: "text-emerald-600 dark:text-emerald-400",
  Cancelled: "text-red-600 dark:text-red-400",
};

export default function OrderActions({
  order,
  onStatusChange,
  isUpdatingStatus,
}: OrderActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Actions for order ${order._id}`}
            disabled={isUpdatingStatus}
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          render={<Link href={`/orders/${order._id}/edit`} />}
        >
          Edit Order
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={order.status === "Pending" || isUpdatingStatus}
          onClick={() => onStatusChange(order._id, "Pending")}
        >
          <Clock3 className={`size-4 ${statusStyles.Pending}`} />
          Mark as Pending
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={order.status === "Delivered" || isUpdatingStatus}
          onClick={() => onStatusChange(order._id, "Delivered")}
        >
          <CheckCircle2
            className={`size-4 ${statusStyles.Delivered}`}
          />
          Mark as Delivered
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={order.status === "Cancelled" || isUpdatingStatus}
          onClick={() => onStatusChange(order._id, "Cancelled")}
        >
          <XCircle className={`size-4 ${statusStyles.Cancelled}`} />
          Cancel Order
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={
            <Link href={`/orders/${order._id}/delete`} />
          }
          className="text-destructive focus:text-destructive"
        >
          Delete Order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}