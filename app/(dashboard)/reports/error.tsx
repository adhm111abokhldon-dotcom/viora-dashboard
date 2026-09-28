"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ReportsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          Something went wrong
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t load the reports right now. Please try again.
        </p>

        <Button className="mt-6" onClick={() => reset()}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
