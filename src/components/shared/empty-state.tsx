import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ElementType
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center", className)}>
      {Icon ? (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </span>
      ) : null}
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}