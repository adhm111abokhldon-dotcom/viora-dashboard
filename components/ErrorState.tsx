import { useTranslations } from "next-intl";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const t = useTranslations("errors");
  const tc = useTranslations("common");

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
        <AlertTriangle className="size-5 text-destructive" />
      </div>

      <div className="space-y-1">
        <p className="font-medium">{title ?? t("title")}</p>

        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {description ?? t("generic")}
        </p>
      </div>

      {onRetry ? (
        <Button variant="outline" className="mt-1" onClick={onRetry}>
          <RefreshCw className="size-4" />
          {retryLabel ?? tc("retry")}
        </Button>
      ) : null}
    </div>
  );
}
