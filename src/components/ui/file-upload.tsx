"use client";

import * as React from "react";
import { CheckCircle2, File, FileImage, FileText, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "")) {
    return <FileImage className="h-5 w-5 text-blue-500" />;
  }
  if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext || "")) {
    return <FileText className="h-5 w-5 text-rose-500" />;
  }
  return <File className="h-5 w-5 text-primary" />;
}

export function FileUpload({
  value,
  onChange,
  accept,
  maxSizeMB = 10,
  helperText,
  className,
  id,
  disabled = false,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleFile = (file: File | null) => {
    setErrorMsg(null);
    if (!file) {
      onChange(null);
      return;
    }

    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      setErrorMsg(`File exceeds maximum size of ${maxSizeMB}MB (${formatFileSize(file.size)}).`);
      return;
    }

    onChange(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const droppedFile = e.dataTransfer.files?.[0] ?? null;
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {!value ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            "group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-input bg-card p-5 text-center transition-all cursor-pointer shadow-xs",
            "hover:border-primary/60 hover:bg-primary/[0.02]",
            isDragging && "border-primary bg-primary/[0.05] ring-2 ring-primary/20",
            disabled && "opacity-60 cursor-not-allowed hover:border-input hover:bg-card"
          )}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary mb-3 transition-transform group-hover:scale-105">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">
            <span className="text-primary font-semibold hover:underline">Choose file</span> or drag & drop here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {helperText ||
              (accept
                ? `${accept.replace(/\./g, "").toUpperCase()} up to ${maxSizeMB}MB`
                : `Any document or image up to ${maxSizeMB}MB`)}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card border shadow-xs">
              {getFileIcon(value.name)}
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-semibold text-foreground truncate max-w-[260px] sm:max-w-xs">
                {value.name}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  {formatFileSize(value.size)}
                </span>
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 text-[9px] gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                >
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Ready
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="h-8 text-xs px-2.5"
            >
              Change
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => handleFile(null)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {errorMsg && (
        <p className="text-xs font-medium text-destructive mt-1">{errorMsg}</p>
      )}
    </div>
  );
}
