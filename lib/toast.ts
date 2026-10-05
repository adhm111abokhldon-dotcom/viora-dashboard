"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/errors";

/**
 * Success messages for every mutation in the app.
 * Keys live in the "toast" namespace of messages/en.json and messages/ar.json.
 */
export type ToastMessageKey =
  | "orderCreated"
  | "orderUpdated"
  | "orderDeleted"
  | "orderMarkedDelivered"
  | "orderCancelled"
  | "productCreated"
  | "productUpdated"
  | "productDeleted"
  | "adCreated"
  | "adUpdated"
  | "adDeleted"
  | "windsorSyncDone";

/**
 * Single entry point for mutation feedback.
 *
 * - Success copy is always short, specific and translated.
 * - Errors go through the project's existing `apiErrorMessage` helper, so a
 *   real server message (for example "Not enough stock for LED Bear.
 *   Available: 3") is shown verbatim, while the app's own static failures are
 *   mapped to the localized "errors" namespace.
 * - `error()` is only ever called from a mutation's `onError`, so a failed
 *   mutation can never produce a success toast.
 */
export function useAppToast() {
  const t = useTranslations("toast");
  const te = useTranslations("errors");

  return {
    success(key: ToastMessageKey) {
      toast.success(t(key));
    },

    /** `fallbackKey` is a key inside the "errors" namespace. */
    error(error: unknown, fallbackKey: string) {
      toast.error(apiErrorMessage(error, te, te(fallbackKey)));
    },
  };
}
