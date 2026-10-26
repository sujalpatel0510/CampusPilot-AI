"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
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
    const emailValue = (emailOverride ?? email).trim();
    const passwordValue = passwordOverride ?? password;
    const next: Record<string, string> = {};

    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      next.email = "Please enter a valid email address.";
    }
    if (!passwordValue || passwordValue.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const session = await api.login(emailValue, passwordValue);
      login(session);
      toast.success(`Welcome back, ${session.user.full_name.split(" ")[0]}!`);
      router.replace(homeFor(session.user.role));
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : "Invalid credentials. Please verify your email and password.";
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
    setEmail(creds.email);
    setPassword(creds.password);
    setErrors({});
    void submit(creds.email, creds.password);
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-background via-muted/20 to-muted/40">
      {/* Top Header: Full-Width */}
      <header className="h-14 shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-md w-full">
        <div className="flex h-full w-full items-center justify-between px-4 sm:px-8 lg:px-12 xl:px-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/20 transition-transform group-hover:scale-105">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight">
              CampusPilot <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="h-8 text-xs px-3">
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content: Fills the entire vertical and horizontal space without top/bottom dead gaps */}
      <main className="flex-1 w-full flex items-center justify-center px-4 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
        <div className="grid w-full gap-8 lg:gap-12 md:grid-cols-12 items-center">
          
          {/* Left Hero Showcase (Desktop - Full Left Half) */}
          <div className="hidden md:col-span-6 lg:col-span-7 xl:col-span-7 md:flex md:flex-col md:space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary w-fit">
              <ShieldCheck className="h-3.5 w-3.5" />
              Official Academic Portal
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                Your Academic Life, <br />
                <span className="bg-gradient-to-r from-indigo-600 via-primary to-violet-600 bg-clip-text text-transparent">
                  Synchronized & In Control.
                </span>
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                Log in to seamlessly track attendance, timetable schedules, upcoming exams, and assignment submissions in real time.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-2.5 pt-2 w-full max-w-xl">
              <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Users className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Real-Time Attendance Monitoring</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Stay safely above 75% with live class attendance calculation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Dynamic Timetable & Schedule</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Weekly schedules, ongoing classes, and lecture room locations.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Instant Assignments & Exams</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Submit assignments with 1-click and countdown to exams.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Login Card (Desktop - Full Right Half) */}
          <div className="w-full md:col-span-6 lg:col-span-5 xl:col-span-5">
            <Card className="border-border/80 shadow-xl shadow-indigo-600/5 backdrop-blur-sm w-full">
              <CardContent className="p-6 sm:p-7">
                
                {/* Header inside card */}
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Welcome back</h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Enter your college credentials to access your portal.
                  </p>
                </div>

                {/* One-Click Quick Demo Login Chips */}
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 w-full">
                  <div className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>One-Click Demo Access</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">Ready</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => demoLogin("student")}
                      disabled={submitting}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-sm"
                    >
                      <GraduationCap className="h-4 w-4 text-indigo-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-tight text-foreground">Student Demo</p>
                        <p className="text-[11px] text-muted-foreground truncate">Sujal Sharma</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => demoLogin("faculty")}
                      disabled={submitting}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-sm"
                    >
                      <Users className="h-4 w-4 text-violet-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-tight text-foreground">Faculty Demo</p>
                        <p className="text-[11px] text-muted-foreground truncate">Dr. Anil Kumar</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/80" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-card px-2.5 text-muted-foreground">or sign in with email</span>
                  </div>
                </div>

                {/* Login Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                  }}
                  className="space-y-3 w-full"
                >
                  {/* Email */}
                  <div className="space-y-1">
                    <Label htmlFor="login-email" className="text-xs font-medium">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@college.ac.in"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        className="pl-9 h-9.5 text-sm"
                        aria-invalid={!!errors.email}
                      />
                    </div>
                    {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-xs font-medium">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => toast.info("Demo accounts: campus123 (student) or faculty123 (faculty)")}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        className="pl-9 pr-9 h-9.5 text-sm"
                        aria-invalid={!!errors.password}
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

                  {/* Remember Me */}
                  <div className="flex items-center space-x-2 pt-0.5">
                    <Checkbox id="login-remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                    <Label htmlFor="login-remember" className="text-xs text-muted-foreground cursor-pointer font-normal">
                      Keep me signed in
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-md shadow-indigo-600/20 hover:from-indigo-700 hover:to-violet-700 transition-all h-10 text-sm mt-1"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                {/* Footer Link */}
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  Don&apos;t have an account yet?{" "}
                  <Link href="/register" className="font-semibold text-primary hover:underline">
                    Create student account
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
