import type { MockApi } from '../support/mock-api'

describe('minha conta', () => {
  let api: MockApi
  beforeEach(() => {
    cy.mockApi().then((mock) => (api = mock))
  })

  it('mostra dados cadastrais e atualiza o contato', () => {
    cy.visitSignedIn('/conta')
    cy.findByText('529.982.247-25').should('be.visible')
    cy.findByText('10/05/1995').should('be.visible')

    cy.findByRole('button', { name: 'Editar' }).click()
    cy.findByLabelText('Nome completo').clear().type('Ana Souza')
    cy.findByLabelText('Telefone').clear().type('1432345678')
    cy.findByRole('button', { name: 'Salvar' }).click()

    cy.findByText('Dados de contato atualizados.').should('be.visible')
    cy.then(() => {
      expect(api.requestsTo('PATCH', '/users')[0].body).to.deep.equal({ name: 'Ana Souza', phoneNumber: '1432345678' })
    })
  })

  it('recusa a troca de senha com a senha atual incorreta', () => {
    cy.visitSignedIn('/conta/seguranca')
    cy.findByLabelText('Senha atual').type('Errada@123')
    cy.findByLabelText('Nova senha').type('NovaSenha@1')
    cy.findByLabelText('Confirmar nova senha').type('NovaSenha@1')
    cy.findByRole('button', { name: 'Redefinir senha' }).click()

    cy.findByText('A senha atual está incorreta.').should('be.visible')
  })
})
