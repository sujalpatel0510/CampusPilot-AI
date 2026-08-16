"use client";

import { Download, File, FileSpreadsheet, FileText, Presentation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { MaterialFileType, StudyMaterial } from "@/types";
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
