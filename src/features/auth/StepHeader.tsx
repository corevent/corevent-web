import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'

interface StepHeaderProps {
  onBack: () => void
  step?: number
  total?: number
  disabled?: boolean
}

export function StepHeader({ onBack, step, total, disabled = false }: StepHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
        {step && total && (
          <span className="text-xs font-bold text-zinc-700">
            Etapa {step} de {total}
          </span>
        )}
      </div>
      {step && total && (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
          {Array.from({ length: total }, (_, index) => (
            <div key={index} className={`h-1.5 rounded-full transition-colors ${index < step ? 'bg-brand' : 'bg-zinc-200'}`} />
          ))}
        </div>
      )}
    </>
  )
}

export function StepTitle({ title, subtitle }: { title: string; subtitle: ReactNode }) {
  return (
    <div>
      <h3 id="auth-title" className="text-xl font-bold text-zinc-950">
        {title}
      </h3>
      <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
    </div>
  )
}
