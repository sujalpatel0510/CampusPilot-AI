"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { Assignment, AssignmentStatus } from "@/types";
import { formatDate, daysUntil, cn } from "@/lib/utils";

const TABS: { value: "all" | AssignmentStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
];

export default function AssignmentsPage() {
  const { data, loading, error, refetch } = useApi(() => api.getAssignments(), [], { key: "assignments" });
  const subjects = useApi(() => api.getSubjects(), [], { key: "subjects" });
  const [tab, setTab] = useState<"all" | AssignmentStatus>("all");
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filtered = (data ?? [])
    .filter((a) => {
      if (tab !== "all" && a.status !== tab) return false;
      if (subjectFilter !== "all" && a.subjectId !== subjectFilter) return false;
      if (priorityFilter !== "all") {
        const days = daysUntil(a.dueDate);
        if (priorityFilter === "urgent" && !(days <= 3 && a.status !== "completed")) return false;
        if (priorityFilter === "this-week" && !(days <= 7 && days > 0 && a.status !== "completed")) return false;
        if (priorityFilter === "later" && !(days > 7 || a.status === "completed")) return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          (a.description ?? "").toLowerCase().includes(q) ||
          (a.subjectName ?? "").toLowerCase().includes(q) ||
          (a.subjectCode ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

  async function toggleComplete(assignment: Assignment) {
    try {
      await api.updateAssignmentStatus(assignment.id, !assignment.submitted);
      refetch();
      toast.success(assignment.submitted ? `"${assignment.title}" reopened.` : `"${assignment.title}" marked complete.`);
    } catch {
      toast.error("Could not update the assignment.");
    }
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Assignments" />
        <div className="mt-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Track deadlines across all your courses"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | AssignmentStatus)}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchBar value={query} onChange={setQuery} placeholder="Search assignments…" className="sm:max-w-72" />
            <FilterDropdown
              label="Subject"
              value={subjectFilter}
              onChange={setSubjectFilter}
              options={[
                { value: "all", label: "All subjects" },
                ...(subjects.data ?? []).map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
            <FilterDropdown
              label="Priority"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { value: "all", label: "All priorities" },
                { value: "urgent", label: "Urgent (3 days or less)" },
                { value: "this-week", label: "This week" },
                { value: "later", label: "Later / done" },
              ]}
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No assignments match"
              description="Try adjusting your filters, or check back when a faculty member posts new assignments."
              icon={ClipboardList}
            />
          ) : (
            filtered.map((assignment) => {
              const days = daysUntil(assignment.dueDate);
              const urgent = assignment.status === "pending" && days <= 3;
              return (
                <Card
                  key={assignment.id}
                  className={cn(
                    "transition-colors",
                    assignment.status === "overdue" && "border-destructive/40",
                    assignment.status === "completed" && "opacity-70"
                  )}
                >
                  <CardContent className="flex items-start gap-3.5 p-4">
                    <button
                      type="button"
                      onClick={() => toggleComplete(assignment)}
                      className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary"
                      aria-label={assignment.submitted ? `Reopen ${assignment.title}` : `Mark ${assignment.title} complete`}
                    >
                      {assignment.submitted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn("text-sm font-semibold", assignment.submitted && "line-through")}>
                          {assignment.title}
                        </p>
                        {assignment.status === "overdue" ? <Badge variant="destructive">Overdue</Badge> : null}
                        {urgent ? <Badge variant="warning">Due soon</Badge> : null}
                        {assignment.submitted ? <Badge variant="success">Completed</Badge> : null}
                      </div>
                      {assignment.description ? (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{assignment.description}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: assignment.subjectColor }} />
                          {assignment.subjectName || assignment.subjectCode || assignment.subjectId}
                        </span>
                        <span>Due {formatDate(assignment.dueDate)}</span>
                        {!assignment.submitted && days > 0 ? (
                          <span className={cn("font-medium", urgent ? "text-destructive" : "text-muted-foreground")}>
                            {days === 1 ? "Due tomorrow" : `${days} days left`}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
