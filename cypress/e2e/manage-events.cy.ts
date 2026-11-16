import { makeEvent } from '../../tests/mocks/fixtures'
import type { MockApi } from '../support/mock-api'

describe('gestão de eventos', () => {
  it('adiciona lote a um rascunho e publica pelo modal de lotes', () => {
    let api!: MockApi
    cy.mockApi((mock) => {
      mock.events = [makeEvent({ id: 'event-9', title: 'Show Acústico', status: 'draft' })]
      mock.lots = []
    }).then((mock) => (api = mock))
    cy.visitSignedIn('/')

    cy.contains('article', 'Show Acústico').findByRole('button', { name: 'Gerenciar Lotes' }).click()
    cy.findByRole('dialog', { name: 'Lotes: Show Acústico' }).within(() => {
      cy.findByText('Nenhum lote cadastrado.', { exact: false }).should('be.visible')
      cy.findByRole('button', { name: 'Adicionar Lote' }).click()
      cy.findByLabelText('Nome do Lote').type('Pista')
      cy.findByLabelText('Preço Unitário (R$)').clear().type('80')
      cy.findByLabelText(/^Quantidade/).clear().type('150')
      cy.findByRole('button', { name: 'Salvar Lote' }).click()
      cy.findByText('Lote adicionado com sucesso.').should('be.visible')
      cy.findByText('Pista').should('be.visible')
      cy.findByRole('button', { name: 'Publicar Evento' }).click()
    })
    cy.findByRole('dialog', { name: 'Publicar evento?' }).findByRole('button', { name: 'Publicar' }).click()

    cy.findByText('"Show Acústico" foi publicado.').should('be.visible')
    cy.then(() => expect(api.events[0].status).to.equal('opened'))
  })

  it('exporta participantes em CSV sem fórmulas perigosas', () => {
    cy.mockApi()
    cy.visitSignedIn('/')

    cy.contains('article', 'Festival de Verão').findByRole('button', { name: 'Gerenciar Lotes' }).click()
    cy.findByRole('dialog', { name: 'Lotes: Festival de Verão' }).findByRole('button', { name: 'Exportar CSV' }).click()

    cy.readFile(`${Cypress.config('downloadsFolder')}/participantes-festival-de-verao.csv`).then((content: string) => {
      expect(content).to.contain('Nome;E-mail;Ingressos')
      expect(content).to.contain('Carla Souza;carla@example.com;2')
      expect(content).to.contain(`"'=HYPERLINK(""http://evil"")"`)
    })
  })

  it('cancela um evento publicado após confirmação', () => {
    cy.mockApi()
    cy.visitSignedIn('/')

    cy.contains('article', 'Festival de Verão').findByRole('button', { name: 'Cancelar evento' }).click()
    cy.findByRole('dialog', { name: 'Cancelar evento?' }).findByRole('button', { name: 'Cancelar evento' }).click()

    cy.findByText('"Festival de Verão" foi cancelado.').should('be.visible')
    cy.contains('article', 'Festival de Verão').findByText('Cancelado').should('be.visible')
  })
})
