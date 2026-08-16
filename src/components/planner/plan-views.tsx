"use client";

import { Fragment, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, LayoutGrid, Rows3, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StudyPlan, StudyPlanSlot } from "@/types";
import { DAY_LABELS, formatTime12, subjectColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ViewMode = "weekly" | "daily" | "calendar";

function slotDuration(slot: StudyPlanSlot): number {
  const [sh, sm] = slot.startTime.split(":").map(Number);
  const [eh, em] = slot.endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function subjectNameFor(slot: StudyPlanSlot): string {
  return slot.subjectName ?? slot.subjectCode ?? slot.subjectId;
}

function weekdayLabel(date: Date): string {
  return DAY_LABELS[(date.getDay() + 6) % 7];
}

function SlotName({
  slot,
  weakSubjectIds,
}: {
  slot: StudyPlanSlot;
  weakSubjectIds: Set<string>;
}) {
  const isRevision = slot.type === "revision";
  const isWeak = weakSubjectIds.has(slot.subjectId);
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: isRevision ? "hsl(262 83% 58%)" : subjectColor(slot.subjectCode ?? slot.subjectId) }}
      />
      <span className="font-medium">{subjectNameFor(slot)}</span>
      {isRevision ? (
        <Badge variant="outline" className="border-violet-300 bg-violet-50 px-1.5 text-[10px] text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-400">
          Revision
        </Badge>
      ) : (
        <Badge variant="outline" className="border-sky-300 bg-sky-50 px-1.5 text-[10px] text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-400">
          Study
        </Badge>
      )}
      {isWeak ? (
        <Badge variant="outline" className="border-amber-300 bg-amber-50 px-1.5 text-[10px] text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
          Priority
        </Badge>
      ) : null}
    </div>
  );
}

function isSameDay(date: Date) {
  const t = new Date();
  return date.toDateString() === t.toDateString();
}

