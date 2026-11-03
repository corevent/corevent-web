import { createContext } from 'react'
import type { User } from '../api/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  /** True when the user has organizer payment info (required by POST /events). Null when unknown. */
  isOrganizer: boolean | null
  /** Set when a request failed because the session could not be renewed. */
  sessionExpired: boolean
  bootError: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  reloadOrganizerStatus: () => Promise<void>
  retryBoot: () => void
  dismissSessionExpired: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
