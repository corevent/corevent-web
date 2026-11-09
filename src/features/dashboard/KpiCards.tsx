import type { ReactNode } from 'react'
import type { DashboardEvent } from '../../app/eventsContext'
import { percentOf } from '../../app/eventStats'
import { formatCurrency, formatInteger } from '../../utils/format'

function Kpi({ label, children, loading }: { label: string; children: ReactNode; loading?: boolean }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-zinc-200">
      <div className="text-[11px] font-semibold text-zinc-500">{label}</div>
      {loading ? (
        <div className="h-7 mt-1 w-20 rounded bg-zinc-100 animate-pulse" />
      ) : (
        <div className="text-lg sm:text-2xl font-bold text-zinc-950 font-mono mt-1 truncate">{children}</div>
      )}
    </div>
  )
}

export function KpiCards({ events, loading }: { events: DashboardEvent[]; loading: boolean }) {
  const statsLoading = loading || events.some((event) => event.stats === undefined)
  const totals = events.reduce(
    (acc, event) => ({
      sold: acc.sold + (event.stats?.sold ?? 0),
      capacity: acc.capacity + (event.stats?.capacity ?? 0),
      revenue: acc.revenue + (event.stats?.revenue ?? 0),
    }),
    { sold: 0, capacity: 0, revenue: 0 },
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Kpi label="Eventos Cadastrados" loading={loading}>
        {events.length}
      </Kpi>
      <Kpi label="Ingressos Vendidos" loading={statsLoading}>
        {formatInteger(totals.sold)}{' '}
        <span className="text-xs text-zinc-400 font-normal font-sans">/ {formatInteger(totals.capacity)}</span>
      </Kpi>
      <Kpi label="Receita Bruta Total" loading={statsLoading}>
        {formatCurrency(totals.revenue)}
      </Kpi>
      <Kpi label="Taxa de Ocupação" loading={statsLoading}>
        {percentOf(totals.sold, totals.capacity)}%
      </Kpi>
    </div>
  )
}
