import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { fetchAllPages } from '../api/client'
import { getErrorMessage } from '../api/errors'
import { listMyOrganizerEvents } from '../api/events'
import { listAllTicketTypes } from '../api/ticketTypes'
import type { EventListItem, EventStatus } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { EventsContext, type DashboardEvent, type EventsLoadStatus } from './eventsContext'
import { computeStats } from './eventStats'

// GET /events/my/organizer accepts a single (required) status per request.
const ALL_STATUSES: EventStatus[] = ['draft', 'opened', 'going', 'finished', 'canceled']
const STATUS_ORDER: Record<EventStatus, number> = { going: 0, opened: 1, draft: 2, finished: 3, canceled: 4 }

function sortEvents(events: EventListItem[]): EventListItem[] {
  return [...events].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    const byDate = new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    // Past events: most recent first.
    return a.status === 'finished' || a.status === 'canceled' ? -byDate : byDate
  })
}

interface LoadedData {
  /** User the data belongs to; data from a previous session is never exposed. */
  ownerId: string | null
  events: DashboardEvent[]
  status: Exclude<EventsLoadStatus, 'idle'>
  error: string | null
}

const INITIAL: LoadedData = { ownerId: null, events: [], status: 'loading', error: null }

export function EventsProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, user } = useAuth()
  const [data, setData] = useState<LoadedData>(INITIAL)
  const requestIdRef = useRef(0)
  const userId = authStatus === 'authenticated' ? (user?.id ?? null) : null

  const fetchEvents = useCallback(async (ownerId: string) => {
    const requestId = ++requestIdRef.current
    try {
      const pages = await Promise.all(
        ALL_STATUSES.map((eventStatus) =>
          fetchAllPages((page, limit) => listMyOrganizerEvents({ status: eventStatus, page, limit })),
        ),
      )
      if (requestId !== requestIdRef.current) return

      const list = sortEvents(pages.flat())
      setData((previous) => ({
        ownerId,
        status: 'ready',
        error: null,
        events: list.map((event) => {
          // Keep previous numbers while the refreshed ones load, to avoid flicker.
          const old = previous.ownerId === ownerId ? previous.events.find((item) => item.id === event.id) : undefined
          return { ...event, lots: old?.lots, stats: old?.stats }
        }),
      }))

      const lotsResults = await Promise.allSettled(list.map((event) => listAllTicketTypes(event.id)))
      if (requestId !== requestIdRef.current) return

      setData((previous) => ({
        ...previous,
        events: list.map((event, index) => {
          const result = lotsResults[index]
          if (result.status === 'rejected') return { ...event, lots: null, stats: null }
          return { ...event, lots: result.value, stats: computeStats(result.value) }
        }),
      }))
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setData((previous) => ({
        ownerId,
        events: previous.ownerId === ownerId ? previous.events : [],
        status: 'error',
        error: getErrorMessage(err),
      }))
    }
  }, [])

  useEffect(() => {
    if (userId) void fetchEvents(userId)
    else requestIdRef.current++ // discard in-flight responses after logout
  }, [userId, fetchEvents])

  const reload = useCallback(async () => {
    if (!userId) return
    setData((previous) =>
      previous.ownerId === userId && previous.status === 'ready' ? previous : { ...previous, status: 'loading', error: null },
    )
    await fetchEvents(userId)
  }, [userId, fetchEvents])

  const isCurrent = userId !== null && data.ownerId === userId
  const status: EventsLoadStatus = !userId ? 'idle' : isCurrent ? data.status : 'loading'

  return (
    <EventsContext.Provider
      value={{
        events: isCurrent ? data.events : [],
        status,
        error: isCurrent ? data.error : null,
        reload,
      }}
    >
      {children}
    </EventsContext.Provider>
  )
}
