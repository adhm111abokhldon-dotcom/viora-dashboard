import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<{ className?: string }>;

export type StatTone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "destructive";

const toneStyles: Record<StatTone, string> = {
  default: "border bg-muted text-muted-foreground",
  primary: "border bg-primary/10 text-primary",
  success: "border bg-success/10 text-success",
  warning: "border bg-warning/10 text-warning",
  destructive: "border bg-destructive/10 text-destructive",
};

/*
 * Consistent statistic card used across Dashboard, Orders and Reports.
 * Colours are driven by semantic tokens, never hardcoded brand values.
 */
export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: IconComponent;
  tone?: StatTone;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md",
            toneStyles[tone],
          )}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>

          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>

          {hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {hint}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
