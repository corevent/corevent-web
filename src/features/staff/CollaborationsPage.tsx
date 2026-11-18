import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronDown, Download, Handshake, MailOpen, RefreshCw, ScanLine, X } from 'lucide-react'
import { getErrorMessage } from '../../api/errors'
import { acceptInvitation, listAllMyInvitations, listAllMyStaffEvents, rejectInvitation, type StaffEventStatus } from '../../api/staff'
import { listAllParticipants } from '../../api/tickets'
import type { ReceivedInvitation, StaffEventListItem } from '../../api/types'
import { AppDownloadModal } from '../../components/layout/AppDownloadModal'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '../../utils/categories'
import { downloadCsv, slugify } from '../../utils/csv'
import { formatDateTime, formatLongDate, formatTime } from '../../utils/format'
import { EventImage } from '../events/EventImage'
import { describeLocation } from '../events/eventLocation'
import {
  ACCESS_LEVEL_BADGE_CLASSES,
  ACCESS_LEVEL_DESCRIPTIONS,
  ACCESS_LEVEL_LABELS,
  INVITATION_STATUS_BADGE_CLASSES,
  INVITATION_STATUS_LABELS,
  notifyInvitationsChanged,
} from './staffLabels'

// GET /events/my/staff accepts a single (required) status per request, and only these three.
const STAFF_EVENT_STATUSES: StaffEventStatus[] = ['going', 'opened', 'finished']
const STATUS_ORDER: Record<string, number> = { going: 0, opened: 1, finished: 2 }

function sortStaffEvents(events: StaffEventListItem[]): StaffEventListItem[] {
  return [...events].sort((a, b) => {
    const byStatus = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
    if (byStatus !== 0) return byStatus
    const byDate = new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    return a.status === 'finished' ? -byDate : byDate
  })
}

const organizerOf = (invitation: ReceivedInvitation) => invitation.event.organizer ?? invitation.organizer ?? null

type Loadable<T> = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; data: T }

