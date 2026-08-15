import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  tone?: "default" | "good" | "success" | "warning" | "critical"
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  tone = "default",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const toneColor =
    tone === "success" || tone === "good"
      ? "stroke-emerald-500"
      : tone === "warning"
        ? "stroke-amber-500"
        : tone === "critical"
          ? "stroke-red-500"
          : "stroke-primary"

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700", toneColor)}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold tracking-tight">{label ?? `${value}%`}</span>
        {sublabel ? <span className="text-xs text-muted-foreground">{sublabel}</span> : null}
      </div>
    </div>
  )
}