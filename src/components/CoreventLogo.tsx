import logoUrl from '../assets/logo.webp'
import logoWhiteUrl from '../assets/logo-white.webp'

interface CoreventLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** White wordmark for dark backgrounds (footer). */
  inverted?: boolean
}

// The artwork is 1405×252 (≈5.6:1); only the height is set so the width follows.
const HEIGHTS = {
  sm: 'h-5',
  md: 'h-7',
  lg: 'h-9',
}

export function CoreventLogo({ className = '', size = 'md', inverted = false }: CoreventLogoProps) {
  return (
    <img
      src={inverted ? logoWhiteUrl : logoUrl}
      alt="Corevent"
      width={1405}
      height={252}
      draggable={false}
      className={`${HEIGHTS[size]} w-auto select-none ${className}`}
    />
  )
}
