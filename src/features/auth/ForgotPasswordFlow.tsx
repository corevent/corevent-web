import { useLayoutEffect, useState, type FormEvent } from 'react'
import * as authApi from '../../api/auth'
import { ApiError, getErrorMessage } from '../../api/errors'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, TextInput } from '../../components/ui/Field'
import { OtpInput } from '../../components/ui/OtpInput'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { PasswordRules } from '../../components/ui/PasswordRules'
import { isStrongPassword, isValidEmail } from '../../utils/validators'
import { StepHeader, StepTitle } from './StepHeader'
import { useCountdown } from './useCountdown'

type Phase = 'email' | 'otp' | 'reset-password'
const RESEND_SECONDS = 60

interface ForgotPasswordFlowProps {
  onBackToLogin: () => void
  onSuccess: (email: string) => void
  onBusyChange: (busy: boolean) => void
  onDirtyChange: (dirty: boolean) => void
}

// The API has no "verify code" endpoint: the code is only checked by
// POST /auth/reset-password together with the new password.
export function ForgotPasswordFlow({ onBackToLogin, onSuccess, onBusyChange, onDirtyChange }: ForgotPasswordFlowProps) {
  const [phase, setPhase] = useState<Phase>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusyState] = useState(false)
  const [resendIn, startResendCountdown] = useCountdown()

  const dirty = phase !== 'email' || email.trim() !== ''
  // Layout effect so the modal knows about unsaved input before the next key press.
  useLayoutEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  const setBusy = (value: boolean) => {
    setBusyState(value)
    onBusyChange(value)
  }

  const sendCode = async (): Promise<boolean> => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await authApi.forgotPassword(email.trim())
      startResendCountdown(RESEND_SECONDS)
      return true
    } catch (err) {
      setError(getErrorMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleSendCode = async (event: FormEvent) => {
    event.preventDefault()
    if (!isValidEmail(email)) return setError('Informe um e-mail válido.')
    if (await sendCode()) {
      setCode('')
      setPhase('otp')
    }
  }

  const handleVerify = (event: FormEvent) => {
    event.preventDefault()
    if (code.length !== 6) return setError('Digite os 6 dígitos do código.')
    setError('')
    setNotice('')
    setPhase('reset-password')
  }

  const handleReset = async (event: FormEvent) => {
    event.preventDefault()
    if (!isStrongPassword(newPassword)) return setError('A senha precisa cumprir todos os requisitos.')
    if (newPassword !== confirmPassword) return setError('As senhas não coincidem.')

    setBusy(true)
    setError('')
    try {
      await authApi.resetPassword(email.trim(), code, newPassword)
      setBusy(false)
      onSuccess(email.trim())
    } catch (err) {
      setBusy(false)
      const message = getErrorMessage(err)
      if (err instanceof ApiError && err.hasRawMessage(/^(Invalid code|Code expired|User not found)/)) {
        setCode('')
        setPhase(err.hasRawMessage('User not found') ? 'email' : 'otp')
      }
      setError(message)
    }
  }

  const handleBack = () => {
    setError('')
    setNotice('')
    if (phase === 'email') onBackToLogin()
    else if (phase === 'otp') setPhase('email')
    else setPhase('otp')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <StepHeader onBack={handleBack} disabled={busy} />

      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      {phase === 'email' && (
        <form onSubmit={handleSendCode} className="space-y-4" noValidate>
          <StepTitle title="Recuperar senha" subtitle="Informe o e-mail da sua conta Corevent (o mesmo usado no app) para receber o código." />
          <Field label="E-mail" htmlFor="forgot-email">
            <TextInput
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoFocus
            />
          </Field>
          <Button type="submit" size="lg" loading={busy}>
            {!busy && 'Enviar código'}
          </Button>
        </form>
      )}

      {phase === 'otp' && (
        <form onSubmit={handleVerify} className="space-y-4" noValidate>
          <StepTitle
            title="Verifique seu e-mail"
            subtitle={
              <>
                Se houver uma conta para <strong>{email}</strong>, enviamos um código de 6 dígitos.
              </>
            }
          />
          <OtpInput value={code} onChange={setCode} disabled={busy} />
          <Button type="submit" size="lg">
            Verificar
          </Button>
          <div className="text-center text-xs space-y-1">
            <p className="text-zinc-400">
              {resendIn > 0 ? (
                `Reenviar código (${resendIn}s)`
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (await sendCode()) setNotice('Enviamos um novo código.')
                  }}
                  className="text-brand font-bold"
                >
                  Reenviar código
                </button>
              )}
            </p>
            <button type="button" onClick={() => setPhase('email')} className="text-brand font-bold">
              Alterar e-mail
            </button>
          </div>
        </form>
      )}

      {phase === 'reset-password' && (
        <form onSubmit={handleReset} className="space-y-4" noValidate>
          <StepTitle title="Redefinir senha" subtitle="Escolha uma nova senha para sua conta." />
          <div>
            <label htmlFor="reset-password" className="block text-xs font-semibold text-zinc-700 mb-1">
              Nova senha
            </label>
            <PasswordInput
              id="reset-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              compact
              autoFocus
            />
            <PasswordRules password={newPassword} />
          </div>
          <Field label="Confirmar senha" htmlFor="reset-confirm">
            <PasswordInput
              id="reset-confirm"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita a senha"
              compact
            />
          </Field>
          <Button type="submit" size="lg" loading={busy}>
            {!busy && 'Redefinir senha'}
          </Button>
        </form>
      )}
    </div>
  )
}
