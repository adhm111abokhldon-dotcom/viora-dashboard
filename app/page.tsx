"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LockKeyhole, LogIn, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VALID_USERNAME = "viorabeauty2004";
const VALID_PASSWORD = "viora2004";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    if (username.trim() !== VALID_USERNAME || password !== VALID_PASSWORD) {
      setError("Invalid username or password.");
      return;
    }

    setError("");

    sessionStorage.setItem("isLoggedIn", "true");

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md shadow-none">
        <CardHeader className="space-y-6 pb-6">
          {/* Brand */}
          <div className="flex flex-col items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
              <LockKeyhole className="size-5 text-muted-foreground" />
            </div>

            <div className="mt-4">
              <h1 className="text-2xl font-semibold tracking-tight">
                Viora Beauty
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to your dashboard
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>

              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter your username"
                  className="pl-9"
                  aria-invalid={!!error}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  className="pl-9 pr-10"
                  aria-invalid={!!error}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full">
              <LogIn className="size-4" />
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
