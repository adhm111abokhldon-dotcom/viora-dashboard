import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>

              <Skeleton className="size-10 rounded-lg" />
            </div>

            <Skeleton className="mt-4 h-3 w-36" />
          </div>
        ))}
      </div>

      {/* Sales Chart */}
      <div className="rounded-xl border p-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>

        <Skeleton className="mt-6 h-80 w-full" />
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-xl border">
          <div className="space-y-2 p-6">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-64" />
          </div>

          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="size-9 rounded-lg" />

                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>

                <div className="space-y-2 text-end">
                  <Skeleton className="ms-auto h-4 w-16" />
                  <Skeleton className="ms-auto h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status */}
        <div className="rounded-xl border p-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-64" />
          </div>

          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
            <Skeleton className="size-55 shrink-0 rounded-full" />

            <div className="w-full space-y-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-2.5 rounded-full" />
                  <Skeleton className="h-4 flex-1 max-w-32" />
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Business Snapshot */}
      <div className="rounded-xl border p-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className="h-4 w-28" />
              </div>

              <Skeleton className="mt-4 h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
