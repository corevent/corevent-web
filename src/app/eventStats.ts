import type { TicketType } from '../api/types'
import { toNumber } from '../utils/format'
import type { EventSalesStats } from './eventsContext'

export function computeStats(lots: TicketType[]): EventSalesStats {
  return lots.reduce<EventSalesStats>(
    (acc, lot) => {
      const sold = Math.max(0, lot.totalQuantity - lot.availableQuantity)
      return {
        sold: acc.sold + sold,
        capacity: acc.capacity + lot.totalQuantity,
        revenue: acc.revenue + sold * toNumber(lot.price),
      }
    },
    { sold: 0, capacity: 0, revenue: 0 },
  )
}

export const percentOf = (part: number, total: number): number =>
  total > 0 ? Math.min(100, Math.round((part / total) * 100)) : 0
