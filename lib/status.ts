import type { OrderStatus } from "@/lib/api";

/*
 * Centralized order-status styling.
 *
 * Everything is expressed through semantic design tokens
 * (success / warning / destructive) so the exact colours follow the
 * active theme automatically instead of being hardcoded per component.
 */

export const orderStatusBadge: Record<OrderStatus, string> = {
  Pending: "border-warning/30 bg-warning/10 text-warning",
  Delivered: "border-success/30 bg-success/10 text-success",
  Cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
};

export const orderStatusText: Record<OrderStatus, string> = {
  Pending: "text-warning",
  Delivered: "text-success",
  Cancelled: "text-destructive",
};

export const orderStatusDot: Record<OrderStatus, string> = {
  Pending: "bg-warning",
  Delivered: "bg-success",
  Cancelled: "bg-destructive",
};

export function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}
