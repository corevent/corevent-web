import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'

type Tone = 'error' | 'success' | 'info' | 'warning'

const TONES: Record<Tone, { box: string; icon: ReactNode }> = {
  error: { box: 'bg-rose-50 border-rose-200 text-rose-700', icon: <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> },
  success: { box: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> },
  info: { box: 'bg-zinc-50 border-zinc-200 text-zinc-700', icon: <Info className="w-4 h-4 shrink-0 text-zinc-500" /> },
  warning: { box: 'bg-amber-50 border-amber-200 text-amber-800', icon: <TriangleAlert className="w-4 h-4 shrink-0 text-amber-600" /> },
}

interface AlertProps {
  tone?: Tone
  children: ReactNode
  action?: ReactNode
  className?: string
}

export function Alert({ tone = 'error', children, action, className = '' }: AlertProps) {
  const { box, icon } = TONES[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${box} ${className}`}
    >
      <span className="mt-px">{icon}</span>
      <div className="flex-1 min-w-0">{children}</div>
      {action}
    </div>
  )
}
