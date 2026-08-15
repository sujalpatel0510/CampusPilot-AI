"use client";

import { useState } from "react";
import { FileText, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AiSummaryDialog, AiSummaryButton } from "@/components/notices/ai-summary-dialog";
import { PdfUploadZone } from "@/components/notices/pdf-upload-zone";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { Notice, NoticeCategory } from "@/types";
import { formatDate, timeAgo } from "@/lib/utils";

const CATEGORY_COLORS: Record<NoticeCategory, string> = {
  Examination: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900",
  Academic: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900",
  Event: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-900",
  Fee: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  Placement: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  General: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
};

const CATEGORIES: NoticeCategory[] = ["Examination", "Academic", "Event", "Fee", "Placement", "General"];
const PAGE_SIZE = 5;

export default function NoticesPage() {
  const { data, loading, error, refetch } = useApi(() => api.getNotices());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [summaryNotice, setSummaryNotice] = useState<Notice | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const filtered = (data ?? [])
    .filter((n) => {
      if (category !== "all" && n.category !== category) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (error) {
    return (
      <div>
        <PageHeader title="Notices" />
        <div className="mt-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notices"
        description="Official announcements from the institute"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search notices…"
            className="sm:max-w-72"
          />
          <FilterDropdown
            label="Category"
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : pageItems.length === 0 ? (
            <EmptyState
              title={query || category !== "all" ? "No notices match your filters" : "No notices yet"}
              description={query || category !== "all" ? "Try a different search or category." : "New institute notices will appear here."}
              icon={Megaphone}
            />
          ) : (
            pageItems.map((notice) => (
              <Card key={notice.id} className={notice.isImportant ? "border-amber-300 dark:border-amber-900" : ""}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={CATEGORY_COLORS[notice.category]}>
                      {notice.category}
                    </Badge>
                    {notice.isImportant ? <Badge variant="warning">Important</Badge> : null}
                    {notice.hasAttachment ? (
                      <Badge variant="secondary">
                        <FileText className="h-3 w-3" />
                        Document attached
                      </Badge>
                    ) : null}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(notice.date)} · {timeAgo(notice.date)}
                    </span>
                  </div>

                  <h2 className="mt-2.5 text-base font-semibold leading-snug">{notice.title}</h2>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {notice.content}
                  </p>

                  <div className="mt-3.5 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Summary:</span> {notice.summary}
                    </p>
                    <AiSummaryButton notice={notice} onClick={(n) => { setSummaryNotice(n); setSummaryOpen(true); }} />
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600">
                  <FileText className="h-3.5 w-3.5 text-white" />
                </span>
                Upload a notice for AI processing
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Upload an official PDF and CampusPilot AI will extract the text and generate a
                summary (OCR pipeline — preview only in this demo).
              </p>
              <Separator className="my-4" />
              <PdfUploadZone />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold">How AI summaries work</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>The full notice text is extracted from the original document.</li>
                <li>Key dates, amounts and deadlines are identified.</li>
                <li>A concise summary is generated — no more scanning long PDFs.</li>
              </ol>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  const first = filtered[0];
                  if (first) {
                    setSummaryNotice(first);
                    setSummaryOpen(true);
                  }
                }}
              >
                Try it on the latest notice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AiSummaryDialog
        notice={summaryNotice}
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
      />
    </div>
  );
}