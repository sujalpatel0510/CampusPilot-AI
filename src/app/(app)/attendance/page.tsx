"use client";

import dynamic from "next/dynamic";
import { AlertTriangle, CalendarCheck, CalendarX, CheckCircle2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CircularProgress } from "@/components/shared/circular-progress";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { AttendanceBadge } from "@/components/attendance/attendance-badge";

const AttendanceBarChart = dynamic(
  () => import("@/components/attendance/attendance-charts").then((m) => m.AttendanceBarChart),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full" /> }
);

const AttendanceAreaChart = dynamic(
  () => import("@/components/attendance/attendance-charts").then((m) => m.AttendanceAreaChart),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full" /> }
);

export default function AttendancePage() {
  const { data, loading, error, refetch } = useApi(() => api.getAttendance(), [], { key: "attendance" });

  if (error) {
    return (
      <div>
        <PageHeader title="Attendance" />
        <div className="mt-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track your presence and stay above the 75% requirement"
      />

      {loading || !data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Overall attendance" value={`${data.overall}%`} icon={Users} />
            <StatCard title="Classes attended" value={data.attended} icon={CalendarCheck} footer={`out of ${data.totalClasses} total`} />
            <StatCard
              title="Below 75%"
              value={data.subjects.filter((s) => s.percentage < 75).length}
              icon={CalendarX}
              footer="subjects at risk"
            />
            <StatCard
              title="Good standing"
              value={data.subjects.filter((s) => s.percentage >= 75).length}
              icon={CheckCircle2}
              footer="subjects above the limit"
            />
          </div>

          {data.subjects.some((s) => s.percentage < 75) ? (
            <Card className="border-amber-300 dark:border-amber-900">
              <CardContent className="flex items-start gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Attendance warning</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {data.subjects
                      .filter((s) => s.percentage < 75)
                      .map((s) => s.subjectName?.split(" ")[0] ?? s.subjectCode ?? s.subjectId)
                      .join(", ")}{" "}
                    {data.subjects.filter((s) => s.percentage < 75).length === 1 ? "is" : "are"} below the 75% requirement.{" "}
                    Attend the next classes without fail to avoid being debarred from exams.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Overall</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <CircularProgress
                  value={data.overall}
                  size={170}
                  strokeWidth={13}
                  label={`${data.overall}%`}
                  sublabel={`${data.attended}/${data.totalClasses}`}
                  tone={data.overall >= 85 ? "good" : data.overall >= 75 ? "default" : "critical"}
                />
              </CardContent>
              <CardContent className="space-y-3">
                {data.subjects.map((subject) => {
                  const name = subject.subjectName ?? subject.subjectId;
                  return (
                    <div key={subject.subjectId} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                        <span className="truncate">{name.split(" ").slice(0, 2).join(" ")}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {subject.attended}/{subject.totalClasses}
                      </span>
                      <AttendanceBadge percentage={subject.percentage} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Attendance by subject</CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceBarChart data={data} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance trend (last 8 weeks)</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceAreaChart data={data} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Subject-wise detail</CardTitle>
              <Badge variant="secondary">Minimum 75% required</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead className="text-right">Attended</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.subjects.map((subject) => {
                    return (
                      <TableRow key={subject.subjectId}>
                        <TableCell className="font-medium">{subject.subjectName ?? subject.subjectId}</TableCell>
                        <TableCell className="text-muted-foreground">{subject.subjectCode ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell className="text-right">
                          {subject.attended}/{subject.totalClasses}
                        </TableCell>
                        <TableCell className="text-right">
                          <AttendanceBadge percentage={subject.percentage} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={subject.percentage < 75 ? "warning" : "success"}>
                            {subject.percentage < 75 ? "At risk" : "Safe"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}