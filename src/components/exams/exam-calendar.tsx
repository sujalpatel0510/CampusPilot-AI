"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Exam } from "@/types";
import { DAY_LABELS } from "@/lib/utils";
import { SUBJECTS } from "@/data/mock-data";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ExamCalendar({ exams }: { exams: Exam[] }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const monthExams = exams.filter((e) => {
    const date = new Date(e.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });

  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function shift(delta: number) {
    let next = month + delta;
    let nextYear = year;
    if (next < 0) {
      next = 11;
      nextYear -= 1;
    } else if (next > 11) {
      next = 0;
      nextYear += 1;
    }
    setMonth(next);
    setYear(nextYear);
  }

  const today = new Date();

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b p-3">
        <Button variant="ghost" size="icon-sm" onClick={() => shift(-1)} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold">
          {MONTH_LABELS[month]} {year}
        </p>
        <Button variant="ghost" size="icon-sm" onClick={() => shift(1)} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 border-b bg-muted/40 text-center">
        {DAY_LABELS.slice(1, 7).map((day) => (
          <p key={day} className="py-1.5 text-[11px] font-semibold text-muted-foreground">
            {day.slice(0, 3)}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-2">
        {Array.from({ length: startWeekday }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const date = new Date(year, month, dayNum);
          const dayExams = monthExams.filter((e) => new Date(e.date).getDate() === dayNum);
          const isToday = today.getDate() === dayNum && today.getMonth() === month && today.getFullYear() === year;
          return (
            <div
              key={dayNum}
              className={cn(
                "flex min-h-14 flex-col items-center rounded-md border p-1",
                dayExams.length > 0 ? "border-primary/30 bg-primary/5" : "border-transparent",
                isToday && "ring-1 ring-primary"
              )}
            >
              <span className={cn("text-xs font-medium", isToday && "font-bold text-primary")}>
                {dayNum}
              </span>
              {dayExams.slice(0, 2).map((exam) => (
                <span
                  key={exam.id}
                  className="mt-0.5 w-full truncate rounded-full px-1.5 py-0.5 text-center text-[9px] font-semibold text-white"
                  style={{ backgroundColor: SUBJECTS.find((s) => s.id === exam.subjectId)?.color }}
                  title={`${exam.title} — ${exam.startTime}`}
                >
                  {exam.title.split(" ")[0]}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t p-3 text-xs text-muted-foreground">
        {monthExams.length === 0 ? (
          <span>No exams in {MONTH_LABELS[month]} {year}.</span>
        ) : (
          monthExams.map((exam) => (
            <span key={exam.id} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SUBJECTS.find((s) => s.id === exam.subjectId)?.color }} />
              {new Date(exam.date).getDate()} {MONTH_LABELS[month].slice(0, 3)} — {exam.title}
            </span>
          ))
        )}
      </div>
    </div>
  );
}