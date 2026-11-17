import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Integration tests: React rendered in jsdom with the API mocked at the network layer (MSW).
// Unit and HTTP (Supertest) tests run in Jest (jest.config.js); E2E tests in Cypress.
export default defineConfig({
  plugins: [react()],
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['tests/integration/setup.ts'],
    // Fixed timezone so date formatting is deterministic on any machine/CI.
    env: { TZ: 'America/Sao_Paulo' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.d.ts'],
      reporter: ['text-summary', 'html', 'json'],
      reportsDirectory: 'coverage/integration',
    },
  },
})
