"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Role } from "@/types";

function homeFor(role: Role): string {
  return role === "student" ? "/dashboard" : "/faculty/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(emailOverride?: string, passwordOverride?: string) {
    const emailValue = emailOverride ?? email;
    const passwordValue = passwordOverride ?? password;
    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) next.email = "Enter a valid email address.";
    if (passwordValue.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const session = await api.login(emailValue, passwordValue);
      login(session);
      toast.success(`Welcome back, ${session.user.full_name.split(" ")[0]}!`);
      router.replace(homeFor(session.user.role));
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  function demoLogin(role: "student" | "faculty") {
    const creds = {
      student: { email: "sujal.sharma@nitd.ac.in", password: "campus123" },
      faculty: { email: "anil.kumar@nitd.ac.in", password: "faculty123" },
    }[role];
    void submit(creds.email, creds.password);
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              CampusPilot <span className="text-primary">AI</span>
            </span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your campus account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">College email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@college.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                aria-invalid={!!errors.password}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
              Remember me
            </label>
            <button type="button" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </button>
          </div>

          <Button className="w-full" size="lg" onClick={() => void submit()} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">or</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="w-full" onClick={() => demoLogin("student")} disabled={submitting}>
              Student demo
            </Button>
            <Button variant="outline" size="sm" className="w-full" onClick={() => demoLogin("faculty")} disabled={submitting}>
              Faculty demo
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Student · sujal.sharma@nitd.ac.in / campus123
          </p>

          <p className="text-center text-sm text-muted-foreground">
            New to CampusPilot?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
