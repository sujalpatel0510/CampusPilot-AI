"use client";

import { useAuth } from "@/lib/auth";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { ErrorState } from "@/components/shared/error-state";
import { AiWidget } from "@/components/dashboard/ai-widget";
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
  const { data, loading, error, refetch } = useApi(() => api.getDashboardData());

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
          <h1 className="text-2xl font-bold tracking-tight">{greeting()}, {user?.name?.split(" ")[0] ?? "Student"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{today}</p>
        </div>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{greeting()}, {user?.name?.split(" ")[0] ?? "Student"}</h1>
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
              <AiWidget />
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