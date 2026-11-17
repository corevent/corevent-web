// Fixed timezone so date formatting is deterministic on any machine/CI (GitHub runners use UTC).
// It must be a globalSetup: setupFiles run after the worker's clock already picked up the system timezone.
export default function globalSetup(): void {
  process.env.TZ = 'America/Sao_Paulo'
}
