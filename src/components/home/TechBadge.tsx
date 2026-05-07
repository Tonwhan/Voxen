import { Badge } from "@/components/ui/badge"

type TechBadgeProps = {
  label: string
}

/**
 * A small badge for displaying technology names or features.
 */
export function TechBadge({ label }: TechBadgeProps) {
  return (
    <Badge variant="outline" className="border-border bg-surface text-text-muted hover:text-text px-3 py-1 text-xs font-mono">
      {label}
    </Badge>
  )
}
