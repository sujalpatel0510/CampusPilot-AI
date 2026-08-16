"use client";

import { useState } from "react";
import { FileText, Megaphone, PencilLine, Plus, Upload } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatDate, timeAgo } from "@/lib/utils";
import type { FacultyNotice } from "@/types";

const CATEGORIES = ["Examination", "Academic", "Event", "Fee", "Placement", "General"];

const CATEGORY_COLORS: Record<string, string> = {
  Examination: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900",
  Academic: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900",
  Event: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-900",
  Fee: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  Placement: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  General: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
};

export default function FacultyNoticesPage() {
  const notices = useApi(() => api.getFacultyNotices(), [], { key: "faculty-notices" });
  const [mode, setMode] = useState<"write" | "upload">("write");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [important, setImportant] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [saving, setSaving] = useState(false);

  function openDialog() {
    setMode("write");
    setTitle("");
    setContent("");
    setCategory("General");
    setImportant(false);
    setFile(null);
    setUploadTitle("");
    setDialogOpen(true);
  }

  async function createNotice() {
    if (title.trim().length < 2) {
      toast.error("Title must be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      await api.createNotice({
        title: title.trim(),
        content,
        category,
        is_important: important,
      });
      toast.success("Notice published.");
      setDialogOpen(false);
      notices.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish the notice.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadNotice() {
    if (!file) {
      toast.error("Choose a PDF or image to upload.");
      return;
    }
    setSaving(true);
    try {
      const notice = await api.uploadNotice(file, category, uploadTitle.trim() || undefined);
      toast.success(`Notice uploaded${notice.ai_summary ? " and AI summary generated" : ""}.`);
      setDialogOpen(false);
      notices.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload the notice.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notices"
        description="Post announcements or upload documents for AI processing"
        actions={
          <Button onClick={openDialog}>
            <Plus className="h-4 w-4" />
            New notice
          </Button>
        }
      />

      {notices.error ? (
        <ErrorState message={notices.error} onRetry={notices.refetch} />
      ) : notices.loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (notices.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="No notices posted"
          description="Share an announcement or upload a document for AI summarisation."
          icon={Megaphone}
          action={
            <Button onClick={openDialog}>
              <Plus className="h-4 w-4" />
              New notice
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {(notices.data ?? []).map((notice) => (
            <Card key={notice.id} className={notice.is_important ? "border-amber-300 dark:border-amber-900" : ""}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={CATEGORY_COLORS[notice.category] ?? CATEGORY_COLORS.General}>
                    {notice.category}
                  </Badge>
                  {notice.is_important ? <Badge variant="warning">Important</Badge> : null}
                  {notice.original_file_url ? (
                    <Badge variant="secondary">
                      <FileText className="h-3 w-3" />
                      Document attached
                    </Badge>
                  ) : null}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(notice.created_at)} · {timeAgo(notice.created_at)}
                  </span>
                </div>
                <h2 className="mt-2.5 text-base font-semibold leading-snug">{notice.title}</h2>
                {notice.extracted_text ? (
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {notice.extracted_text}
                  </p>
                ) : null}
                {notice.ai_summary ? (
                  <p className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">AI summary:</span> {notice.ai_summary}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New notice</DialogTitle>
            <DialogDescription>
              Write a notice or upload a document and CampusPilot AI will summarise it.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setMode("write")}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${mode === "write" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              <PencilLine className="h-3.5 w-3.5" />
              Write
            </button>
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${mode === "upload" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload document
            </button>
          </div>

          <div className="grid gap-4 py-2">
            {mode === "write" ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="no-title">Title</Label>
                  <Input
                    id="no-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Mid-semester exam schedule released"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="no-content">Content</Label>
                  <Textarea
                    id="no-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write the notice body…"
                    rows={4}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="no-file">Document (PDF / image)</Label>
                  <Input
                    id="no-file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Text is extracted and summarised automatically. If no file is provided, use the Write tab.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="no-uptitle">Title (optional)</Label>
                  <Input
                    id="no-uptitle"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Defaults to the file name"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={important} onCheckedChange={(v) => setImportant(v === true)} />
                Mark as important
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void (mode === "write" ? createNotice() : uploadNotice())} disabled={saving}>
              {saving ? (mode === "write" ? "Publishing…" : "Uploading…") : mode === "write" ? "Publish" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
