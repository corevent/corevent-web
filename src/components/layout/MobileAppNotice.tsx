import { useState } from 'react'
import { ScanLine, Smartphone } from 'lucide-react'
import type { MobileAppKind } from '../../config/apps'
import { AppDownloadModal } from './AppDownloadModal'

/**
 * Top notice bar. Visitors see the participant app; signed-in users (who manage events here)
 * see the organizer app used for check-in at the entrance.
 */
export function MobileAppNotice({ app }: { app: MobileAppKind }) {
  const [open, setOpen] = useState(false)
  const Icon = app === 'organizer' ? ScanLine : Smartphone

  return (
    <>
      <aside aria-label="Aplicativos Corevent" className="bg-brand-tint border-b border-brand/20 px-4 py-2.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-zinc-800">
            <span className="p-1 rounded bg-brand text-white shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </span>
            {app === 'organizer' ? (
              <span>
                <strong>Check-in na entrada:</strong> a validação dos ingressos é feita pelo{' '}
                <strong>app para colaboradores</strong>. Entre nele com esta mesma conta e escolha o evento.
              </span>
            ) : (
              <span>
                <strong>Quer comprar ingressos?</strong> Use o app <strong>Corevent</strong> com a mesma conta deste site.
                Aqui você cria e gerencia seus próprios eventos.
              </span>
            )}
          </div>

          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold transition-colors shrink-0 text-xs"
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{app === 'organizer' ? 'Baixar app para colaboradores' : 'Baixar app Corevent'}</span>
          </button>
        </div>
      </aside>
      {open && <AppDownloadModal app={app} onClose={() => setOpen(false)} />}
    </>
  )
}
