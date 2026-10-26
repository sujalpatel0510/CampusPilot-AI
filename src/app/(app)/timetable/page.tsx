"use client";

import { useState } from "react";
import { CalendarDays, CalendarRange, Clock, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { WeekView, TodayView, DayView, LabsView } from "@/components/timetable/views";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "@/lib/utils";

export default function TimetablePage() {
  const { data, loading, error, refetch } = useApi(() => api.getTimetable(), [], { key: "timetable" });
  const [view, setView] = useState<"week" | "day" | "today" | "labs">("week");
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
        title="Timetable & Lab Schedule"
        description={
          view === "today"
            ? `${DAY_LABELS[today]}, ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`
            : view === "day"
              ? `${DAY_LABELS[daySel]} full day schedule (09:00 AM – 05:00 PM)`
              : view === "labs"
                ? "Laboratory practical schedule, facility rooms & instructors"
                : "Full day weekly schedule with morning lectures & afternoon laboratory practicals"
        }
        actions={
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted p-1 border">
            <button
              type="button"
              onClick={() => setView("week")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "week" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Week
            </button>
            <button
              type="button"
              onClick={() => setView("day")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "day" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Full Day
            </button>
            <button
              type="button"
              onClick={() => setView("labs")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "labs"
                  ? "bg-background shadow-xs text-amber-600 dark:text-amber-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FlaskConical className="h-3.5 w-3.5 text-amber-500" />
              Lab Section
            </button>
            <button
              type="button"
              onClick={() => setView("today")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "today" ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Today
            </button>
          </div>
        }
      />

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-card p-3 shadow-xs">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Weekly Schedule</p>
            <p className="text-xl font-bold mt-0.5 text-foreground">{data.length} Periods</p>
          </div>
          <div className="rounded-xl border bg-card p-3 shadow-xs">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Theory Lectures</p>
            <p className="text-xl font-bold mt-0.5 text-foreground">{data.filter((e) => e.type !== "lab").length} Lectures</p>
          </div>
          <div className="rounded-xl border bg-amber-500/5 border-amber-500/20 p-3 shadow-xs">
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Lab Practicals</p>
            <p className="text-xl font-bold mt-0.5 text-amber-700 dark:text-amber-300">
              {data.filter((e) => e.type === "lab").length} Labs (12 Hrs)
            </p>
          </div>
          <div className="rounded-xl border bg-card p-3 shadow-xs">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Daily Hours</p>
            <p className="text-xl font-bold mt-0.5 text-foreground">09:00 – 17:00</p>
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-[420px]" />
      ) : data ? (
        view === "week" ? (
          <WeekView entries={data} />
        ) : view === "day" ? (
          <DayView entries={data} day={daySel} onSelectDay={setDaySel} />
        ) : view === "labs" ? (
          <LabsView
            entries={data}
            onSelectDay={(day) => {
              setDaySel(day);
              setView("day");
            }}
          />
        ) : (
          <TodayView entries={data.filter((e) => e.day === today)} />
        )
      ) : null}
    </div>
  );
}