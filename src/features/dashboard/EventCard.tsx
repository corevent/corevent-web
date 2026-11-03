import { Ban, Play, ScanLine, Trash2 } from 'lucide-react'
import type { DashboardEvent } from '../../app/eventsContext'
import { percentOf } from '../../app/eventStats'
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '../../utils/categories'
import { formatCurrency, formatInteger, formatLongDate, formatTime } from '../../utils/format'
import { EventImage } from '../events/EventImage'
import { describeLocation } from '../events/eventLocation'

interface EventCardProps {
  event: DashboardEvent
  /** Check-in happens in the organizer mobile app; this opens its download instructions. */
  onCheckIn: () => void
  onManageLots: () => void
  onPublish: () => void
  onCancel: () => void
  onDelete: () => void
}

const iconButton =
  'p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

export function EventCard({ event, onCheckIn, onManageLots, onPublish, onCancel, onDelete }: EventCardProps) {
  const { stats } = event
  const percent = stats ? percentOf(stats.sold, stats.capacity) : 0
  const canCheckIn = event.status === 'opened' || event.status === 'going'

  return (
    <article className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
        <EventImage src={event.bannerUrl} alt={event.title} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg shrink-0" />

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_BADGE_CLASSES[event.status]}`}>
              {STATUS_LABELS[event.status]}
            </span>
            <span className="text-xs text-zinc-400">·</span>
            <span className="text-xs text-zinc-500">
              {formatLongDate(event.startDate)} · {formatTime(event.startDate)}
            </span>
            {event.isAdultOnly && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-white">+18</span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-950 truncate">{event.title}</h3>
          <div className="text-xs text-zinc-500 truncate">{describeLocation(event)}</div>
        </div>
      </div>

      <div className="w-full lg:w-56 space-y-1 text-xs">
        {stats === undefined ? (
          <div className="space-y-2" aria-label="Carregando vendas">
            <div className="h-3 rounded bg-zinc-100 animate-pulse" />
            <div className="h-1.5 rounded bg-zinc-100 animate-pulse" />
            <div className="h-3 w-2/3 ml-auto rounded bg-zinc-100 animate-pulse" />
          </div>
        ) : stats === null ? (
          <p className="text-[11px] text-zinc-400">Não foi possível carregar os lotes deste evento.</p>
        ) : (
          <>
            <div className="flex justify-between text-zinc-600">
              <span>Vendas</span>
              <span className="font-mono font-bold text-zinc-900">
                {formatInteger(stats.sold)} / {formatInteger(stats.capacity)} ({percent}%)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full bg-brand rounded-full" style={{ width: `${percent}%` }} />
            </div>
            <div className="text-[11px] text-zinc-400 flex justify-between">
              <span>Receita</span>
              <span className="font-mono font-bold text-zinc-700">{formatCurrency(stats.revenue)}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
        <button
          onClick={onCheckIn}
          disabled={!canCheckIn}
          title={canCheckIn ? 'O check-in é feito pelo app para colaboradores' : 'Disponível para eventos publicados ou em andamento'}
          className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ScanLine className="w-3.5 h-3.5 text-brand" />
          <span>Check-in (app)</span>
        </button>

        <button
          onClick={onManageLots}
          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
        >
          Gerenciar Lotes
        </button>

        {event.status === 'draft' && (
          <>
            <button onClick={onPublish} className={iconButton} title="Publicar evento" aria-label="Publicar evento">
              <Play className="w-3.5 h-3.5 text-emerald-600" />
            </button>
            <button onClick={onDelete} className={iconButton} title="Excluir rascunho" aria-label="Excluir rascunho">
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            </button>
          </>
        )}
        {(event.status === 'opened' || event.status === 'going') && (
          <button onClick={onCancel} className={iconButton} title="Cancelar evento" aria-label="Cancelar evento">
            <Ban className="w-3.5 h-3.5 text-rose-500" />
          </button>
        )}
      </div>
    </article>
  )
}
