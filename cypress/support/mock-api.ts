// Mock of the Corevent API for the Cypress tests. It mirrors the real contracts (paths,
// payloads, status codes, NestJS error body) and keeps state per test, so a created event
// shows up in the next listing, a published draft changes status, etc.
import type { EventListItem, PaymentInfoListItem, TicketType, User } from '../../src/api/types'
import { TEST_PASSWORD, makeEvent, makeLot, makeUser } from '../../tests/mocks/fixtures'

export interface RecordedRequest {
  method: string
  path: string
  body: unknown
}

type Body = Record<string, unknown> | undefined
type Reply = { statusCode: number; body?: unknown }

export class MockApi {
  user: User = makeUser()
  password = TEST_PASSWORD
  paymentInfos: PaymentInfoListItem[] = [{ id: 'pay-1', description: 'PIX principal' }]
  events: EventListItem[] = [makeEvent()]
  lots: TicketType[] = [makeLot({ availableQuantity: 380 })]
  participants = [
    { id: 'p1', name: 'Carla Souza', email: 'carla@example.com', ticketsCount: 2 },
    { id: 'p2', name: '=HYPERLINK("http://evil")', email: 'x@example.com', ticketsCount: 1 },
  ]
  /** When true, every authenticated call and refresh answers 401 (revoked session). */
  sessionRevoked = false
  readonly requests: RecordedRequest[] = []
  readonly unhandled: string[] = []
  private counter = 0
  private accessTokens = new Set<string>()
  private refreshTokens = new Set<string>()

  issueTokens() {
    this.counter += 1
    const tokens = { accessToken: `access-${this.counter}`, refreshToken: `refresh-${this.counter}` }
    this.accessTokens.add(tokens.accessToken)
    this.refreshTokens.add(tokens.refreshToken)
    return tokens
  }

  requestsTo(method: string, path: string | RegExp): RecordedRequest[] {
    return this.requests.filter(
      (request) => request.method === method && (typeof path === 'string' ? request.path === path : path.test(request.path)),
    )
  }

  /** Returns the HTTP answer for an API call (path without the "/api" prefix). */
  handle(method: string, path: string, query: URLSearchParams, body: Body, authorization?: string): Reply {
    this.requests.push({ method, path, body })
    const json = (statusCode: number, data?: unknown): Reply => ({ statusCode, body: data })
    const error = (statusCode: number, message: string) => json(statusCode, { statusCode, message, error: 'Error' })
    const page = <T>(items: T[]) => ({
      data: items,
      meta: { currentPage: 1, itemsPerPage: 100, totalItems: items.length, totalPages: 1 },
    })

    // Public auth routes
    if (method === 'POST' && path === '/auth/login') {
      if (body?.email !== this.user.email || body?.password !== this.password) return error(401, 'Invalid credentials')
      return json(200, this.issueTokens())
    }
    if (method === 'POST' && path === '/auth/refresh') {
      const token = String(body?.refreshToken)
      if (this.sessionRevoked || !this.refreshTokens.has(token)) return error(401, 'Invalid refresh token')
      this.refreshTokens.delete(token)
      return json(200, this.issueTokens())
    }
    if (method === 'POST' && path === '/auth/logout') return json(200)

    const token = authorization?.replace('Bearer ', '')
    if (this.sessionRevoked || !token || !this.accessTokens.has(token)) return error(401, 'Unauthorized')

    // Account
    if (method === 'GET' && path === '/users/me') return json(200, { data: this.user })
    if (method === 'PATCH' && path === '/users') {
      Object.assign(this.user, body)
      return json(200, { data: this.user })
    }
    if (method === 'PATCH' && path === '/users/pass') {
      if (body?.currentPassword !== this.password) return error(400, 'Invalid current password provided')
      this.password = String(body?.newPassword)
      return json(200, { message: 'Password updated successfully' })
    }
    if (method === 'GET' && path === '/users/me/organizer-payment-info') return json(200, page(this.paymentInfos))

    // Collaboration invitations received (header badge): none in these scenarios.
    if (method === 'GET' && path === '/invitations/me') return json(200, page([]))

    // Locations
    if (method === 'GET' && path === '/states') return json(200, { data: [{ id: 35, name: 'São Paulo', acronym: 'SP' }] })
    if (method === 'GET' && path === '/states/35/cities') {
      return json(200, { data: [{ id: 3525300, name: 'Jaú', stateId: 35 }, { id: 3550308, name: 'São Paulo', stateId: 35 }] })
    }

    // Events
    if (method === 'GET' && path === '/events/my/organizer') {
      return json(200, page(this.events.filter((event) => event.status === query.get('status'))))
    }
    if (method === 'POST' && path === '/events') {
      if (this.paymentInfos.length === 0) return error(404, 'User is not a organizer')
      const event = makeEvent({
        ...(body as Partial<EventListItem>),
        id: `event-${this.events.length + 1}`,
        city: body?.cityId ? { id: Number(body.cityId), name: 'Jaú', state: { id: 35, name: 'São Paulo', acronym: 'SP' } } : null,
      })
      this.events.push(event)
      return json(201, { data: event })
    }

    const lotsMatch = path.match(/^\/events\/([^/]+)\/ticket-types$/)
    if (lotsMatch) {
      const eventId = lotsMatch[1]
      if (method === 'GET') return json(200, page(this.lots.filter((lot) => lot.eventId === eventId)))
      if (method === 'POST') {
        const event = this.events.find((item) => item.id === eventId)
        if (!event) return error(404, 'Event not found')
        if (event.status !== 'draft') return error(400, 'Cannot create because event is not draft')
        const lot = makeLot({
          ...(body as Partial<TicketType>),
          id: `lot-${this.lots.length + 1}`,
          eventId,
          availableQuantity: Number(body?.totalQuantity),
        })
        this.lots.push(lot)
        return json(201, { data: lot })
      }
    }

    const lotMatch = path.match(/^\/events\/ticket-types\/([^/]+)$/)
    if (lotMatch && method === 'DELETE') {
      this.lots = this.lots.filter((lot) => lot.id !== lotMatch[1])
      return json(204)
    }

    const participantsMatch = path.match(/^\/events\/([^/]+)\/participants$/)
    if (participantsMatch && method === 'GET') return json(200, page(this.participants))

    const cancelMatch = path.match(/^\/events\/([^/]+)\/cancel$/)
    if (cancelMatch && method === 'POST') {
      const event = this.events.find((item) => item.id === cancelMatch[1])
      if (event) event.status = 'canceled'
      return json(201)
    }

    const eventMatch = path.match(/^\/events\/([^/]+)$/)
    if (eventMatch) {
      const event = this.events.find((item) => item.id === eventMatch[1])
      if (!event) return error(404, 'Event not found')
      if (method === 'PATCH') {
        Object.assign(event, body)
        return json(200, { data: event })
      }
      if (method === 'DELETE') {
        this.events = this.events.filter((item) => item !== event)
        return json(200)
      }
    }

    this.unhandled.push(`${method} ${path}`)
    return error(404, `Cannot ${method} ${path}`)
  }
}
