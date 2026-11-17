import { defineConfig } from 'cypress'

// E2E tests with Cypress. The site is started by `pnpm test:e2e` (start-server-and-test)
// at http://localhost:4174 and the API is mocked per test with cy.intercept
// (cypress/support/mock-api.ts), so runs are deterministic and never touch real data.
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4174',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 8000,
    retries: { runMode: 2, openMode: 0 },
    video: Boolean(process.env.CI),
    screenshotOnRunFailure: true,
  },
})
