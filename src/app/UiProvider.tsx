import { useState, type ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'
import { UiContext, type AuthView } from './uiContext'

export function UiProvider({ children }: { children: ReactNode }) {
  const { status, isOrganizer } = useAuth()
  const [authView, setAuthView] = useState<AuthView>('none')
  const [createEventOpen, setCreateEventOpen] = useState(false)
  const [organizerNoticeOpen, setOrganizerNoticeOpen] = useState(false)

  const requestCreateEvent = () => {
    if (status !== 'authenticated') {
      setAuthView('login')
      return
    }
    // Unknown status (null) lets the API decide; it answers 404 "User is not a organizer".
    if (isOrganizer === false) {
      setOrganizerNoticeOpen(true)
      return
    }
    setCreateEventOpen(true)
  }

  return (
    <UiContext.Provider
      value={{
        authView,
        openAuth: setAuthView,
        closeAuth: () => setAuthView('none'),
        createEventOpen: createEventOpen && status === 'authenticated',
        requestCreateEvent,
        closeCreateEvent: () => setCreateEventOpen(false),
        organizerNoticeOpen: organizerNoticeOpen && status === 'authenticated',
        closeOrganizerNotice: () => setOrganizerNoticeOpen(false),
      }}
    >
      {children}
    </UiContext.Provider>
  )
}
