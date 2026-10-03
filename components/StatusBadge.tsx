import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/api";
import { orderStatusBadge } from "@/lib/status";
import { cn } from "@/lib/utils";

export default function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  /*
   * Statuses come from the API as the canonical English values
   * (Pending / Delivered / Cancelled) and are only translated for display.
   */
  const t = useTranslations("status");

  const label = {
    Pending: t("pending"),
    Delivered: t("delivered"),
    Cancelled: t("cancelled"),
  }[status];

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", orderStatusBadge[status], className)}
    >
      {label}
    </Badge>
  );
}
