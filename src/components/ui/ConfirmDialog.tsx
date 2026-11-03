import { useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { getErrorMessage } from '../../api/errors'
import { Alert } from './Alert'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  description: ReactNode
  confirmLabel: string
  tone?: 'primary' | 'danger'
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function ConfirmDialog({ title, description, confirmLabel, tone = 'primary', onConfirm, onClose }: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-sm" dismissible={!loading} className="p-6">
      <button onClick={onClose} disabled={loading} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800" aria-label="Fechar">
        <X className="w-4 h-4" />
      </button>
      <h3 className="text-base font-bold text-zinc-950 pr-6">{title}</h3>
      <div className="text-xs text-zinc-500 mt-1.5 space-y-2">{description}</div>
      {error && <Alert className="mt-3">{error}</Alert>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          Voltar
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} size="sm" onClick={handleConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
