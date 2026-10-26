"use client";

import { Fragment, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  LayoutGrid,
  Rows3,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { StudyPlan, StudyPlanSlot } from "@/types";
import { DAY_LABELS, formatTime12, subjectColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ViewMode = "weekly" | "daily" | "calendar";

function slotDuration(slot: StudyPlanSlot): number {
  const [sh, sm] = slot.startTime.split(":").map(Number);
  const [eh, em] = slot.endTime.split(":").map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff <= 0) diff += 24 * 60; // Handle wraps past midnight
  return diff;
}

function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${mins}m`;
}

function subjectNameFor(slot: StudyPlanSlot): string {
  return slot.subjectName ?? slot.subjectCode ?? slot.subjectId;
}

function weekdayLabel(date: Date): string {
  return DAY_LABELS[(date.getDay() + 6) % 7];
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
  const progressPercent = Math.round((doneCount / plan.slots.length) * 100);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 p-2.5 backdrop-blur-sm">
        <div className="inline-flex items-center rounded-lg bg-muted/60 p-1">
          {(
            [
              { id: "weekly", label: "Timeline Schedule", icon: LayoutGrid },
              { id: "daily", label: "Day View", icon: Rows3 },
              { id: "calendar", label: "Month Calendar", icon: CalendarDays },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                  view === tab.id
                    ? "bg-background text-foreground shadow-sm shadow-black/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Progress summary */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Plan Progress:</span>
            <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-semibold text-foreground">{progressPercent}%</span>
          </div>

          {doneCount > 0 ? (
            <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {doneCount} of {plan.slots.length} completed
            </Badge>
          ) : (
            <Badge variant="secondary" className="py-1">
              {plan.slots.length} total sessions
            </Badge>
          )}
        </div>
      </div>

      {/* WEEKLY TIMELINE SCHEDULE (Redesigned) */}
      {view === "weekly" ? (
        <div className="space-y-4">
          {days.map(({ date, slots }) => {
            const today = isSameDay(date);
            const dayDoneCount = slots.filter((s) => doneIds.has(s.id)).length;
            const dayMinutes = slots.reduce((sum, s) => sum + slotDuration(s), 0);

            return (
              <Card
                key={date.toISOString()}
                className={cn(
                  "overflow-hidden border border-border/80 shadow-sm transition-all hover:border-primary/40",
                  today && "border-primary/50 shadow-md shadow-primary/5"
                )}
              >
                {/* Day Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {weekdayLabel(date)}, {date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    {today ? (
                      <Badge className="bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        Today
                      </Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground font-medium">
                      • {slots.length} session{slots.length === 1 ? "" : "s"} ({formatDuration(dayMinutes)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {slots.length > 0 && dayDoneCount === slots.length ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <Check className="h-3.5 w-3.5" /> All completed
                      </span>
                    ) : slots.length > 0 && dayDoneCount > 0 ? (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {dayDoneCount} of {slots.length} done
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Day Sessions List */}
                <CardContent className="p-0 divide-y divide-border/50">
                  {slots.length === 0 ? (
                    <div className="px-4 py-5 text-center text-xs text-muted-foreground">
                      Rest day — no revision sessions scheduled.
                    </div>
                  ) : (
                    slots.map((slot) => {
                      const done = doneIds.has(slot.id);
                      const isRevision = slot.type === "revision";
                      const isWeak = weakSubjectIds.has(slot.subjectId);
                      const duration = slotDuration(slot);
                      const cleanTopic = slot.topic.includes("·")
                        ? slot.topic.split("·")[1].trim()
                        : slot.topic;

                      return (
                        <div
                          key={slot.id}
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/20",
                            done && "bg-muted/30 opacity-60"
                          )}
                        >
                          {/* Left: Checkbox + Subject + Tags */}
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <Checkbox
                              checked={done}
                              onCheckedChange={() => toggleDone(slot.id)}
                              aria-label={`Mark ${slot.topic} done`}
                              className="mt-1 sm:mt-0 h-4 w-4 rounded"
                            />

                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: isRevision
                                      ? "hsl(262 83% 58%)"
                                      : subjectColor(slot.subjectCode ?? slot.subjectId),
                                  }}
                                />
                                <span className="font-semibold text-sm text-foreground">
                                  {subjectNameFor(slot)}
                                </span>
                                {slot.subjectCode ? (
                                  <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                                    {slot.subjectCode}
                                  </Badge>
                                ) : null}

                                {isRevision ? (
                                  <Badge variant="outline" className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-400 text-[10px] px-1.5 py-0 font-medium">
                                    Revision
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-400 text-[10px] px-1.5 py-0 font-medium">
                                    Study
                                  </Badge>
                                )}

                                {isWeak ? (
                                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] px-1.5 py-0 font-medium gap-1">
                                    <Flame className="h-3 w-3 text-amber-600" />
                                    Priority
                                  </Badge>
                                ) : null}
                              </div>

                              {/* Topic subtitle */}
                              <p className={cn("text-xs text-muted-foreground", done && "line-through text-muted-foreground/60")}>
                                <span className="font-medium text-foreground/80">Topic:</span> {cleanTopic}
                              </p>
                            </div>
                          </div>

                          {/* Right: Time and Duration Badge */}
                          <div className="flex items-center gap-2.5 pl-7 sm:pl-0 shrink-0">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              {formatTime12(slot.startTime)} – {formatTime12(slot.endTime)}
                            </span>
                            <span className="rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                              {formatDuration(duration)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {/* DAILY VIEW */}
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
                    "flex min-w-16 flex-col items-center gap-0.5 rounded-xl border p-2.5 transition-all",
                    selected
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                      : "border-border bg-card hover:border-primary/40",
                    today && !selected && "border-primary/40 bg-primary/5"
                  )}
                >
                  <span className={cn("text-[10px] font-semibold uppercase", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {weekdayLabel(date).slice(0, 3)}
                  </span>
                  <span className="text-base font-extrabold">{date.getDate()}</span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full mt-0.5",
                      slots.length > 0 ? (selected ? "bg-white" : "bg-primary") : "bg-transparent"
                    )}
                  />
                </button>
              );
            })}
          </div>

          <Card className="border-border/80 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {weekdayLabel(days[selectedDay].date)},{" "}
                    {days[selectedDay].date.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {days[selectedDay].slots.length > 0
                      ? `${days[selectedDay].slots.length} sessions scheduled`
                      : "Rest day — no sessions scheduled."}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
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
                <div className="py-10 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                  <p className="text-sm font-medium text-foreground">No sessions scheduled for this day</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Take time to relax or review previous notes.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {days[selectedDay].slots.map((slot) => {
                    const done = doneIds.has(slot.id);
                    const isRevision = slot.type === "revision";
                    const isWeak = weakSubjectIds.has(slot.subjectId);
                    const duration = slotDuration(slot);
                    const cleanTopic = slot.topic.includes("·")
                      ? slot.topic.split("·")[1].trim()
                      : slot.topic;

                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-all hover:border-primary/40",
                          done && "bg-muted/40 opacity-60"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Checkbox
                            checked={done}
                            onCheckedChange={() => toggleDone(slot.id)}
                            aria-label="Mark session done"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: isRevision
                                    ? "hsl(262 83% 58%)"
                                    : subjectColor(slot.subjectCode ?? slot.subjectId),
                                }}
                              />
                              <p className="font-semibold text-sm truncate">{subjectNameFor(slot)}</p>
                              {isRevision ? (
                                <Badge variant="outline" className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 text-[10px] px-1.5 py-0">
                                  Revision
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 text-[10px] px-1.5 py-0">
                                  Study
                                </Badge>
                              )}
                              {isWeak ? (
                                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 text-[10px] px-1.5 py-0">
                                  Priority
                                </Badge>
                              ) : null}
                            </div>
                            <p className={cn("text-xs text-muted-foreground mt-0.5 truncate", done && "line-through")}>
                              {cleanTopic}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-medium text-muted-foreground">
                            {formatTime12(slot.startTime)} – {formatTime12(slot.endTime)}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                            {formatDuration(duration)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* CALENDAR VIEW */}
      {view === "calendar" ? (
        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-7 gap-2">
              {DAY_LABELS.map((day) => (
                <p key={day} className="py-1 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {day.slice(0, 3)}
                </p>
              ))}
              {weeks.map((week, weekIndex) => (
                <Fragment key={weekIndex}>
                  {week.map((date, dayIndex) => {
                    if (date === null) {
                      return <div key={`empty-${weekIndex}-${dayIndex}`} className="min-h-20 rounded-xl border border-transparent p-2" />;
                    }
                    const count = slotsFor.get(date.toISOString().slice(0, 10))?.length ?? 0;
                    const today = isSameDay(date);
                    return (
                      <div
                        key={date.toISOString()}
                        className={cn(
                          "flex min-h-20 flex-col items-center justify-between rounded-xl border p-2 transition-all",
                          count > 0 ? "border-primary/25 bg-primary/5 hover:border-primary/50" : "border-border/60 bg-muted/20",
                          today && "ring-2 ring-primary border-primary"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                            today ? "bg-primary text-primary-foreground" : "text-foreground"
                          )}
                        >
                          {date.getDate()}
                        </span>
                        {count > 0 ? (
                          <span className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            {count} {count === 1 ? "session" : "sessions"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium">Rest</span>
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                Study Session
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                Revision Session
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Priority (Weak Subject)
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
