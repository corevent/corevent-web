import { useState } from 'react'
import { CalendarPlus, Smartphone } from 'lucide-react'
import { useUi } from '../../app/useUi'
import { AppDownloadModal } from '../../components/layout/AppDownloadModal'
import { OneAccountNotice } from '../../components/layout/OneAccountNotice'

/** Welcome screen for visitors (also shown on protected routes while signed out). */
export function VisitorGate() {
  const { openAuth } = useUi()
  const [showApp, setShowApp] = useState(false)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center mx-auto">
          <CalendarPlus className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-950">Crie e gerencie seus eventos</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Entre com a <strong>mesma conta que você usa no app Corevent</strong> para criar eventos, configurar lotes de
            ingressos e acompanhar suas vendas.
          </p>
        </div>
        <div className="pt-2 space-y-2">
          <button
            onClick={() => openAuth('login')}
            className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-colors"
          >
            Entrar na minha conta
          </button>
          <button
            onClick={() => openAuth('register')}
            className="w-full py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors"
          >
            Ainda não tenho conta Corevent
          </button>
        </div>
      </div>

      <OneAccountNotice />

      <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-zinc-950">Quer ir a um evento?</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              A compra de ingressos e os seus passes ficam no app Corevent para participantes, com a mesma conta.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowApp(true)}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold"
        >
          Baixar app Corevent
        </button>
      </div>

      {showApp && <AppDownloadModal app="participant" onClose={() => setShowApp(false)} />}
    </div>
  )
}
