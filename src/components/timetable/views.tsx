"use client";

import { CalendarDays, Clock, FlaskConical, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
                    const isLunch = row.hour === 13;
                    return (
                      <tr key={row.hour} className={cn("border-t", isLunch && "bg-muted/20")}>
                        <td className={cn("p-2 text-[11px] text-muted-foreground align-top", isToday && nowHour === row.hour && "bg-primary/5 font-semibold text-primary")}>
                          {formatTime12(`${String(row.hour).padStart(2, "0")}:00`)}
                          {isToday && nowHour === row.hour ? (
                            <Badge className="ml-1.5 h-4 px-1 text-[8px]">Now</Badge>
                          ) : null}
                        </td>
                        <td className="p-2 text-[11px] text-muted-foreground/70">
                          {isLunch ? (
                            <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                              🍱 Lunch Break (1:00 PM – 2:00 PM)
                            </span>
                          ) : (
                            <span className="italic">Free Period</span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                  const entry = row.entry;
                  const color = subjectColor(entry.subjectCode ?? entry.subjectId);
                  const subjectName = entry.subjectName ?? entry.subjectCode ?? "Class";
                  const nowHere = isToday && nowHour >= toHour(entry.startTime) && nowHour < toHour(entry.endTime);
                  const isLab = entry.type === "lab";
                  return (
                    <tr key={row.hour} className={cn("border-t", isLab && "bg-amber-500/[0.02]")}>
                      <td className={cn("whitespace-nowrap p-2 align-top text-[11px]", nowHere ? "bg-primary/5 font-semibold text-primary" : "text-muted-foreground")}>
                        {formatTime12(entry.startTime)} – {formatTime12(entry.endTime)}
                        {nowHere ? (
                          <Badge className="ml-1.5 h-4 px-1 text-[8px]">Now</Badge>
                        ) : null}
                      </td>
                      <td className="p-2">
                        <div
                          className={cn(
                            "flex flex-col gap-1 rounded-md border px-3 py-2",
                            isLab && "border-l-4"
                          )}
                          style={{
                            backgroundColor: `${color}14`,
                            borderColor: `${color}55`,
                            borderLeftColor: isLab ? color : undefined,
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold" style={{ color }}>
                                {subjectName}
                              </p>
                              {entry.subjectCode && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  ({entry.subjectCode})
                                </span>
                              )}
                            </div>
                            <Badge
                              variant={isLab ? "secondary" : "outline"}
                              className={cn(
                                "capitalize text-[10px]",
                                isLab && "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold"
                              )}
                            >
                              {isLab ? `🔬 Lab Session · ${row.span} hrs` : entry.type}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {entry.facultyName || "Faculty"} · Room {entry.room}
                            {row.span > 1 && !isLab ? ` · ${row.span} hrs` : ""}
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

  const covered = new Set<string>();

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 w-20 bg-background p-2 text-xs font-semibold text-muted-foreground border-r">
              Time
            </th>
            {DAY_LABELS.slice(1, 7).map((day) => (
              <th key={day} className="bg-muted/40 p-2 text-xs font-semibold border-l">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => {
            const time = `${String(hour).padStart(2, "0")}:00`;
            const isLunchHour = hour === 13;
            return (
              <tr key={hour} className="border-t">
                <td className="sticky left-0 bg-background p-2 text-[11px] text-muted-foreground border-r font-mono">
                  {formatTime12(time)}
                </td>
                {DAY_LABELS.slice(1, 7).map((_, dayIndex) => {
                  const day = dayIndex + 1;
                  const cellKey = `${day}-${hour}`;
                  if (covered.has(cellKey)) return null;

                  const entry = byDay[dayIndex].find((e) => e.startTime === time);
                  if (!entry) {
                    return (
                      <td key={day} className="h-16 border-l p-1.5 text-center align-middle">
                        {isLunchHour ? (
                          <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-medium italic select-none">
                            🍱 Lunch
                          </span>
                        ) : null}
                      </td>
                    );
                  }

                  const color = subjectColor(entry.subjectCode ?? entry.subjectId);
                  const subjectName = entry.subjectName ?? entry.subjectCode ?? "Subject";
                  const startH = parseInt(entry.startTime.split(":")[0], 10);
                  const endH = parseInt(entry.endTime.split(":")[0], 10);
                  const rowSpan = Math.max(1, endH - startH);

                  if (rowSpan > 1) {
                    for (let h = startH + 1; h < startH + rowSpan; h++) {
                      covered.add(`${day}-${h}`);
                    }
                  }

                  const isLab = entry.type === "lab";

                  return (
                    <td key={day} rowSpan={rowSpan} className="border-l p-1.5 align-top">
                      <div
                        className={cn(
                          "flex h-full min-h-14 flex-col justify-between rounded-md border p-2 transition-all hover:shadow-sm",
                          isLab && "border-l-4"
                        )}
                        style={{
                          backgroundColor: `${color}14`,
                          borderColor: `${color}55`,
                          borderLeftColor: isLab ? color : undefined,
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color }}>
                              {subjectName}
                            </p>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatTime12(entry.startTime)} – {formatTime12(entry.endTime)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-black/5 dark:border-white/5">
                          <span className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                            {entry.room}
                          </span>
                          {isLab ? (
                            <Badge variant="secondary" className="px-1.5 py-0 text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold shrink-0">
                              Lab · {rowSpan}h
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
        const isLab = entry.type === "lab";
        return (
          <div
            key={entry.id}
            className={cn(
              "flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:border-primary/30",
              isLab && "border-amber-500/30 bg-amber-500/[0.03]"
            )}
          >
            <div className="flex w-24 shrink-0 flex-col items-center rounded-md bg-muted/50 py-2">
              <span className="text-sm font-bold font-mono">{formatTime12(entry.startTime)}</span>
              <span className="text-[10px] text-muted-foreground">– {formatTime12(entry.endTime)}</span>
            </div>
            <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">{subjectName}</p>
                {entry.subjectCode && (
                  <span className="text-xs font-mono text-muted-foreground">
                    ({entry.subjectCode})
                  </span>
                )}
                {isLab && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold">
                    🔬 Lab Practical
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {entry.facultyName || "Faculty"} · Room {entry.room}
              </p>
            </div>
            <Badge
              variant={isLab ? "secondary" : "outline"}
              className={cn("capitalize", isLab && "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30")}
            >
              {entry.type}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

export function LabsView({
  entries,
  onSelectDay,
}: {
  entries: TimetableEntry[];
  onSelectDay?: (day: number) => void;
}) {
  const labEntries = entries
    .filter((e) => e.type === "lab")
    .slice()
    .sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime));

  if (labEntries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No laboratory practicals scheduled for this semester.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm">
              🔬
            </span>
            <h3 className="text-sm font-semibold text-foreground">Weekly Laboratory Practicals</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Specialized hands-on practical courses in university computing labs & workshops.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10 font-semibold px-2.5 py-1">
            {labEntries.length} Lab Sessions / Week
          </Badge>
        </div>
      </div>

      {/* Grid of Lab cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {labEntries.map((lab) => {
          const dayLabel = DAY_LABELS[lab.day];
          const [sh] = lab.startTime.split(":").map(Number);
          const [eh] = lab.endTime.split(":").map(Number);
          const durationHours = Math.max(1, eh - sh);

          return (
            <Card key={lab.id} className="border hover:border-primary/40 transition-all hover:shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      {lab.subjectCode}
                    </span>
                    <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                      {lab.subjectName || "Laboratory Course"}
                    </h4>
                  </div>
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 shrink-0 text-[10px] font-bold">
                    {durationHours} Hours
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">{dayLabel}</span>
                    <span>·</span>
                    <span className="font-mono">{formatTime12(lab.startTime)} – {formatTime12(lab.endTime)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span className="font-medium text-foreground">{lab.room || "Lab Facility"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">
                      Instructor: <span className="font-medium text-foreground">{lab.facultyName || "Faculty In-Charge"}</span>
                    </span>
                  </div>
                </div>

                {onSelectDay && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-7 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => onSelectDay(lab.day)}
                    >
                      Open in {dayLabel} Full Day →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function viewTabsClass(view: "week" | "today" | "day" | "labs", current: "week" | "today" | "day" | "labs") {
  return cn(
    "rounded px-3 py-1 text-sm font-medium capitalize transition-colors",
    view === current ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
  );
}