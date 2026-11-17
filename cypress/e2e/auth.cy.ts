import type { MockApi } from '../support/mock-api'

describe('autenticação', () => {
  let api: MockApi
  beforeEach(() => {
    cy.mockApi().then((mock) => (api = mock))
  })

  it('credenciais inválidas mostram erro traduzido', () => {
    cy.visit('/')
    cy.findByRole('button', { name: 'Entrar na minha conta' }).click()
    cy.findByRole('dialog').within(() => {
      cy.findByLabelText('E-mail').type('ana@example.com')
      cy.findByLabelText('Senha').type('Errada@123')
      cy.findByRole('button', { name: 'Entrar' }).click()
      cy.findByText('E-mail ou senha incorretos.').should('be.visible')
    })
  })

  it('sessão é restaurada ao recarregar e encerrada no logout', () => {
    cy.visitSignedIn('/')
    cy.findByText('Festival de Verão').should('be.visible')

    cy.reload()
    cy.findByText('Festival de Verão').should('be.visible')

    cy.findByRole('button', { name: /minha conta/i }).click()
    cy.findByRole('menuitem', { name: 'Sair da conta' }).click()
    cy.findByRole('heading', { name: 'Crie e gerencie seus eventos' }).should('be.visible')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('corevent.refreshToken')).to.equal(null)
      expect(api.requestsTo('POST', '/auth/logout')).to.have.length(1)
    })
  })

  it('sessão revogada leva ao login com aviso de sessão expirada', () => {
    cy.visitSignedIn('/')
    cy.findByText('Festival de Verão').should('be.visible')

    cy.then(() => {
      api.sessionRevoked = true
    })
    cy.findByRole('button', { name: /minha conta/i }).click()
    cy.findByRole('menuitem', { name: 'Dados de recebimento' }).click()

    cy.findByRole('dialog').findByText('Sua sessão expirou. Entre novamente para continuar.').should('be.visible')
  })

  context('layout mobile', () => {
    beforeEach(() => cy.viewport('iphone-x'))

    it('entra com a conta e vê o painel no celular', () => {
      cy.visit('/')
      cy.findByRole('button', { name: 'Entrar na minha conta' }).click()
      cy.findByRole('dialog').within(() => {
        cy.findByLabelText('E-mail').type('ana@example.com')
        cy.findByLabelText('Senha').type('Senha@2026')
        cy.findByRole('button', { name: 'Entrar' }).click()
      })
      cy.findByRole('heading', { name: 'Meus Eventos' }).should('be.visible')
      cy.findByText('Festival de Verão').should('be.visible')
    })
  })
})
