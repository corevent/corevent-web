import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ChevronDown, Mail, RefreshCw, Send, Trash2, UserPlus, Users, X } from 'lucide-react'
import { ApiError, getErrorMessage } from '../../api/errors'
import {
  cancelInvitation,
  inviteStaff,
  listAllEventInvitations,
  listAllEventStaff,
  removeStaff,
  updateStaffAccessLevel,
} from '../../api/staff'
import type { EventInvitation, EventListItem, EventStaffMember, StaffAccessLevel } from '../../api/types'
import { Avatar } from '../../components/Avatar'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { SelectInput, TextInput } from '../../components/ui/Field'
import { Modal, ModalCloseButton } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { formatLongDate } from '../../utils/format'
import { isValidEmail } from '../../utils/validators'
import { EventImage } from '../events/EventImage'
import { describeLocation } from '../events/eventLocation'
import {
  ACCESS_LEVELS,
  ACCESS_LEVEL_BADGE_CLASSES,
  ACCESS_LEVEL_DESCRIPTIONS,
  ACCESS_LEVEL_LABELS,
  INVITATION_STATUS_BADGE_CLASSES,
  INVITATION_STATUS_LABELS,
  staffAvatarSrc,
} from './staffLabels'

interface TeamData {
  staff: EventStaffMember[]
  pending: EventInvitation[]
  /** Rejected and canceled invitations. */
  history: EventInvitation[]
}

type PendingAction =
  | { type: 'remove'; member: EventStaffMember }
  | { type: 'cancel-invite'; invitation: EventInvitation }

const labelClass = 'block text-[11px] font-semibold text-zinc-700 mb-1'

interface ManageStaffModalProps {
  event: EventListItem
  onClose: () => void
}

