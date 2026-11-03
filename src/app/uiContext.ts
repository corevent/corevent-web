import { createContext } from 'react'

export type AuthView = 'none' | 'login' | 'register' | 'forgot-password'

export interface UiContextValue {
  authView: AuthView
  openAuth: (view: Exclude<AuthView, 'none'>) => void
  closeAuth: () => void
  createEventOpen: boolean
  /** Opens the event wizard, or login / the organizer requirement notice when needed. */
  requestCreateEvent: () => void
  closeCreateEvent: () => void
  organizerNoticeOpen: boolean
  closeOrganizerNotice: () => void
}

export const UiContext = createContext<UiContextValue | null>(null)
