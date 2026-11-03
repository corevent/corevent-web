import { createContext, useContext } from 'react'

export interface ModalContextValue {
  /** Closes the modal, asking for confirmation first when it has unsaved progress. */
  requestClose: () => void
  dismissible: boolean
}

export const ModalContext = createContext<ModalContextValue | null>(null)

export function useModalClose(): ModalContextValue {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useModalClose must be used inside <Modal>')
  return context
}
