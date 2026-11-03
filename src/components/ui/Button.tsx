import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'dark' | 'outline' | 'soft' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-bold shadow-sm',
  dark: 'bg-zinc-900 hover:bg-zinc-800 text-white font-semibold',
  outline: 'border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold',
  soft: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 font-medium',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white font-bold',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 rounded-lg text-xs gap-1.5',
  md: 'px-4 py-2 rounded-xl text-xs gap-1.5',
  lg: 'w-full py-3 rounded-xl text-sm gap-2',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner className="w-4 h-4" light={variant === 'primary' || variant === 'dark' || variant === 'danger'} /> : icon}
      {children}
    </button>
  )
}
