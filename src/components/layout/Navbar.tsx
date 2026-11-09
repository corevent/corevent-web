import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { ChevronDown, Layers, Lock, LogOut, Plus, User, Wallet } from 'lucide-react'
import { useOrganizerEvents } from '../../app/useOrganizerEvents'
import { useUi } from '../../app/useUi'
import { useAuth } from '../../auth/useAuth'
import { firstName } from '../../utils/format'
import { Avatar } from '../Avatar'
import { CoreventLogo } from '../CoreventLogo'

const MENU_ITEMS = [
  { to: '/', label: 'Meus Eventos Criados', icon: Layers },
  { to: '/conta', label: 'Dados pessoais', icon: User },
  { to: '/conta/seguranca', label: 'Segurança & Senha', icon: Lock },
  { to: '/conta/recebimentos', label: 'Dados de recebimento', icon: Wallet },
]

export function Navbar() {
  const { user, status, isOrganizer, logout } = useAuth()
  const { openAuth, requestCreateEvent } = useUi()
  const { events } = useOrganizerEvents()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  const handleSignOut = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.5rem] flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand hover:opacity-95"
            aria-label="Ir para Meus Eventos"
          >
            <CoreventLogo size="md" />
          </Link>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
            Gestão de eventos
          </span>
        </div>

        {status === 'authenticated' && (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 border-b-2 ${
                  isActive ? 'text-brand font-bold border-brand' : 'border-transparent hover:text-zinc-950'
                }`
              }
            >
              <Layers className="w-4 h-4 text-brand" />
              <span>Meus Eventos</span>
              {events.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-xs font-bold inline-flex items-center justify-center">
                  {events.length}
                </span>
              )}
            </NavLink>
          </nav>
        )}

        <div className="flex items-center gap-3 shrink-0">
          {status === 'authenticated' && user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={requestCreateEvent}
                aria-label="Criar evento"
                className="flex items-center gap-1.5 p-2 sm:px-3.5 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Criar evento</span>
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2.5 p-1.5 sm:pr-3 rounded-full hover:bg-zinc-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <Avatar name={user.name} src={user.avatarUrl} className="w-9 h-9 shadow-sm ring-2 ring-white" />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-zinc-900 leading-tight max-w-28 truncate">{firstName(user.name)}</div>
                    <div className="text-[10px] text-zinc-500 font-medium">Minha conta</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-zinc-100 p-2 z-50 animate-pop-in"
                  >
                    <div className="p-3 border-b border-zinc-100 mb-1 flex items-center gap-3">
                      <Avatar name={user.name} src={user.avatarUrl} className="w-11 h-11" textClassName="text-base" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-zinc-900 truncate">{user.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        {isOrganizer ? (
                          <span className="inline-block mt-0.5 text-[10px] font-medium text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                            Pronto para criar eventos
                          </span>
                        ) : isOrganizer === false ? (
                          <span className="inline-block mt-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            Cadastre o recebimento
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      {MENU_ITEMS.map(({ to, label, icon: Icon }) => (
                        <button
                          key={to}
                          role="menuitem"
                          onClick={() => {
                            setMenuOpen(false)
                            navigate(to)
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 rounded-xl transition-colors"
                        >
                          <Icon className="w-4 h-4 text-brand" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-zinc-100 mt-2 pt-1">
                      <button
                        role="menuitem"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair da conta</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : status === 'loading' ? null : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => openAuth('login')}
                className="hidden sm:block px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-brand transition-colors rounded-xl whitespace-nowrap"
              >
                Entrar com a conta do app
              </button>
              <button
                onClick={() => openAuth('login')}
                className="sm:hidden px-3 py-2 text-xs font-semibold text-zinc-700 hover:text-brand rounded-xl"
              >
                Entrar
              </button>
              <button
                onClick={() => openAuth('register')}
                className="px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover active:bg-brand-active shadow-[0_2px_8px_rgba(255,85,40,0.3)] hover:shadow-[0_4px_14px_rgba(255,85,40,0.4)] rounded-xl transition-all whitespace-nowrap"
              >
                Criar conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
