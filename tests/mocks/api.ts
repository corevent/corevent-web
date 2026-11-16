// MSW handlers that emulate the Corevent API contracts (shapes, status codes and
// NestJS error format) with an in-memory database that each test can customize.
import { HttpResponse, http } from 'msw'
import type { EventListItem, PaymentInfoListItem, TicketType, User } from '../../src/api/types'
import { TEST_PASSWORD, makeEvent, makeLot, makeUser } from './fixtures'

export const API_URL = 'http://api.test/api'

export interface MockDb {
  user: User
  password: string
  paymentInfos: PaymentInfoListItem[]
  events: EventListItem[]
  lots: TicketType[]
  /** Valid refresh tokens (rotated on every refresh, like the real API). */
  refreshTokens: Set<string>
  accessTokens: Set<string>
  /** Requests received, in order: "METHOD /path". */
  requests: string[]
}

export function createDb(overrides: Partial<MockDb> = {}): MockDb {
  return {
    user: makeUser(),
    password: TEST_PASSWORD,
    paymentInfos: [{ id: 'pay-1', description: 'PIX principal' }],
    events: [makeEvent()],
    lots: [makeLot({ availableQuantity: 380 })],
    refreshTokens: new Set(),
    accessTokens: new Set(),
    requests: [],
    ...overrides,
  }
}

const error = (statusCode: number, message: string | string[]) =>
  HttpResponse.json({ statusCode, message, error: 'Error' }, { status: statusCode })

const page = <T>(items: T[]) => ({
  data: items,
  meta: { currentPage: 1, itemsPerPage: 100, totalItems: items.length, totalPages: 1 },
})

let tokenCounter = 0
function issueTokens(db: MockDb) {
  tokenCounter += 1
  const tokens = { accessToken: `access-${tokenCounter}`, refreshToken: `refresh-${tokenCounter}` }
  db.accessTokens.add(tokens.accessToken)
  db.refreshTokens.add(tokens.refreshToken)
  return tokens
}

export function createHandlers(db: MockDb) {
  const authorized = (request: Request) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    return token !== undefined && db.accessTokens.has(token)
  }

  const track = (request: Request) => {
    const url = new URL(request.url)
    db.requests.push(`${request.method} ${url.pathname.replace('/api', '')}`)
  }

  return [
    http.all(`${API_URL}/*`, ({ request }) => {
      track(request)
      // Fall through to the specific handlers below.
    }),

    http.post(`${API_URL}/auth/login`, async ({ request }) => {
      const body = (await request.json()) as { email: string; password: string }
      if (body.email !== db.user.email || body.password !== db.password) return error(401, 'Invalid credentials')
      return HttpResponse.json(issueTokens(db))
    }),

    http.post(`${API_URL}/auth/refresh`, async ({ request }) => {
      const { refreshToken } = (await request.json()) as { refreshToken: string }
      if (!db.refreshTokens.has(refreshToken)) return error(401, 'Invalid refresh token')
      db.refreshTokens.delete(refreshToken)
      return HttpResponse.json(issueTokens(db))
    }),

    http.post(`${API_URL}/auth/logout`, async ({ request }) => {
      const { refreshToken } = (await request.json()) as { refreshToken: string }
      db.refreshTokens.delete(refreshToken)
      return new HttpResponse(null, { status: 200 })
    }),

    http.post(`${API_URL}/auth/verify-email`, () => HttpResponse.json({ message: 'If the email exists, a code was sent' })),

    http.post(`${API_URL}/auth/register`, async ({ request }) => {
      const body = (await request.json()) as { verifyEmailCode: string; email: string; name: string }
      if (body.verifyEmailCode !== '123456') return error(400, 'Invalid code, 4 attempts left')
      db.user = makeUser({ email: body.email, name: body.name })
      return HttpResponse.json({ data: db.user }, { status: 201 })
    }),

    http.get(`${API_URL}/users/me`, ({ request }) => {
      if (!authorized(request)) return error(401, 'Unauthorized')
      return HttpResponse.json({ data: db.user })
    }),

    http.get(`${API_URL}/users/me/organizer-payment-info`, ({ request }) => {
      if (!authorized(request)) return error(401, 'Unauthorized')
      return HttpResponse.json(page(db.paymentInfos))
    }),

    http.get(`${API_URL}/events/my/organizer`, ({ request }) => {
      if (!authorized(request)) return error(401, 'Unauthorized')
      const status = new URL(request.url).searchParams.get('status')
      return HttpResponse.json(page(db.events.filter((event) => event.status === status)))
    }),

    http.get(`${API_URL}/events/:eventId/ticket-types`, ({ request, params }) => {
      if (!authorized(request)) return error(401, 'Unauthorized')
      return HttpResponse.json(page(db.lots.filter((lot) => lot.eventId === params.eventId)))
    }),

    http.patch(`${API_URL}/events/:eventId`, async ({ request, params }) => {
      if (!authorized(request)) return error(401, 'Unauthorized')
      const event = db.events.find((item) => item.id === params.eventId)
      if (!event) return error(404, 'Event not found')
      Object.assign(event, (await request.json()) as Partial<EventListItem>)
      return HttpResponse.json({ data: event })
    }),

    http.delete(`${API_URL}/events/ticket-types/:lotId`, ({ request, params }) => {
      if (!authorized(request)) return error(401, 'Unauthorized')
      db.lots = db.lots.filter((lot) => lot.id !== params.lotId)
      return new HttpResponse(null, { status: 204 })
    }),

    http.delete(`${API_URL}/events/:eventId`, ({ request, params }) => {
      if (!authorized(request)) return error(401, 'Unauthorized')
      // Same constraint as the database: lots must be removed first (no ON DELETE CASCADE).
      if (db.lots.some((lot) => lot.eventId === params.eventId)) return error(500, 'Internal server error')
      db.events = db.events.filter((event) => event.id !== params.eventId)
      return new HttpResponse(null, { status: 200 })
    }),
  ]
}

/** Signs the test user in without going through the UI (stored refresh token, as after a reload). */
export function seedSession(db: MockDb): void {
  const { refreshToken } = issueTokens(db)
  localStorage.setItem('corevent.refreshToken', refreshToken)
}
