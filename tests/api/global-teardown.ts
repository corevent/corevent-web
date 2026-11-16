export default async function globalTeardown(): Promise<void> {
  globalThis.__PREVIEW_SERVER__?.kill()
}
