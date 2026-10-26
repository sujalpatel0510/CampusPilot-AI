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
import { ThemeToggle } from "@/components/shared/theme-toggle";
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
    <div className="min-h-screen w-full bg-background overflow-x-hidden pt-16">
      {/* Header: Fixed Full Width */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md w-full">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-8 lg:px-12 xl:px-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/20 transition-transform group-hover:scale-105">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              CampusPilot <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#benefits" className="hover:text-foreground transition-colors">Benefits</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm">
                <Link href={user.role === "student" ? "/dashboard" : "/faculty/dashboard"}>
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  Go to dashboard
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm hover:from-indigo-700 hover:to-violet-700">
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section: Full Screen Width */}
      <section className="relative overflow-hidden w-full py-16 sm:py-24 lg:py-28">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[70rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-600/15 to-violet-600/15 blur-3xl" />
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 text-center">
          <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full px-3.5 py-1 text-xs">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Built for Indian colleges & universities
          </Badge>
          <h1 className="mx-auto max-w-5xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.12]">
            Your entire campus,{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-primary to-violet-600 bg-clip-text text-transparent">
              one intelligent assistant
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            CampusPilot AI brings attendance, timetable, assignments, exams and notices
            together — and answers your questions in natural language.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            {user ? (
              <Button asChild size="lg" className="h-12 px-6 text-base bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20">
                <Link href={user.role === "student" ? "/dashboard" : "/faculty/dashboard"}>
                  Open your dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-12 px-6 text-base bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-md shadow-indigo-600/20 hover:from-indigo-700 hover:to-violet-700">
                  <Link href="/register">Get started free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                  <Link href="/login">Try demo accounts</Link>
                </Button>
              </>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No installation · Works in your browser · Live bidirectional sync</p>
        </div>
      </section>

      {/* Features Section: Edge-to-Edge Full Width */}
      <section id="features" className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 border-t bg-muted/10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything your semester throws at you</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Six powerful tools working together, powered by one AI core that understands your academic life.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="transition-all hover:shadow-md hover:border-primary/40">
                <CardContent className="p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600/10 to-violet-600/10 text-primary mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works Section: Full Width */}
      <section id="how-it-works" className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 border-y bg-muted/30">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Up and running in minutes</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            No complex setup, no admin approval, no training manuals.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 w-full">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative rounded-xl border bg-background p-6 shadow-sm">
                <span className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-sm">
                  {index + 1}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-3">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold text-base">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Section: Edge-to-Edge Full Width */}
      <section id="benefits" className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-16 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-12 w-full">
          <div className="lg:col-span-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Why students love CampusPilot AI</h2>
            <ul className="mt-6 space-y-3.5">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm sm:text-base">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {user ? (
                <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm">
                  <Link href={user.role === "student" ? "/dashboard" : "/faculty/dashboard"}>
                    Open dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm hover:from-indigo-700 hover:to-violet-700">
                  <Link href="/register">
                    Create free account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                Your data stays in your campus network.
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative w-full">
            <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-600/10 to-violet-600/10 blur-xl" />
            <Card className="relative overflow-hidden w-full shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Dashboard preview</p>
                  <Badge variant="secondary">Live Mock Data</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Attendance", value: "84%", icon: Users, color: "text-emerald-600" },
                    { label: "Assignments", value: "3 due", icon: ClipboardList, color: "text-sky-600" },
                    { label: "Next exam", value: "10d", icon: CalendarClock, color: "text-violet-600" },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="rounded-lg border p-3 text-center">
                        <Icon className={`h-4 w-4 mx-auto ${stat.color}`} />
                        <p className="mt-2 text-lg font-bold">{stat.value}</p>
                        <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    { title: "DBMS Mid-Term — 24 Aug", sub: "10:00 AM · Room B-204", color: "bg-violet-500" },
                    { title: "Digital Electronics — 82%", sub: "Above 75% requirement · safe zone", color: "bg-emerald-500" },
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

      {/* Call to Action Section: Full Width */}
      <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-10 text-center text-white shadow-xl sm:p-14 w-full">
          <BellRing className="mx-auto h-9 w-9 opacity-90" />
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">Ready to take control of your semester?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 sm:text-base leading-relaxed">
            Join CampusPilot AI and let your campus work for you — attendance, exams, deadlines and study plans all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            {user ? (
              <Button asChild size="lg" className="h-12 px-6 text-base bg-white text-indigo-700 hover:bg-white/90 shadow-md">
                <Link href={user.role === "student" ? "/dashboard" : "/faculty/dashboard"}>
                  Open your dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="h-12 px-6 text-base bg-white text-indigo-700 hover:bg-white/90 shadow-md font-semibold">
                  <Link href="/register">Get started — it&apos;s free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base border-white/40 bg-transparent text-white hover:bg-white/10">
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer: Full Width Edge-to-Edge */}
      <footer className="border-t bg-muted/30 w-full">
        <div className="flex w-full flex-col items-center justify-between gap-4 px-4 sm:px-8 lg:px-12 xl:px-16 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </span>
            <p className="text-sm font-semibold">CampusPilot AI</p>
          </div>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            © {new Date().getFullYear()} CampusPilot AI. Built for students, by students.
          </p>
        </div>
      </footer>
    </div>
  );
}
