import type { EventListItem } from '../../api/types'

export function describeLocation(event: Pick<EventListItem, 'locationType' | 'locationName' | 'city'>): string {
  const city = event.city ? `${event.city.name}${event.city.state ? `, ${event.city.state.acronym}` : ''}` : ''
  if (event.locationType === 'online') return 'Evento online'
  const place = [event.locationName, city].filter(Boolean).join(', ')
  return event.locationType === 'hybrid' ? `${place || 'Local a definir'} · Híbrido` : place || 'Local a definir'
}
