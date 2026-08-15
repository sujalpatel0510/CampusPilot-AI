"use client";

import { useRef, useState } from "react";
import { CloudUpload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  status: "uploading" | "processing";
}

export function PdfUploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file.");
      return;
    }
    const id = `up-${Date.now()}`;
    setFiles((prev) => [...prev, { id, name: file.name, status: "uploading" }]);
    try {
      const record = await api.uploadNoticeFile(file.name);
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "processing" } : f))
      );
      toast.success(`"${record.name}" uploaded — OCR is processing the document.`);
    } catch {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast.error("Upload failed. Please try again.");
    }
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          Array.from(e.dataTransfer.files).forEach(handleFile);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-muted/40"
        )}
        aria-label="Upload a PDF notice for OCR"
      >
        <span className="rounded-full bg-primary/10 p-2.5">
          <CloudUpload className="h-5 w-5 text-primary" />
        </span>
        <p className="text-sm font-medium">Drop a PDF notice here or click to browse</p>
        <p className="text-xs text-muted-foreground">
          The OCR pipeline will extract text so CampusPilot AI can summarise it.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul className="space-y-1.5">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-2 text-sm"
            >
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              {file.status === "uploading" ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  Uploading…
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  OCR processing
                </span>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6 text-muted-foreground"
                onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}