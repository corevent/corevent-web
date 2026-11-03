interface SpinnerProps {
  className?: string
  /** Light variant for use on top of the brand color. */
  light?: boolean
}

export function Spinner({ className = 'w-5 h-5', light = false }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={`inline-block rounded-full border-2 animate-spin ${
        light ? 'border-white/30 border-t-white' : 'border-zinc-200 border-t-brand'
      } ${className}`}
    />
  )
}
