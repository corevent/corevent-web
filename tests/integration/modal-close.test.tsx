import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './render'

describe('closing modals with unsaved input', () => {
  it('closes an empty modal with Escape without asking', async () => {
    const { user } = renderApp()
    await user.click(screen.getByRole('button', { name: 'Entrar na minha conta' }))

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('asks for confirmation before discarding typed data', async () => {
    const { user } = renderApp()
    await user.click(screen.getByRole('button', { name: 'Entrar na minha conta' }))
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')

    await user.keyboard('{Escape}')

    const confirm = screen.getByRole('dialog', { name: 'Fechar o login?' })
    await user.click(within(confirm).getByRole('button', { name: 'Continuar entrando' }))
    expect(screen.getByLabelText('E-mail')).toHaveValue('ana@example.com')
  })

  it('discards the data when the user confirms (backdrop click)', async () => {
    const { user } = renderApp()
    await user.click(screen.getByRole('button', { name: 'Entrar na minha conta' }))
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')

    // The backdrop is the element that wraps the dialog panel.
    await user.click(screen.getByRole('dialog').parentElement!)
    const confirm = screen.getByRole('dialog', { name: 'Fechar o login?' })
    await user.click(within(confirm).getByRole('button', { name: 'Fechar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
