"use client";

import { Badge } from "@/components/ui/badge";
import type { TimetableEntry } from "@/types";
import { DAY_LABELS, formatTime12, subjectColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

/** Full day range shown in the day view: 8:00 → 18:00. */
const DAY_START = 8;
const DAY_END = 18;

function toHour(time: string): number {
  return Number(time.split(":")[0] ?? 0);
}

export function DayView({
  entries,
  day,
  onSelectDay,
}: {
  entries: TimetableEntry[];
  day: number;
  onSelectDay: (day: number) => void;
}) {
  const dayEntries = entries
    .filter((e) => e.day === day)
    .slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const isToday = day === new Date().getDay();
  const nowHour = new Date().getHours();

  // Rows for the full day; entries can span multiple hours.
  const hours: number[] = [];
  for (let h = DAY_START; h < DAY_END; h++) hours.push(h);

  const covered = new Set<number>();
  const rows = hours.map((hour) => {
    if (covered.has(hour)) return { hour, entry: null as TimetableEntry | null, span: 0 };
    const time = `${String(hour).padStart(2, "0")}:00`;
    const entry = dayEntries.find((e) => e.startTime.startsWith(time));
    if (!entry) return { hour, entry: null, span: 1 };
    const startH = toHour(entry.startTime);
    const endH = toHour(entry.endTime);
    const mins = Number(entry.endTime.split(":")[1] ?? 0);
    const span = Math.max(1, endH - startH + (mins > 0 ? 1 : 0));
    for (let h = hour + 1; h < hour + span; h++) covered.add(h);
    return { hour, entry, span };
  });

  const hasMinutes = dayEntries.some((e) => !e.startTime.endsWith(":00") || !e.endTime.endsWith(":00"));
  const offGrid = hasMinutes ? dayEntries.filter((e) => !e.startTime.endsWith(":00")) : [];

  return (
    <div className="space-y-4">
      {/* Day selector */}
      <div className="flex flex-wrap gap-2">
        {DAY_LABELS.slice(1, 7).map((label, index) => {
          const d = index + 1;
          const selected = d === day;
          const today = d === new Date().getDay();
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelectDay(d)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              {label}
              {today ? (
                <span className={cn("ml-1.5 text-[9px]", selected ? "text-primary-foreground/70" : "text-primary")}>
                  Today
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {dayEntries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No classes scheduled for {DAY_LABELS[day]}. Enjoy the break!
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/40">
                  <th className="w-24 p-2 text-left text-xs font-semibold text-muted-foreground">Time</th>
                  <th className="p-2 text-left text-xs font-semibold">Class</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  if (row.span === 0) return null;
                  if (!row.entry) {
                    return (
                      <tr key={row.hour} className="border-t">
                        <td className={cn("p-2 text-[11px] text-muted-foreground align-top", isToday && nowHour === row.hour && "bg-primary/5 font-semibold text-primary")}>
                          {formatTime12(`${String(row.hour).padStart(2, "0")}:00`)}
                          {isToday && nowHour === row.hour ? (
                            <Badge className="ml-1.5 h-4 px-1 text-[8px]">Now</Badge>
                          ) : null}
                        </td>
                        <td className="p-2 text-[11px] italic text-muted-foreground/70">Free</td>
                      </tr>
                    );
                  }
                  const entry = row.entry;
                  const color = subjectColor(entry.subjectCode ?? entry.subjectId);
                  const subjectName = entry.subjectName ?? entry.subjectCode ?? "Class";
                  const nowHere = isToday && nowHour >= toHour(entry.startTime) && nowHour < toHour(entry.endTime);
                  return (
                    <tr key={row.hour} className="border-t">
                      <td className={cn("whitespace-nowrap p-2 align-top text-[11px]", nowHere ? "bg-primary/5 font-semibold text-primary" : "text-muted-foreground")}>
                        {formatTime12(entry.startTime)} – {formatTime12(entry.endTime)}
                        {nowHere ? (
                          <Badge className="ml-1.5 h-4 px-1 text-[8px]">Now</Badge>
                        ) : null}
                      </td>
                      <td className="p-2">
                        <div
                          className="flex flex-col gap-1 rounded-md border px-3 py-2"
                          style={{ backgroundColor: `${color}14`, borderColor: `${color}55` }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold" style={{ color }}>
                              {subjectName}
                            </p>
                            <Badge variant={entry.type === "lab" ? "secondary" : "outline"} className="capitalize">
                              {entry.type}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {entry.facultyName || "Faculty"} · Room {entry.room}
                            {row.span > 1 ? ` · ${row.span} hrs` : ""}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {offGrid.length > 0 ? (
            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              Some classes start mid-hour and are listed above by start time.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}


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