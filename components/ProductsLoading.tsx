import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>

        <Skeleton className="h-10 w-full sm:w-32" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20" />
              </div>

              <Skeleton className="size-10 rounded-lg" />
            </div>

            <Skeleton className="mt-4 h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Product Catalog */}
      <div className="overflow-hidden rounded-xl border">
        {/* Card Header */}
        <div className="border-b p-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>

          <Skeleton className="mt-5 h-10 w-full sm:max-w-sm" />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          {/* Table Header */}
          <div className="grid grid-cols-7 gap-4 border-b px-6 py-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>

          {/* Table Rows */}
          <div className="divide-y">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-7 items-center gap-4 px-6 py-4"
              >
                <Skeleton className="size-7 rounded-md" />

                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>

                <Skeleton className="h-4 w-20" />

                <Skeleton className="h-4 w-16" />

                <Skeleton className="h-4 w-16" />

                <Skeleton className="h-6 w-20 rounded-full" />

                <Skeleton className="ml-auto size-8 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y md:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-lg" />

                  <div className="min-w-0 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>

                <Skeleton className="size-8 shrink-0 rounded-md" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <Skeleton className="h-4 w-24" />

          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
