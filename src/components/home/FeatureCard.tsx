import { ReactNode } from "react"

type FeatureCardProps = {
  title: string
  description: string
  icon: ReactNode
}

/**
 * A card displaying a feature with an icon, title, and description.
 */
export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-6 transition-all hover:border-accent/50">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent-dim text-accent">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-text">{title}</h3>
      <p className="text-text-muted leading-relaxed">{description}</p>
    </div>
  )
}
