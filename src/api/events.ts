import { apiRequest } from './client'
import type {
  ApiData,
  CreateEventPayload,
  CreatedEvent,
  EventListItem,
  EventStatus,
  Paginated,
  UpdateEventPayload,
} from './types'

export interface MyEventsQuery {
  /** Required by the API; only one status per request. */
  status: EventStatus
  page: number
  limit: number
  search?: string
}

export function listMyOrganizerEvents(query: MyEventsQuery): Promise<Paginated<EventListItem>> {
  return apiRequest('/events/my/organizer', { query: { ...query } })
}

/** Requires organizer payment info (404 "User is not a organizer" otherwise). */
export function createEvent(payload: CreateEventPayload): Promise<ApiData<CreatedEvent>> {
  return apiRequest('/events', { method: 'POST', body: payload })
}

export function updateEvent(id: string, payload: UpdateEventPayload): Promise<ApiData<EventListItem>> {
  return apiRequest(`/events/${id}`, { method: 'PATCH', body: payload })
}

/** Only opened/going events can be cancelled. */
export function cancelEvent(id: string): Promise<void> {
  return apiRequest(`/events/${id}/cancel`, { method: 'POST' })
}

/** Only drafts can be deleted. */
export function deleteEvent(id: string): Promise<void> {
  return apiRequest(`/events/${id}`, { method: 'DELETE' })
}

export function confirmEventBanner(id: string, key: string): Promise<ApiData<EventListItem>> {
  return apiRequest(`/events/${id}/banner`, { method: 'PATCH', body: { key } })
}
