import { createContext } from 'react'
import type { EventListItem, TicketType } from '../api/types'

export interface EventSalesStats {
  /** Σ(totalQuantity − availableQuantity): only paid orders decrement availability. */
  sold: number
  capacity: number
  revenue: number
}

export interface DashboardEvent extends EventListItem {
  /** undefined while loading, null when the ticket types could not be loaded. */
  lots: TicketType[] | null | undefined
  stats: EventSalesStats | null | undefined
}

export type EventsLoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface EventsContextValue {
  events: DashboardEvent[]
  status: EventsLoadStatus
  error: string | null
  reload: () => Promise<void>
}

export const EventsContext = createContext<EventsContextValue | null>(null)
