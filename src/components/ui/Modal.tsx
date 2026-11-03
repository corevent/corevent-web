import { useEffect, useId, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LogOut, X } from 'lucide-react'
import { ModalContext, useModalClose } from './modalContext'

// Only the top-most modal reacts to Escape when dialogs are stacked.
const openModals: symbol[] = []

export interface CloseConfirmation {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
}

interface ModalProps {
  onClose: () => void
  children: ReactNode
  /** Tailwind max-width class for the panel. */
  maxWidth?: string
  className?: string
  labelledBy?: string
  /** Disable closing via Escape/backdrop/close buttons (e.g. while a request is running). */
  dismissible?: boolean
  /**
   * When set, closing via Escape, backdrop click or <ModalCloseButton> asks for confirmation
   * first. Pass it only while there is unsaved progress.
   */
  confirmClose?: CloseConfirmation | null
}

export function Modal({
  onClose,
  children,
  maxWidth = 'max-w-md',
  className = '',
  labelledBy,
  dismissible = true,
  confirmClose = null,
}: ModalProps) {
  const fallbackId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [confirming, setConfirming] = useState(false)

  const requestClose = () => {
    if (!dismissible) return
    if (confirmClose) setConfirming(true)
    else onClose()
  }

  // Kept in a ref so the mount effect (which moves focus) runs only once. Layout effect:
  // updated synchronously after each render, so an immediate Escape sees the latest state.
  const requestCloseRef = useRef(requestClose)
  useLayoutEffect(() => {
    requestCloseRef.current = requestClose
  })

  useEffect(() => {
    const id = Symbol('modal')
    openModals.push(id)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const previouslyFocused = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    const handleKey = (event: KeyboardEvent) => {
      const isTopMost = openModals[openModals.length - 1] === id
      if (event.key === 'Escape' && isTopMost) requestCloseRef.current()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      openModals.splice(openModals.indexOf(id), 1)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [])

  return createPortal(
    <ModalContext.Provider value={{ requestClose, dismissible }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) requestClose()
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy ?? fallbackId}
          tabIndex={-1}
          className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-xl border border-zinc-200 outline-none animate-pop-in ${className}`}
        >
          {children}
        </div>
      </div>

      {confirming && confirmClose && (
        <Modal onClose={() => setConfirming(false)} maxWidth="max-w-sm" className="p-6" labelledBy={`${fallbackId}-confirm`}>
          <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center mb-3">
            <LogOut className="w-5 h-5" />
          </div>
          <h3 id={`${fallbackId}-confirm`} className="text-base font-bold text-zinc-950">
            {confirmClose.title}
          </h3>
          <div className="text-xs text-zinc-500 mt-1.5">{confirmClose.message}</div>
          <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              autoFocus
              onClick={() => setConfirming(false)}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold"
            >
              {confirmClose.cancelLabel ?? 'Continuar aqui'}
            </button>
            <button
              onClick={() => {
                setConfirming(false)
                onClose()
              }}
              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
            >
              {confirmClose.confirmLabel ?? 'Sair e descartar'}
            </button>
          </div>
        </Modal>
      )}
    </ModalContext.Provider>,
    document.body,
  )
}

interface ModalCloseButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  children?: ReactNode
}

/** Close control that goes through the modal's confirmation (if any). Defaults to an "X" icon. */
export function ModalCloseButton({ children, className, disabled, ...props }: ModalCloseButtonProps) {
  const { requestClose, dismissible } = useModalClose()
  return (
    <button
      type="button"
      onClick={requestClose}
      disabled={disabled || !dismissible}
      aria-label={children ? undefined : 'Fechar'}
      className={className ?? 'absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 transition-colors disabled:opacity-50'}
      {...props}
    >
      {children ?? <X className="w-5 h-5" />}
    </button>
  )
}
