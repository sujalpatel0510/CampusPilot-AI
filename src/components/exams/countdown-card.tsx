"use client";

import { CalendarClock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCountdown } from "@/hooks/use-countdown";
import type { Exam } from "@/types";
import { formatDate, formatTime12 } from "@/lib/utils";
import { SUBJECTS } from "@/data/mock-data";
import { cn } from "@/lib/utils";

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-bold tabular-nums text-white shadow-md shadow-indigo-600/25 sm:h-16 sm:w-16 sm:text-2xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function CountdownCard({ exam }: { exam: Exam }) {
  const countdown = useCountdown(exam.date + "T" + exam.startTime);
  const subject = SUBJECTS.find((s) => s.id === exam.subjectId);

  if (!countdown) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="py-6 text-center text-sm text-muted-foreground">Loading countdown…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-indigo-600/5 via-primary/5 to-violet-600/5">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <CalendarClock className="h-3.5 w-3.5" />
            Next exam
          </p>
          <span className="text-xs text-muted-foreground">{exam.type.replace("-", " ")}</span>
        </div>

        <h2 className="mt-2 text-xl font-bold sm:text-2xl">{exam.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {subject?.name} · {formatDate(exam.date)}
        </p>

        <div className="mt-6 flex items-center justify-center gap-4 sm:gap-6">
          <TimeUnit value={countdown.days} label="Days" />
          <span className="text-2xl font-bold text-muted-foreground/40">:</span>
          <TimeUnit value={countdown.hours} label="Hours" />
          <span className="text-2xl font-bold text-muted-foreground/40">:</span>
          <TimeUnit value={countdown.minutes} label="Min" />
          <span className="text-2xl font-bold text-muted-foreground/40">:</span>
          <TimeUnit value={countdown.seconds} label="Sec" />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4 text-primary" />
            {formatTime12(exam.startTime)} – {formatTime12(exam.endTime)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            Room {exam.room}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExamCard({ exam }: { exam: Exam }) {
  const subject = SUBJECTS.find((s) => s.id === exam.subjectId);
  const done = exam.completed;

  return (
    <Card className={cn(done && "opacity-75")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{exam.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {subject?.name} · {exam.type.replace("-", " ")}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              done
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                : "bg-primary/10 text-primary"
            )}
          >
            {done ? `Completed · ${exam.marks} marks` : `${exam.marks} marks`}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{formatDate(exam.date)}</span>
          <span>
            {formatTime12(exam.startTime)} – {formatTime12(exam.endTime)}
          </span>
          <span>Room {exam.room}</span>
        </div>

        {exam.syllabus.length > 0 ? (
          <div className="mt-3.5 rounded-md bg-muted/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Syllabus</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {exam.syllabus.map((topic) => (
                <span key={topic} className="rounded-full border bg-background px-2 py-0.5 text-[11px]">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}