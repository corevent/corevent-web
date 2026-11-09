import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title?: string
  description: ReactNode
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="p-8 text-center bg-white rounded-xl border border-zinc-200">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center mx-auto mb-3">{icon}</div>
      )}
      {title && <h3 className="text-sm font-bold text-zinc-950 mb-1">{title}</h3>}
      <div className="text-xs text-zinc-500 mb-3">{description}</div>
      {action}
    </div>
  )
}