/** Organizer view: invite collaborators, follow invitations and manage the event team. */
export function ManageStaffModal({ event, onClose }: ManageStaffModalProps) {
  const [team, setTeam] = useState<TeamData | null>(null)
  const [loadError, setLoadError] = useState('')
  const [toast, setToast] = useState('')
  const [actionError, setActionError] = useState('')
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  const canInvite = event.status === 'opened'

  const loadTeam = useCallback(async () => {
    try {
      const [staff, pendingInvites, rejected, canceled] = await Promise.all([
        listAllEventStaff(event.id),
        listAllEventInvitations(event.id, 'pending'),
        listAllEventInvitations(event.id, 'rejected'),
        listAllEventInvitations(event.id, 'canceled'),
      ])
      setTeam({ staff, pending: pendingInvites, history: [...rejected, ...canceled] })
      setLoadError('')
    } catch (err) {
      setLoadError(getErrorMessage(err))
    }
  }, [event.id])

  useEffect(() => {
    void loadTeam()
  }, [loadTeam])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const afterChange = async (message: string) => {
    showToast(message)
    await loadTeam()
  }

  const handleAccessLevel = async (member: EventStaffMember, accessLevel: StaffAccessLevel) => {
    if (member.accessLevel === accessLevel) return
    setUpdatingId(member.id)
    setActionError('')
    try {
      await updateStaffAccessLevel(member.id, accessLevel)
      await afterChange(`Acesso de ${member.user.name} alterado para ${ACCESS_LEVEL_LABELS[accessLevel]}.`)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  const knownEmails = team
    ? [...team.staff.map((m) => m.user.email), ...team.pending.map((i) => i.user.email), ...team.history.map((i) => i.user.email)]
    : []

  return (
    <Modal
      onClose={onClose}
      maxWidth="max-w-3xl"
      confirmClose={
        inviteEmail.trim()
          ? {
              title: 'Descartar o convite?',
              message: 'O convite que você está preenchendo ainda não foi enviado e será perdido se você fechar esta tela.',
              confirmLabel: 'Descartar e fechar',
              cancelLabel: 'Continuar editando',
            }
          : null
      }
      className="overflow-hidden flex flex-col max-h-[90vh]"
      labelledBy="staff-title"
    >
      <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between gap-4">
        <EventImage src={event.bannerUrl} alt={event.title} className="w-12 h-12 rounded-lg shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 id="staff-title" className="text-base font-bold text-zinc-950 truncate">
            Equipe: {event.title}
          </h2>
          <p className="text-xs text-zinc-500 truncate">
            {formatLongDate(event.startDate)} · {describeLocation(event)}
          </p>
        </div>
        <ModalCloseButton className="text-zinc-400 hover:text-zinc-700 shrink-0" />
      </div>

      <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
        {toast && <Alert tone="success">{toast}</Alert>}
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

        {canInvite ? (
          <InviteForm
            eventId={event.id}
            email={inviteEmail}
            onEmailChange={setInviteEmail}
            knownEmails={knownEmails}
            disabled={team === null}
            onInvited={async (email) => {
              setInviteEmail('')
              await afterChange(`Convite enviado para ${email}.`)
            }}
          />
        ) : (
          <Alert tone="info">
            {event.status === 'draft'
              ? 'Publique o evento para convidar colaboradores. Os convites só podem ser enviados para eventos publicados.'
              : 'Novos convites só podem ser enviados enquanto o evento está publicado e ainda não começou. Você ainda pode ajustar o acesso ou remover colaboradores.'}
          </Alert>
        )}

        {loadError ? (
          <Alert
            action={
              <button onClick={() => void loadTeam()} className="flex items-center gap-1 font-semibold whitespace-nowrap">
                <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
              </button>
            }
          >
            Não foi possível carregar a equipe. {loadError}
          </Alert>
        ) : team === null ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <>
            <section className="space-y-2" aria-labelledby="staff-members-title">
              <h3 id="staff-members-title" className="text-xs font-bold text-zinc-900">
                Colaboradores ({team.staff.length})
              </h3>
              {team.staff.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500">
                  Nenhum colaborador ainda. Quem aceitar o convite aparece aqui.
                </div>
              ) : (
                <ul className="space-y-2">
                  {team.staff.map((member) => (
                    <li
                      key={member.id}
                      className="p-3.5 rounded-xl border border-zinc-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <PersonInfo name={member.user.name} email={member.user.email} avatar={member.user.avatarUrl} />
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label htmlFor={`access-${member.id}`} className="sr-only">
                          Nível de acesso de {member.user.name}
                        </label>
                        <SelectInput
                          id={`access-${member.id}`}
                          compact
                          value={member.accessLevel}
                          disabled={updatingId !== null}
                          onChange={(e) => void handleAccessLevel(member, e.target.value as StaffAccessLevel)}
                          className="sm:w-36"
                        >
                          {ACCESS_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {ACCESS_LEVEL_LABELS[level]}
                            </option>
                          ))}
                        </SelectInput>
                        {updatingId === member.id && <Spinner className="w-3.5 h-3.5 shrink-0" />}
                        <button
                          onClick={() => setPending({ type: 'remove', member })}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2" aria-labelledby="staff-pending-title">
              <h3 id="staff-pending-title" className="text-xs font-bold text-zinc-900">
                Convites aguardando resposta ({team.pending.length})
              </h3>
              {team.pending.length === 0 ? (
                <p className="text-xs text-zinc-500">Nenhum convite pendente.</p>
              ) : (
                <ul className="space-y-2">
                  {team.pending.map((invitation) => (
                    <li
                      key={invitation.id}
                      className="p-3.5 rounded-xl border border-zinc-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <PersonInfo name={invitation.user.name} email={invitation.user.email} avatar={invitation.user.avatarUrl} />
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${ACCESS_LEVEL_BADGE_CLASSES[invitation.originalAccessLevel]}`}
                        >
                          {ACCESS_LEVEL_LABELS[invitation.originalAccessLevel]}
                        </span>
                        <button
                          onClick={() => setPending({ type: 'cancel-invite', invitation })}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 text-rose-600 hover:bg-rose-50"
                        >
                          Cancelar convite
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {team.history.length > 0 && (
              <section className="space-y-2">
                <button
                  onClick={() => setShowHistory((open) => !open)}
                  aria-expanded={showHistory}
                  className="flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-zinc-950"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                  Convites recusados ou cancelados ({team.history.length})
                </button>
                {showHistory && (
                  <ul className="space-y-2">
                    {team.history.map((invitation) => (
                      <li
                        key={invitation.id}
                        className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3 text-xs"
                      >
                        <PersonInfo name={invitation.user.name} email={invitation.user.email} avatar={invitation.user.avatarUrl} />
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${INVITATION_STATUS_BADGE_CLASSES[invitation.invitationStatus]}`}
                        >
                          {INVITATION_STATUS_LABELS[invitation.invitationStatus]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <div className="p-3.5 border-t border-zinc-200 flex items-center justify-between gap-2 bg-zinc-50">
        <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          Os convidados respondem pelo site, em Colaborações.
        </p>
        <ModalCloseButton className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shrink-0">
          Fechar
        </ModalCloseButton>
      </div>

      {pending?.type === 'remove' && (
        <ConfirmDialog
          title="Remover colaborador?"
          description={
            <>
              <p>
                <strong>{pending.member.user.name}</strong> perderá o acesso a este evento, inclusive ao check-in.
              </p>
              <p>Esta pessoa não poderá ser convidada novamente para este mesmo evento.</p>
            </>
          }
          confirmLabel="Remover"
          tone="danger"
          onConfirm={async () => {
            await removeStaff(pending.member.id)
            await afterChange(`${pending.member.user.name} foi removido(a) da equipe.`)
          }}
          onClose={() => setPending(null)}
        />
      )}
      {pending?.type === 'cancel-invite' && (
        <ConfirmDialog
          title="Cancelar convite?"
          description={
            <>
              <p>
                O convite para <strong>{pending.invitation.user.name}</strong> será cancelado.
              </p>
              <p>Esta pessoa não poderá ser convidada novamente para este mesmo evento.</p>
            </>
          }
          confirmLabel="Cancelar convite"
          tone="danger"
          onConfirm={async () => {
            await cancelInvitation(pending.invitation.id)
            await afterChange('Convite cancelado.')
          }}
          onClose={() => setPending(null)}
        />
      )}
    </Modal>
  )
}

function PersonInfo({ name, email, avatar }: { name: string; email: string; avatar?: string | null }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Avatar name={name} src={staffAvatarSrc(avatar)} className="w-8 h-8" textClassName="text-xs" />
      <div className="min-w-0">
        <div className="font-bold text-zinc-950 truncate">{name}</div>
        <div className="text-zinc-500 truncate">{email}</div>
      </div>
    </div>
  )
}

interface InviteFormProps {
  eventId: string
  email: string
  onEmailChange: (email: string) => void
  /** E-mails already on the team or invited before (the API allows one invitation per person and event). */
  knownEmails: string[]
  disabled: boolean
  onInvited: (email: string) => Promise<void>
}

function InviteForm({ eventId, email, onEmailChange, knownEmails, disabled, onInvited }: InviteFormProps) {
  const [accessLevel, setAccessLevel] = useState<StaffAccessLevel>('checkin')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (formEvent: FormEvent) => {
    formEvent.preventDefault()
    const value = email.trim()
    if (!isValidEmail(value)) return setError('Informe um e-mail válido.')
    if (knownEmails.some((known) => known.toLowerCase() === value.toLowerCase()))
      return setError('Esta pessoa já faz parte da equipe ou já recebeu um convite para este evento.')

    setSending(true)
    setError('')
    try {
      await inviteStaff(eventId, { email: value, originalAccessLevel: accessLevel })
      await onInvited(value)
    } catch (err) {
      setError(
        err instanceof ApiError && err.hasRawMessage('User not found')
          ? 'Não há uma conta Corevent com este e-mail. A pessoa precisa criar a conta (no app ou neste site) antes de ser convidada.'
          : getErrorMessage(err),
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3" noValidate>
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
          <UserPlus className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-xs font-bold text-zinc-900">Convidar colaborador</h3>
          <p className="text-[11px] text-zinc-500">A pessoa precisa ter uma conta Corevent com este e-mail.</p>
        </div>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_11rem] gap-2">
        <div>
          <label htmlFor="invite-email" className={labelClass}>
            E-mail
          </label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <TextInput
              id="invite-email"
              compact
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="colaborador@email.com"
              className="pl-8"
            />
          </div>
        </div>
        <div>
          <label htmlFor="invite-access" className={labelClass}>
            Acesso
          </label>
          <SelectInput
            id="invite-access"
            compact
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value as StaffAccessLevel)}
          >
            {ACCESS_LEVELS.map((level) => (
              <option key={level} value={level}>
                {ACCESS_LEVEL_LABELS[level]}
              </option>
            ))}
          </SelectInput>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-[11px] text-zinc-500">{ACCESS_LEVEL_DESCRIPTIONS[accessLevel]}</p>
        <Button type="submit" size="sm" loading={sending} disabled={disabled} icon={<Send className="w-3.5 h-3.5" />} className="shrink-0">
          Enviar convite
        </Button>
      </div>
    </form>
  )
}
