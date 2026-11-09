import type { AuthTokens } from '../api/types'

// The access token lives only in memory; the refresh token is persisted so the
// session survives reloads (the API does not use cookies).
const REFRESH_TOKEN_KEY = 'corevent.refreshToken'

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setTokens(tokens: AuthTokens): void {
  accessToken = tokens.accessToken
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  } catch {
    // Storage unavailable (private mode): the session lasts until the tab closes.
  }
}

export function clearTokens(): void {
  accessToken = null
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // ignore
  }
}

export function isRefreshTokenStorageEvent(event: StorageEvent): boolean {
  return event.key === REFRESH_TOKEN_KEY
}

type SessionExpiredListener = () => void
const sessionExpiredListeners = new Set<SessionExpiredListener>()

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener)
  return () => sessionExpiredListeners.delete(listener)
}

export function notifySessionExpired(): void {
  sessionExpiredListeners.forEach((listener) => listener())
}
