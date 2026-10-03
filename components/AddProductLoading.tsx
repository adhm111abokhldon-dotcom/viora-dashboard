import { Skeleton } from "@/components/ui/skeleton";

export default function AddProductLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      {/* Form Card */}
      <div className="rounded-xl border bg-card">
        {/* Card Header */}
        <div className="border-b p-6">
          <Skeleton className="h-5 w-32" />

          <Skeleton className="mt-2 h-4 w-64 max-w-full" />
        </div>

        {/* Form */}
        <div className="space-y-6 p-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Price / Cost */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Margin Preview */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40 max-w-full" />
              </div>

              <div className="space-y-2 text-end">
                <Skeleton className="ms-auto h-6 w-20" />
                <Skeleton className="ms-auto h-4 w-12" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <Skeleton className="h-10 w-full sm:w-24" />
            <Skeleton className="h-10 w-full sm:w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
