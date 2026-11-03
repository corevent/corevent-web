import { useState } from 'react'
import { useNavigate } from 'react-router'
import { KeyRound, ScanLine, Smartphone } from 'lucide-react'
import { useUi } from '../../app/useUi'
import { useAuth } from '../../auth/useAuth'
import { MOBILE_APPS, type MobileAppKind } from '../../config/apps'
import { CoreventLogo } from '../CoreventLogo'
import { AppDownloadModal } from './AppDownloadModal'

const linkClass = 'hover:text-white transition-colors text-left'

const APP_CARDS: { app: MobileAppKind; icon: typeof Smartphone; title: string; text: string; cta: string }[] = [
  {
    app: 'participant',
    icon: Smartphone,
    title: 'Vai a um evento? Use o app Corevent',
    text: 'Compra de ingressos e passes ficam no app para participantes, com a mesma conta deste site.',
    cta: 'Baixar app Corevent',
  },
  {
    app: 'organizer',
    icon: ScanLine,
    title: 'Organiza um evento? Use o app para colaboradores',
    text: 'O check-in dos ingressos na entrada é feito pelo app Corevent Colaboradores, entrando com a mesma conta.',
    cta: 'Baixar app para colaboradores',
  },
]

export function Footer() {
  const [openApp, setOpenApp] = useState<MobileAppKind | null>(null)
  const { openAuth } = useUi()
  const { status } = useAuth()
  const navigate = useNavigate()

  const goTo = (path: string) => {
    if (path !== '/' && status !== 'authenticated') {
      openAuth('login')
      return
    }
    navigate(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-900 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {APP_CARDS.map(({ app, icon: Icon, title, text, cta }) => (
            <div key={app} className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4 justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand/20 text-brand flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{title}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{text}</p>
                </div>
              </div>
              <button
                onClick={() => setOpenApp(app)}
                className="self-start px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                <span>{cta}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-zinc-900">
          <div className="lg:col-span-2 space-y-4">
            <CoreventLogo size="md" inverted />
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              No site, você cria eventos, configura lotes de ingressos e acompanha as vendas. Nos apps, você participa de
              eventos e faz o check-in dos seus.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <KeyRound className="w-4 h-4 text-brand" />
              <span>Uma única conta Corevent para participar e organizar</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Seus eventos</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => goTo('/')} className={linkClass}>
                  Meus eventos criados
                </button>
              </li>
              <li>
                <button onClick={() => goTo('/')} className={linkClass}>
                  Lotes & preços
                </button>
              </li>
              <li>
                <button onClick={() => setOpenApp('organizer')} className={linkClass}>
                  Check-in pelo app para colaboradores
                </button>
              </li>
              <li>
                <button onClick={() => setOpenApp('participant')} className={linkClass}>
                  Comprar ingressos pelo app {MOBILE_APPS.participant.name}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Sua conta</h4>
            <ul className="space-y-2 text-xs">
              {status !== 'authenticated' && (
                <>
                  <li>
                    <button onClick={() => openAuth('login')} className={linkClass}>
                      Entrar com a conta do app
                    </button>
                  </li>
                  <li>
                    <button onClick={() => openAuth('register')} className={linkClass}>
                      Criar conta Corevent
                    </button>
                  </li>
                </>
              )}
              <li>
                <button onClick={() => goTo('/conta')} className={linkClass}>
                  Dados cadastrais (CPF/CNPJ)
                </button>
              </li>
              <li>
                <button onClick={() => goTo('/conta/seguranca')} className={linkClass}>
                  Segurança & senha
                </button>
              </li>
              <li>
                <button onClick={() => goTo('/conta/recebimentos')} className={linkClass}>
                  Dados de recebimento
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Corevent · Criação e gestão de eventos.</p>
        </div>
      </div>

      {openApp && <AppDownloadModal app={openApp} onClose={() => setOpenApp(null)} />}
    </footer>
  )
}
