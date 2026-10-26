"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
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
  const effectiveSubject = subjectId ?? subjects.data?.[0]?.id ?? null;
  const currentSubjectId = effectiveSubject ?? 0;
  const currentSubject = subjects.data?.find((s) => s.id === currentSubjectId);

  const students = useApi(
    () => (effectiveSubject ? api.getSubjectStudents(effectiveSubject) : Promise.resolve(null)),
    [effectiveSubject],
    { key: `faculty-students-${effectiveSubject ?? "none"}` }
  );
  const [editing, setEditing] = useState<SubjectStudent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [total, setTotal] = useState("");
  const [attended, setAttended] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [intervening, setIntervening] = useState(false);

  const studentList = students.data ?? [];
  const enrolledCount = studentList.length;
  const avgAttendance =
    enrolledCount > 0
      ? (
          studentList.reduce((acc, s) => acc + (s.total_classes ? s.percentage : 0), 0) /
          (studentList.filter((s) => s.total_classes > 0).length || 1)
        ).toFixed(1)
      : "0.0";
  const safeCount = studentList.filter((s) => s.total_classes > 0 && s.percentage >= 75).length;
  const atRiskCount = studentList.filter((s) => s.total_classes > 0 && s.percentage < 75).length;

  async function handleInterveneAll() {
    if (!currentSubjectId || atRiskCount === 0) {
      toast.error("No at-risk students found.");
      return;
    }
    if (
      !window.confirm(
        `Send personalized AI Attendance Recovery Warnings to ${atRiskCount} at-risk students (<75%)?`
      )
    ) {
      return;
    }
    setIntervening(true);
    try {
      const res = await api.interveneAtRiskStudents(currentSubjectId);
      toast.success(res.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send intervention notifications.");
    } finally {
      setIntervening(false);
    }
  }

  async function handleInterveneStudent(student: SubjectStudent) {
    try {
      const res = await api.interveneAtRiskStudents(currentSubjectId, student.id);
      toast.success(res.message || `AI recovery alert sent to ${student.full_name}.`);
    } catch {
      toast.error("Could not send alert.");
    }
  }

  async function handleExportExcel() {
    if (!currentSubjectId) {
      toast.error("Please select a subject first.");
      return;
    }
    setExporting(true);
    try {
      await api.exportSubjectAttendance(currentSubjectId);
      toast.success("Attendance spreadsheet downloaded (.xlsx)!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export attendance.");
    } finally {
      setExporting(false);
    }
  }

  async function handleMarkAllPresent() {
    if (!currentSubjectId || studentList.length === 0) {
      toast.error("No enrolled students found for this subject.");
      return;
    }
    if (
      !window.confirm(
        `Record today's class: Mark ALL ${studentList.length} enrolled students Present (+1 class attended)?`
      )
    ) {
      return;
    }
    setMarkingAll(true);
    try {
      const res = await api.bulkMarkAttendance(currentSubjectId, { all_present: true });
      toast.success(res.message || "Class attendance marked for all students!");
      students.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record bulk attendance.");
    } finally {
      setMarkingAll(false);
    }
  }

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

  async function quickMark(student: SubjectStudent, present: boolean) {
    const currentTotal = student.total_classes ?? 0;
    const currentAttended = student.attended_classes ?? 0;
    const newTotal = currentTotal + 1;
    const newAttended = present ? currentAttended + 1 : currentAttended;
    try {
      if (student.attendance_id) {
        await api.updateAttendance(student.attendance_id, {
          total_classes: newTotal,
          attended_classes: newAttended,
        });
      } else {
        await api.createAttendance({
          student_id: student.id,
          subject_id: currentSubjectId,
          total_classes: newTotal,
          attended_classes: newAttended,
        });
      }
      toast.success(`${student.full_name}: marked ${present ? "Present (+1)" : "Absent"}`);
      students.refetch();
    } catch {
      toast.error("Could not update attendance.");
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
        title="Attendance Management"
        description="Record student attendance, track at-risk students, and export Excel reports"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleExportExcel()}
              disabled={exporting || !currentSubjectId || studentList.length === 0}
              className="gap-2 font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
              title="Download full Microsoft Excel (.xlsx) spreadsheet"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {exporting ? "Exporting…" : "Export Excel (.xlsx)"}
            </Button>
            <Button
              size="sm"
              onClick={() => void handleMarkAllPresent()}
              disabled={markingAll || !currentSubjectId || studentList.length === 0}
              className="gap-2 font-medium bg-primary"
            >
              <CheckCheck className="h-4 w-4" />
              {markingAll ? "Recording…" : "Mark All Present"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Enrolled Students</p>
              <p className="text-xl font-bold">{enrolledCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Class Average</p>
              <p className="text-xl font-bold">{avgAttendance}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Eligible (≥75%)</p>
              <p className="text-xl font-bold">{safeCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">At Risk (&lt;75%)</p>
              <p className="text-xl font-bold">{atRiskCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {atRiskCount > 0 ? (
        <Card className="border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-500/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  AI Early Warning: {atRiskCount} Student{atRiskCount > 1 ? "s" : ""} Below 75% Cutoff
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300/80">
                  These students risk semester exam disqualification. Send personalized AI attendance recovery notifications to their dashboards.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleInterveneAll()}
              disabled={intervening}
              className="gap-2 border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300 font-medium shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {intervening ? "Delivering Alerts…" : "Send AI Recovery Alerts"}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Select Subject
          </CardTitle>
          {currentSubject ? (
            <Badge variant="outline" className="text-xs">
              Semester {currentSubject.semester} · {currentSubject.department}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent>
          {subjects.loading ? (
            <Skeleton className="h-9 w-full sm:w-72" />
          ) : (
            <Select
              value={currentSubjectId ? String(currentSubjectId) : ""}
              onValueChange={(v) => setSubjectId(Number(v))}
            >
              <SelectTrigger className="sm:w-80">
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
          ) : studentList.length === 0 ? (
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
                {studentList.map((student) => (
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
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] font-medium text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
                          onClick={() => void quickMark(student, true)}
                          title="Quick mark present (+1 class attended)"
                        >
                          + Present
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] font-medium text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
                          onClick={() => void quickMark(student, false)}
                          title="Quick mark absent (+1 total class)"
                        >
                          + Absent
                        </Button>
                        {student.percentage < 75 && student.total_classes > 0 ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
                            onClick={() => void handleInterveneStudent(student)}
                            title="Send individual AI attendance recovery alert"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDialog(student)}
                          aria-label={student.attendance_id ? "Edit attendance" : "Add attendance"}
                          title="Custom numbers"
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

