import { NavLink, Outlet, useNavigate } from 'react-router'
import { Layers, Lock, LogOut, User, Wallet } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { Avatar } from '../../components/Avatar'

const TABS = [
  { to: '/conta', label: 'Dados pessoais', icon: User, end: true },
  { to: '/conta/seguranca', label: 'Segurança', icon: Lock, end: false },
  { to: '/conta/recebimentos', label: 'Recebimentos', icon: Wallet, end: false },
]

export function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold text-zinc-950">Minha Conta</h1>
          <p className="text-xs text-zinc-500">Dados cadastrais e credenciais de acesso.</p>
        </div>
        <button
          onClick={async () => {
            await logout()
            navigate('/')
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <aside className="md:col-span-4 space-y-3">
          <div className="bg-white p-5 rounded-xl border border-zinc-200 flex items-center gap-3">
            <Avatar name={user.name} src={user.avatarUrl} className="w-14 h-14" textClassName="text-xl font-black" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-zinc-950 truncate">{user.name}</h3>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>

          <nav className="bg-white p-2 rounded-xl border border-zinc-200 space-y-1" aria-label="Seções da conta">
            {TABS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive ? 'bg-brand-tint text-brand' : 'text-zinc-700 hover:bg-zinc-50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}
            <NavLink
              to="/"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <Layers className="w-4 h-4" />
              <span>Meus Eventos</span>
            </NavLink>
          </nav>
        </aside>

        <section className="md:col-span-8 space-y-4">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
