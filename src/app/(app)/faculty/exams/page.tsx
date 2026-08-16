"use client";

import { useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
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
import { daysUntil, formatDate, formatTime12, subjectColor } from "@/lib/utils";
import type { FacultyExam } from "@/types";

const EXAM_TYPES = ["Quiz", "Internal", "Mid-Term", "End-Term"];

export default function FacultyExamsPage() {
  const exams = useApi(() => api.getFacultyExams(), [], { key: "faculty-exams" });
  const subjects = useApi(() => api.getFacultySubjects(), [], { key: "faculty-subjects" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [examType, setExamType] = useState("Internal");
  const [examDate, setExamDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [room, setRoom] = useState("");
  const [saving, setSaving] = useState(false);

  const taughtSubjectIds = new Set((subjects.data ?? []).map((s) => s.id));
  const myExams = (exams.data ?? []).filter((e) => taughtSubjectIds.has(e.subject_id));

  function openDialog() {
    const first = subjects.data?.[0];
    setSubjectId(first ? String(first.id) : "");
    setExamType("Internal");
    setExamDate("");
    setStartTime("09:00");
    setEndTime("11:00");
    setRoom("");
    setDialogOpen(true);
  }

  async function createExam() {
    const subjectNum = Number(subjectId);
    const selected = subjects.data?.find((s) => s.id === subjectNum);
    if (!subjectId) {
      toast.error("Choose a subject.");
      return;
    }
    if (!examDate) {
      toast.error("Pick an exam date.");
      return;
    }
    if (startTime >= endTime) {
      toast.error("End time must be after start time.");
      return;
    }
    setSaving(true);
    try {
      await api.createExam({
        subject_id: subjectNum,
        department: selected?.department ?? "",
        semester: selected?.semester ?? 0,
        section: "A",
        exam_type: examType,
        exam_date: examDate,
        start_time: startTime,
        end_time: endTime,
        room: room.trim(),
      });
      toast.success("Exam scheduled.");
      setDialogOpen(false);
      exams.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not schedule the exam.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExam(exam: FacultyExam) {
    if (!window.confirm(`Delete the ${exam.exam_type} for ${exam.subject_name}?`)) return;
    try {
      await api.deleteExam(exam.id);
      toast.success("Exam deleted.");
      exams.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the exam.");
    }
  }

  const sorted = [...myExams].sort((a, b) => a.exam_date.localeCompare(b.exam_date));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams"
        description="Schedule and manage exams for your subjects"
        actions={
          <Button onClick={openDialog}>
            <Plus className="h-4 w-4" />
            Schedule exam
          </Button>
        }
      />

      {exams.error || subjects.error ? (
        <ErrorState message={exams.error ?? subjects.error ?? ""} onRetry={() => { exams.refetch(); subjects.refetch(); }} />
      ) : exams.loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No exams scheduled"
          description="Schedule your exams here so students can see them on the calendar."
          icon={CalendarClock}
          action={
            <Button onClick={openDialog}>
              <Plus className="h-4 w-4" />
              Schedule exam
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((exam) => {
            const days = daysUntil(exam.exam_date);
            return (
              <Card key={exam.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                      style={{ backgroundColor: subjectColor(exam.subject_code) }}
                    >
                      {exam.subject_code.slice(-2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{exam.subject_name}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {exam.exam_type}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          Sem {exam.semester} · {exam.section}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(exam.exam_date)} · {formatTime12(exam.start_time)} – {formatTime12(exam.end_time)} · Room {exam.room}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {days < 0 ? (
                        <Badge variant="secondary">Completed</Badge>
                      ) : days === 0 ? (
                        <Badge variant="warning">Today</Badge>
                      ) : (
                        <Badge variant={days <= 3 ? "warning" : "secondary"}>{days}d left</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteExam(exam)}
                        aria-label="Delete exam"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
            <DialogTitle>Schedule an exam</DialogTitle>
            <DialogDescription>Students will see this on their exam calendar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ex-subject">Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger id="ex-subject">
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Exam type</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ex-date">Exam date</Label>
                <Input id="ex-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ex-start">Start time</Label>
                <Input id="ex-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ex-end">End time</Label>
                <Input id="ex-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-room">Room</Label>
              <Input id="ex-room" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. A-105" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void createExam()} disabled={saving}>
              {saving ? "Scheduling…" : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
