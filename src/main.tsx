import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { EventsProvider } from './app/EventsProvider.tsx'
import { UiProvider } from './app/UiProvider.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <UiProvider>
            <EventsProvider>
              <App />
            </EventsProvider>
          </UiProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
