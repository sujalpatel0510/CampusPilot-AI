"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  GraduationCap,
  KeyRound,
  LogOut,
  Moon,
  Palette,
  Shield,
  Sun,
  UserRound,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";

const NOTIFICATION_PREFS = [
  { key: "assignments", label: "Assignment deadlines", description: "Reminders 48 hours before a deadline" },
  { key: "attendance", label: "Attendance warnings", description: "Alerts when a subject drops below 75%" },
  { key: "exams", label: "Exam reminders", description: "Notifications ahead of every scheduled exam" },
  { key: "notices", label: "Institute notices", description: "New official announcements from the college" },
  { key: "aiSuggestions", label: "AI suggestions", description: "Personalised study and revision tips" },
];

const AI_PREFS = [
  { key: "concise", label: "Concise answers", description: "Prefer short, bullet-point responses" },
  { key: "autoPlanner", label: "Auto-sync with study planner", description: "Suggest planner updates after every conversation" },
];

export default function SettingsPage() {
  const { user, logout, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const isStudent = user?.role === "student";
  const subjects = useApi(() => (isStudent ? api.getSubjects() : Promise.resolve([])), [isStudent], { key: "subjects" });
  const [name, setName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [course, setCourse] = useState(user?.course ?? "B.Tech CSE");
  const [semester, setSemester] = useState<string>(user?.semester ? `Semester ${user.semester}` : "Semester 4");
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    assignments: true,
    attendance: true,
    exams: true,
    notices: true,
    aiSuggestions: true,
    concise: false,
    autoPlanner: false,
  });
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function saveProfile() {
    if (name.trim().length < 3) {
      toast.error("Name must be at least 3 characters.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        full_name: name.trim(),
        course,
        semester: Number(semester.match(/\d+/)?.[0] ?? user?.semester),
      });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  function changePassword() {
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      toast.error("New password must be 8+ characters with a letter and a number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    toast.success("Password changed.");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function togglePref(key: string) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, preferences and security
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4 text-primary" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="set-name">Full name</Label>
              <Input id="set-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-email">College email</Label>
              <Input id="set-email" value={email} disabled />
              <p className="text-[11px] text-muted-foreground">Email is tied to your college account and cannot be changed.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {isStudent ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="set-course">Course</Label>
                    <Select value={course} onValueChange={setCourse}>
                      <SelectTrigger id="set-course">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["B.Tech CSE", "B.Tech ECE", "B.Tech ME", "B.Tech Civil", "M.Tech", "MCA", "MBA"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="set-sem">Semester</Label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger id="set-sem">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="set-department">Department</Label>
                  <Input id="set-department" value={user?.department ?? ""} disabled />
                  <p className="text-[11px] text-muted-foreground">Department is set by the institute.</p>
                </div>
              )}
            </div>
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" />
              Account & password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <span className="font-semibold text-primary">Demo account</span>
              <p className="mt-0.5 text-muted-foreground">
                Password changes and email verification are simulated in this preview build.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-current">Current password</Label>
              <Input id="set-current" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="set-new">New password</Label>
                <Input id="set-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="8+ chars, letters & numbers" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="set-confirm">Confirm new password</Label>
                <Input id="set-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat it" />
              </div>
            </div>
            <Button variant="outline" onClick={changePassword}>
              Change password
            </Button>
            <Separator />
            <Button variant="destructive" className="w-full sm:w-auto" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Log out of CampusPilot
            </Button>
          </CardContent>
        </Card>

        {isStudent ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {NOTIFICATION_PREFS.map((pref) => (
                <div key={pref.key} className="flex items-center justify-between gap-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.description}</p>
                  </div>
                  <Switch checked={prefs[pref.key]} onCheckedChange={() => togglePref(pref.key)} aria-label={pref.label} />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SparklesSmall />
              CampusPilot AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {AI_PREFS.map((pref) => (
              <div key={pref.key} className="flex items-center justify-between gap-4 py-2.5">
                <div>
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
                <Switch checked={prefs[pref.key]} onCheckedChange={() => togglePref(pref.key)} aria-label={pref.label} />
              </div>
            ))}
            <Separator className="my-3" />
            <p className="text-xs text-muted-foreground">
              AI preferences are applied to the assistant on your next conversation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: GraduationCap },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
                    theme === option.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/40"
                  )}
                  aria-pressed={theme === option.value}
                >
                  <option.icon className={cn("h-4 w-4", theme === option.value ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xs font-medium">{option.label}</span>
                  {theme === option.value ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            {isStudent ? (
              <div className="space-y-1.5">
                <Label htmlFor="set-default-course">Default course view</Label>
                <Select defaultValue={subjects.data?.[0]?.id}>
                  <SelectTrigger id="set-default-course">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(subjects.data ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center justify-between gap-4 py-2.5">
              <div>
                <p className="text-sm font-medium">Share anonymised usage data</p>
                <p className="text-xs text-muted-foreground">Helps improve AI suggestions across campuses</p>
              </div>
              <Switch defaultChecked aria-label="Share anonymised usage data" />
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <div>
                <p className="text-sm font-medium">Session persistence</p>
                <p className="text-xs text-muted-foreground">Stay signed in on this device</p>
              </div>
              <Switch defaultChecked aria-label="Session persistence" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SparklesSmall() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-2.5 w-2.5 text-white">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" strokeLinejoin="round" />
      </svg>
    </span>
  );
}