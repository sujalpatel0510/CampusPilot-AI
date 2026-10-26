import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  iconClassName?: string
  footer?: React.ReactNode
  className?: string
}

export function StatCard({ title, value, icon: Icon, iconClassName, footer, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/30", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
              iconClassName
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
        </div>
        {footer ? <div className="mt-3 text-xs text-muted-foreground">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}