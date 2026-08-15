"use client";

import { useState } from "react";
import { CalendarClock, GraduationCap, Moon, Sparkles, Sun, Sunrise, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PreferredTime, StudyPlanForm } from "@/types";
import { SUBJECTS } from "@/data/mock-data";
import { cn } from "@/lib/utils";

const TIME_OPTIONS: { value: PreferredTime; label: string; icon: React.ElementType; hint: string }[] = [
  { value: "morning", label: "Morning", hint: "6 – 10 AM", icon: Sunrise },
  { value: "evening", label: "Evening", hint: "4 – 8 PM", icon: Sun },
  { value: "night", label: "Night", hint: "9 PM – 12 AM", icon: Moon },
];

interface PlanFormProps {
  initial: StudyPlanForm;
  onGenerate: (form: StudyPlanForm) => void;
  generating: boolean;
}

export function PlanForm({ initial, onGenerate, generating }: PlanFormProps) {
  const [examDates, setExamDates] = useState<Record<string, string>>(initial.examDates);
  const [availableHours, setAvailableHours] = useState(initial.availableHours);
  const [weakSubjects, setWeakSubjects] = useState<string[]>(initial.weakSubjects);
  const [preferredTime, setPreferredTime] = useState<PreferredTime>(initial.preferredTime);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleWeak(subjectId: string) {
    setWeakSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((s) => s !== subjectId) : [...prev, subjectId]
    );
  }

  function generate() {
    const next: Record<string, string> = {};
    const withDates = Object.entries(examDates).filter(([, date]) => date);
    if (withDates.length === 0) {
      next.dates = "Set at least one exam date to generate a plan.";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (const [subjectId, date] of withDates) {
        if (new Date(date) < today) next[subjectId] = "Exam date cannot be in the past.";
      }
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onGenerate({ examDates, availableHours, weakSubjects, preferredTime });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </span>
          Study Plan Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <CalendarClock className="h-3.5 w-3.5 text-primary" />
            Exam dates
          </Label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {SUBJECTS.slice(0, 5).map((subject) => (
              <div key={subject.id} className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
                  style={{ backgroundColor: subject.color }}
                >
                  {subject.name.slice(0, 2).toUpperCase()}
                </span>
                <Input
                  type="date"
                  aria-label={`${subject.name} exam date`}
                  value={examDates[subject.id]?.slice(0, 10) ?? ""}
                  onChange={(e) =>
                    setExamDates((prev) => ({ ...prev, [subject.id]: e.target.value }))
                  }
                  className={cn("h-8", errors[subject.id] && "border-destructive")}
                />
              </div>
            ))}
          </div>
          {errors.dates || Object.values(errors).some(Boolean) ? (
            <p className="text-xs text-destructive">
              {errors.dates ?? Object.values(errors).find(Boolean)}
            </p>
          ) : null}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Study hours per day</Label>
            <span className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              {availableHours} hour{availableHours === 1 ? "" : "s"}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={6}
            value={availableHours}
            onChange={(e) => setAvailableHours(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label="Study hours per day"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            {[1, 2, 3, 4, 5, 6].map((h) => (
              <span key={h} className={cn(h === availableHours && "font-semibold text-primary")}>
                {h}h
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <Target className="h-3.5 w-3.5 text-primary" />
            Weak subjects
          </Label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((subject) => {
              const selected = weakSubjects.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => toggleWeak(subject.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    selected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                  aria-pressed={selected}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: selected ? "white" : subject.color }} />
                  {subject.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Weak subjects get more sessions and appear earlier in the plan.
          </p>
        </div>

        <div className="space-y-2.5">
          <Label className="text-xs font-semibold">Preferred study time</Label>
          <RadioGroup
            value={preferredTime}
            onValueChange={(v) => setPreferredTime(v as PreferredTime)}
            className="grid grid-cols-3 gap-2"
          >
            {TIME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = preferredTime === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all",
                    active
                      ? "border-primary bg-gradient-to-b from-primary/10 to-primary/5 shadow-sm"
                      : "hover:border-primary/40"
                  )}
                >
                  <RadioGroupItem value={option.value} className="sr-only" />
                  <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xs font-semibold">{option.label}</span>
                  <span className={cn("text-[10px]", active ? "text-primary/70" : "text-muted-foreground/70")}>
                    {option.hint}
                  </span>
                </label>
              );
            })}
          </RadioGroup>
        </div>

        <Button
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
          size="lg"
          onClick={generate}
          disabled={generating}
        >
          {generating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Generating your plan…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate AI Study Plan
            </>
          )}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5" />
          AI distributes hours by exam proximity and weak-subject priority.
        </p>
      </CardContent>
    </Card>
  );
}