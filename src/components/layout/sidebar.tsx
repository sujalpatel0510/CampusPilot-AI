"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  CalendarDays,
  CalendarClock,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Megaphone,
  NotebookPen,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/types";

export function Logo({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const href = user?.role === "student" ? "/dashboard" : "/faculty/dashboard";
  return (
    <Link href={href} className="flex items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
        <Sparkles className="h-4 w-4 text-white" />
      </span>
      {!compact ? (
        <span className="text-base font-bold tracking-tight">
          CampusPilot <span className="text-primary">AI</span>
        </span>
      ) : null}
    </Link>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const STUDENT_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/assistant", label: "AI Assistant", icon: Bot, badge: "AI" },
    ],
  },
  {
    label: "Academic",
    items: [
      { href: "/attendance", label: "Attendance", icon: Users },
      { href: "/timetable", label: "Timetable", icon: CalendarDays },
      { href: "/assignments", label: "Assignments", icon: ClipboardList },
      { href: "/exams", label: "Exams", icon: CalendarClock },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/notices", label: "Notices", icon: Megaphone },
      { href: "/study-materials", label: "Study Materials", icon: BookOpen },
      { href: "/study-planner", label: "Study Planner", icon: NotebookPen },
      { href: "/notifications", label: "Notifications", icon: FileText },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

const FACULTY_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Main",
    items: [{ href: "/faculty/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Academic",
    items: [
      { href: "/faculty/subjects", label: "My Subjects", icon: BookOpen },
      { href: "/faculty/attendance", label: "Attendance", icon: Users },
      { href: "/faculty/assignments", label: "Assignments", icon: ClipboardList },
      { href: "/faculty/timetable", label: "Timetable", icon: CalendarDays },
      { href: "/faculty/exams", label: "Exams", icon: CalendarClock },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/faculty/notices", label: "Notices", icon: Megaphone },
      { href: "/faculty/materials", label: "Study Materials", icon: BookOpen },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role: Role = user?.role ?? "student";
  const navGroups = role === "student" ? STUDENT_NAV : FACULTY_NAV;

  return (
    <div className={cn("flex h-full flex-col gap-6 overflow-y-auto px-3 py-5 scrollbar-thin", className)}>
      <div className="px-2">
        <Logo />
      </div>
      <nav className="flex-1 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <Badge variant="secondary" className="h-4.5 bg-gradient-to-r from-indigo-600 to-violet-600 px-1.5 text-[9px] text-white">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      {role === "student" ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-semibold text-primary">Need help?</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Ask CampusPilot AI about exams, attendance or your schedule.
          </p>
          <Link
            href="/assistant"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            <Bot className="h-3 w-3" />
            Open AI Assistant
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
          <p className="text-xs font-semibold text-foreground">Faculty workspace</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Manage your subjects, attendance, exams and study resources.
          </p>
        </div>
      )}
    </div>
  );
}
