import { useLayoutEffect, useState, type FormEvent } from 'react'
import { getErrorMessage } from '../../api/errors'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, TextInput } from '../../components/ui/Field'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { isValidEmail } from '../../utils/validators'

interface LoginViewProps {
  initialEmail?: string
  notice?: string
  onForgotPassword: () => void
  onRegister: () => void
  onSuccess: () => void
  onBusyChange: (busy: boolean) => void
  onDirtyChange: (dirty: boolean) => void
}

export function LoginView({
  initialEmail = '',
  notice,
  onForgotPassword,
  onRegister,
  onSuccess,
  onBusyChange,
  onDirtyChange,
}: LoginViewProps) {
  const { login, sessionExpired } = useAuth()
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const dirty = email.trim() !== initialEmail || password !== ''
  // Layout effect so the modal knows about unsaved input before the next key press.
  useLayoutEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isValidEmail(email) || !password) {
      setError('Informe um e-mail válido e a senha.')
      return
    }
    // The API rejects passwords shorter than 8 characters before checking credentials.
    if (password.length < 8) {
      setError('E-mail ou senha incorretos.')
      return
    }
    setSubmitting(true)
    onBusyChange(true)
    setError('')
    try {
      await login(email, password)
      onSuccess()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
      onBusyChange(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 id="auth-title" className="text-2xl font-bold text-zinc-950 tracking-tight">
          Bem-vindo de volta!
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Use o <strong>mesmo e-mail e senha do app Corevent</strong>. Sua conta serve para participar e para criar
          eventos.
        </p>
      </div>

      {sessionExpired && !error && <Alert tone="warning">Sua sessão expirou. Entre novamente para continuar.</Alert>}
      {notice && !error && <Alert tone="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="E-mail" htmlFor="login-email">
          <TextInput
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu@email.com"
            required
            autoFocus
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="login-password" className="block text-xs font-semibold text-zinc-700">
              Senha
            </label>
            <button type="button" onClick={onForgotPassword} className="text-xs font-semibold text-brand hover:underline">
              Esqueceu a senha?
            </button>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            required
          />
        </div>

        <Button type="submit" size="lg" loading={submitting}>
          {!submitting && 'Entrar'}
        </Button>
      </form>

      <p className="text-center pt-2 text-xs text-zinc-500">
        Ainda não tem conta Corevent?{' '}
        <button onClick={onRegister} className="font-bold text-brand hover:underline">
          Cadastre-se
        </button>
      </p>
    </div>
  )
}
