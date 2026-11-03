import { useContext } from 'react'
import { UiContext, type UiContextValue } from './uiContext'

export function useUi(): UiContextValue {
  const context = useContext(UiContext)
  if (!context) throw new Error('useUi must be used inside <UiProvider>')
  return context
}
