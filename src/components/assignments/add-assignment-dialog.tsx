"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { SUBJECTS } from "@/data/mock-data";

interface AddAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddAssignmentDialog({ open, onOpenChange, onAdded }: AddAssignmentDialogProps) {
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [weightage, setWeightage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (title.trim().length < 3) {
      toast.error("Assignment title must be at least 3 characters.");
      return;
    }
    if (!subjectId) {
      toast.error("Select a subject.");
      return;
    }
    if (!dueDate) {
      toast.error("Pick a due date.");
      return;
    }
    setSubmitting(true);
    try {
      await api.addAssignment({
        subjectId,
        title: title.trim(),
        description: description.trim(),
        dueDate,
        weightage: Number(weightage) || 5,
      });
      onAdded();
      toast.success("Assignment added.");
      setTitle("");
      setDescription("");
      setDueDate("");
      setWeightage("");
      setSubjectId("");
      onOpenChange(false);
    } catch {
      toast.error("Could not add the assignment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-primary" />
            New assignment
          </DialogTitle>
          <DialogDescription>Add an assignment to your courses.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="as-title">Title</Label>
            <Input id="as-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DBMS Normalisation Worksheet" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="as-subject">Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger id="as-subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="as-weight">Weightage (%)</Label>
              <Input id="as-weight" type="number" min={0} max={100} value={weightage} onChange={(e) => setWeightage(e.target.value)} placeholder="e.g. 10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="as-due">Due date</Label>
            <Input id="as-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="as-desc">Description</Label>
            <Textarea id="as-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be done?" className="min-h-20" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Adding…" : "Add assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}