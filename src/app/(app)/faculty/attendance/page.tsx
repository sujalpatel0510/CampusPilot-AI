"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { SubjectStudent } from "@/types";

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s.includes("critical")) return <Badge variant="destructive">{status}</Badge>;
  if (s.includes("warning")) return <Badge variant="warning">{status}</Badge>;
  if (s === "no_record") return <Badge variant="outline">No record</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export default function FacultyAttendancePage() {
  const subjects = useApi(() => api.getFacultySubjects(), [], { key: "faculty-subjects" });
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const students = useApi(() => api.getSubjectStudents(subjectId ?? 0), [subjectId], { key: `faculty-students-${subjectId ?? 0}` });
  const [editing, setEditing] = useState<SubjectStudent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [total, setTotal] = useState("");
  const [attended, setAttended] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveSubject = subjectId ?? subjects.data?.[0]?.id ?? null;
  const currentSubjectId = effectiveSubject ?? 0;

  async function openDialog(student: SubjectStudent | null) {
    setEditing(student);
    setTotal(student ? String(student.total_classes) : "");
    setAttended(student ? String(student.attended_classes) : "");
    setDialogOpen(true);
  }

  async function saveRecord() {
    const totalNum = Number(total);
    const attendedNum = Number(attended);
    if (!Number.isInteger(totalNum) || totalNum < 0 || !Number.isInteger(attendedNum) || attendedNum < 0) {
      toast.error("Enter valid non-negative numbers.");
      return;
    }
    if (attendedNum > totalNum) {
      toast.error("Attended classes cannot exceed total classes.");
      return;
    }
    setSaving(true);
    try {
      if (editing?.attendance_id) {
        await api.updateAttendance(editing.attendance_id, {
          total_classes: totalNum,
          attended_classes: attendedNum,
        });
        toast.success("Attendance record updated.");
      } else {
        await api.createAttendance({
          student_id: editing?.id ?? 0,
          subject_id: currentSubjectId,
          total_classes: totalNum,
          attended_classes: attendedNum,
        });
        toast.success("Attendance record created.");
      }
      setDialogOpen(false);
      students.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the attendance record.");
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord(student: SubjectStudent) {
    if (!student.attendance_id) return;
    if (!window.confirm(`Delete the attendance record for ${student.full_name}?`)) return;
    try {
      await api.deleteAttendance(student.attendance_id);
      toast.success("Attendance record deleted.");
      students.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the record.");
    }
  }

  if (subjects.error) {
    return (
      <div>
        <PageHeader title="Attendance" />
        <div className="mt-6">
          <ErrorState message={subjects.error} onRetry={subjects.refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Record and manage attendance for the subjects you teach"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Subject
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.loading ? (
            <Skeleton className="h-9 w-full sm:w-72" />
          ) : (
            <Select
              value={currentSubjectId ? String(currentSubjectId) : ""}
              onValueChange={(v) => setSubjectId(Number(v))}
            >
              <SelectTrigger className="sm:w-72">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {(subjects.data ?? []).map((subject) => (
                  <SelectItem key={subject.id} value={String(subject.id)}>
                    {subject.name} ({subject.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {!currentSubjectId ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Select a subject to manage attendance.</p>
          ) : students.loading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-11" />
              ))}
            </div>
          ) : students.error ? (
            <div className="p-4">
              <ErrorState message={students.error} onRetry={students.refetch} />
            </div>
          ) : (students.data?.length ?? 0) === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No students enrolled in this subject.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Attended</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(students.data ?? []).map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.student_id}</TableCell>
                    <TableCell>
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </TableCell>
                    <TableCell className="text-right">{student.total_classes}</TableCell>
                    <TableCell className="text-right">{student.attended_classes}</TableCell>
                    <TableCell className="text-right font-medium">{student.percentage}%</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={student.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDialog(student)}
                          aria-label={student.attendance_id ? "Edit attendance" : "Add attendance"}
                        >
                          {student.attendance_id ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </Button>
                        {student.attendance_id ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeRecord(student)}
                            aria-label="Delete attendance"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing?.attendance_id ? "Edit attendance record" : "Add attendance record"}
            </DialogTitle>
            <DialogDescription>
              {editing ? `${editing.full_name} (${editing.student_id})` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="att-total">Total classes</Label>
                <Input
                  id="att-total"
                  type="number"
                  min={0}
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="e.g. 20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="att-attended">Attended classes</Label>
                <Input
                  id="att-attended"
                  type="number"
                  min={0}
                  value={attended}
                  onChange={(e) => setAttended(e.target.value)}
                  placeholder="e.g. 16"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void saveRecord()} disabled={saving}>
              {saving ? "Saving…" : editing?.attendance_id ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
