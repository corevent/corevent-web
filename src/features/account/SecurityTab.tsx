import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../../api/errors'
import { changePassword } from '../../api/users'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { PasswordRules } from '../../components/ui/PasswordRules'
import { isStrongPassword } from '../../utils/validators'

export function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!currentPassword) return setMessage({ tone: 'error', text: 'Digite sua senha atual.' })
    if (!isStrongPassword(newPassword)) return setMessage({ tone: 'error', text: 'A nova senha não atende a todos os critérios.' })
    if (newPassword !== confirmPassword) return setMessage({ tone: 'error', text: 'A confirmação não confere.' })

    setSaving(true)
    setMessage(null)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage({ tone: 'success', text: 'Senha alterada com sucesso.' })
    } catch (err) {
      setMessage({ tone: 'error', text: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-zinc-200 space-y-4">
      <h3 className="text-sm font-bold text-zinc-950 uppercase">Altere sua senha</h3>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <Field label="Senha atual" htmlFor="sec-current">
          <PasswordInput
            id="sec-current"
            compact
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Senha atual"
          />
        </Field>
        <div>
          <label htmlFor="sec-new" className="block text-xs font-semibold text-zinc-700 mb-1">
            Nova senha
          </label>
          <PasswordInput
            id="sec-new"
            compact
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
          <PasswordRules password={newPassword} />
        </div>
        <Field label="Confirmar nova senha" htmlFor="sec-confirm">
          <PasswordInput
            id="sec-confirm"
            compact
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
          />
        </Field>
        <Button type="submit" size="sm" loading={saving} className="rounded-lg">
          Redefinir senha
        </Button>
      </form>
    </div>
  )
}
