"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "@/i18n/navigation";

type AuthGuardProps = {
  children: React.ReactNode;
};

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);

  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): boolean | null {
  return sessionStorage.getItem("isLoggedIn") === "true";
}

// null = not known yet (server / first client render).
function getServerSnapshot(): boolean | null {
  return null;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();

  const isLoggedIn = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (isLoggedIn === false) {
      router.replace("/");
    }
  }, [isLoggedIn, router]);

  if (isLoggedIn !== true) {
    return null;
  }

  return <>{children}</>;
}

