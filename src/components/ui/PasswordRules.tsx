import { PASSWORD_RULES } from '../../utils/validators'

export function PasswordRules({ password }: { password: string }) {
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {PASSWORD_RULES.map(({ rule, label, test }) => {
        const ok = Boolean(password) && test(password)
        return (
          <span
            key={rule}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
              ok ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-600' : 'bg-zinc-400'}`} />
            {label}
          </span>
        )
      })}
    </div>
  )
}
