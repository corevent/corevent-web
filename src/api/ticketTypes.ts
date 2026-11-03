import { apiRequest, fetchAllPages } from './client'
import type { ApiData, Paginated, TicketType, TicketTypePayload } from './types'

export function listTicketTypes(eventId: string, page: number, limit: number): Promise<Paginated<TicketType>> {
  // `availableOnly` is required by the API; false returns every ticket type.
  return apiRequest(`/events/${eventId}/ticket-types`, { query: { page, limit, availableOnly: false } })
}

export function listAllTicketTypes(eventId: string): Promise<TicketType[]> {
  return fetchAllPages((page, limit) => listTicketTypes(eventId, page, limit))
}

/** Only allowed while the event is a draft and by its organizer. */
export function createTicketType(eventId: string, payload: TicketTypePayload): Promise<ApiData<TicketType>> {
  return apiRequest(`/events/${eventId}/ticket-types`, { method: 'POST', body: payload })
}

export function deleteTicketType(ticketTypeId: string): Promise<void> {
  return apiRequest(`/events/ticket-types/${ticketTypeId}`, { method: 'DELETE' })
}