export function PlanViews({ plan }: { plan: StudyPlan }) {
  const [view, setView] = useState<ViewMode>("weekly");
  const [selectedDay, setSelectedDay] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set());

  const weakSubjectIds = useMemo(() => new Set(plan.form.weakSubjects), [plan.form.weakSubjects]);

  const days = useMemo(() => {
    const byDate = new Map<string, StudyPlanSlot[]>();
    for (const slot of plan.slots) {
      const key = slot.date.slice(0, 10);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(slot);
    }
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, slots]) => {
        const d = new Date(date + "T00:00:00");
        d.setHours(0, 0, 0, 0);
        return { date: d, slots };
      });
  }, [plan.slots]);

  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    let week: (Date | null)[] = [];
    const leading = days.length > 0 ? (days[0].date.getDay() + 6) % 7 : 0;
    for (let i = 0; i < leading; i++) week.push(null);
    for (const { date } of days) {
      week.push(date);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      result.push(week);
    }
    return result;
  }, [days]);

  const slotsFor = useMemo(() => {
    const map = new Map<string, StudyPlanSlot[]>();
    for (const slot of plan.slots) {
      const key = slot.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return map;
  }, [plan.slots]);

  function toggleDone(slotId: string) {
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  }

  if (plan.slots.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </span>
          <p className="text-sm font-medium">No study slots yet</p>
          <p className="text-xs text-muted-foreground">
            Configure the settings and generate a plan to see your schedule.
          </p>
        </CardContent>
      </Card>
    );
  }

  const doneCount = plan.slots.filter((slot) => doneIds.has(slot.id)).length;

  const timeCell = (slot: StudyPlanSlot) => (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      {formatTime12(slot.startTime)} – {formatTime12(slot.endTime)}
      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        {slotDuration(slot)}m
      </span>
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-lg bg-muted p-1">
          {(
            [
              { id: "weekly", label: "Week", icon: LayoutGrid },
              { id: "daily", label: "Day", icon: Rows3 },
              { id: "calendar", label: "Calendar", icon: CalendarDays },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  view === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        {doneCount > 0 ? (
          <Badge variant="secondary" className="gap-1">
            <Check className="h-3 w-3 text-primary" />
            {doneCount} of {plan.slots.length} done
          </Badge>
        ) : (
          <Badge variant="secondary">{plan.slots.length} sessions planned</Badge>
        )}
      </div>

      {view === "weekly" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Day</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead className="w-56">Time</TableHead>
                  <TableHead className="w-16 text-center">Done</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {days.map(({ date, slots }) => {
                  const today = isSameDay(date);
                  return (
                    <Fragment key={date.toISOString()}>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableCell colSpan={5} className="px-4 py-1.5">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {weekdayLabel(date)}
                            {" · "}
                            {date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                          {today ? (
                            <Badge className="ml-2 h-5 px-1.5 text-[9px]">Today</Badge>
                          ) : null}
                          <span className="ml-2 text-[11px] text-muted-foreground">
                            {slots.length} session{slots.length === 1 ? "" : "s"}
                          </span>
                        </TableCell>
                      </TableRow>
                      {slots.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-2 text-center text-xs text-muted-foreground">
                            Rest day — no sessions
                          </TableCell>
                        </TableRow>
                      ) : (
                        slots.map((slot) => {
                          const done = doneIds.has(slot.id);
                          return (
                            <TableRow key={slot.id} className={cn(done && "opacity-50")}>
                              <TableCell />
                              <TableCell>
                                <SlotName slot={slot} weakSubjectIds={weakSubjectIds} />
                              </TableCell>
                              <TableCell className={cn("max-w-56 truncate text-xs", done && "line-through")}>
                                {slot.topic}
                              </TableCell>
                              <TableCell>{timeCell(slot)}</TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={done}
                                  onCheckedChange={() => toggleDone(slot.id)}
                                  aria-label={`Mark ${slot.topic} done`}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {view === "daily" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {days.map(({ date, slots }, dayIndex) => {
              const today = isSameDay(date);
              const selected = selectedDay === dayIndex;
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(dayIndex)}
                  className={cn(
                    "flex min-w-14 flex-col items-center gap-0.5 rounded-lg border px-2 py-2 transition-all",
                    selected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card hover:border-primary/40",
                    today && !selected && "border-primary/40"
                  )}
                >
                  <span className={cn("text-[10px] font-medium", selected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {weekdayLabel(date).slice(0, 3)}
                  </span>
                  <span className="text-sm font-bold">{date.getDate()}</span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      slots.length > 0 ? (selected ? "bg-primary-foreground" : "bg-primary") : "bg-transparent"
                    )}
                  />
                </button>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {weekdayLabel(days[selectedDay].date)},{" "}
                    {days[selectedDay].date.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {days[selectedDay].slots.length > 0
                      ? `${days[selectedDay].slots.length} session${days[selectedDay].slots.length === 1 ? "" : "s"} planned`
                      : "Rest day — no sessions scheduled."}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
                    disabled={selectedDay === 0}
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setSelectedDay(Math.min(days.length - 1, selectedDay + 1))}
                    disabled={selectedDay === days.length - 1}
                    aria-label="Next day"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {days[selectedDay].slots.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No sessions scheduled for this day.
                </p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {days[selectedDay].slots.map((slot) => {
                    const done = doneIds.has(slot.id);
                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5",
                          done && "opacity-50"
                        )}
                      >
                        <Checkbox
                          checked={done}
                          onCheckedChange={() => toggleDone(slot.id)}
                          aria-label="Mark session done"
                        />
                        <div className="min-w-0 flex-1">
                          <SlotName slot={slot} weakSubjectIds={weakSubjectIds} />
                          <p className={cn("truncate text-xs text-muted-foreground", done && "line-through")}>
                            {slot.topic}
                          </p>
                        </div>
                        {timeCell(slot)}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {view === "calendar" ? (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_LABELS.map((day) => (
                <p key={day} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {day.slice(0, 3)}
                </p>
              ))}
              {weeks.map((week, weekIndex) => (
                <Fragment key={weekIndex}>
                  {week.map((date, dayIndex) => {
                    if (date === null) {
                      return <div key={`empty-${weekIndex}-${dayIndex}`} className="min-h-16 rounded-lg border border-transparent p-1.5" />;
                    }
                    const count = slotsFor.get(date.toISOString().slice(0, 10))?.length ?? 0;
                    const today = isSameDay(date);
                    return (
                      <div
                        key={date.toISOString()}
                        className={cn(
                          "flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border p-1.5",
                          count > 0 ? "border-primary/25 bg-primary/5" : "border-border bg-muted/25",
                          today && "ring-2 ring-primary/25"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                            today ? "bg-primary text-primary-foreground" : ""
                          )}
                        >
                          {date.getDate()}
                        </span>
                        {count > 0 ? (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                            {count} session{count === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">rest</span>
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary/30" />
                Study session
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-violet-500/30" />
                Revision
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/30" />
                Priority (weak subject)
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function planDateRange(plan: StudyPlan): string {
  if (plan.slots.length === 0) return "";
  const first = new Date(plan.slots[0].date);
  const last = new Date(plan.slots[plan.slots.length - 1].date);
  return `${first.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${last.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}