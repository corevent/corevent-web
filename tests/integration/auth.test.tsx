import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createDb, seedSession } from '../mocks/api'
import { TEST_PASSWORD } from '../mocks/fixtures'
import { renderApp } from './render'

async function openLogin(user: ReturnType<typeof renderApp>['user']) {
  await user.click(screen.getByRole('button', { name: 'Entrar na minha conta' }))
  return within(screen.getByRole('dialog'))
}

describe('authentication', () => {
  it('shows the welcome screen to visitors', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'Crie e gerencie seus eventos' })).toBeInTheDocument()
    expect(screen.getByText(/mesma conta que você usa no app Corevent/)).toBeInTheDocument()
  })

  it('signs in and loads the organizer dashboard', async () => {
    const { user, db } = renderApp()
    const dialog = await openLogin(user)

    await user.type(dialog.getByLabelText('E-mail'), db.user.email)
    await user.type(dialog.getByLabelText('Senha'), TEST_PASSWORD)
    await user.click(dialog.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Meus Eventos' })).toBeInTheDocument()
    expect(await screen.findByText('Festival de Verão')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(localStorage.getItem('corevent.refreshToken')).toMatch(/^refresh-/)
  })

  it('shows a translated error for invalid credentials', async () => {
    const { user, db } = renderApp()
    const dialog = await openLogin(user)

    await user.type(dialog.getByLabelText('E-mail'), db.user.email)
    await user.type(dialog.getByLabelText('Senha'), 'Errada@123')
    await user.click(dialog.getByRole('button', { name: 'Entrar' }))

    expect(await dialog.findByText('E-mail ou senha incorretos.')).toBeInTheDocument()
    expect(localStorage.getItem('corevent.refreshToken')).toBeNull()
  })

  it('restores the session from the stored refresh token', async () => {
    const db = createDb()
    seedSession(db)
    renderApp({ db })

    expect(await screen.findByText('Festival de Verão')).toBeInTheDocument()
    expect(db.requests).toContain('POST /auth/refresh')
  })

  it('signs out, revokes the refresh token and returns to the welcome screen', async () => {
    const db = createDb()
    seedSession(db)
    const { user } = renderApp({ db })

    await user.click(await screen.findByRole('button', { name: /minha conta/i }))
    await user.click(screen.getByRole('menuitem', { name: 'Sair da conta' }))

    expect(await screen.findByRole('heading', { name: 'Crie e gerencie seus eventos' })).toBeInTheDocument()
    await waitFor(() => expect(db.requests).toContain('POST /auth/logout'))
    expect(localStorage.getItem('corevent.refreshToken')).toBeNull()
  })

  it('protects account pages for visitors', async () => {
    renderApp({ route: '/conta' })
    expect(await screen.findByRole('heading', { name: 'Crie e gerencie seus eventos' })).toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getByRole('heading', { name: 'Bem-vindo de volta!' })).toBeInTheDocument()
  })
})
