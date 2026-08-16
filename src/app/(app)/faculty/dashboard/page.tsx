"use client";

import { BookOpen, CalendarClock, CalendarDays, ClipboardList, Megaphone, Users } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime12, subjectColor, WEEK_DAY_NAMES } from "@/lib/utils";
import { daysUntil } from "@/lib/utils";

function todayName(): string {
  const idx = (new Date().getDay() + 6) % 7;
  return WEEK_DAY_NAMES[idx];
}

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const profile = useApi(() => api.getFacultyProfile(), [], { key: "faculty-profile" });
  const subjects = useApi(() => api.getFacultySubjects(), [], { key: "faculty-subjects" });
  const timetable = useApi(() => api.getFacultyTimetable(), [], { key: "faculty-timetable" });
  const exams = useApi(() => api.getFacultyExams(), [], { key: "faculty-exams" });
  const assignments = useApi(() => api.getFacultyAssignments(), [], { key: "faculty-assignments" });
  const notices = useApi(() => api.getFacultyNotices(), [], { key: "faculty-notices" });

  if (user && user.role !== "faculty") {
    return (
      <div className="space-y-6">
        <PageHeader title="Faculty Dashboard" description="Admin preview" />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Admin accounts can manage exams, notices and study materials via the faculty pages,
            but don&apos;t have a faculty profile. Use the <strong>Faculty demo</strong> login to see the
            full faculty dashboard.
          </CardContent>
        </Card>
      </div>
    );
  }

  const error =
    profile.error ?? subjects.error ?? timetable.error ?? exams.error ?? assignments.error ?? notices.error;

  if (error) {
    return (
      <div>
        <PageHeader title="Faculty Dashboard" />
        <div className="mt-6">
          <ErrorState message={error} onRetry={() => { profile.refetch(); subjects.refetch(); }} />
        </div>
      </div>
    );
  }

  const loading = profile.loading || subjects.loading || timetable.loading || exams.loading || assignments.loading || notices.loading;
  const today = todayName();
  const todayClasses = (timetable.data ?? []).filter((e) => e.day_of_week === today);
  const upcomingExams = (exams.data ?? []).filter((e) => (e.days_left ?? 0) >= 0).slice(0, 5);
  const pendingAssignments = (assignments.data ?? []).filter((a) => a.status !== "completed").slice(0, 5);
  const recentNotices = (notices.data ?? []).slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.full_name.split(" ")[0] ?? "Faculty"}`}
        description={profile.data ? `${profile.data.employee_id} · ${profile.data.department} department` : undefined}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Subjects I teach"
            value={subjects.data?.length ?? 0}
            icon={BookOpen}
            footer={profile.data ? `${profile.data.department} · Semester ${subjects.data?.[0]?.semester ?? "—"}` : undefined}
          />
          <StatCard
            title="Classes today"
            value={todayClasses.length}
            icon={CalendarDays}
            footer={today}
          />
          <StatCard
            title="Upcoming exams"
            value={upcomingExams.length}
            icon={CalendarClock}
            footer={upcomingExams[0] ? `${upcomingExams[0].subject_name} · in ${upcomingExams[0].days_left ?? 0}d` : "Nothing scheduled"}
          />
          <StatCard
            title="Active assignments"
            value={pendingAssignments.length}
            icon={ClipboardList}
            footer={pendingAssignments[0] ? `Next due: ${pendingAssignments[0].subject_code}` : "Nothing pending"}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Today&apos;s classes ({today})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : todayClasses.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No classes scheduled for today.</p>
            ) : (
              <ul className="divide-y">
                {todayClasses.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 py-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                      style={{ backgroundColor: subjectColor(entry.subject_code) }}
                    >
                      {entry.subject_code.slice(-2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{entry.subject_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime12(entry.start_time)} – {formatTime12(entry.end_time)} · Room {entry.room}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      Sem {entry.semester} · {entry.section}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-primary" />
                Upcoming exams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <Skeleton className="h-32" />
              ) : upcomingExams.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No upcoming exams.</p>
              ) : (
                upcomingExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between gap-2 rounded-md border p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{exam.subject_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {exam.exam_type} · {formatDate(exam.exam_date)}
                      </p>
                    </div>
                    <Badge variant={exam.days_left && exam.days_left <= 3 ? "warning" : "secondary"}>
                      {exam.days_left && exam.days_left === 0 ? "Today" : `${exam.days_left ?? 0}d`}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-4 w-4 text-primary" />
                Latest notices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <Skeleton className="h-32" />
              ) : recentNotices.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No notices posted yet.</p>
              ) : (
                recentNotices.map((notice) => (
                  <Link key={notice.id} href="/faculty/notices" className="block">
                    <div className="rounded-md border p-2.5 transition-colors hover:bg-muted/50">
                      <p className="truncate text-sm font-medium">{notice.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{notice.category}</Badge>
                        {daysUntil(notice.created_at.slice(0, 10)) >= 0
                          ? `${daysUntil(notice.created_at.slice(0, 10))}d ago`
                          : formatDate(notice.created_at)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Quick actions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/faculty/attendance", label: "Record attendance" },
            { href: "/faculty/assignments", label: "Post an assignment" },
            { href: "/faculty/exams", label: "Schedule an exam" },
            { href: "/faculty/materials", label: "Upload study material" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-lg border border-border bg-card p-3 text-center text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {action.label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
