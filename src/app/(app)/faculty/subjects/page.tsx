"use client";

import { useState } from "react";
import { BookOpen, Users } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { subjectColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function FacultySubjectsPage() {
  const subjects = useApi(() => api.getFacultySubjects(), [], { key: "faculty-subjects" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const students = useApi(() => api.getSubjectStudents(selectedId ?? 0), [selectedId], { key: `faculty-students-${selectedId ?? 0}` });

  const selected = subjects.data?.find((s) => s.id === selectedId) ?? subjects.data?.[0] ?? null;

  function statusBadge(status: string) {
    const s = status.toLowerCase();
    if (s.includes("critical")) return <Badge variant="destructive">{status}</Badge>;
    if (s.includes("warning")) return <Badge variant="warning">{status}</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  }

  if (subjects.error) {
    return (
      <div>
        <PageHeader title="My Subjects" />
        <div className="mt-6">
          <ErrorState message={subjects.error} onRetry={subjects.refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Subjects"
        description="Subjects you teach and the students enrolled in them"
      />

      {subjects.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (subjects.data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-semibold">No subjects assigned yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Subjects you teach are derived from the timetable. Ask your admin to assign you classes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(subjects.data ?? []).map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => setSelectedId(subject.id)}
                className={cn(
                  "rounded-lg border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40",
                  selected?.id === subject.id && "border-primary/60 ring-1 ring-primary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                    style={{ backgroundColor: subjectColor(subject.code) }}
                  >
                    {subject.code.slice(-2)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {subject.code} · Sem {subject.semester} · {subject.credits} credits
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                Students · {selected?.name ?? "Select a subject"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selected ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Select a subject to see enrolled students.</p>
              ) : students.loading ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : students.error ? (
                <ErrorState message={students.error} onRetry={students.refetch} />
              ) : (students.data?.length ?? 0) === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No students enrolled in this subject yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Attended</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(students.data ?? []).map((student) => (
                      <TableRow key={student.student_id}>
                        <TableCell className="font-medium">{student.student_id}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{student.email}</TableCell>
                        <TableCell className="text-right">{student.total_classes}</TableCell>
                        <TableCell className="text-right">{student.attended_classes}</TableCell>
                        <TableCell className="text-right font-medium">{student.percentage}%</TableCell>
                        <TableCell className="text-right">{statusBadge(student.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
