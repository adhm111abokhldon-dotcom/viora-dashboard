"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { hasLocalSession } from "@/lib/fakeAuth";

type AuthGuardProps = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const t = useTranslations("authGuard");
  const [state, setState] = useState<"checking" | "authenticated" | "error">(
    "checking",
  );

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => hasLocalSession())
      .then((authenticated) => {
        if (!active) return;
        if (!authenticated) {
          router.replace("/");
          return;
        }
        setState("authenticated");
      })
      .catch(() => {
        if (active) setState("error");
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (state === "error") {
    return (
      <main className="flex min-h-svh items-center justify-center px-4 text-center text-sm text-destructive">
        {t("unavailable")}
      </main>
    );
  }

  if (state !== "authenticated") return null;
  return <>{children}</>;
}
