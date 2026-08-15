"use client";

import { BookOpen, Clock3, Layers, RefreshCw } from "lucide-react";
import type { StudyPlan } from "@/types";
import { cn } from "@/lib/utils";

function slotMinutes(slot: { startTime: string; endTime: string }): number {
  const [sh, sm] = slot.startTime.split(":").map(Number);
  const [eh, em] = slot.endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function PlanStats({ plan }: { plan: StudyPlan }) {
  if (plan.slots.length === 0) return null;

  const totalMinutes = plan.slots.reduce((sum, slot) => sum + slotMinutes(slot), 0);
  const subjects = new Set(plan.slots.map((slot) => slot.subjectId));
  const revisionCount = plan.slots.filter((slot) => slot.type === "revision").length;

  const firstDate = new Date(plan.slots[0].date);
  const lastDate = new Date(plan.slots[plan.slots.length - 1].date);
  firstDate.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);
  const totalDays = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / 86400000) + 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const elapsed = Math.min(totalDays, Math.max(0, Math.round((today.getTime() - firstDate.getTime()) / 86400000) + 1));
  const progress = Math.round((elapsed / totalDays) * 100);

  const stats = [
    { icon: Clock3, label: "Total hours", value: Math.round(totalMinutes / 60) },
    { icon: Layers, label: "Sessions", value: plan.slots.length },
    { icon: BookOpen, label: "Subjects", value: subjects.size },
    { icon: RefreshCw, label: "Revision sessions", value: revisionCount },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-indigo-600/5 via-primary/5 to-violet-600/5 shadow-sm">
      <div className="grid grid-cols-2 divide-x divide-y divide-primary/10 sm:grid-cols-4 sm:divide-y-0">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center gap-2.5 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <div>
                <p className="text-lg font-bold leading-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-primary/10 px-4 py-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="font-medium text-muted-foreground">
            Day {elapsed} of {totalDays}
          </span>
          <span className={cn("font-semibold", progress >= 100 ? "text-primary" : "text-muted-foreground")}>
            {progress}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-700"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>
    </div>
  );
}