"use client";

import { Toaster } from "sonner";
import { useLocale } from "next-intl";

/**
 * The one and only <Toaster /> for the app.
 *
 * Theme
 * -----
 * The app has ten themes applied as a class on <html> by next-themes
 * (see components/ThemeProvider.tsx). Because Sonner portals into <body>,
 * the theme's CSS custom properties (--background, --card, --border,
 * --foreground ...) cascade into the toast, so it re-colours itself for
 * light/dark/viora/nord/... without passing Sonner's `theme` prop (which
 * only understands light|dark|system and would break the custom themes).
 *
 * RTL
 * ---
 * `dir` follows the active locale so the text and the expand/close affordances
 * mirror correctly in Arabic.
 *
 * Position
 * --------
 * `top-center` on purpose: the primary action buttons in this app sit at the
 * BOTTOM of the forms on mobile (see orders/add-order/page.tsx), so a
 * bottom toast would cover Save/Cancel. Top-centre also stays clear of the
 * sticky header.
 */
export default function AppToaster() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <Toaster
      dir={isRtl ? "rtl" : "ltr"}
      position="top-center"
      closeButton
      duration={4000}
      visibleToasts={3}
      toastOptions={{
        classNames: {
          toast:
            "group !rounded-lg !border-border !bg-card !text-text !shadow-none",
          title: "!text-text !text-sm !font-medium",
          description: "!text-text-muted !text-xs",
          success: "!border-s-success",
          error: "!border-s-destructive",
          closeButton:
            "!border-border !bg-card !text-text-muted hover:!text-text",
        },
      }}
    />
  );
}
