"use client";

import Link from "next/link";
import { CalendarClock, CalendarDays, ClipboardList, GraduationCap, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { ErrorState } from "@/components/shared/error-state";
import { AiWidget } from "@/components/dashboard/ai-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURES } from "@/lib/feature-flags";
import {
  AttendanceCard,
  DashboardGridSkeleton,
  SummaryCards,
  UpcomingAssignments,
  UpcomingClasses,
  UpcomingExams,
} from "@/components/dashboard/widgets";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useApi(() => api.getDashboardData(), [], { key: "dashboard" });

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting()}, {user?.full_name?.split(" ")[0] ?? "Student"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{today}</p>
        </div>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{greeting()}, {user?.full_name?.split(" ")[0] ?? "Student"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{today}</p>
      </div>

      {loading || !data ? (
        <DashboardGridSkeleton />
      ) : (
        <>
          <SummaryCards data={data} />

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-2">
              <AttendanceCard data={data.attendance} />
              {FEATURES.AI_ASSISTANT ? (
                <AiWidget />
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      Quick Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2.5 text-xs">
                    <Link
                      href="/timetable"
                      className="flex items-center gap-2 rounded-lg border p-2.5 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/40 transition-all font-medium"
                    >
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Timetable
                    </Link>
                    <Link
                      href="/assignments"
                      className="flex items-center gap-2 rounded-lg border p-2.5 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/40 transition-all font-medium"
                    >
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Assignments
                    </Link>
                    <Link
                      href="/exams"
                      className="flex items-center gap-2 rounded-lg border p-2.5 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/40 transition-all font-medium"
                    >
                      <CalendarClock className="h-4 w-4 text-primary" />
                      Exams
                    </Link>
                    <Link
                      href="/attendance"
                      className="flex items-center gap-2 rounded-lg border p-2.5 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/40 transition-all font-medium"
                    >
                      <Users className="h-4 w-4 text-primary" />
                      Attendance
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="space-y-6 lg:col-span-3">
              <UpcomingClasses data={data.todayClasses} />
              <div className="grid gap-6 sm:grid-cols-2">
                <UpcomingAssignments data={data.upcomingAssignments} />
                <UpcomingExams data={data.upcomingExams} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}