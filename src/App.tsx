import { useEffect } from 'react'
import { Link, Route, Routes } from 'react-router'
import { RefreshCw } from 'lucide-react'
import { useUi } from './app/useUi'
import { RequireAuth } from './auth/RequireAuth'
import { useAuth } from './auth/useAuth'
import { Footer } from './components/layout/Footer'
import { MobileAppNotice } from './components/layout/MobileAppNotice'
import { Navbar } from './components/layout/Navbar'
import { Alert } from './components/ui/Alert'
import { PageLoader } from './components/ui/PageLoader'
import { AccountPage } from './features/account/AccountPage'
import { PaymentInfoTab } from './features/account/PaymentInfoTab'
import { PersonalTab } from './features/account/PersonalTab'
import { SecurityTab } from './features/account/SecurityTab'
import { AuthModal } from './features/auth/AuthModal'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { VisitorGate } from './features/dashboard/VisitorGate'
import { CreateEventModal, OrganizerRequiredModal } from './features/events/CreateEventModal'

function HomePage() {
  const { status } = useAuth()
  if (status === 'loading') return <PageLoader label="Restaurando sua sessão…" />
  if (status === 'authenticated') return <DashboardPage />
  return <VisitorGate />
}

function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto my-16 text-center space-y-2 px-4">
      <h1 className="text-xl font-bold text-zinc-950">Página não encontrada</h1>
      <p className="text-xs text-zinc-500">O endereço acessado não existe neste site.</p>
      <Link to="/" className="inline-block mt-2 text-xs font-bold text-brand hover:underline">
        Voltar para Meus Eventos
      </Link>
    </div>
  )
}

export default function App() {
  const { status, bootError, retryBoot, sessionExpired } = useAuth()
  const { openAuth, createEventOpen, closeCreateEvent, organizerNoticeOpen, closeOrganizerNotice } = useUi()

  useEffect(() => {
    if (sessionExpired) openAuth('login')
  }, [sessionExpired, openAuth])

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-zinc-900">
      <Navbar />
      {/* Visitors: app to attend events. Signed in (managing events): app for check-in. */}
      <MobileAppNotice app={status === 'authenticated' ? 'organizer' : 'participant'} />

      <main className="flex-1 pb-14">
        {sessionExpired && status === 'anonymous' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <Alert tone="warning">Sua sessão expirou. Entre novamente para continuar.</Alert>
          </div>
        )}

        {status === 'error' ? (
          <div className="max-w-md mx-auto my-12 px-4">
            <Alert
              action={
                <button onClick={retryBoot} className="flex items-center gap-1 font-semibold whitespace-nowrap">
                  <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
                </button>
              }
            >
              Não foi possível restaurar sua sessão. {bootError}
            </Alert>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/conta"
              element={
                <RequireAuth>
                  <AccountPage />
                </RequireAuth>
              }
            >
              <Route index element={<PersonalTab />} />
              <Route path="seguranca" element={<SecurityTab />} />
              <Route path="recebimentos" element={<PaymentInfoTab />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        )}
      </main>

      <Footer />

      <AuthModal />
      {createEventOpen && <CreateEventModal onClose={closeCreateEvent} />}
      {organizerNoticeOpen && <OrganizerRequiredModal onClose={closeOrganizerNotice} />}
    </div>
  )
}