/** Invited user / collaborator view: answer invitations and access the events where they are on the team. */
export function CollaborationsPage() {
  const [invitations, setInvitations] = useState<Loadable<ReceivedInvitation[]>>({ status: 'loading' })
  const [events, setEvents] = useState<Loadable<StaffEventListItem[]>>({ status: 'loading' })
  const [feedback, setFeedback] = useState('')
  const [actionError, setActionError] = useState('')
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [toReject, setToReject] = useState<ReceivedInvitation | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showCheckinApp, setShowCheckinApp] = useState(false)

  const loadInvitations = useCallback(async () => {
    try {
      setInvitations({ status: 'ready', data: await listAllMyInvitations() })
    } catch (err) {
      setInvitations({ status: 'error', error: getErrorMessage(err) })
    }
  }, [])

  const loadEvents = useCallback(async () => {
    try {
      const pages = await Promise.all(STAFF_EVENT_STATUSES.map((status) => listAllMyStaffEvents(status)))
      setEvents({ status: 'ready', data: sortStaffEvents(pages.flat()) })
    } catch (err) {
      setEvents({ status: 'error', error: getErrorMessage(err) })
    }
  }, [])

  useEffect(() => {
    void loadInvitations()
    void loadEvents()
  }, [loadInvitations, loadEvents])

  const afterAnswer = async (message: string) => {
    setFeedback(message)
    notifyInvitationsChanged()
    await Promise.all([loadInvitations(), loadEvents()])
  }

  const handleAccept = async (invitation: ReceivedInvitation) => {
    setAcceptingId(invitation.id)
    setActionError('')
    try {
      await acceptInvitation(invitation.id)
      await afterAnswer(`Você agora faz parte da equipe de "${invitation.event.title}".`)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setAcceptingId(null)
    }
  }

  const received = invitations.status === 'ready' ? invitations.data : []
  const pendingInvites = received.filter((invitation) => invitation.invitationStatus === 'pending')
  const answeredInvites = received.filter((invitation) => invitation.invitationStatus !== 'pending')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="pb-4 border-b border-zinc-200">
        <h1 className="text-2xl font-bold text-zinc-950 tracking-tight">Colaborações</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Convites para trabalhar na equipe de eventos de outros organizadores e os eventos em que você colabora.
        </p>
      </div>

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
      {actionError && (
        <Alert
          action={
            <button onClick={() => setActionError('')} className="font-semibold" aria-label="Fechar aviso">
              <X className="w-3.5 h-3.5" />
            </button>
          }
        >
          {actionError}
        </Alert>
      )}

      <section className="space-y-3" aria-labelledby="invites-title">
        <h2 id="invites-title" className="text-sm font-bold text-zinc-950 flex items-center gap-2">
          <MailOpen className="w-4 h-4 text-brand" />
          Convites recebidos
          {pendingInvites.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-xs font-bold inline-flex items-center justify-center">
              {pendingInvites.length}
            </span>
          )}
        </h2>

        {invitations.status === 'error' ? (
          <Alert
            action={
              <button onClick={() => void loadInvitations()} className="flex items-center gap-1 font-semibold whitespace-nowrap">
                <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
              </button>
            }
          >
            Não foi possível carregar seus convites. {invitations.error}
          </Alert>
        ) : invitations.status === 'loading' ? (
          <div className="bg-white p-6 rounded-xl border border-zinc-200 flex justify-center">
            <Spinner />
          </div>
        ) : pendingInvites.length === 0 ? (
          <div className="p-5 text-center rounded-xl border border-dashed border-zinc-300 bg-white text-xs text-zinc-500">
            Nenhum convite aguardando resposta.
          </div>
        ) : (
          <ul className="space-y-3">
            {pendingInvites.map((invitation) => {
              const organizer = organizerOf(invitation)
              return (
                <li
                  key={invitation.id}
                  className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ACCESS_LEVEL_BADGE_CLASSES[invitation.originalAccessLevel]}`}
                      >
                        {ACCESS_LEVEL_LABELS[invitation.originalAccessLevel]}
                      </span>
                      <span className="text-xs text-zinc-400">·</span>
                      <span className="text-xs text-zinc-500">Recebido em {formatDateTime(invitation.createdAt)}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-950 truncate">{invitation.event.title}</h3>
                    {organizer && (
                      <p className="text-xs text-zinc-500 truncate">
                        Convite de <strong className="text-zinc-700">{organizer.name}</strong> ({organizer.email})
                      </p>
                    )}
                    <p className="text-[11px] text-zinc-400">{ACCESS_LEVEL_DESCRIPTIONS[invitation.originalAccessLevel]}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setToReject(invitation)}
                      disabled={acceptingId !== null}
                      icon={<X className="w-3.5 h-3.5" />}
                    >
                      Recusar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void handleAccept(invitation)}
                      loading={acceptingId === invitation.id}
                      disabled={acceptingId !== null}
                      icon={<Check className="w-3.5 h-3.5" />}
                    >
                      Aceitar
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {answeredInvites.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowHistory((open) => !open)}
              aria-expanded={showHistory}
              className="flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-zinc-950"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              Convites respondidos ou cancelados ({answeredInvites.length})
            </button>
            {showHistory && (
              <ul className="space-y-2">
                {answeredInvites.map((invitation) => {
                  const organizer = organizerOf(invitation)
                  return (
                    <li
                      key={invitation.id}
                      className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-950 truncate">{invitation.event.title}</div>
                        <div className="text-zinc-500 truncate">
                          {organizer ? `${organizer.name} · ` : ''}
                          {ACCESS_LEVEL_LABELS[invitation.originalAccessLevel]} · {formatDateTime(invitation.createdAt)}
                        </div>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${INVITATION_STATUS_BADGE_CLASSES[invitation.invitationStatus]}`}
                      >
                        {INVITATION_STATUS_LABELS[invitation.invitationStatus]}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="staff-events-title">
        <h2 id="staff-events-title" className="text-sm font-bold text-zinc-950 flex items-center gap-2">
          <Handshake className="w-4 h-4 text-brand" />
          Eventos em que colaboro
        </h2>

        {events.status === 'error' ? (
          <Alert
            action={
              <button onClick={() => void loadEvents()} className="flex items-center gap-1 font-semibold whitespace-nowrap">
                <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
              </button>
            }
          >
            Não foi possível carregar os eventos em que você colabora. {events.error}
          </Alert>
        ) : events.status === 'loading' ? (
          <div className="space-y-3" aria-label="Carregando eventos">
            {[0, 1].map((index) => (
              <div key={index} className="bg-white p-5 rounded-xl border border-zinc-200 flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg bg-zinc-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-zinc-100 animate-pulse" />
                  <div className="h-4 w-64 max-w-full rounded bg-zinc-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : events.data.length === 0 ? (
          <EmptyState
            icon={<Handshake className="w-5 h-5" />}
            title="Você ainda não colabora em nenhum evento"
            description="Quando um organizador convidar você para a equipe de um evento, o convite aparece acima. Depois de aceitar, o evento aparece aqui."
          />
        ) : (
          <div className="space-y-3">
            {events.data.map((event) => (
              <StaffEventCard key={event.id} event={event} onCheckIn={() => setShowCheckinApp(true)} />
            ))}
          </div>
        )}
      </section>

      {showCheckinApp && <AppDownloadModal app="organizer" onClose={() => setShowCheckinApp(false)} />}

      {toReject && (
        <ConfirmDialog
          title="Recusar convite?"
          description={
            <>
              <p>
                Você não fará parte da equipe de <strong>{toReject.event.title}</strong>.
              </p>
              <p>Depois de recusar, só o organizador pode decidir sobre um novo acesso.</p>
            </>
          }
          confirmLabel="Recusar convite"
          tone="danger"
          onConfirm={async () => {
            await rejectInvitation(toReject.id)
            await afterAnswer(`Convite para "${toReject.event.title}" recusado.`)
          }}
          onClose={() => setToReject(null)}
        />
      )}
    </div>
  )
}

function StaffEventCard({ event, onCheckIn }: { event: StaffEventListItem; onCheckIn: () => void }) {
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ tone: 'warning' | 'error'; text: string } | null>(null)
  const canCheckIn = event.accessLevel === 'checkin' && (event.status === 'opened' || event.status === 'going')

  const handleExport = async () => {
    setExporting(true)
    setMessage(null)
    try {
      const participants = await listAllParticipants(event.id)
      if (participants.length === 0) {
        setMessage({ tone: 'warning', text: 'Ainda não há participantes com ingressos pagos para exportar.' })
        return
      }
      downloadCsv(
        `participantes-${slugify(event.title)}.csv`,
        ['Nome', 'E-mail', 'Ingressos'],
        participants.map((p) => [p.name, p.email, p.ticketsCount]),
      )
    } catch (err) {
      setMessage({ tone: 'error', text: getErrorMessage(err) })
    } finally {
      setExporting(false)
    }
  }

  return (
    <article className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all space-y-3">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
          <EventImage src={event.bannerUrl} alt={event.title} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg shrink-0" />
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_BADGE_CLASSES[event.status]}`}>
                {STATUS_LABELS[event.status]}
              </span>
              {event.accessLevel && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ACCESS_LEVEL_BADGE_CLASSES[event.accessLevel]}`}>
                  {ACCESS_LEVEL_LABELS[event.accessLevel]}
                </span>
              )}
              <span className="text-xs text-zinc-400">·</span>
              <span className="text-xs text-zinc-500">
                {formatLongDate(event.startDate)} · {formatTime(event.startDate)}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-950 truncate">{event.title}</h3>
            <div className="text-xs text-zinc-500 truncate">{describeLocation(event)}</div>
            <div className="text-[11px] text-zinc-400 truncate">Organizado por {event.organizer.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
          {event.accessLevel === 'checkin' && (
            <button
              onClick={onCheckIn}
              disabled={!canCheckIn}
              title={canCheckIn ? 'O check-in é feito pelo app para colaboradores' : 'Disponível para eventos publicados ou em andamento'}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ScanLine className="w-3.5 h-3.5 text-brand" />
              <span>Check-in (app)</span>
            </button>
          )}
          <button
            onClick={() => void handleExport()}
            disabled={exporting}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
          >
            {exporting ? <Spinner className="w-3.5 h-3.5" light /> : <Download className="w-3.5 h-3.5" />}
            <span>Exportar participantes</span>
          </button>
        </div>
      </div>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
    </article>
  )
}
