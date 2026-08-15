"use client";

import { CalendarClock, ClipboardList, Megaphone, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: CalendarClock, label: "When is my next exam?", color: "text-violet-600 dark:text-violet-400" },
  { icon: Users, label: "Am I at risk of being debarred?", color: "text-emerald-600 dark:text-emerald-400" },
  { icon: ClipboardList, label: "What assignments are due this week?", color: "text-sky-600 dark:text-sky-400" },
  { icon: Megaphone, label: "Any important notices?", color: "text-amber-600 dark:text-amber-400" },
  { icon: Sparkles, label: "Make me a study plan for DBMS", color: "text-primary" },
];

export function SuggestedPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {SUGGESTIONS.map((suggestion) => {
        const Icon = suggestion.icon;
        return (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => onSelect(suggestion.label)}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Icon className={cn("h-3.5 w-3.5", suggestion.color)} />
            {suggestion.label}
          </button>
        );
      })}
    </div>
  );
}