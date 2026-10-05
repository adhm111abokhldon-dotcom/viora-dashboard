"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Every query key used for business data in the app, as prefix roots.
 *
 * `invalidateQueries({ queryKey: [root] })` prefix-matches by default in
 * TanStack Query v5, so a single root covers every parameterized variant:
 *
 *   ["orders", page, limit, search, status]   -> ["orders"]
 *   ["order", id]                             -> ["order"]
 *   ["products", page, limit, search]         -> ["products"]
 *   ["products", "all"] / ["products","order-edit"] -> ["products"]
 *   ["product", id]                           -> ["product"]
 *   ["productStats", id, trendDays]           -> ["productStats"]
 *   ["reports", range]                        -> ["reports"]
 *   ["dashboard"]                             -> ["dashboard"]
 *   ["advertising", page, from, to, platform] -> ["advertising"]
 *
 * NOTE: "order" and "product" are listed separately on purpose - they are
 * distinct array roots, so invalidating ["order"] does NOT cover ["orders"]
 * and invalidating ["product"] does NOT cover ["productStats"].
 */
export const BUSINESS_QUERY_ROOTS = [
  "orders",
  "order",
  "products",
  "product",
  "productStats",
  "reports",
  "dashboard",
  "advertising",
  // The Ad-performance card. Without this the card kept showing pre-sync
  // numbers for up to staleTime after a Windsor sync.
  "adInsights",
] as const;

/**
 * Invalidate every business query after a mutation.
 *
 * `refetchType: "active"` makes each mounted screen refetch straight away, so
 * the numbers the owner is looking at update immediately instead of waiting
 * out the 60s `staleTime`. Inactive queries (pages they are not on) are
 * simply marked stale so they refetch the next time they are opened.
 *
 * Returns a promise that resolves once the active refetches are done; awaiting
 * it inside `onSuccess` guarantees the new data is on screen by the time the
 * mutation settles.
 */
export function useInvalidateAll() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await Promise.all(
      BUSINESS_QUERY_ROOTS.map((root) =>
        queryClient.invalidateQueries({
          queryKey: [root],
          refetchType: "active",
        }),
      ),
    );
  }, [queryClient]);
}
