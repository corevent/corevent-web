import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import App from '../../src/App'
import { EventsProvider } from '../../src/app/EventsProvider'
import { UiProvider } from '../../src/app/UiProvider'
import { AuthProvider } from '../../src/auth/AuthProvider'
import { createDb, createHandlers, type MockDb } from '../mocks/api'
import { server } from './setup'

/** Renders the whole application (same provider tree as src/main.tsx) against the mocked API. */
export function renderApp({ route = '/', db = createDb() }: { route?: string; db?: MockDb } = {}) {
  server.use(...createHandlers(db))
  const user = userEvent.setup()
  const view = render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <UiProvider>
          <EventsProvider>
            <App />
          </EventsProvider>
        </UiProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
  return { ...view, user, db }
}
