"use client";

import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ReportsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const te = useTranslations("errors");
  const tc = useTranslations("common");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          {te("title")}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {te("reports")}
        </p>

        <Button className="mt-6" onClick={() => reset()}>
          <RefreshCw className="size-4" />
          {tc("retry")}
        </Button>
      </div>
    </div>
  );
}
