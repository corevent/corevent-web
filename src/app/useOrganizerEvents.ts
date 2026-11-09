import { useContext } from 'react'
import { EventsContext, type EventsContextValue } from './eventsContext'

export function useOrganizerEvents(): EventsContextValue {
  const context = useContext(EventsContext)
  if (!context) throw new Error('useOrganizerEvents must be used inside <EventsProvider>')
  return context
}
