import { useState } from 'react'
import { Link } from 'react-router'
import { CalendarPlus, Plus, RefreshCw, Search } from 'lucide-react'
import { cancelEvent, deleteEvent, updateEvent } from '../../api/events'
import { deleteTicketType, listAllTicketTypes } from '../../api/ticketTypes'
import type { DashboardEvent } from '../../app/eventsContext'
import { useOrganizerEvents } from '../../app/useOrganizerEvents'
import { useUi } from '../../app/useUi'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { ManageLotsModal } from '../events/ManageLotsModal'
import { describeLocation } from '../events/eventLocation'
import { AppDownloadModal } from '../../components/layout/AppDownloadModal'
import { OneAccountNotice } from '../../components/layout/OneAccountNotice'
import { EventCard } from './EventCard'
import { KpiCards } from './KpiCards'

type Filter = 'all' | 'published' | 'draft' | 'closed'
type PendingAction = { type: 'publish' | 'cancel' | 'delete'; event: DashboardEvent }

const FILTERS: { value: Filter; label: string; matches: (event: DashboardEvent) => boolean }[] = [
  { value: 'all', label: 'Todos', matches: () => true },
  { value: 'published', label: 'Publicados', matches: (e) => e.status === 'opened' || e.status === 'going' },
  { value: 'draft', label: 'Rascunhos', matches: (e) => e.status === 'draft' },
  { value: 'closed', label: 'Encerrados', matches: (e) => e.status === 'finished' || e.status === 'canceled' },
]

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function DashboardPage() {
  const { isOrganizer } = useAuth()
  const { requestCreateEvent } = useUi()
  const { events, status, error, reload } = useOrganizerEvents()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [showOrganizerApp, setShowOrganizerApp] = useState(false)
  const [manageEventId, setManageEventId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [feedback, setFeedback] = useState('')

  const loading = status === 'loading' || status === 'idle'
  const activeFilter = FILTERS.find((item) => item.value === filter)!
  const query = normalize(search.trim())
  const visibleEvents = events.filter(
    (event) =>
      activeFilter.matches(event) &&
      (!query || normalize(`${event.title} ${describeLocation(event)}`).includes(query)),
  )
  const manageEvent = events.find((event) => event.id === manageEventId)

  const runAction = async (action: PendingAction) => {
    const { event, type } = action
    if (type === 'publish') await updateEvent(event.id, { status: 'opened' })
    if (type === 'cancel') await cancelEvent(event.id)
    if (type === 'delete') {
      // ticket_types.event_id has no ON DELETE CASCADE: remove the lots first.
      const lots = await listAllTicketTypes(event.id)
      for (const lot of lots) await deleteTicketType(lot.id)
      await deleteEvent(event.id)
    }
    const messages = {
      publish: `"${event.title}" foi publicado.`,
      cancel: `"${event.title}" foi cancelado.`,
      delete: `"${event.title}" foi excluído.`,
    }
    setFeedback(messages[type])
    await reload()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* The "Criar evento" action lives in the header, available on every page. */}
      <div className="pb-4 border-b border-zinc-200">
        <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Meus Eventos</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Eventos que você criou, seus lotes de ingressos e vendas.</p>
      </div>

      {isOrganizer === false && (
        <Alert
          tone="warning"
          action={
            <Link to="/conta/recebimentos" className="font-bold text-amber-900 underline whitespace-nowrap">
              Cadastrar agora
            </Link>
          }
        >
          Para criar eventos, cadastre seus <strong>dados de recebimento</strong> (PIX ou conta bancária).
        </Alert>
      )}

      {feedback && (
        <Alert
          tone="success"
          action={
            <button onClick={() => setFeedback('')} className="font-semibold">
              OK
            </button>
          }
        >
          {feedback}
        </Alert>
      )}

      <KpiCards events={events} loading={loading} />

      <div className="bg-white p-3 rounded-xl border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar evento..."
            aria-label="Buscar evento"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === item.value ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-600 hover:text-zinc-950 bg-zinc-50'
              }`}
            >
              {item.label}
              {item.value === 'all' && !loading && ` (${events.length})`}
            </button>
          ))}
        </div>
      </div>

      {status === 'error' ? (
        <Alert
          action={
            <button onClick={() => void reload()} className="flex items-center gap-1 font-semibold whitespace-nowrap">
              <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
            </button>
          }
        >
          Não foi possível carregar seus eventos. {error}
        </Alert>
      ) : loading ? (
        <div className="space-y-3" aria-label="Carregando eventos">
          {[0, 1, 2].map((index) => (
            <div key={index} className="bg-white p-5 rounded-xl border border-zinc-200 flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-zinc-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-zinc-100 animate-pulse" />
                <div className="h-4 w-64 max-w-full rounded bg-zinc-100 animate-pulse" />
                <div className="h-3 w-48 max-w-full rounded bg-zinc-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={<CalendarPlus className="w-5 h-5" />}
            title="Você ainda não criou eventos"
            description="Crie seu primeiro evento, configure os lotes de ingressos e publique quando estiver pronto. Os ingressos que você comprou como participante continuam no app Corevent."
            action={
              <Button size="sm" onClick={requestCreateEvent} icon={<Plus className="w-3.5 h-3.5" />}>
                Criar meu primeiro evento
              </Button>
            }
          />
          <OneAccountNotice />
        </div>
      ) : visibleEvents.length === 0 ? (
        <EmptyState description="Nenhum evento encontrado." />
      ) : (
        <div className="space-y-3">
          {visibleEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onCheckIn={() => setShowOrganizerApp(true)}
              onManageLots={() => setManageEventId(event.id)}
              onPublish={() => setPending({ type: 'publish', event })}
              onCancel={() => setPending({ type: 'cancel', event })}
              onDelete={() => setPending({ type: 'delete', event })}
            />
          ))}
        </div>
      )}

      {showOrganizerApp && <AppDownloadModal app="organizer" onClose={() => setShowOrganizerApp(false)} />}
      {manageEvent && (
        <ManageLotsModal
          event={manageEvent}
          onClose={() => setManageEventId(null)}
          onPublish={() => setPending({ type: 'publish', event: manageEvent })}
        />
      )}

      {pending && (
        <ConfirmDialog
          title={
            pending.type === 'publish' ? 'Publicar evento?' : pending.type === 'cancel' ? 'Cancelar evento?' : 'Excluir rascunho?'
          }
          description={
            pending.type === 'publish' ? (
              <>
                <p>
                  <strong>{pending.event.title}</strong> ficará visível para compra no app.
                </p>
                <p>Após publicar, os lotes não poderão mais ser criados, editados ou excluídos, e o evento não volta a rascunho.</p>
                {pending.event.lots?.length === 0 && (
                  <p className="text-amber-700 font-semibold">Atenção: este evento ainda não possui lotes de ingressos.</p>
                )}
              </>
            ) : pending.type === 'cancel' ? (
              <p>
                <strong>{pending.event.title}</strong> será cancelado. Esta ação não pode ser desfeita.
              </p>
            ) : (
              <p>
                <strong>{pending.event.title}</strong> e seus lotes serão removidos permanentemente.
              </p>
            )
          }
          confirmLabel={pending.type === 'publish' ? 'Publicar' : pending.type === 'cancel' ? 'Cancelar evento' : 'Excluir'}
          tone={pending.type === 'publish' ? 'primary' : 'danger'}
          onConfirm={() => runAction(pending)}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  )
}
