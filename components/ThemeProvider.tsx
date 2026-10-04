"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="shadcn-dark"
      enableSystem={false}
      themes={[
        "light",
        "dark",
        "viora,one-dark,dracula,tokyo-night,catppuccin,nord,shadcn-dark,shadcn-light",
      ]}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
