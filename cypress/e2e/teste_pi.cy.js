// Teste de fluxo crítico do Projeto Integrador (modelo da "Missão Final" da disciplina).
// A API é simulada por cy.mockApi() (cypress/support), então o teste não depende de banco real.
describe('Teste de Fluxo Crítico - Projeto Integrador', () => {
  beforeEach(() => {
    cy.mockApi()
  })

  it('Deve executar o fluxo principal com sucesso', () => {
    // 1. URL onde o PI está rodando (baseUrl em cypress.config.ts: http://localhost:4174)
    cy.visit('/')

    // 2. Abrir o login e preencher os campos do formulário do PI
    cy.contains('button', 'Entrar na minha conta').click()
    cy.get('#login-email').type('ana@example.com')
    cy.get('#login-password').type('Senha@2026')

    // 3. Clicar no botão de ação
    cy.get('[role="dialog"]').contains('button', /^Entrar$/).click()

    // 4. Asserções: o login fecha e o painel "Meus Eventos" aparece com os eventos do usuário
    cy.url().should('eq', `${Cypress.config('baseUrl')}/`)
    cy.get('[role="dialog"]').should('not.exist')
    cy.get('h1').should('contain', 'Meus Eventos')
    cy.contains('Festival de Verão').should('be.visible')
    cy.contains('button', 'Ana').should('be.visible') // nome do usuário no menu do cabeçalho
  })
})
