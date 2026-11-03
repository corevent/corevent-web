import { ExternalLink, ScanLine, Smartphone } from 'lucide-react'
import { MOBILE_APPS, type MobileAppKind } from '../../config/apps'
import { Modal, ModalCloseButton } from '../ui/Modal'

export function AppDownloadModal({ app, onClose }: { app: MobileAppKind; onClose: () => void }) {
  const info = MOBILE_APPS[app]
  const Icon = app === 'organizer' ? ScanLine : Smartphone
  const titleId = `app-download-${app}`

  return (
    <Modal onClose={onClose} maxWidth="max-w-sm" className="p-6" labelledBy={titleId}>
      <ModalCloseButton />

      <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[11px] font-bold text-brand uppercase tracking-wider">{info.audience}</p>
      <h3 id={titleId} className="text-lg font-bold text-zinc-950">
        App {info.name}
      </h3>
      <p className="text-xs text-zinc-500 mt-1">{info.summary}</p>

      <ol className="mt-4 space-y-2.5">
        {info.steps.map((step, index) => (
          <li key={step} className="flex gap-2.5 text-xs text-zinc-700">
            <span className="w-5 h-5 rounded-full bg-brand text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      {info.storeUrl ? (
        <a
          href={info.storeUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold flex items-center justify-center gap-1.5"
        >
          Baixar {info.name} <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : (
        <p className="mt-5 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-500 text-center">
          O link para download estará disponível em breve nas lojas de aplicativos.
        </p>
      )}

      <ModalCloseButton className="mt-3 w-full py-2 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50">
        Fechar
      </ModalCloseButton>
    </Modal>
  )
}
