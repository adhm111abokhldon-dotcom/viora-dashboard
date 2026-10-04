"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={[
        "light",
        "dark",
        "shadcn-dark",
        "shadcn-light",
        "viora",
        "one-dark",
        "dracula",
        "tokyo-night",
        "catppuccin",
        "nord",
      ]}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
