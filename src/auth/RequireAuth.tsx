import { useEffect, type ReactNode } from 'react'
import { useUi } from '../app/useUi'
import { PageLoader } from '../components/ui/PageLoader'
import { VisitorGate } from '../features/dashboard/VisitorGate'
import { useAuth } from './useAuth'

/** Protected content: shows the visitor gate and opens the login modal for anonymous users. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const { openAuth } = useUi()

  useEffect(() => {
    if (status === 'anonymous') openAuth('login')
  }, [status, openAuth])

  if (status === 'loading') return <PageLoader label="Restaurando sua sessão…" />
  if (status !== 'authenticated') return <VisitorGate />
  return children
}
