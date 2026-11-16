import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_URL } from '../mocks/api'
import { TEST_PASSWORD } from '../mocks/fixtures'
import { renderApp } from './render'
import { server } from './setup'

async function fillFirstSteps(user: ReturnType<typeof renderApp>['user'], document: string) {
  await user.click(screen.getByRole('button', { name: 'Ainda não tenho conta Corevent' }))
  const dialog = within(screen.getByRole('dialog'))
  await user.type(dialog.getByLabelText('Nome completo'), 'Bruno Produtor')
  await user.type(dialog.getByLabelText('Dia'), '10')
  await user.type(dialog.getByLabelText('Mês'), '05')
  await user.type(dialog.getByLabelText('Ano'), '1995')
  await user.click(dialog.getByRole('button', { name: 'Próximo' }))
  await user.click(dialog.getByRole('button', { name: 'Próximo' })) // Pessoa Física (default)
  await user.type(dialog.getByLabelText('CPF'), document)
  await user.click(dialog.getByRole('button', { name: 'Próximo' }))
  return dialog
}

describe('registration', () => {
  it('blocks an invalid CPF before calling the API', async () => {
    const { user, db } = renderApp()
    const dialog = await fillFirstSteps(user, '11111111111')

    expect(dialog.getByText('Informe um CPF válido.')).toBeInTheDocument()
    expect(dialog.getByText('Etapa 3 de 5')).toBeInTheDocument()
    expect(db.requests).toEqual([])
  })

  it('verifies the e-mail, creates the account with a clean payload and signs in', async () => {
    let registerBody: Record<string, unknown> | undefined
    const { user, db } = renderApp()
    server.use(
      http.post(`${API_URL}/auth/register`, async ({ request }) => {
        registerBody = (await request.json()) as Record<string, unknown>
        db.user = { ...db.user, email: String(registerBody.email), name: String(registerBody.name) }
        return HttpResponse.json({ data: db.user }, { status: 201 })
      }),
    )
    const dialog = await fillFirstSteps(user, '529.982.247-25')

    await user.type(dialog.getByLabelText(/E-mail/), 'bruno@example.com')
    await user.type(dialog.getByLabelText('Senha'), TEST_PASSWORD)
    await user.type(dialog.getByLabelText('Confirmar senha'), TEST_PASSWORD)
    db.password = TEST_PASSWORD
    await user.click(dialog.getByRole('button', { name: 'Enviar código' }))

    expect(await dialog.findByRole('heading', { name: 'Verifique seu e-mail' })).toBeInTheDocument()
    await user.type(dialog.getByLabelText('Dígito 1'), '123456')
    await user.click(dialog.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('heading', { name: 'Meus Eventos' })).toBeInTheDocument()
    expect(db.requests).toContain('POST /auth/verify-email')
    expect(registerBody).toEqual({
      name: 'Bruno Produtor',
      email: 'bruno@example.com',
      password: TEST_PASSWORD,
      birthDate: '1995-05-10',
      documentType: 'cpf',
      document: '52998224725',
      verifyEmailCode: '123456',
    })
  })

  it('keeps the user on the code step when the code is wrong', async () => {
    const { user, db } = renderApp()
    const dialog = await fillFirstSteps(user, '52998224725')
    await user.type(dialog.getByLabelText(/E-mail/), 'bruno@example.com')
    await user.type(dialog.getByLabelText('Senha'), TEST_PASSWORD)
    await user.type(dialog.getByLabelText('Confirmar senha'), TEST_PASSWORD)
    await user.click(dialog.getByRole('button', { name: 'Enviar código' }))

    await user.type(await dialog.findByLabelText('Dígito 1'), '000000')
    await user.click(dialog.getByRole('button', { name: 'Criar conta' }))

    expect(await dialog.findByText('Código incorreto. Restam 4 tentativa(s).')).toBeInTheDocument()
    expect(dialog.getByRole('heading', { name: 'Verifique seu e-mail' })).toBeInTheDocument()
    expect(db.requests.filter((request) => request === 'POST /auth/register')).toHaveLength(1)
  })
})
