import { HttpResponse, delay, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, refreshSession } from '../../src/api/client'
import { ApiError } from '../../src/api/errors'
import { getAccessToken, getRefreshToken, onSessionExpired, setTokens } from '../../src/auth/tokenStorage'
import { API_URL } from '../mocks/api'
import { server } from './setup'

describe('API client', () => {
  const unsubscribers: (() => void)[] = []
  afterEach(() => unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe()))

  it('sends the bearer token and omits empty query params', async () => {
    let received: { auth: string | null; search: string } | undefined
    server.use(
      http.get(`${API_URL}/events/my/organizer`, ({ request }) => {
        received = { auth: request.headers.get('Authorization'), search: new URL(request.url).search }
        return HttpResponse.json({ ok: true })
      }),
    )
    setTokens({ accessToken: 'token-a', refreshToken: 'refresh-a' })

    await apiRequest('/events/my/organizer', { query: { status: 'draft', page: 1, search: '', cityId: undefined } })

    expect(received).toEqual({ auth: 'Bearer token-a', search: '?status=draft&page=1' })
  })

  it('refreshes the session only once for concurrent 401 responses and retries the requests', async () => {
    let refreshCalls = 0
    server.use(
      http.post(`${API_URL}/auth/refresh`, async () => {
        refreshCalls += 1
        await delay(20)
        return HttpResponse.json({ accessToken: 'token-new', refreshToken: 'refresh-new' })
      }),
      http.get(`${API_URL}/users/me`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer token-new'
          ? HttpResponse.json({ data: 'ok' })
          : HttpResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 }),
      ),
    )
    setTokens({ accessToken: 'token-expired', refreshToken: 'refresh-old' })

    const results = await Promise.all([apiRequest('/users/me'), apiRequest('/users/me'), apiRequest('/users/me')])

    expect(results).toEqual([{ data: 'ok' }, { data: 'ok' }, { data: 'ok' }])
    expect(refreshCalls).toBe(1)
    expect(getAccessToken()).toBe('token-new')
    expect(getRefreshToken()).toBe('refresh-new')
  })

  it('ends the session when the refresh token is rejected', async () => {
    const expired = vi.fn()
    unsubscribers.push(onSessionExpired(expired))
    server.use(
      http.get(`${API_URL}/users/me`, () => HttpResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 })),
      http.post(`${API_URL}/auth/refresh`, () =>
        HttpResponse.json({ statusCode: 401, message: 'Invalid refresh token' }, { status: 401 }),
      ),
    )
    setTokens({ accessToken: 'token-expired', refreshToken: 'refresh-revoked' })

    await expect(apiRequest('/users/me')).rejects.toMatchObject({ status: 401 })
    expect(expired).toHaveBeenCalledOnce()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('rejects a 2xx response that is not JSON (e.g. an HTML page from the host)', async () => {
    server.use(http.get(`${API_URL}/users/me`, () => HttpResponse.html('<!doctype html><div id="root"></div>')))

    const error = await apiRequest('/users/me').catch((err: unknown) => err)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toMatch(/Resposta inesperada/)
  })

  it('does not store invalid tokens returned by the refresh endpoint', async () => {
    server.use(http.post(`${API_URL}/auth/refresh`, () => HttpResponse.json({ unexpected: true })))
    setTokens({ accessToken: 'a', refreshToken: 'refresh-ok' })

    await expect(refreshSession()).rejects.toBeInstanceOf(ApiError)
    expect(getRefreshToken()).toBe('refresh-ok')
  })

  it('fails with a timeout error when the API does not answer', async () => {
    server.use(http.get(`${API_URL}/users/me`, async () => {
      await delay('infinite')
      return HttpResponse.json({})
    }))

    const error = await apiRequest('/users/me', { auth: false, timeoutMs: 50 }).catch((err: unknown) => err)

    expect((error as ApiError).message).toMatch(/demorou demais/)
  })

  it('translates API errors to Portuguese', async () => {
    server.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json({ statusCode: 401, message: 'Invalid credentials' }, { status: 401 }),
      ),
    )

    await expect(apiRequest('/auth/login', { method: 'POST', body: {}, auth: false })).rejects.toThrow(
      'E-mail ou senha incorretos.',
    )
  })
})
