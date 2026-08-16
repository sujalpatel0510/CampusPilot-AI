"use client";

import { CalendarClock, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountdownCard, ExamCard } from "@/components/exams/countdown-card";
import { ExamCalendar } from "@/components/exams/exam-calendar";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";

export default function ExamsPage() {
  const { data, loading, error, refetch } = useApi(() => api.getExams(), [], { key: "exams" });

  if (error) {
    return (
      <div>
        <PageHeader title="Exams" />
        <div className="mt-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  const upcoming = (data ?? []).filter((e) => !e.completed).sort((a, b) => a.date.localeCompare(b.date));
  const completed = (data ?? []).filter((e) => e.completed);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams"
        description="Schedules, countdowns and syllabus for every exam"
      />

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      ) : data ? (
        <>
          {upcoming[0] ? <CountdownCard exam={upcoming[0]} /> : null}

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    Upcoming exams
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcoming.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No upcoming exams.</p>
                  ) : (
                    upcoming.map((exam) => <ExamCard key={exam.id} exam={exam} />)
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completed.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No completed exams yet.</p>
                  ) : (
                    completed.map((exam) => <ExamCard key={exam.id} exam={exam} />)
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <ExamCalendar exams={data} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}