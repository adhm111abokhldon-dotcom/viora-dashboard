"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
staleTime: 60 * 1000,
            /*
             * Refetch whenever the owner comes back to the tab. This was
             * previously left at the TanStack Query v5 default of `true`; it
             * is now stated explicitly so the intent survives future config
             * changes. `staleTime` stays at 60s - the tab only refetches when
             * the data is actually stale by then.
             */
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}