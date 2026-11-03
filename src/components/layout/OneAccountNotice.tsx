import { CalendarPlus, KeyRound, Ticket } from 'lucide-react'

const POINTS = [
  {
    icon: KeyRound,
    title: 'A mesma conta do app',
    text: 'Use aqui o mesmo e-mail e senha do app Corevent. Não é preciso criar uma conta separada para organizar eventos.',
  },
  {
    icon: CalendarPlus,
    title: 'Crie eventos quando quiser',
    text: 'Para publicar eventos, basta cadastrar seus dados de recebimento (PIX ou conta bancária) na sua conta.',
  },
  {
    icon: Ticket,
    title: 'Continue participando',
    text: 'Organizar eventos não muda nada na sua conta: você segue comprando ingressos de outros eventos pelo app.',
  },
]

/** Explains that one Corevent account is used both to attend and to organize events. */
export function OneAccountNotice({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-label="Uma conta para participar e organizar"
      className={`bg-white rounded-2xl border border-zinc-200 ${compact ? 'p-4' : 'p-5 sm:p-6'}`}
    >
      <h2 className="text-sm font-bold text-zinc-950">Uma única conta Corevent para participar e organizar</h2>
      <div className={`grid gap-4 mt-3 ${compact ? '' : 'sm:grid-cols-3'}`}>
        {POINTS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3">
            <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-zinc-900">{title}</h3>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
