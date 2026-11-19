import type { StaffAccessLevel, StaffInvitationStatus } from '../../api/types'

export const ACCESS_LEVELS: StaffAccessLevel[] = ['readonly', 'checkin']

export const ACCESS_LEVEL_LABELS: Record<StaffAccessLevel, string> = {
  readonly: 'Visualização',
  checkin: 'Check-in',
}

export const ACCESS_LEVEL_DESCRIPTIONS: Record<StaffAccessLevel, string> = {
  readonly: 'Acompanha o evento e a lista de participantes.',
  checkin: 'Também valida os ingressos na entrada pelo app Corevent Colaboradores.',
}

export const ACCESS_LEVEL_BADGE_CLASSES: Record<StaffAccessLevel, string> = {
  readonly: 'bg-zinc-100 text-zinc-700',
  checkin: 'bg-brand-soft text-brand',
}

export const INVITATION_STATUS_LABELS: Record<StaffInvitationStatus, string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  rejected: 'Recusado',
  canceled: 'Cancelado',
}

export const INVITATION_STATUS_BADGE_CLASSES: Record<StaffInvitationStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-700',
  canceled: 'bg-zinc-100 text-zinc-500',
}

/** Staff/invitation lists return the raw storage key, not a signed URL: show it only when it is a URL. */
export const staffAvatarSrc = (value?: string | null): string | null =>
  value && /^https?:\/\//.test(value) ? value : null

/** Fired after the user accepts or rejects an invitation, so the header badge refreshes. */
export const INVITATIONS_CHANGED_EVENT = 'corevent:invitations-changed'

export function notifyInvitationsChanged(): void {
  window.dispatchEvent(new Event(INVITATIONS_CHANGED_EVENT))
}
