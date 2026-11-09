import { useLayoutEffect, useState, type FormEvent } from 'react'
import { Building2, Check, User as UserIcon } from 'lucide-react'
import * as authApi from '../../api/auth'
import { ApiError, getErrorMessage } from '../../api/errors'
import type { DocumentType } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, TextInput, inputClass } from '../../components/ui/Field'
import { OtpInput } from '../../components/ui/OtpInput'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { PasswordRules } from '../../components/ui/PasswordRules'
import { maskDocument } from '../../utils/format'
import { isStrongPassword, isValidCnpj, isValidCpf, isValidEmail, onlyDigits, toIsoDate } from '../../utils/validators'
import { StepHeader, StepTitle } from './StepHeader'
import { useCountdown } from './useCountdown'

type Step = 1 | 2 | 3 | 4 | 5
const TOTAL_STEPS = 5
const RESEND_SECONDS = 60

interface RegisterFlowProps {
  onBackToLogin: () => void
  onSuccess: () => void
  onBusyChange: (busy: boolean) => void
  onDirtyChange: (dirty: boolean) => void
}

export function RegisterFlow({ onBackToLogin, onSuccess, onBusyChange, onDirtyChange }: RegisterFlowProps) {
  const { login } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType>('cpf')
  const [document, setDocument] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusyState] = useState(false)
  const [accountCreated, setAccountCreated] = useState(false)
  const [resendIn, startResendCountdown] = useCountdown()

  const dirty =
    !accountCreated &&
    (step > 1 || [name, day, month, year, document, email, password, confirmPassword].some((value) => value !== ''))
  // Layout effect so the modal knows about unsaved input before the next key press.
  useLayoutEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  const setBusy = (value: boolean) => {
    setBusyState(value)
    onBusyChange(value)
  }

  const goTo = (next: Step) => {
    setError('')
    setNotice('')
    setStep(next)
  }

  const requestCode = async (): Promise<boolean> => {
    setBusy(true)
    setError('')
    try {
      await authApi.sendVerifyEmailCode(email.trim())
      startResendCountdown(RESEND_SECONDS)
      return true
    } catch (err) {
      setError(getErrorMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleNext = async (event?: FormEvent) => {
    event?.preventDefault()
    setError('')

    if (step === 1) {
      if (name.trim().length < 3) return setError('Informe seu nome completo.')
      const birthDate = toIsoDate(day, month, year)
      if (!birthDate) return setError('Informe uma data de nascimento válida.')
      if (new Date(birthDate) > new Date() || Number(year) < 1900) return setError('Informe uma data de nascimento válida.')
      return goTo(2)
    }

    if (step === 2) return goTo(3)

    if (step === 3) {
      const valid = documentType === 'cpf' ? isValidCpf(document) : isValidCnpj(document)
      if (!valid) return setError(`Informe um ${documentType === 'cpf' ? 'CPF' : 'CNPJ'} válido.`)
      return goTo(4)
    }

    if (step === 4) {
      if (!isValidEmail(email)) return setError('Informe um e-mail válido.')
      if (!isStrongPassword(password)) return setError('A senha precisa cumprir todos os requisitos.')
      if (password !== confirmPassword) return setError('As senhas não coincidem.')
      // The API only creates the account with the code sent to this e-mail.
      if (await requestCode()) {
        setCode('')
        goTo(5)
      }
      return
    }

    await handleCreateAccount()
  }

  const handleCreateAccount = async () => {
    if (code.length !== 6) return setError('Digite os 6 dígitos do código.')

    setBusy(true)
    try {
      await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        birthDate: toIsoDate(day, month, year)!,
        documentType,
        document: onlyDigits(document),
        verifyEmailCode: code,
      })
    } catch (err) {
      setBusy(false)
      handleRegisterError(err)
      return
    }

    try {
      await login(email, password)
      setBusy(false)
      onSuccess()
    } catch {
      setBusy(false)
      setAccountCreated(true)
    }
  }

  // /auth/register validates (and consumes) the code before the other checks,
  // so any non-code error requires a new code.
  const handleRegisterError = (err: unknown) => {
    const message = getErrorMessage(err)
    const isCodeError = err instanceof ApiError && err.hasRawMessage(/^(Invalid code|Code expired)/)
    if (isCodeError || !(err instanceof ApiError) || err.status !== 400) {
      setCode('')
      setError(message)
      return
    }
    const resendNote = 'Ao continuar, enviaremos um novo código.'
    if (err.hasRawMessage(/CPF|CNPJ|^Document/)) {
      goTo(3)
    } else {
      goTo(4)
    }
    setError(message)
    setNotice(resendNote)
  }

  const handleBack = () => {
    if (step === 1) onBackToLogin()
    else goTo((step - 1) as Step)
  }

  if (accountCreated) {
    return (
      <div className="space-y-4 animate-fade-in">
        <StepTitle title="Conta criada!" subtitle="Seu cadastro foi concluído." />
        <Alert tone="success">Não foi possível entrar automaticamente. Entre com seu e-mail e senha.</Alert>
        <Button size="lg" onClick={onBackToLogin}>
          Ir para o login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleNext} className="space-y-5 animate-fade-in" noValidate>
      <StepHeader onBack={handleBack} step={step} total={TOTAL_STEPS} disabled={busy} />

      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="info">{notice}</Alert>}

      {step === 1 && (
        <div className="space-y-4">
          <StepTitle title="Conte-nos sobre você" subtitle="Vamos começar com o básico para criar seu perfil." />
          <Field label="Nome completo" htmlFor="reg-name">
            <TextInput
              id="reg-name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome completo"
              autoFocus
            />
          </Field>
          <fieldset>
            <legend className="block text-xs font-semibold text-zinc-700 mb-1">Data de nascimento</legend>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: day, set: setDay, placeholder: 'Dia', max: 2, label: 'Dia' },
                { value: month, set: setMonth, placeholder: 'Mês', max: 2, label: 'Mês' },
                { value: year, set: setYear, placeholder: 'Ano', max: 4, label: 'Ano' },
              ].map((part) => (
                <input
                  key={part.label}
                  aria-label={part.label}
                  inputMode="numeric"
                  maxLength={part.max}
                  value={part.value}
                  onChange={(event) => part.set(onlyDigits(event.target.value))}
                  placeholder={part.placeholder}
                  className={`${inputClass} text-center px-2`}
                />
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <StepTitle title="Pessoa ou empresa?" subtitle="Selecione o tipo da sua conta." />
          <div className="space-y-2.5" role="radiogroup">
            {(
              [
                { type: 'cpf', title: 'Pessoa Física', subtitle: 'Usar CPF', Icon: UserIcon },
                { type: 'cnpj', title: 'Pessoa Jurídica', subtitle: 'Usar CNPJ', Icon: Building2 },
              ] as const
            ).map(({ type, title, subtitle, Icon }) => {
              const selected = documentType === type
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    if (type !== documentType) setDocument('')
                    setDocumentType(type)
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                    selected ? 'border-brand bg-brand-tint' : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-zinc-900">{title}</span>
                    <span className="block text-xs text-zinc-500">{subtitle}</span>
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selected ? 'border-brand bg-brand text-white' : 'border-zinc-300'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <StepTitle title="Seu documento" subtitle="Informe o documento da sua conta." />
          <Field label={documentType === 'cpf' ? 'CPF' : 'CNPJ'} htmlFor="reg-document">
            <TextInput
              id="reg-document"
              inputMode="numeric"
              value={document}
              onChange={(event) => setDocument(maskDocument(event.target.value, documentType))}
              placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0001-00'}
              className="font-mono"
              autoFocus
            />
          </Field>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <StepTitle
            title="Credenciais de acesso"
            subtitle="Com este e-mail e senha você entra neste site e nos apps Corevent."
          />
          <Field label="E-mail" htmlFor="reg-email" hint="Enviaremos um código de verificação para este e-mail.">
            <TextInput
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              compact
            />
          </Field>
          <div>
            <label htmlFor="reg-password" className="block text-xs font-semibold text-zinc-700 mb-1">
              Senha
            </label>
            <PasswordInput
              id="reg-password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              compact
            />
            <PasswordRules password={password} />
          </div>
          <Field label="Confirmar senha" htmlFor="reg-confirm">
            <PasswordInput
              id="reg-confirm"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita a senha"
              compact
            />
          </Field>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <StepTitle
            title="Verifique seu e-mail"
            subtitle={
              <>
                Enviamos um código de 6 dígitos para <strong>{email}</strong>
              </>
            }
          />
          <OtpInput value={code} onChange={setCode} disabled={busy} />
        </div>
      )}

      <Button type="submit" size="lg" loading={busy}>
        {!busy && (step === 4 ? 'Enviar código' : step === 5 ? 'Criar conta' : 'Próximo')}
      </Button>

      {step === 5 && (
        <div className="text-center text-xs space-y-1">
          <p className="text-zinc-400">
            {resendIn > 0 ? (
              `Reenviar código (${resendIn}s)`
            ) : (
              <button type="button" onClick={() => void requestCode()} disabled={busy} className="text-brand font-bold">
                Reenviar código
              </button>
            )}
          </p>
          <button type="button" onClick={() => goTo(4)} disabled={busy} className="text-brand font-bold">
            Alterar e-mail
          </button>
        </div>
      )}

      {step === 1 && (
        <p className="text-center text-xs text-zinc-500">
          Já usa o app Corevent? Não crie outra conta:{' '}
          <button type="button" onClick={onBackToLogin} className="font-bold text-brand hover:underline">
            entre com ela
          </button>
        </p>
      )}
    </form>
  )
}
