"use client";

import { useState } from "react";
import { CloudUpload, Download, File, FileSpreadsheet, FileText, Presentation } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MaterialCategory, MaterialFileType, StudyMaterial } from "@/types";
import { SUBJECTS } from "@/data/mock-data";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const TYPE_META: Record<MaterialFileType, { icon: React.ElementType; className: string }> = {
  PDF: { icon: FileText, className: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" },
  PPTX: { icon: Presentation, className: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400" },
  DOCX: { icon: FileText, className: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400" },
  XLSX: { icon: FileSpreadsheet, className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
  ZIP: { icon: File, className: "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400" },
};

export function MaterialTypeIcon({ type, className }: { type: MaterialFileType; className?: string }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.className, className)}>
      <Icon className="h-4.5 w-4.5" />
    </span>
  );
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: (material: StudyMaterial) => void;
}

export function UploadMaterialDialog({ open, onOpenChange, onUploaded }: UploadDialogProps) {
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("Notes");
  const [fileType, setFileType] = useState<MaterialFileType>("PDF");
  const [size, setSize] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (name.trim().length < 3) {
      toast.error("Enter a file name (min 3 characters).");
      return;
    }
    if (!subjectId) {
      toast.error("Select a subject.");
      return;
    }
    setSubmitting(true);
    try {
      const material = await api.uploadStudyMaterial({
        name: name.trim(),
        subjectId,
        category,
        fileType,
        size: size || "0.5 MB",
      });
      onUploaded(material);
      toast.success(`"${material.name}" added to your library.`);
      setName("");
      setSubjectId("");
      setSize("");
      setFileName("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudUpload className="h-4.5 w-4.5 text-primary" />
            Upload Study Material
          </DialogTitle>
          <DialogDescription>
            Add notes, slides or papers to your subject library.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mat-file">File</Label>
            <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed p-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/40">
              <CloudUpload className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">
                {fileName || "Choose a file or drag it here"}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFileName(file.name);
                    if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
                  }
                }}
              />
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mat-name">Display name</Label>
            <Input
              id="mat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DSA Unit 4 Notes"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mat-subject">Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger id="mat-subject">
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
              <Label htmlFor="mat-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MaterialCategory)}>
                <SelectTrigger id="mat-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["Notes", "PDFs", "Previous Year Papers", "Presentations", "Assignments"] as MaterialCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mat-type">File type</Label>
              <Select value={fileType} onValueChange={(v) => setFileType(v as MaterialFileType)}>
                <SelectTrigger id="mat-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["PDF", "PPTX", "DOCX", "XLSX", "ZIP"] as MaterialFileType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-size">Size</Label>
              <Input
                id="mat-size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 2.4 MB"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            <CloudUpload className="h-4 w-4" />
            {submitting ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DownloadButton({ material }: { material: StudyMaterial }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Download ${material.name}`}
      className="text-muted-foreground hover:text-primary"
      onClick={() => toast.success(`"${material.name}" will download in the full build.`)}
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}