import { describe, expect, it } from '@jest/globals'
import type { EventListItem, TicketType } from '../../src/api/types'
import { computeStats, percentOf } from '../../src/app/eventStats'
import { describeLocation } from '../../src/features/events/eventLocation'

const lot = (overrides: Partial<TicketType>): TicketType => ({
  id: 'l',
  eventId: 'e',
  name: 'Lote',
  price: '100.00',
  totalQuantity: 100,
  availableQuantity: 100,
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-02-01T00:00:00.000Z',
  ...overrides,
})

describe('computeStats', () => {
  it('derives sold tickets, capacity and revenue from the lots', () => {
    const stats = computeStats([
      lot({ price: '180.00', totalQuantity: 500, availableQuantity: 0 }),
      lot({ price: 220, totalQuantity: 600, availableQuantity: 120 }),
      lot({ price: '0', totalQuantity: 50, availableQuantity: 10 }),
    ])
    expect(stats).toEqual({ sold: 500 + 480 + 40, capacity: 1150, revenue: 500 * 180 + 480 * 220 })
  })

  it('never counts negative sales', () => {
    expect(computeStats([lot({ totalQuantity: 10, availableQuantity: 12 })]).sold).toBe(0)
  })

  it('returns zeros for events without lots', () => {
    expect(computeStats([])).toEqual({ sold: 0, capacity: 0, revenue: 0 })
  })
})

describe('percentOf', () => {
  it('rounds and caps at 100%', () => {
    expect(percentOf(1, 3)).toBe(33)
    expect(percentOf(5, 4)).toBe(100)
    expect(percentOf(1, 0)).toBe(0)
  })
})

describe('describeLocation', () => {
  const city = { id: 1, name: 'São Paulo', state: { id: 35, name: 'São Paulo', acronym: 'SP' } }
  const base: Pick<EventListItem, 'locationType' | 'locationName' | 'city'> = {
    locationType: 'in_person',
    locationName: 'Arena',
    city,
  }

  it('describes in-person, hybrid and online events', () => {
    expect(describeLocation(base)).toBe('Arena, São Paulo, SP')
    expect(describeLocation({ ...base, locationType: 'hybrid' })).toBe('Arena, São Paulo, SP · Híbrido')
    expect(describeLocation({ ...base, locationType: 'online', city: null })).toBe('Evento online')
  })

  it('handles missing location data', () => {
    expect(describeLocation({ locationType: 'in_person', locationName: null, city: null })).toBe('Local a definir')
  })
})
