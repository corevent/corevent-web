// Test data shaped exactly like the API responses (see src/api/types.ts).
import type { EventListItem, TicketType, User } from '../../src/api/types'

const DAY = 86_400_000

export const TEST_PASSWORD = 'Senha@2026'

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Ana Organizadora',
    email: 'ana@example.com',
    documentType: 'cpf',
    // The API stores the document in a char(14) column, padded with spaces.
    document: '52998224725   ',
    birthDate: '1995-05-10',
    phoneNumber: '14981234567',
    avatarUrl: null,
    createdAt: '2026-01-10T12:00:00.000Z',
    ...overrides,
  }
}

export function makeEvent(overrides: Partial<EventListItem> = {}): EventListItem {
  return {
    id: 'event-1',
    title: 'Festival de Verão',
    maxParticipants: 1000,
    locationName: 'Arena Central',
    locationType: 'in_person',
    startDate: new Date(Date.now() + 30 * DAY).toISOString(),
    endDate: new Date(Date.now() + 30.3 * DAY).toISOString(),
    category: 'music',
    bannerUrl: null,
    isAdultOnly: false,
    status: 'opened',
    organizer: { id: 'user-1', name: 'Ana Organizadora', email: 'ana@example.com', avatarUrl: null },
    city: { id: 3550308, name: 'São Paulo', state: { id: 35, name: 'São Paulo', acronym: 'SP' } },
    averageRating: null,
    ...overrides,
  }
}

export function makeLot(overrides: Partial<TicketType> = {}): TicketType {
  return {
    id: 'lot-1',
    eventId: 'event-1',
    name: 'Pista',
    price: '100.00',
    totalQuantity: 500,
    availableQuantity: 500,
    startDate: new Date(Date.now() - DAY).toISOString(),
    endDate: new Date(Date.now() + 29 * DAY).toISOString(),
    ...overrides,
  }
}
