"use client";

import { Badge } from "@/components/ui/badge";
import type { TimetableEntry } from "@/types";
import { DAY_LABELS, formatTime12, subjectColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

export function WeekView({ entries }: { entries: TimetableEntry[] }) {
  const byDay = DAY_LABELS.slice(1, 7).map((_, index) =>
    entries.filter((e) => e.day === index + 1)
  );

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 w-16 bg-background p-2 text-xs font-semibold text-muted-foreground">
              Time
            </th>
            {DAY_LABELS.slice(1, 7).map((day) => (
              <th key={day} className="bg-muted/40 p-2 text-xs font-semibold">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => {
            const time = `${String(hour).padStart(2, "0")}:00`;
            return (
              <tr key={hour} className="border-t">
                <td className="sticky left-0 bg-background p-2 text-[11px] text-muted-foreground">
                  {formatTime12(time)}
                </td>
                {DAY_LABELS.slice(1, 7).map((_, dayIndex) => {
                  const day = dayIndex + 1;
                  const entry = byDay[dayIndex].find((e) => e.startTime === time);
                  if (!entry) return <td key={day} className="h-16 border-l p-1.5" />;
                  const color = subjectColor(entry.subjectCode ?? entry.subjectId);
                  const subjectName = entry.subjectName ?? entry.subjectCode ?? "Subject";
                  const rowSpan = Math.round(
                    (parseInt(entry.endTime.split(":")[0]) - parseInt(entry.startTime.split(":")[0])) +
                      (parseInt(entry.endTime.split(":")[1]) - parseInt(entry.startTime.split(":")[1])) / 60
                  );
                  return (
                    <td key={day} rowSpan={rowSpan} className="border-l p-1.5 align-top">
                      <div
                        className="flex h-full min-h-14 flex-col justify-between rounded-md border p-2"
                        style={{
                          backgroundColor: `${color}14`,
                          borderColor: `${color}55`,
                        }}
                      >
                        <div>
                          <p className="text-xs font-semibold" style={{ color }}>
                            {subjectName.split(" ").slice(0, 2).join(" ")}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatTime12(entry.startTime)} – {formatTime12(entry.endTime)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">{entry.room}</span>
                          {entry.type === "lab" ? (
                            <Badge variant="secondary" className="px-1.5 text-[9px]">
                              Lab
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function TodayView({ entries }: { entries: TimetableEntry[] }) {
  const sorted = entries.slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No classes scheduled for today. Enjoy the break!
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {sorted.map((entry) => {
        const color = subjectColor(entry.subjectCode ?? entry.subjectId);
        const subjectName = entry.subjectName ?? entry.subjectCode ?? "Subject";
        return (
          <div key={entry.id} className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex w-24 shrink-0 flex-col items-center rounded-md bg-muted/50 py-2">
              <span className="text-sm font-bold">{formatTime12(entry.startTime)}</span>
              <span className="text-[10px] text-muted-foreground">– {formatTime12(entry.endTime)}</span>
            </div>
            <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{subjectName}</p>
              <p className="text-xs text-muted-foreground">
                {entry.facultyName || "Faculty"} · Room {entry.room}
              </p>
            </div>
            <Badge variant={entry.type === "lab" ? "secondary" : "outline"} className="capitalize">
              {entry.type}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

export function viewTabsClass(view: "week" | "today", current: "week" | "today") {
  return cn(
    "rounded px-3 py-1 text-sm font-medium capitalize transition-colors",
    view === current ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
  );
}