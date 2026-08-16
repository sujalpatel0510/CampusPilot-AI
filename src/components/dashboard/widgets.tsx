"use client";

import { AlertTriangle, ArrowRight, ClipboardList, CalendarClock, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { CircularProgress } from "@/components/shared/circular-progress";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { formatDate, formatTime12, daysUntil } from "@/lib/utils";
import { AiWidget } from "@/components/dashboard/ai-widget";
import { Skeleton } from "@/components/ui/skeleton";

export function SummaryCards({ data }: { data: Awaited<ReturnType<typeof api.getDashboardData>> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        title="Overall attendance"
        value={`${data.overallAttendance}%`}
        icon={Users}
        footer={`${data.attendance.attended} of ${data.attendance.totalClasses} classes`}
      />
      <StatCard
        title="Pending assignments"
        value={data.assignmentsDue}
        icon={ClipboardList}
        footer="Due before this week"
      />
      <StatCard
        title="Upcoming exams"
        value={data.examsUpcoming}
        icon={CalendarClock}
        footer={data.upcomingExams[0] ? `Next: ${formatDate(data.upcomingExams[0].date)}` : "No exams scheduled"}
      />
    </div>
  );
}

export function AttendanceCard({ data }: { data: Awaited<ReturnType<typeof api.getDashboardData>>["attendance"] }) {
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Attendance</h2>
          <Link href="/attendance" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-4 flex justify-center">
          <CircularProgress
            value={data.overall}
            label={`${data.overall}%`}
            sublabel="Overall"
            tone={data.overall >= 85 ? "good" : data.overall >= 75 ? "default" : "warning"}
          />
        </div>
        {data.subjects.some((s) => s.percentage < 75) ? (
          <p className="mt-4 flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-2 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {data.subjects
              .filter((s) => s.percentage < 75)
              .map((s) => s.subjectName?.split(" ")[0] ?? s.subjectId)
              .join(", ")}{" "}
            below 75%
          </p>
        ) : null}
        <div className="mt-4 space-y-3">
          {data.subjects.slice(0, 4).map((subject) => (
            <div key={subject.subjectId}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="truncate font-medium">{subject.subjectName ?? subject.subjectId}</span>
                <span className={subject.percentage < 75 ? "font-semibold text-amber-600" : "text-muted-foreground"}>
                  {subject.percentage}%
                </span>
              </div>
              <Progress
                value={subject.percentage}
                className={subject.percentage < 75 ? "[&>div]:bg-amber-500" : ""}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function UpcomingClasses({ data }: { data: Awaited<ReturnType<typeof api.getDashboardData>>["todayClasses"] }) {
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Today&apos;s classes</h2>
          <Link href="/timetable" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Timetable
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-4 space-y-2.5">
          {data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No classes today.</p>
          ) : (
            data
              .slice()
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .slice(0, 4)
              .map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-md border p-2.5">
                  <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: entry.subject.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{entry.subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime12(entry.startTime)} – {formatTime12(entry.endTime)} · Room {entry.room}
                    </p>
                  </div>
                  <Badge variant={entry.status === "ongoing" ? "success" : "secondary"} className="capitalize">
                    {entry.status}
                  </Badge>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function UpcomingAssignments({ data }: { data: Awaited<ReturnType<typeof api.getDashboardData>>["upcomingAssignments"] }) {
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Assignments due</h2>
          <Link href="/assignments" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-4 space-y-2.5">
          {data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing due. Nice work!</p>
          ) : (
            data.map((assignment) => {
              const days = daysUntil(assignment.dueDate);
              return (
                <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-md border p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{assignment.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{assignment.subject.name}</p>
                  </div>
                  <span className={days <= 2 ? "shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive" : "shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"}>
                    {days <= 0 ? "Overdue" : `${days}d left`}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function UpcomingExams({ data }: { data: Awaited<ReturnType<typeof api.getDashboardData>>["upcomingExams"] }) {
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Upcoming exams</h2>
          <Link href="/exams" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-4 space-y-2.5">
          {data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No upcoming exams.</p>
          ) : (
            data.map((exam) => (
              <div key={exam.id} className="flex items-center gap-3 rounded-md border p-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarClock className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{exam.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(exam.date)} · {formatTime12(exam.startTime)}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-primary">
                  {daysUntil(exam.date)}d
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80 lg:col-span-3" />
      </div>
    </div>
  );
}