"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const COLLEGES = [
  "National Institute of Technology, Delhi",
  "National Institute of Technology, Trichy",
  "Indian Institute of Technology, Delhi",
  "Delhi Technological University",
  "Charutar Vidya Mandal University",
  "Birla Institute of Technology and Science, Pilani",
  "Vellore Institute of Technology",
  "Other Institute",
];

const COURSES = [
  "B.Tech Computer Science (CSE)",
  "B.Tech Electronics & Comm (ECE)",
  "B.Tech Information Tech (IT)",
  "B.Tech Mechanical Eng (ME)",
  "B.Tech Civil Eng (CE)",
  "M.Tech / Postgrad",
  "MCA (Computer Applications)",
  "MBA / Management",
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const strengthScore = [hasLength, hasLetter, hasNumber].filter(Boolean).length;

  async function submit() {
    const next: Record<string, string> = {};
    if (name.trim().length < 3) {
      next.name = "Enter your full name (min 3 chars).";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address.";
    }
    if (password.length < 8 || !hasLetter || !hasNumber) {
      next.password = "Min 8 chars with letter & number.";
    }
    if (password !== confirmPassword) {
      next.confirm = "Passwords do not match.";
    }
    if (!college) {
      next.college = "Select your college.";
    }
    if (!course) {
      next.course = "Select your degree.";
    }
    if (!semester) {
      next.semester = "Select semester.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const session = await api.register(name.trim(), email.trim(), password, course, Number(semester));
      login(session);
      toast.success("Account created successfully. Welcome to CampusPilot AI!");
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : "Registration failed. Please verify your details.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-background via-muted/20 to-muted/40">
      {/* Header: Full-Width */}
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
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content: Fills the entire vertical and horizontal space without top/bottom dead gaps */}
      <main className="flex-1 w-full flex items-center justify-center px-4 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
        <div className="grid w-full gap-8 lg:gap-12 md:grid-cols-12 items-center">
          
          {/* Left Brand Showcase (Desktop - Full Left Side) */}
          <div className="hidden md:col-span-5 lg:col-span-5 xl:col-span-5 md:flex md:flex-col md:space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary w-fit">
              <GraduationCap className="h-3.5 w-3.5" />
              Student Registration
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                Join CampusPilot, <br />
                <span className="bg-gradient-to-r from-indigo-600 via-primary to-violet-600 bg-clip-text text-transparent">
                  Get Started in Seconds.
                </span>
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                Connect your academic profile and instantly access synced timetables, attendance analytics, and assignment schedules.
              </p>
            </div>

            {/* Checklist items */}
            <div className="space-y-2.5 pt-2 text-sm text-muted-foreground w-full max-w-md">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-2.5 backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Instant semester timetable sync</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-2.5 backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Automated 75% attendance protection</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-2.5 backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">1-click assignment submissions & alerts</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-2.5 backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Completely private & campus-isolated</span>
              </div>
            </div>
          </div>

          {/* Right Signup Card (Desktop - Full Right Side) */}
          <div className="w-full md:col-span-7 lg:col-span-7 xl:col-span-7">
            <Card className="border-border/80 shadow-xl shadow-indigo-600/5 backdrop-blur-sm w-full">
              <CardContent className="p-6 sm:p-7">
                
                {/* Header inside card */}
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Create student account</h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Enter your details to generate your student portal profile.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                  }}
                  className="mt-4 space-y-3 w-full"
                >
                  {/* Full Name & Email */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="reg-name" className="text-xs font-medium">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="reg-name"
                          placeholder="e.g. Sujal Sharma"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                          }}
                          className="pl-9 h-9.5 text-sm"
                          aria-invalid={!!errors.name}
                        />
                      </div>
                      {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reg-email" className="text-xs font-medium">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="reg-email"
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
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="reg-password" className="text-xs font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Min 8 chars, letter & number"
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
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reg-confirm" className="text-xs font-medium">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="reg-confirm"
                          type={showPassword ? "text" : "password"}
                          placeholder="Repeat password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: "" }));
                          }}
                          className="pl-9 h-9.5 text-sm"
                          aria-invalid={!!errors.confirm}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Checklist */}
                  {password.length > 0 ? (
                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Strength:</span>
                        <span
                          className={`font-semibold ${
                            strengthScore === 3
                              ? "text-emerald-500"
                              : strengthScore === 2
                              ? "text-amber-500"
                              : "text-rose-500"
                          }`}
                        >
                          {strengthScore === 3 ? "Strong" : strengthScore === 2 ? "Fair" : "Weak"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className={`inline-flex items-center gap-1 ${hasLength ? "text-emerald-500" : ""}`}>
                          <Check className="h-3.5 w-3.5" /> 8+ chars
                        </span>
                        <span className={`inline-flex items-center gap-1 ${hasLetter ? "text-emerald-500" : ""}`}>
                          <Check className="h-3.5 w-3.5" /> Letter
                        </span>
                        <span className={`inline-flex items-center gap-1 ${hasNumber ? "text-emerald-500" : ""}`}>
                          <Check className="h-3.5 w-3.5" /> Number
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
                  {errors.confirm ? <p className="text-xs text-destructive">{errors.confirm}</p> : null}

                  {/* College / Institute */}
                  <div className="space-y-1">
                    <Label htmlFor="reg-college" className="text-xs font-medium">
                      College / University
                    </Label>
                    <Select
                      value={college}
                      onValueChange={(v) => {
                        setCollege(v);
                        if (errors.college) setErrors((prev) => ({ ...prev, college: "" }));
                      }}
                    >
                      <SelectTrigger id="reg-college" className="h-9.5 text-sm">
                        <SelectValue placeholder="Select your college or institute" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLLEGES.map((c) => (
                          <SelectItem key={c} value={c} className="text-sm">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.college ? <p className="text-xs text-destructive">{errors.college}</p> : null}
                  </div>

                  {/* Course & Semester */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="reg-course" className="text-xs font-medium">
                        Degree / Branch
                      </Label>
                      <Select
                        value={course}
                        onValueChange={(v) => {
                          setCourse(v);
                          if (errors.course) setErrors((prev) => ({ ...prev, course: "" }));
                        }}
                      >
                        <SelectTrigger id="reg-course" className="h-9.5 text-sm">
                          <SelectValue placeholder="Select degree" />
                        </SelectTrigger>
                        <SelectContent>
                          {COURSES.map((c) => (
                            <SelectItem key={c} value={c} className="text-sm">
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.course ? <p className="text-xs text-destructive">{errors.course}</p> : null}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reg-sem" className="text-xs font-medium">
                        Current Semester
                      </Label>
                      <Select
                        value={semester}
                        onValueChange={(v) => {
                          setSemester(v);
                          if (errors.semester) setErrors((prev) => ({ ...prev, semester: "" }));
                        }}
                      >
                        <SelectTrigger id="reg-sem" className="h-9.5 text-sm">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <SelectItem key={s} value={String(s)} className="text-sm">
                              Semester {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.semester ? <p className="text-xs text-destructive">{errors.semester}</p> : null}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-md shadow-indigo-600/20 hover:from-indigo-700 hover:to-violet-700 transition-all h-10 text-sm mt-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating your account…
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </form>

                {/* Footer Link */}
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign in here
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
