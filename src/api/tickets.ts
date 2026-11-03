import { apiRequest, fetchAllPages } from './client'
import type { EventParticipant, Paginated } from './types'

export function listParticipants(eventId: string, page: number, limit: number): Promise<Paginated<EventParticipant>> {
  return apiRequest(`/events/${eventId}/participants`, { query: { page, limit } })
}

export function listAllParticipants(eventId: string): Promise<EventParticipant[]> {
  return fetchAllPages((page, limit) => listParticipants(eventId, page, limit))
}
