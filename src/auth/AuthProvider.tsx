import { useCallback, useEffect, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import { refreshSession } from '../api/client'
import { ApiError, getErrorMessage } from '../api/errors'
import { listPaymentInfo } from '../api/paymentInfo'
import type { User } from '../api/types'
import { getMe } from '../api/users'
import { AuthContext, type AuthStatus } from './authContext'
import {
  clearTokens,
  getRefreshToken,
  isRefreshTokenStorageEvent,
  onSessionExpired,
  setTokens,
} from './tokenStorage'

async function fetchOrganizerStatus(): Promise<boolean | null> {
  try {
    const { meta } = await listPaymentInfo(1, 10)
    return meta.totalItems > 0
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw error
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Without a stored refresh token there is no session to restore.
  const [status, setStatus] = useState<AuthStatus>(() => (getRefreshToken() ? 'loading' : 'anonymous'))
  const [user, setUser] = useState<User | null>(null)
  const [isOrganizer, setIsOrganizer] = useState<boolean | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [bootError, setBootError] = useState<string | null>(null)

  const resetToAnonymous = useCallback(() => {
    setUser(null)
    setIsOrganizer(null)
    setStatus('anonymous')
  }, [])

  const loadProfile = useCallback(async () => {
    const [{ data }, organizer] = await Promise.all([getMe(), fetchOrganizerStatus()])
    setUser(data)
    setIsOrganizer(organizer)
    setStatus('authenticated')
  }, [])

  /** Restores the session from the stored refresh token (state only changes after the requests). */
  const restoreSession = useCallback(async () => {
    try {
      const renewed = await refreshSession()
      if (!renewed) {
        resetToAnonymous()
        return
      }
      await loadProfile()
      setBootError(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearTokens()
        resetToAnonymous()
        return
      }
      setBootError(getErrorMessage(error))
      setStatus('error')
    }
  }, [loadProfile, resetToAnonymous])

  useEffect(() => {
    if (getRefreshToken()) void restoreSession()
  }, [restoreSession])

  const retryBoot = () => {
    if (!getRefreshToken()) {
      resetToAnonymous()
      return
    }
    setStatus('loading')
    void restoreSession()
  }

  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      clearTokens()
      resetToAnonymous()
      setSessionExpired(true)
    })

    // Logging out in another tab removes the shared refresh token.
    const handleStorage = (event: StorageEvent) => {
      if (isRefreshTokenStorageEvent(event) && event.newValue === null) {
        clearTokens()
        resetToAnonymous()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => {
      unsubscribe()
      window.removeEventListener('storage', handleStorage)
    }
  }, [resetToAnonymous])

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login(email.trim(), password)
      setTokens(tokens)
      await loadProfile()
      setSessionExpired(false)
    },
    [loadProfile],
  )

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    clearTokens()
    resetToAnonymous()
    setSessionExpired(false)
    if (refreshToken) {
      // Revokes the refresh token server-side; the access token simply expires.
      await authApi.logout(refreshToken).catch(() => undefined)
    }
  }, [resetToAnonymous])

  const reloadOrganizerStatus = useCallback(async () => {
    setIsOrganizer(await fetchOrganizerStatus())
  }, [])

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        isOrganizer,
        sessionExpired,
        bootError,
        login,
        logout,
        setUser,
        reloadOrganizerStatus,
        retryBoot,
        dismissSessionExpired: () => setSessionExpired(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
