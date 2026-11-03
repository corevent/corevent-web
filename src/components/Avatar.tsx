import { useState } from 'react'
import { getInitials } from '../utils/format'

interface AvatarProps {
  name: string
  src?: string | null
  className?: string
  textClassName?: string
}

/** Peach circle with coral initials (mockup), or the signed avatar URL when available. */
export function Avatar({ name, src, className = 'w-9 h-9', textClassName = 'text-sm' }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = Boolean(src) && failedSrc !== src

  return (
    <span
      className={`rounded-full bg-brand-soft flex items-center justify-center text-brand font-extrabold shrink-0 overflow-hidden ${textClassName} ${className}`}
    >
      {showImage ? (
        <img src={src!} alt={name} className="w-full h-full object-cover" onError={() => setFailedSrc(src ?? null)} />
      ) : (
        getInitials(name)
      )}
    </span>
  )
}
