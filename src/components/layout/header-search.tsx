"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ClipboardList, FileText, GraduationCap, Search, Users } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface HeaderSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ResultGroup =
  | { type: "assignment"; title: string; subtitle: string; href: string; icon: React.ElementType }
  | { type: "exam"; title: string; subtitle: string; href: string; icon: React.ElementType }
  | { type: "notice"; title: string; subtitle: string; href: string; icon: React.ElementType }
  | { type: "subject"; title: string; subtitle: string; href: string; icon: React.ElementType };

export function HeaderSearch({ open, onOpenChange }: HeaderSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultGroup[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) onOpenChange(false);
    }
    if (open) window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open, onOpenChange]);

  useEffect(() => {
    let cancelled = false;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const q = query.toLowerCase();
      try {
        const [assignments, exams, notices, subjects] = await Promise.all([
          api.getAssignments(),
          api.getExams(),
          api.getNotices(),
          api.getSubjects(),
        ]);
        if (cancelled) return;
        const groups: ResultGroup[] = [
          ...assignments
            .filter((a) => a.title.toLowerCase().includes(q) || a.subjectName?.toLowerCase().includes(q) || a.subjectCode?.toLowerCase().includes(q))
            .slice(0, 3)
            .map((a) => ({
              type: "assignment" as const,
              title: a.title,
              subtitle: `Assignment · ${a.subjectName ?? ""} · due ${formatDate(a.dueDate)}`,
              href: "/assignments",
              icon: ClipboardList,
            })),
          ...exams
            .filter((e) => e.title.toLowerCase().includes(q) || e.subjectName?.toLowerCase().includes(q) || e.subjectCode?.toLowerCase().includes(q))
            .slice(0, 3)
            .map((e) => ({
              type: "exam" as const,
              title: e.title,
              subtitle: `Exam · ${e.subjectName ?? ""} · ${formatDate(e.date)}`,
              href: "/exams",
              icon: CalendarClock,
            })),
          ...notices
            .filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
            .slice(0, 3)
            .map((n) => ({
              type: "notice" as const,
              title: n.title,
              subtitle: `Notice · ${formatDate(n.date)}`,
              href: "/notices",
              icon: FileText,
            })),
          ...subjects
            .filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
            .slice(0, 3)
            .map((s) => ({
              type: "subject" as const,
              title: s.name,
              subtitle: `${s.code} · ${s.faculty || "Subject"}`,
              href: "/timetable",
              icon: GraduationCap,
            })),
        ];
        setResults(groups);
      } catch {
        // ignore search errors
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  if (!open) return null;

  return (
    <div
      ref={boxRef}
      className="fixed inset-x-4 top-3 z-50 mx-auto max-w-xl rounded-xl border bg-popover p-2 shadow-2xl sm:inset-x-auto sm:right-6 sm:top-3 sm:mx-0"
    >
      <div className="flex items-center gap-2 border-b px-2 pb-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assignments, exams, notices, subjects…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-md border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
        >
          ESC
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto pt-1 scrollbar-thin">
        {query.trim() && results.length === 0 ? (
          <p className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            No results for &quot;{query}&quot;
          </p>
        ) : null}
        {!query.trim() ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            Search across assignments, exams, notices and subjects.
          </p>
        ) : null}
        {results.map((result, index) => {
          const Icon = result.icon;
          return (
            <Link
              key={`${result.type}-${index}`}
              href={result.href}
              onClick={() => onOpenChange(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted"
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{result.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}