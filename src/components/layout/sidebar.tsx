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
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { FEATURES } from "@/lib/feature-flags";
import type { Role } from "@/types";

export function Logo({ compact = false, onClick }: { compact?: boolean; onClick?: () => void }) {
  const { user } = useAuth();
  const href = user?.role === "student" ? "/dashboard" : "/faculty/dashboard";
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2">
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
      ...(FEATURES.AI_ASSISTANT
        ? [{ href: "/assistant", label: "AI Assistant", icon: Bot, badge: "AI" }]
        : []),
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
  ...(FEATURES.RESOURCES || FEATURES.STUDY_PLANNER
    ? [
        {
          label: "Resources",
          items: [
            ...(FEATURES.RESOURCES
              ? [
                  { href: "/notices", label: "Notices", icon: Megaphone },
                  { href: "/study-materials", label: "Study Materials", icon: BookOpen },
                ]
              : []),
            ...(FEATURES.STUDY_PLANNER
              ? [{ href: "/study-planner", label: "Study Planner", icon: NotebookPen, badge: "AI" }]
              : []),
            ...(FEATURES.RESOURCES
              ? [{ href: "/notifications", label: "Notifications", icon: FileText }]
              : []),
          ],
        },
      ]
    : []),
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
  ...(FEATURES.RESOURCES
    ? [
        {
          label: "Resources",
          items: [
            { href: "/faculty/notices", label: "Notices", icon: Megaphone },
            { href: "/faculty/materials", label: "Study Materials", icon: BookOpen },
          ],
        },
      ]
    : []),
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export function Sidebar({ className, onItemClick }: { className?: string; onItemClick?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role: Role = user?.role ?? "student";
  const navGroups = role === "student" ? STUDENT_NAV : FACULTY_NAV;

  return (
    <div className={cn("flex h-full flex-col gap-6 overflow-y-auto px-3 py-5 scrollbar-thin", className)}>
      <div className="px-2">
        <Logo onClick={onItemClick} />
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
                      onClick={onItemClick}
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
      {role === "student" && FEATURES.AI_ASSISTANT ? (
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
      ) : role !== "student" ? (
        <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
          <p className="text-xs font-semibold text-foreground">Faculty workspace</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Manage your subjects, attendance, exams and study resources.
          </p>
        </div>
      ) : null}

      {user ? (
        <div className="mt-auto pt-3 border-t border-border/60">
          <div className="flex items-center justify-between rounded-lg p-2 bg-muted/30 hover:bg-muted/60 transition-colors">
            <Link
              href="/settings"
              onClick={onItemClick}
              className="flex items-center gap-2.5 min-w-0 flex-1 group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-sm">
                {user.full_name
                  ? user.full_name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {user.full_name || user.email}
                </p>
                <p className="truncate text-[10px] text-muted-foreground capitalize">
                  {user.role}
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                logout();
                toast.success("Logged out successfully");
              }}
              title="Log out"
              aria-label="Log out"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
