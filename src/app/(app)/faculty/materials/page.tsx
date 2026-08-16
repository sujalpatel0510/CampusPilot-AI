"use client";

import { useState } from "react";
import { BookOpen, FileText, Plus, Upload } from "lucide-react";
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
import { formatDate, subjectColor } from "@/lib/utils";
import type { FacultyMaterial } from "@/types";

function fileTypeBadge(fileType: string) {
  const t = (fileType ?? "").toUpperCase();
  const variant = ["PDF", "PPTX", "DOCX", "XLSX", "ZIP"].includes(t) ? "secondary" : "outline";
  return <Badge variant={variant as "secondary"}>{t || "FILE"}</Badge>;
}

function fileUrl(url: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function formatSize(bytes: number): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function FacultyMaterialsPage() {
  const materials = useApi(() => api.getFacultyMaterials(), [], { key: "faculty-materials" });
  const subjects = useApi(() => api.getFacultySubjects(), [], { key: "faculty-subjects" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  function openDialog() {
    const first = subjects.data?.[0];
    setSubjectId(first ? String(first.id) : "");
    setTitle("");
    setDescription("");
    setFile(null);
    setDialogOpen(true);
  }

  async function uploadMaterial() {
    const subjectNum = Number(subjectId);
    if (!subjectId) {
      toast.error("Choose a subject.");
      return;
    }
    if (!file) {
      toast.error("Choose a file to upload.");
      return;
    }
    if (title.trim().length < 2) {
      toast.error("Title must be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      await api.uploadMaterial(file, subjectNum, title.trim(), description.trim() || undefined);
      toast.success("Study material uploaded.");
      setDialogOpen(false);
      materials.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload the material.");
    } finally {
      setSaving(false);
    }
  }

  const sorted = [...(materials.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Materials"
        description="Share notes and resources with your students"
        actions={
          <Button onClick={openDialog}>
            <Upload className="h-4 w-4" />
            Upload material
          </Button>
        }
      />

      {materials.error || subjects.error ? (
        <ErrorState message={materials.error ?? subjects.error ?? ""} onRetry={() => { materials.refetch(); subjects.refetch(); }} />
      ) : materials.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No materials uploaded"
          description="Upload notes, slides or papers for your students."
          icon={BookOpen}
          action={
            <Button onClick={openDialog}>
              <Upload className="h-4 w-4" />
              Upload material
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((material) => (
            <Card key={material.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                    style={{ backgroundColor: subjectColor(material.subject_code) }}
                  >
                    {material.subject_code.slice(-2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" title={material.title}>
                      {material.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {material.subject_name} ({material.subject_code})
                    </p>
                    {material.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{material.description}</p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-1.5">
                      {fileTypeBadge(material.file_type)}
                      {formatSize(material.file_size) ? (
                        <span className="text-[11px] text-muted-foreground">{formatSize(material.file_size)}</span>
                      ) : null}
                      <span className="text-[11px] text-muted-foreground">{formatDate(material.created_at)}</span>
                    </div>
                  </div>
                  {material.file_url ? (
                    <Button asChild variant="ghost" size="icon-sm">
                      <a href={fileUrl(material.file_url)} target="_blank" rel="noreferrer" aria-label="Open file">
                        <FileText className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload study material</DialogTitle>
            <DialogDescription>Share a resource with students enrolled in the subject.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="mt-subject">Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger id="mt-subject">
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
              <Label htmlFor="mt-file">File</Label>
              <Input
                id="mt-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mt-title">Title</Label>
              <Input
                id="mt-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unit 3 – Indexing notes"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mt-desc">Description (optional)</Label>
              <Textarea
                id="mt-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short note for students"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void uploadMaterial()} disabled={saving}>
              {saving ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
