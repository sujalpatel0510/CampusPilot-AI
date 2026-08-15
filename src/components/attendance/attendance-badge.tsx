import { cn } from "@/lib/utils";

export function AttendanceBadge({ percentage }: { percentage: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        percentage >= 85
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          : percentage >= 75
            ? "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400"
            : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
      )}
    >
      {percentage}%
    </span>
  );
}
