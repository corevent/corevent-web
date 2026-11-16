import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { join } from 'node:path'
import { BASE_URL, BUILD_DIR, PREVIEW_PORT } from './server'

declare global {
  // Shared with global-teardown (Jest runs both in the same process).
  var __PREVIEW_SERVER__: ChildProcess | undefined
}

// Jest compiles this file to CommonJS, so `import.meta` is not available here.
const viteBin = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js')

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Preview server did not start at ${url}`)
}

/** Builds the site exactly like the deploy (`vite build`, production mode) and serves it with `vite preview`. */
export default async function globalSetup(): Promise<void> {
  const build = spawnSync(process.execPath, [viteBin, 'build', '--outDir', BUILD_DIR, '--emptyOutDir', '--logLevel', 'error'], {
    stdio: 'inherit',
  })
  if (build.status !== 0) throw new Error('vite build failed')

  globalThis.__PREVIEW_SERVER__ = spawn(
    process.execPath,
    [viteBin, 'preview', '--outDir', BUILD_DIR, '--port', String(PREVIEW_PORT), '--strictPort'],
    { stdio: 'ignore' },
  )
  await waitForServer(BASE_URL)
}
