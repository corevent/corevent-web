import { useState } from 'react'
import { useUi } from '../../app/useUi'
import type { AuthView } from '../../app/uiContext'
import { CoreventLogo } from '../../components/CoreventLogo'
import { Modal, ModalCloseButton, type CloseConfirmation } from '../../components/ui/Modal'
import { ForgotPasswordFlow } from './ForgotPasswordFlow'
import { LoginView } from './LoginView'
import { RegisterFlow } from './RegisterFlow'

const CLOSE_CONFIRMATIONS: Record<Exclude<AuthView, 'none'>, CloseConfirmation> = {
  login: {
    title: 'Fechar o login?',
    message: 'O que você digitou será descartado. Você pode entrar novamente quando quiser.',
    confirmLabel: 'Fechar',
    cancelLabel: 'Continuar entrando',
  },
  register: {
    title: 'Sair do cadastro?',
    message:
      'As informações que você preencheu ainda não foram salvas. Se sair agora, elas serão perdidas e o cadastro terá de ser feito do início.',
    confirmLabel: 'Sair do cadastro',
    cancelLabel: 'Continuar cadastro',
  },
  'forgot-password': {
    title: 'Sair da recuperação de senha?',
    message: 'Sua senha não será alterada. Para tentar de novo, será preciso solicitar um novo código.',
    confirmLabel: 'Sair',
    cancelLabel: 'Continuar recuperação',
  },
}

export function AuthModal() {
  const { authView, openAuth, closeAuth } = useUi()
  // Prefills the login after a password reset.
  const [loginPrefill, setLoginPrefill] = useState<{ email: string; notice: string } | null>(null)
  const [busy, setBusy] = useState(false)
  // Whether the current flow has user input that would be lost on close.
  const [dirty, setDirty] = useState(false)

  if (authView === 'none') return null

  const close = () => {
    setLoginPrefill(null)
    setDirty(false)
    closeAuth()
  }

  const switchView = (view: Exclude<AuthView, 'none'>) => {
    setDirty(false)
    openAuth(view)
  }

  return (
    <Modal
      onClose={close}
      dismissible={!busy}
      confirmClose={dirty ? CLOSE_CONFIRMATIONS[authView] : null}
      className="p-6 sm:p-8 max-h-[95vh] overflow-y-auto"
      labelledBy="auth-title"
    >
      <ModalCloseButton />

      <div className="flex justify-center mb-6">
        <CoreventLogo size="md" />
      </div>

      {authView === 'login' && (
        <LoginView
          key={loginPrefill?.email ?? 'login'}
          initialEmail={loginPrefill?.email}
          notice={loginPrefill?.notice}
          onForgotPassword={() => switchView('forgot-password')}
          onRegister={() => switchView('register')}
          onSuccess={close}
          onBusyChange={setBusy}
          onDirtyChange={setDirty}
        />
      )}

      {authView === 'register' && (
        <RegisterFlow
          onBackToLogin={() => switchView('login')}
          onSuccess={close}
          onBusyChange={setBusy}
          onDirtyChange={setDirty}
        />
      )}

      {authView === 'forgot-password' && (
        <ForgotPasswordFlow
          onBackToLogin={() => switchView('login')}
          onSuccess={(email) => {
            setLoginPrefill({ email, notice: 'Senha redefinida com sucesso. Entre com a nova senha.' })
            switchView('login')
          }}
          onBusyChange={setBusy}
          onDirtyChange={setDirty}
        />
      )}
    </Modal>
  )
}
