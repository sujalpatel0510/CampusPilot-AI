"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  Calculator,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  // Simulator state
  const [simSubjectId, setSimSubjectId] = useState("");
  const [simAttend, setSimAttend] = useState("3");
  const [simMiss, setSimMiss] = useState("0");

  const effectiveSimSubj =
    data?.subjects.find((s) => String(s.subjectId) === simSubjectId) ?? data?.subjects[0];

  const currentAttended = effectiveSimSubj?.attended ?? 0;
  const currentTotal = effectiveSimSubj?.totalClasses ?? 0;
  const addAttend = Math.max(0, parseInt(simAttend, 10) || 0);
  const addMiss = Math.max(0, parseInt(simMiss, 10) || 0);

  const projectedTotal = currentTotal + addAttend + addMiss;
  const projectedAttended = currentAttended + addAttend;
  const projectedPct =
    projectedTotal > 0 ? ((projectedAttended / projectedTotal) * 100).toFixed(1) : "0.0";
  const projectedPctNum = parseFloat(projectedPct);

  // Safe bunk calculation for effective subject
  const safeMissable =
    currentTotal > 0 && (currentAttended / currentTotal) >= 0.75
      ? Math.floor((100 * currentAttended - 75 * currentTotal) / 75)
      : 0;
  const neededClasses =
    currentTotal > 0 && (currentAttended / currentTotal) < 0.75
      ? Math.ceil((75 * currentTotal - 100 * currentAttended) / 25)
      : 0;

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
        title="Attendance & Eligibility"
        description="Track your presence, monitor cutoff thresholds, and simulate attendance goals"
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

          {/* Interactive Attendance & Safe Bunk Simulator Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="h-5 w-5 text-primary" />
                  Interactive Attendance & Safe Bunk Simulator
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Simulate your future attendance percentage before planning leaves or study sprints
                </p>
              </div>
              {effectiveSimSubj ? (
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Label htmlFor="sim-subj-select" className="text-xs text-muted-foreground">Select Course:</Label>
                  <Select
                    value={String(effectiveSimSubj.subjectId)}
                    onValueChange={(val) => setSimSubjectId(val)}
                  >
                    <SelectTrigger id="sim-subj-select" className="h-8 w-48 text-xs">
                      <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.subjects.map((s) => (
                        <SelectItem key={s.subjectId} value={String(s.subjectId)}>
                          {s.subjectName ?? s.subjectCode} ({s.percentage}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </CardHeader>
            <CardContent>
              {effectiveSimSubj ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">Current Standing</p>
                      <p className="text-xl font-bold mt-1">
                        {effectiveSimSubj.attended}/{effectiveSimSubj.totalClasses}{" "}
                        <span className="text-sm font-semibold text-muted-foreground">({effectiveSimSubj.percentage}%)</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {effectiveSimSubj.percentage >= 75
                          ? `Eligible for semester exams`
                          : `Below threshold: Shortage of attendance`}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">Safe Bunk / Recovery Target</p>
                      {effectiveSimSubj.percentage >= 75 ? (
                        <div>
                          <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                            {safeMissable} class{safeMissable !== 1 ? "es" : ""}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            You can safely miss this many without dropping below 75%
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                            {neededClasses} consecutive
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Attend next {neededClasses} classes without absence to regain 75%
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">Projected Attendance</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`text-xl font-bold ${projectedPctNum >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                          {projectedPct}%
                        </p>
                        <Badge variant={projectedPctNum >= 75 ? "success" : "destructive"} className="text-[10px]">
                          {projectedPctNum >= 75 ? "Safe" : "Shortage"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Projected: {projectedAttended}/{projectedTotal} total sessions
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3.5 bg-muted/20">
                    <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      What-If Calculator for {effectiveSimSubj.subjectName ?? effectiveSimSubj.subjectCode}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="sim-attend" className="text-xs">Next upcoming classes to ATTEND:</Label>
                        <Input
                          id="sim-attend"
                          type="number"
                          min={0}
                          max={50}
                          value={simAttend}
                          onChange={(e) => setSimAttend(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="sim-miss" className="text-xs">Next upcoming classes to MISS / LEAVE:</Label>
                        <Input
                          id="sim-miss"
                          type="number"
                          min={0}
                          max={50}
                          value={simMiss}
                          onChange={(e) => setSimMiss(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
