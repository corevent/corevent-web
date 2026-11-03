import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-brand disabled:bg-zinc-50 disabled:text-zinc-500 aria-[invalid=true]:border-rose-400'

/** Denser variant used inside modals and cards (text-xs, rounded-lg), as in the mockup. */
export const compactInputClass =
  'w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-brand disabled:bg-zinc-50 disabled:text-zinc-500 aria-[invalid=true]:border-rose-400'

interface FieldProps {
  label: ReactNode
  htmlFor?: string
  hint?: ReactNode
  error?: string | null
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, hint, error, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-zinc-700 mb-1">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-zinc-400">{hint}</p>
      ) : null}
    </div>
  )
}

export function TextInput({ compact = false, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { compact?: boolean }) {
  return <input className={`${compact ? compactInputClass : inputClass} ${className}`} {...props} />
}

export function SelectInput({ compact = false, className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement> & { compact?: boolean }) {
  return <select className={`${compact ? compactInputClass : inputClass} ${className}`} {...props} />
}

export function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${compactInputClass} ${className}`} {...props} />
}
