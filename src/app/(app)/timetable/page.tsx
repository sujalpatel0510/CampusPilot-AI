"use client";

import { useState } from "react";
import { CalendarDays, CalendarRange, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { WeekView, TodayView, DayView } from "@/components/timetable/views";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/lib/utils";

export default function TimetablePage() {
  const { data, loading, error, refetch } = useApi(() => api.getTimetable(), [], { key: "timetable" });
  const [view, setView] = useState<"week" | "day" | "today">("week");
  const [daySel, setDaySel] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 1 : d;
  });

  if (error) {
    return (
      <div>
        <PageHeader title="Timetable" />
        <div className="mt-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  const today = new Date().getDay();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        description={
          view === "today"
            ? `${DAY_LABELS[today]}, ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`
            : view === "day"
              ? `${DAY_LABELS[daySel]} full day schedule`
              : "Weekly class schedule"
        }
        actions={
          <div className="inline-flex items-center gap-2 rounded-md bg-muted p-1">
            <button
              type="button"
              onClick={() => setView("week")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-3 py-1 text-sm font-medium transition-colors",
                view === "week" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Week
            </button>
            <button
              type="button"
              onClick={() => setView("day")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-3 py-1 text-sm font-medium transition-colors",
                view === "day" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Full day
            </button>
            <button
              type="button"
              onClick={() => setView("today")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-3 py-1 text-sm font-medium transition-colors",
                view === "today" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Today
            </button>
          </div>
        }
      />

      {loading ? (
        <Skeleton className="h-[420px]" />
      ) : data ? (
        view === "week" ? (
          <WeekView entries={data} />
        ) : view === "day" ? (
          <DayView entries={data} day={daySel} onSelectDay={setDaySel} />
        ) : (
          <TodayView entries={data.filter((e) => e.day === today)} />
        )
      ) : null}
    </div>
  );
}