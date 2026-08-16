"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { DownloadButton, MaterialTypeIcon } from "@/components/materials/material-icon";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { MaterialCategory, StudyMaterial } from "@/types";
import { formatDate } from "@/lib/utils";

const CATEGORIES: MaterialCategory[] = ["Notes", "PDFs", "Previous Year Papers", "Presentations", "Assignments"];

export default function StudyMaterialsPage() {
  const { data, loading, error, refetch } = useApi(() => api.getStudyMaterials(), [], { key: "materials" });
  const subjects = useApi(() => api.getSubjects(), [], { key: "subjects" });
  const [tab, setTab] = useState<"all" | MaterialCategory>("all");
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = (data ?? [])
    .filter((m) => {
      if (tab !== "all" && m.category !== tab) return false;
      if (subjectFilter !== "all" && m.subjectId !== subjectFilter) return false;
      if (typeFilter !== "all" && m.fileType !== typeFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          (m.subjectName ?? "").toLowerCase().includes(q) ||
          (m.subjectCode ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));

  if (error) {
    return (
      <div>
        <PageHeader title="Study Materials" />
        <div className="mt-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Materials"
        description="Notes, papers and slides from your courses"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | MaterialCategory)}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c}>
              {c}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchBar value={query} onChange={setQuery} placeholder="Search materials…" className="sm:max-w-72" />
            <FilterDropdown
              label="Subject"
              value={subjectFilter}
              onChange={setSubjectFilter}
              options={[
                { value: "all", label: "All subjects" },
                ...(subjects.data ?? []).map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
            <FilterDropdown
              label="File type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={["all", "PDF", "PPTX", "DOCX", "XLSX", "ZIP"].map((t) => ({
                value: t,
                label: t === "all" ? "All types" : t,
              }))}
            />
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No materials found"
              description={query || subjectFilter !== "all" || typeFilter !== "all" ? "Try adjusting your filters." : "Study materials shared by your faculty will appear here."}
              icon={FileText}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((material) => {
                return (
                  <Card key={material.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <MaterialTypeIcon type={material.fileType} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold" title={material.name}>
                            {material.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {material.subjectName || material.subjectCode || "General"} · {material.size}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[10px]">
                              {material.category}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDate(material.uploadDate)}
                            </span>
                          </div>
                        </div>
                        <DownloadButton material={material} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}