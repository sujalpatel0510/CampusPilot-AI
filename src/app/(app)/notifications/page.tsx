"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  CalendarClock,
  CheckCheck,
  GraduationCap,
  Megaphone,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/pagination";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { AppNotification, NotificationType } from "@/types";
import { formatDate, timeAgo, cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_META: Record<NotificationType, { label: string; icon: React.ElementType; className: string }> = {
  assignment: { label: "Assignment", icon: GraduationCap, className: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400" },
  attendance: { label: "Attendance", icon: Users, className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
  exam: { label: "Exam", icon: CalendarClock, className: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400" },
  notice: { label: "Notice", icon: Megaphone, className: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
  general: { label: "General", icon: Bell, className: "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400" },
};

const TABS: { value: "all" | NotificationType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "assignment", label: "Assignments" },
  { value: "attendance", label: "Attendance" },
  { value: "exam", label: "Exams" },
  { value: "notice", label: "Notices" },
];

const PAGE_SIZE = 8;

export default function NotificationsPage() {
  const { data, loading, error, refetch } = useApi(() => api.getNotifications());
  const [tab, setTab] = useState<"all" | NotificationType>("all");
  const [page, setPage] = useState(1);

  const notifications = (data ?? [])
    .filter((n) => tab === "all" || n.type === tab)
    .sort((a, b) => b.date.localeCompare(a.date));

  const unreadCount = (data ?? []).filter((n) => !n.read).length;
  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE));
  const pageItems = notifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function markRead(id: string) {
    try {
      await api.markNotificationRead(id);
      refetch();
    } catch {
      toast.error("Could not update the notification.");
    }
  }

  async function markAllRead() {
    try {
      await api.markAllNotificationsRead();
      refetch();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Could not mark notifications as read.");
    }
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Notifications" />
        <div className="mt-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Notifications"
          description={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "You're all caught up"}
          className="mb-0"
        />
        <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | NotificationType)}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              {t.value === "all" && unreadCount > 0 ? (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {unreadCount}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : pageItems.length === 0 ? (
            <EmptyState
              title="No notifications here"
              description="New notifications from your courses and the institute will show up here."
              icon={BellOff}
            />
          ) : (
            pageItems.map((notification) => {
              const meta = TYPE_META[notification.type];
              const Icon = meta.icon;
              return (
                <Card
                  key={notification.id}
                  className={cn("transition-colors", !notification.read && "border-primary/30 bg-primary/[0.02]")}
                >
                  <CardContent className="flex items-start gap-3.5 p-4">
                    <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.className)}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className={cn("text-sm font-semibold", !notification.read && "text-primary")}>
                          {notification.title}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(notification.date)} · {timeAgo(notification.date)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{notification.message}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {meta.label}
                      </span>
                      {!notification.read ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => markRead(notification.id)}>
                          Mark read
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}