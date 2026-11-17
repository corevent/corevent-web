import { MockApi } from './mock-api'

let currentApi: MockApi | undefined

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Installs a fresh mocked API for the test. `setup` customizes its data before the app loads. */
      mockApi(setup?: (api: MockApi) => void): Chainable<MockApi>
      /** Opens `path` as a user who signed in on a previous visit (refresh token already stored). */
      visitSignedIn(path?: string): Chainable<Cypress.AUTWindow>
    }
  }
}

Cypress.Commands.add('mockApi', (setup?: (api: MockApi) => void) => {
  const api = new MockApi()
  setup?.(api)
  currentApi = api
  // Only real API calls: app modules such as /src/api/client.ts must not be intercepted.
  cy.intercept({ pathname: /^\/api\// }, (req) => {
    const url = new URL(req.url)
    const body = typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : undefined
    const authorization = req.headers.authorization as string | undefined
    const reply = api.handle(req.method, url.pathname.replace(/^\/api/, ''), url.searchParams, body, authorization)
    req.reply({ statusCode: reply.statusCode, body: reply.body ?? '' })
  })
  return cy.wrap(api, { log: false })
})

Cypress.Commands.add('visitSignedIn', (path = '/') => {
  if (!currentApi) throw new Error('call cy.mockApi() before cy.visitSignedIn()')
  const { refreshToken } = currentApi.issueTokens()
  return cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('corevent.refreshToken', refreshToken)
    },
  })
})

// Every test fails if the app called an endpoint the mock does not know (contract drift).
afterEach(() => {
  const api = currentApi
  currentApi = undefined
  if (api) expect(api.unhandled, 'requests not handled by the API mock').to.deep.equal([])
})
