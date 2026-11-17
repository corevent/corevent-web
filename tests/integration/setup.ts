import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { clearTokens } from '../../src/auth/tokenStorage'

// Network-level API mock shared by every integration test. Each test registers the
// handlers it needs with `server.use(...)`; unhandled requests fail the test.
export const server = setupServer()

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
  clearTokens()
  localStorage.clear()
})

afterAll(() => server.close())
