"use client";

import { useState } from "react";
import { CalendarRange, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanForm } from "@/components/planner/plan-form";
import { PlanStats } from "@/components/planner/plan-stats";
import { PlanViews, planDateRange } from "@/components/planner/plan-views";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { StudyPlan, StudyPlanForm } from "@/types";
import { toast } from "sonner";

export default function StudyPlannerPage() {
  const { data, loading, error, refetch } = useApi(() => api.getStudyPlan(), [], { key: "study-plan" });
  const subjects = useApi(() => api.getSubjects(), [], { key: "subjects" });
  const [generating, setGenerating] = useState(false);

  async function handleGenerate(form: StudyPlanForm) {
    setGenerating(true);
    try {
      const plan = await api.generateStudyPlan(form);
      refetch();
      toast.success(`Study plan generated — ${plan.slots.length} sessions planned.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate the study plan.");
    } finally {
      setGenerating(false);
    }
  }

  const defaultForm: StudyPlanForm = {
    examDates: {},
    availableHours: 3,
    weakSubjects: [],
    preferredTime: "evening",
  };

  if (error) {
    return (
      <div>
        <PageHeader title="Study Planner" />
        <div className="mt-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Planner"
        description="AI-powered revision plans built around your exams"
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {loading ? (
            <Skeleton className="h-[560px]" />
          ) : (
            <PlanForm
              initial={data ? data.form : defaultForm}
              onGenerate={handleGenerate}
              generating={generating}
              subjects={subjects.data ?? []}
            />
          )}
        </div>

        <div className="space-y-4 lg:col-span-3">
          {loading ? (
            <Skeleton className="h-96" />
          ) : data ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600">
                    <Sparkles className="h-4 w-4 text-white" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{data.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Generated {new Date(data.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      {planDateRange(data)}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <CalendarRange className="h-3 w-3" />
                  {data.form.weakSubjects.length > 0 ? "Weak subjects prioritised" : "Balanced plan"}
                </Badge>
              </div>

              <PlanStats plan={data} />

              <PlanViews plan={data} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}