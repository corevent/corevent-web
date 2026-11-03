import { Spinner } from './Spinner'

export function PageLoader({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-xs text-zinc-500">
      <Spinner className="w-7 h-7" />
      <span>{label}</span>
    </div>
  )
}
