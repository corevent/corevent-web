import { useEffect, useState } from 'react'

/** Seconds left until a resend is allowed (the API throttles code e-mails to 3/minute). */
export function useCountdown(): [number, (seconds: number) => void] {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  return [secondsLeft, setSecondsLeft]
}
