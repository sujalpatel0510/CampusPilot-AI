"use client";

import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Bot,
  CalendarClock,
  Check,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  NotebookPen,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

const FEATURES = [
  {
    icon: Bot,
    title: "AI assistant that knows your campus",
    description: "Ask about exams, attendance or deadlines in plain language. CampusPilot AI answers instantly from your live academic data.",
  },
  {
    icon: Users,
    title: "Attendance with early warnings",
    description: "Track every subject in real time. Get alerted the moment a subject dips below the 75% requirement.",
  },
  {
    icon: CalendarClock,
    title: "Exams, countdowns & syllabus",
    description: "Every exam with a live countdown, room, time and a full syllabus breakdown so you always know what's next.",
  },
  {
    icon: NotebookPen,
    title: "AI study planner",
    description: "Generate a day-by-day revision plan built around your exam dates and weak subjects.",
  },
  {
    icon: Megaphone,
    title: "Notices summarised by AI",
    description: "Long official PDFs become crisp summaries. Key dates and fees are extracted automatically.",
  },
  {
    icon: ClipboardList,
    title: "Assignments under control",
    description: "Deadlines, filters and one-click submission tracking across all your courses.",
  },
];

const STEPS = [
  { icon: GraduationCap, title: "Connect your campus", description: "Sign in with your college email. Your academic data loads instantly." },
  { icon: LayoutDashboard, title: "See your academic life at a glance", description: "Attendance, classes, assignments and exams — one dashboard." },
  { icon: Bot, title: "Let AI handle the rest", description: "Ask questions, get summaries, and generate study plans on demand." },
];

const BENEFITS = [
  "Never miss an exam or deadline again",
  "Attendance alerts before it's too late",
  "Study plans personalised to your weak subjects",
  "AI summaries of long official notices",
  "Works on any device, anywhere",
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
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
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#benefits" className="hover:text-foreground">Benefits</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link href="/dashboard">
                  Go to dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" variant="brand">
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-600/15 to-violet-600/15 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
          <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full px-3 py-1 text-xs">
            <Zap className="h-3 w-3 text-primary" />
            Built for Indian colleges
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Your entire campus,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              one intelligent assistant
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            CampusPilot AI brings attendance, timetable, assignments, exams and notices
            together — and answers your questions in natural language.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {user ? (
              <Button asChild size="xl" variant="brand">
                <Link href="/dashboard">
                  Open your dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="xl" variant="brand">
                  <Link href="/register">Get started free</Link>
                </Button>
                <Button asChild size="xl" variant="outline">
                  <Link href="/login">Try demo account</Link>
                </Button>
              </>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No installation · Works in your browser · Free during preview</p>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything your semester throws at you</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Six tools working together, powered by one AI core that understands your academic data.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600/10 to-violet-600/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Up and running in minutes</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              No setup, no admin approval, no training manuals.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative rounded-xl border bg-background p-6 shadow-sm">
                  <span className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="benefits" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Why students love CampusPilot AI</h2>
            <ul className="mt-6 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {user ? (
                <Button asChild size="lg" variant="brand">
                  <Link href="/dashboard">
                    Open dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="brand">
                  <Link href="/register">
                    Create free account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                Your data stays in your campus network.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-600/10 to-violet-600/10 blur-xl" />
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Dashboard preview</p>
                  <Badge variant="secondary">Mock data</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Attendance", value: "82%", icon: Users, color: "text-emerald-600" },
                    { label: "Assignments", value: "3 due", icon: ClipboardList, color: "text-sky-600" },
                    { label: "Next exam", value: "10d", icon: CalendarClock, color: "text-violet-600" },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="rounded-lg border p-3">
                        <Icon className={`h-4 w-4 ${stat.color}`} />
                        <p className="mt-2 text-lg font-bold">{stat.value}</p>
                        <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    { title: "DBMS Mid-Term — 24 Aug", sub: "10:00 AM · Room B-204", color: "bg-violet-500" },
                    { title: "Digital Electronics — 70%", sub: "Below 75% · attend next classes", color: "bg-amber-500" },
                    { title: "AVL Tree Implementation — due 18 Aug", sub: "DSA · 4 days left", color: "bg-indigo-500" },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-3 rounded-lg border p-3">
                      <span className={`h-8 w-1 rounded-full ${item.color}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-10 text-center text-white shadow-lg sm:p-14">
          <BellRing className="mx-auto h-8 w-8 opacity-80" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight">Ready to take control of your semester?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
            Join CampusPilot AI and let your campus work for you — attendance, exams, deadlines and study plans in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {user ? (
              <Button asChild size="xl" className="bg-white text-indigo-700 hover:bg-white/90">
                <Link href="/dashboard">Open your dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="xl" className="bg-white text-indigo-700 hover:bg-white/90">
                  <Link href="/register">Get started — it&apos;s free</Link>
                </Button>
                <Button asChild size="xl" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </span>
            <p className="text-sm font-semibold">CampusPilot AI</p>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CampusPilot AI. Built for students, by students.
          </p>
        </div>
      </footer>
    </div>
  );
}