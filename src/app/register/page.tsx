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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
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

  async function submit() {
    const next: Record<string, string> = {};
    if (name.trim().length < 3) next.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.(ac\.in|edu|in)$/i.test(email)) next.email = "Use a valid college email (e.g. name@college.ac.in).";
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      next.password = "Password must be 8+ characters with a letter and a number.";
    }
    if (password !== confirmPassword) next.confirm = "Passwords do not match.";
    if (!college) next.college = "Select your college.";
    if (!course) next.course = "Select your course.";
    if (!semester) next.semester = "Select your semester.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const profile = await api.register(name.trim(), email, course, Number(semester));
      register(profile);
      toast.success("Account created. Welcome to CampusPilot AI!");
      router.replace("/dashboard");
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
          <Sparkles className="h-5 w-5 text-white" />
        </span>
        <span className="text-lg font-bold tracking-tight">
          CampusPilot <span className="text-primary">AI</span>
        </span>
      </Link>

      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Join with your college email to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reg-name">Full name</Label>
            <Input id="reg-name" placeholder="e.g. Sujal Sharma" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-email">College email</Label>
            <Input id="reg-email" type="email" placeholder="you@college.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
            {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="8+ chars, letters & numbers"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm">Confirm password</Label>
              <Input id="reg-confirm" type="password" placeholder="Repeat it" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} aria-invalid={!!errors.confirm} />
              {errors.confirm ? <p className="text-xs text-destructive">{errors.confirm}</p> : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-college">College</Label>
            <Select value={college} onValueChange={setCollege}>
              <SelectTrigger id="reg-college">
                <SelectValue placeholder="Select your college" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "National Institute of Technology, Delhi",
                  "National Institute of Technology, Trichy",
                  "Indian Institute of Technology, Delhi",
                  "Delhi Technological University",
                  "Charutar Vidya Mandal University",
                  "Other institute",
                ].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.college ? <p className="text-xs text-destructive">{errors.college}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-course">Course</Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger id="reg-course">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {["B.Tech CSE", "B.Tech ECE", "B.Tech ME", "B.Tech Civil", "M.Tech", "MCA", "MBA"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.course ? <p className="text-xs text-destructive">{errors.course}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-sem">Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger id="reg-sem">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      Semester {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.semester ? <p className="text-xs text-destructive">{errors.semester}</p> : null}
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={submit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}