"use client";

import { FormEvent, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import LogoImg from "@/public/logo.jpeg";

const VALID_USERNAMES = ["viora", "viorabeauty2004"];
const VALID_PASSWORD = "viora2004";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("login");

  const [username, setUsername] = useState("viora");
  const [password, setPassword] = useState("viora2004");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError(t("required"));
      return;
    }

    if (
      !VALID_USERNAMES.includes(username.trim().toLowerCase()) ||
      password !== VALID_PASSWORD
    ) {
      setError(t("invalid"));
      return;
    }

    setError("");
    setIsSubmitting(true);

    sessionStorage.setItem("isLoggedIn", "true");

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-none">
          <CardHeader className="space-y-6 pb-6">
            {/* Brand */}
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 relative overflow-hidden items-center justify-center rounded-2xl border border-border text-primary">
                <Image src={LogoImg} alt="logo" fill className="object-cover" />
              </div>

              <div className="mt-4">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Viora Beauty
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  {t("subtitle")}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5"
              aria-busy={isSubmitting}
            >
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">{t("username")}</Label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setError("");
                    }}
                    placeholder={t("usernamePlaceholder")}
                    className="ps-9"
                    aria-invalid={!!error}
                    aria-describedby={error ? "login-error" : undefined}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder={t("passwordPlaceholder")}
                    className="ps-9 pe-10"
                    aria-invalid={!!error}
                    aria-describedby={error ? "login-error" : undefined}
                    disabled={isSubmitting}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={
                      showPassword ? t("hidePassword") : t("showPassword")
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              <div aria-live="polite">
                {error && (
                  <p
                    id="login-error"
                    role="alert"
                    className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("signingIn")}
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    {t("signIn")}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Viora Beauty</span>

          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </main>
  );
}
