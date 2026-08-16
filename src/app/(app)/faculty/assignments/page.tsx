"use client";

import { useState } from "react";
import { CalendarClock, ClipboardList, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, daysUntil } from "@/lib/utils";
import type { FacultyAssignment } from "@/types";

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  if (p === "high") return <Badge variant="destructive">High</Badge>;
  if (p === "low") return <Badge variant="secondary">Low</Badge>;
  return <Badge variant="warning">Medium</Badge>;
}

export default function FacultyAssignmentsPage() {
  const assignments = useApi(() => api.getFacultyAssignments(), [], { key: "faculty-assignments" });
  const subjects = useApi(() => api.getFacultySubjects(), [], { key: "faculty-subjects" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);

  async function createAssignment() {
    const subjectNum = Number(subjectId);
    if (!subjectId || !title.trim() || title.trim().length < 2) {
      toast.error("Choose a subject and enter a title (min 2 characters).");
      return;
    }
    if (!dueDate) {
      toast.error("Pick a due date.");
      return;
    }
    setSaving(true);
    try {
      await api.createAssignment({
        subject_id: subjectNum,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate,
        priority,
      });
      toast.success("Assignment published.");
      setDialogOpen(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("medium");
      assignments.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssignment(assignment: FacultyAssignment) {
    if (!window.confirm(`Delete "${assignment.title}"?`)) return;
    try {
      await api.deleteAssignment(assignment.id);
      toast.success("Assignment deleted.");
      assignments.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the assignment.");
    }
  }

  const sorted = [...(assignments.data ?? [])].sort((a, b) => a.due_date.localeCompare(b.due_date));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Create and manage assignments for your subjects"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New assignment
          </Button>
        }
      />

      {assignments.error ? (
        <ErrorState message={assignments.error} onRetry={assignments.refetch} />
      ) : assignments.loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Publish your first assignment to your students."
          icon={ClipboardList}
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New assignment
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((assignment) => {
            const days = daysUntil(assignment.due_date);
            return (
              <Card key={assignment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ClipboardList className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{assignment.title}</p>
                        <PriorityBadge priority={assignment.priority} />
                        <Badge variant="outline" className="text-[10px]">
                          {assignment.subject_code}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {assignment.description || "No description provided."}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Due {formatDate(assignment.due_date)}
                        {days < 0 ? (
                          <Badge variant="destructive" className="text-[10px]">
                            {Math.abs(days)}d overdue
                          </Badge>
                        ) : days === 0 ? (
                          <Badge variant="warning" className="text-[10px]">
                            Due today
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            {days}d left
                          </Badge>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteAssignment(assignment)}
                      aria-label="Delete assignment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New assignment</DialogTitle>
            <DialogDescription>Publish an assignment to the enrolled students.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="as-subject">Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger id="as-subject">
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {(subjects.data ?? []).map((subject) => (
                    <SelectItem key={subject.id} value={String(subject.id)}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="as-title">Title</Label>
              <Input
                id="as-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Assignment 3 – Normalization"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="as-desc">Description</Label>
              <Textarea
                id="as-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions, questions or submission details"
                rows={3}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="as-due">Due date</Label>
                <Input id="as-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void createAssignment()} disabled={saving}>
              {saving ? "Publishing…" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
