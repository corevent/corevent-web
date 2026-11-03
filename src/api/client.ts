import { API_BASE_URL } from '../config/env'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  notifySessionExpired,
  setTokens,
} from '../auth/tokenStorage'
import { ApiError, parseErrorBody } from './errors'
import type { AuthTokens } from './types'

type QueryValue = string | number | boolean | null | undefined

/** Requests that take longer than this fail with a timeout error instead of hanging. */
const REQUEST_TIMEOUT_MS = 20_000

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
  /** Send the bearer token and retry once after refreshing it on 401. Default: true. */
  auth?: boolean
  signal?: AbortSignal
  timeoutMs?: number
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${API_BASE_URL}${path}`
  if (!query) return url

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    // Omit empty values: the API forbids unknown/empty params in several DTOs.
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }
  const search = params.toString()
  return search ? `${url}?${search}` : url
}

const NOT_JSON = Symbol('not-json')

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return NOT_JSON
  }
}

/**
 * The API always answers JSON (or an empty body). Anything else — e.g. an HTML page from a
 * misconfigured host/CDN answering 200 — must not be treated as a successful response.
 */
async function readJsonBody(response: Response): Promise<unknown> {
  const body = await readBody(response)
  if (body === NOT_JSON) throw ApiError.unexpectedResponse(response.status)
  return body
}

function isAuthTokens(value: unknown): value is AuthTokens {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as AuthTokens).accessToken === 'string' &&
    typeof (value as AuthTokens).refreshToken === 'string'
  )
}

/** Login/refresh responses are validated before tokens are stored. */
export function assertAuthTokens(value: unknown): AuthTokens {
  if (!isAuthTokens(value)) throw ApiError.unexpectedResponse(200)
  return value
}

function buildSignal(options: RequestOptions): AbortSignal {
  const timeout = AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS)
  if (!options.signal) return timeout
  // AbortSignal.any is recent; without it the caller's signal still wins over the timeout.
  return typeof AbortSignal.any === 'function' ? AbortSignal.any([options.signal, timeout]) : options.signal
}

async function send(path: string, options: RequestOptions, withAuth: boolean): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const token = withAuth ? getAccessToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: buildSignal(options),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') throw ApiError.timeout()
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, [])
  }
}

// Refresh tokens are rotated by the API (the old one is deleted) and concurrent
// refreshes are not protected server-side, so only one refresh may be in flight.
let refreshInFlight: Promise<boolean> | null = null

async function performRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  const response = await send('/auth/refresh', { method: 'POST', body: { refreshToken } }, false)
  if (response.ok) {
    setTokens(assertAuthTokens(await readJsonBody(response)))
    return true
  }

  if (response.status === 401) {
    // Another tab may have rotated the token meanwhile: retry with the new one.
    const latest = getRefreshToken()
    if (latest && latest !== refreshToken) return performRefresh()
    clearTokens()
    return false
  }

  throw new ApiError(response.status, parseErrorBody(await readBody(response)))
}

/** Exchanges the stored refresh token for a new token pair. Returns false when the session is gone. */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= performRefresh().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const withAuth = options.auth !== false
  let response = await send(path, options, withAuth)

  if (response.status === 401 && withAuth) {
    const refreshed = await refreshSession()
    if (!refreshed) {
      notifySessionExpired()
      throw new ApiError(401, ['Unauthorized'])
    }
    response = await send(path, options, true)
    if (response.status === 401) {
      clearTokens()
      notifySessionExpired()
    }
  }

  if (!response.ok) throw new ApiError(response.status, parseErrorBody(await readBody(response)))
  return (await readJsonBody(response)) as T
}

/** Fetches every page of a paginated endpoint (the API caps `limit` at 100). */
export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<{ data: T[]; meta: { totalPages: number } }>,
): Promise<T[]> {
  const limit = 100
  const first = await fetchPage(1, limit)
  const items = [...first.data]
  for (let page = 2; page <= first.meta.totalPages; page++) {
    const next = await fetchPage(page, limit)
    items.push(...next.data)
  }
  return items
}
