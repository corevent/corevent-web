import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HttpResponse, http } from 'msw'
import { API_URL, createDb, seedSession } from '../mocks/api'
import { makeEvent, makeLot } from '../mocks/fixtures'
import { renderApp } from './render'
import { server } from './setup'

function signedInDb(overrides: Parameters<typeof createDb>[0] = {}) {
  const db = createDb(overrides)
  seedSession(db)
  return db
}

const normalize = (text: string | null) => text?.replace(/\s/g, ' ')

describe('organizer dashboard', () => {
  it('computes the KPIs from the ticket lots', async () => {
    renderApp({ db: signedInDb() })

    const sold = await screen.findByText('Ingressos Vendidos')
    await waitFor(() => expect(normalize(sold.parentElement!.textContent)).toContain('120 / 500'))
    expect(normalize(screen.getByText('Receita Bruta Total').parentElement!.textContent)).toContain('R$ 12.000,00')
    expect(screen.getByText('Taxa de Ocupação').parentElement).toHaveTextContent('24%')
  })

  it('filters events by status and search', async () => {
    const db = signedInDb({
      events: [makeEvent(), makeEvent({ id: 'event-2', title: 'Feira Gastronômica', status: 'draft' })],
      lots: [],
    })
    const { user } = renderApp({ db })
    await screen.findByText('Feira Gastronômica')

    await user.click(screen.getByRole('button', { name: 'Rascunhos' }))
    expect(screen.queryByText('Festival de Verão')).not.toBeInTheDocument()
    expect(screen.getByText('Feira Gastronômica')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Todos/ }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar evento' }), 'gastronomica')
    expect(screen.getByText('Feira Gastronômica')).toBeInTheDocument()
    expect(screen.queryByText('Festival de Verão')).not.toBeInTheDocument()
  })

  it('publishes a draft after confirmation', async () => {
    const db = signedInDb({ events: [makeEvent({ id: 'event-2', title: 'Feira Gastronômica', status: 'draft' })], lots: [] })
    const { user } = renderApp({ db })

    await user.click(await screen.findByRole('button', { name: 'Publicar evento' }))
    const confirm = screen.getByRole('dialog', { name: 'Publicar evento?' })
    expect(within(confirm).getByText(/ainda não possui lotes/)).toBeInTheDocument()
    await user.click(within(confirm).getByRole('button', { name: 'Publicar' }))

    expect(await screen.findByText('"Feira Gastronômica" foi publicado.')).toBeInTheDocument()
    expect(db.events[0].status).toBe('opened')
  })

  it('deletes a draft removing its lots first (no cascade in the database)', async () => {
    const db = signedInDb({
      events: [makeEvent({ id: 'event-2', title: 'Feira Gastronômica', status: 'draft' })],
      lots: [makeLot({ id: 'lot-2', eventId: 'event-2' })],
    })
    const { user } = renderApp({ db })

    await user.click(await screen.findByRole('button', { name: 'Excluir rascunho' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Excluir rascunho?' })).getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByText('"Feira Gastronômica" foi excluído.')).toBeInTheDocument()
    const deletes = db.requests.filter((request) => request.startsWith('DELETE'))
    expect(deletes).toEqual(['DELETE /events/ticket-types/lot-2', 'DELETE /events/event-2'])
  })

  it('asks users without payment info to register it before creating events', async () => {
    const { user } = renderApp({ db: signedInDb({ paymentInfos: [] }) })

    expect(await screen.findByText(/cadastre seus/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Criar evento' }))

    expect(screen.getByRole('dialog', { name: 'Cadastre seus dados de recebimento' })).toBeInTheDocument()
  })

  it('shows an error with retry when the events cannot be loaded', async () => {
    let failing = true
    const db = signedInDb()
    const { user } = renderApp({ db })
    // Registered after the default handlers, so it takes precedence; returning nothing falls through.
    server.use(
      http.get(`${API_URL}/events/my/organizer`, () => {
        if (failing) return HttpResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 })
      }),
    )

    expect(await screen.findByText(/Não foi possível carregar seus eventos/)).toBeInTheDocument()
    failing = false
    await user.click(screen.getByRole('button', { name: /Tentar novamente/ }))

    expect(await screen.findByText('Festival de Verão')).toBeInTheDocument()
  })
})
