"use client";

import { useEffect, useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Notice } from "@/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AiSummaryDialogProps {
  notice: Notice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiSummaryDialog({ notice, open, onOpenChange }: AiSummaryDialogProps) {
  const [summarizing, setSummarizing] = useState(true);

  useEffect(() => {
    if (open) {
      setSummarizing(true);
      const timer = setTimeout(() => setSummarizing(false), 450);
      return () => clearTimeout(timer);
    }
  }, [open, notice?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </span>
            AI Summary
          </DialogTitle>
          <DialogDescription>
            {notice ? (
              <>
                {notice.title} · {formatDate(notice.date)}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {notice ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Original notice
              </p>
              <p className="max-h-40 overflow-y-auto text-sm leading-relaxed text-muted-foreground scrollbar-thin">
                {notice.content}
              </p>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                Summarised by AI
              </p>
              {summarizing ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{notice.aiSummary}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {notice.hasAttachment ? "Original document attached (PDF)" : "No original document attached"}
              </span>
              {notice.isImportant ? <Badge variant="warning">Important</Badge> : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function AiSummaryButton({ notice, onClick }: { notice: Notice; onClick: (notice: Notice) => void }) {
  const [hovering, setHovering] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onClick(notice)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
        hovering
          ? "border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
          : "border-primary/30 bg-primary/5 text-primary"
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      AI Summary
    </button>
  );
}