import { useCallback, useEffect, useState } from 'react'
import { listMyInvitations } from '../../api/staff'
import { useAuth } from '../../auth/useAuth'
import { INVITATIONS_CHANGED_EVENT } from './staffLabels'

/** Number of collaboration invitations waiting for an answer (0 while unknown or signed out). */
export function usePendingInvitationsCount(): number {
  const { status, user } = useAuth()
  const userId = status === 'authenticated' ? (user?.id ?? null) : null
  const [result, setResult] = useState<{ userId: string; count: number } | null>(null)

  const load = useCallback(async (id: string) => {
    try {
      const page = await listMyInvitations(1, 10, 'pending')
      setResult({ userId: id, count: page.meta.totalItems })
    } catch {
      // The badge is a hint only; the Colaborações page shows errors.
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    void load(userId)
    const refresh = () => void load(userId)
    window.addEventListener(INVITATIONS_CHANGED_EVENT, refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener(INVITATIONS_CHANGED_EVENT, refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [userId, load])

  return userId && result?.userId === userId ? result.count : 0
}
