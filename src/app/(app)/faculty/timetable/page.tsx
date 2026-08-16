"use client";

import { useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
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
import { formatTime12, subjectColor, WEEK_DAY_NAMES } from "@/lib/utils";
import type { FacultyTimetableEntry } from "@/types";

const DAYS = WEEK_DAY_NAMES.slice(0, 6);

export default function FacultyTimetablePage() {
  const timetable = useApi(() => api.getFacultyTimetable(), [], { key: "faculty-timetable" });
  const subjects = useApi(() => api.getFacultySubjects(), [], { key: "faculty-subjects" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [room, setRoom] = useState("");
  const [semester, setSemester] = useState("3");
  const [section, setSection] = useState("A");
  const [saving, setSaving] = useState(false);

  const taughtSubjectIds = new Set((subjects.data ?? []).map((s) => s.id));
  const myEntries = (timetable.data ?? []).filter((e) => taughtSubjectIds.has(e.subject_id));

  function openDialog() {
    const first = subjects.data?.[0];
    setSubjectId(first ? String(first.id) : "");
    setSemester(first ? String(first.semester) : "3");
    setRoom("");
    setSection("A");
    setDay("Monday");
    setStartTime("09:00");
    setEndTime("10:00");
    setDialogOpen(true);
  }

  async function createEntry() {
    const subjectNum = Number(subjectId);
    const selected = subjects.data?.find((s) => s.id === subjectNum);
    const semesterNum = Number(semester);
    if (!subjectId) {
      toast.error("Choose a subject.");
      return;
    }
    if (!Number.isInteger(semesterNum) || semesterNum < 1 || semesterNum > 12) {
      toast.error("Semester must be between 1 and 12.");
      return;
    }
    if (!section.trim()) {
      toast.error("Enter a section (e.g. A).");
      return;
    }
    if (startTime >= endTime) {
      toast.error("End time must be after start time.");
      return;
    }
    setSaving(true);
    try {
      await api.createTimetableEntry({
        subject_id: subjectNum,
        department: selected?.department ?? "",
        semester: semesterNum,
        section: section.trim(),
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        room: room.trim(),
      });
      toast.success("Class added to the timetable.");
      setDialogOpen(false);
      timetable.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the class.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(entry: FacultyTimetableEntry) {
    if (!window.confirm(`Delete ${entry.subject_name} (${entry.day_of_week} ${formatTime12(entry.start_time)})?`)) return;
    try {
      await api.deleteTimetableEntry(entry.id);
      toast.success("Timetable entry deleted.");
      timetable.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the entry.");
    }
  }

  const grouped = DAYS.map((dayName) => ({
    day: dayName,
    entries: myEntries
      .filter((e) => e.day_of_week === dayName)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        description="Your scheduled classes across the week"
        actions={
          <Button onClick={openDialog}>
            <Plus className="h-4 w-4" />
            Add class
          </Button>
        }
      />

      {timetable.error || subjects.error ? (
        <ErrorState message={timetable.error ?? subjects.error ?? ""} onRetry={() => { timetable.refetch(); subjects.refetch(); }} />
      ) : timetable.loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          title="No classes scheduled"
          description="Add your classes to build your teaching timetable."
          icon={CalendarDays}
          action={
            <Button onClick={openDialog}>
              <Plus className="h-4 w-4" />
              Add class
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {grouped.map((group) => (
            <Card key={group.day}>
              <CardContent className="p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {group.day}
                </p>
                <ul className="space-y-2">
                  {group.entries.map((entry) => (
                    <li key={entry.id} className="flex items-center gap-3 rounded-md border p-2.5">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                        style={{ backgroundColor: subjectColor(entry.subject_code) }}
                      >
                        {entry.subject_code.slice(-2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{entry.subject_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime12(entry.start_time)} – {formatTime12(entry.end_time)} · Room {entry.room}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        Sem {entry.semester}·{entry.section}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteEntry(entry)}
                        aria-label="Delete class"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a class</DialogTitle>
            <DialogDescription>Schedule a class for the semester timetable.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tt-subject">Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger id="tt-subject">
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
                <Label>Day</Label>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tt-room">Room</Label>
                <Input id="tt-room" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. A-204" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tt-start">Start time</Label>
                <Input id="tt-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tt-end">End time</Label>
                <Input id="tt-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tt-sem">Semester</Label>
                <Input id="tt-sem" type="number" min={1} max={12} value={semester} onChange={(e) => setSemester(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tt-sec">Section</Label>
                <Input id="tt-sec" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. A" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void createEntry()} disabled={saving}>
              {saving ? "Adding…" : "Add class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
