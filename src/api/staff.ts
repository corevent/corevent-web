import { apiRequest, fetchAllPages } from './client'
import type {
  ApiData,
  EventInvitation,
  EventStaffMember,
  InvitePayload,
  MessageResponse,
  Paginated,
  ReceivedInvitation,
  StaffAccessLevel,
  StaffEventListItem,
  StaffInvitationStatus,
} from './types'

// ---- Organizer: invitations of an event ----

/** Only for opened events. Fails when the e-mail has no account or was already invited (any status). */
export function inviteStaff(eventId: string, payload: InvitePayload): Promise<ApiData<EventInvitation>> {
  return apiRequest(`/invitations/events/${eventId}`, { method: 'POST', body: payload })
}

/** `invitationStatus` is required by the API, so each status is a separate request. */
export function listAllEventInvitations(eventId: string, invitationStatus: StaffInvitationStatus): Promise<EventInvitation[]> {
  return fetchAllPages<EventInvitation>((page, limit) =>
    apiRequest(`/invitations/events/${eventId}`, { query: { page, limit, invitationStatus } }),
  )
}

export function cancelInvitation(invitationId: string): Promise<MessageResponse> {
  return apiRequest(`/invitations/${invitationId}/cancel`, { method: 'POST' })
}

// ---- Organizer: staff of an event ----

export function listAllEventStaff(eventId: string): Promise<EventStaffMember[]> {
  return fetchAllPages<EventStaffMember>((page, limit) => apiRequest(`/events/${eventId}/staff`, { query: { page, limit } }))
}

export function updateStaffAccessLevel(staffId: string, accessLevel: StaffAccessLevel): Promise<ApiData<EventStaffMember>> {
  return apiRequest(`/events/${staffId}/access-level`, { method: 'PATCH', body: { accessLevel } })
}

export function removeStaff(staffId: string): Promise<void> {
  return apiRequest(`/events/staff/${staffId}`, { method: 'DELETE' })
}

// ---- Invited user / collaborator ----

export function listMyInvitations(page: number, limit: number, invitationStatus?: StaffInvitationStatus): Promise<Paginated<ReceivedInvitation>> {
  return apiRequest('/invitations/me', { query: { page, limit, invitationStatus } })
}

export function listAllMyInvitations(): Promise<ReceivedInvitation[]> {
  return fetchAllPages((page, limit) => listMyInvitations(page, limit))
}

/** Only while the event is opened. */
export function acceptInvitation(invitationId: string): Promise<ApiData<EventStaffMember>> {
  return apiRequest(`/invitations/${invitationId}/accept`, { method: 'POST' })
}

export function rejectInvitation(invitationId: string): Promise<MessageResponse> {
  return apiRequest(`/invitations/${invitationId}/reject`, { method: 'POST' })
}

/** The API accepts only opened, going or finished here (one status per request). */
export type StaffEventStatus = 'opened' | 'going' | 'finished'

export function listAllMyStaffEvents(status: StaffEventStatus): Promise<StaffEventListItem[]> {
  return fetchAllPages<StaffEventListItem>((page, limit) => apiRequest('/events/my/staff', { query: { page, limit, status } }))
}
