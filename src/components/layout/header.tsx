"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Bot, LogOut, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { HeaderSearch } from "@/components/layout/header-search";
import { UserMenu } from "@/components/layout/user-menu";
import { useApi, invalidateApiCache } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/feature-flags";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/assistant": "AI Assistant",
  "/attendance": "Attendance",
  "/timetable": "Timetable",
  "/assignments": "Assignments",
  "/exams": "Exams",
  "/notices": "Notices",
  "/study-materials": "Study Materials",
  "/study-planner": "Study Planner",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/faculty/dashboard": "Faculty Dashboard",
  "/faculty/subjects": "My Subjects",
  "/faculty/attendance": "Attendance",
  "/faculty/assignments": "Assignments",
  "/faculty/timetable": "Timetable",
  "/faculty/exams": "Exams",
  "/faculty/notices": "Notices",
  "/faculty/materials": "Study Materials",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isStudent = user?.role === "student";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: notifications } = useApi(
    () => (isStudent ? api.getNotifications() : Promise.resolve([])),
    [isStudent],
    { key: "notifications" }
  );
  const unread = (notifications ?? []).filter((n) => !n.read).length;

  function handleManualSync() {
    setIsSyncing(true);
    invalidateApiCache();
    toast.success("Synchronized latest academic data");
    setTimeout(() => setIsSyncing(false), 600);
  }

  function handleLogout() {
    logout();
    toast.success("Logged out successfully");
    router.replace("/login");
  }

  useEffect(() => {
    function onOpen() {
      setSearchOpen(true);
    }
    window.addEventListener("campuspilot:open-search", onOpen);
    return () => window.removeEventListener("campuspilot:open-search", onOpen);
  }, []);

  const title = TITLES[pathname] ?? "CampusPilot AI";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/60 px-4 glass sm:px-6">
      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
      <h1 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        {/* Quick Sync Button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleManualSync}
          aria-label="Sync latest data"
          title="Sync with latest updates"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isSyncing && "animate-spin text-primary")} />
        </Button>

        {isStudent ? (
          <>
            <HeaderSearch open={searchOpen} onOpenChange={setSearchOpen} />
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden sm:inline-flex"
              onClick={() => setSearchOpen(true)}
              aria-label="Search (press /)"
              title="Search ( / )"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </Button>

            {FEATURES.AI_ASSISTANT ? (
              <Link
                href="/assistant"
                className={cn(
                  "hidden h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium sm:inline-flex",
                  pathname === "/assistant"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Bot className="h-3.5 w-3.5" />
                Ask AI
              </Link>
            ) : null}

            {FEATURES.RESOURCES ? (
              <Button variant="ghost" size="icon-sm" asChild aria-label="Notifications" className="relative">
                <Link href="/notifications">
                  <Bell className="h-4 w-4" />
                  {unread > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                      {unread}
                    </span>
                  ) : null}
                </Link>
              </Button>
            ) : null}
          </>
        ) : null}

        {/* Role Badge */}
        {user ? (
          <Badge
            variant="outline"
            className="hidden md:inline-flex text-[11px] font-medium border-primary/20 bg-primary/5 text-primary capitalize px-2 py-0.5"
          >
            {user.role}
          </Badge>
        ) : null}

        <ThemeToggle />

        {/* Direct Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          aria-label="Direct logout"
          title="Log out of your account"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline font-medium">Log out</span>
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}