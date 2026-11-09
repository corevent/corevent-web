import { useState } from 'react'
import { CalendarDays } from 'lucide-react'

interface EventImageProps {
  src?: string | null
  alt: string
  className?: string
}

/** Banner (signed URL, expires in 6h) with a branded placeholder when missing or expired. */
export function EventImage({ src, alt, className = '' }: EventImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return (
      <div
        className={`bg-linear-to-br from-brand-soft via-brand-tint to-zinc-100 text-brand flex items-center justify-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <CalendarDays className="w-6 h-6 opacity-70" />
      </div>
    )
  }

  return <img src={src} alt={alt} className={`object-cover bg-zinc-100 ${className}`} onError={() => setFailedSrc(src)} />
}
