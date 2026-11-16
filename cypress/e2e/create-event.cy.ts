import type { MockApi } from '../support/mock-api'

describe('criação de evento', () => {
  let api: MockApi
  beforeEach(() => {
    cy.mockApi().then((mock) => (api = mock))
    cy.visitSignedIn('/')
    cy.findByRole('heading', { name: 'Meus Eventos' }).should('be.visible')
  })

  function createOnlineEventWithLots() {
    cy.findByRole('button', { name: 'Criar evento' }).click()
    cy.findByRole('dialog', { name: 'Novo Evento' }).within(() => {
      cy.findByLabelText('Nome do Evento *').type('Workshop de React')
      cy.findByLabelText('Categoria').select('tech')
      cy.findByRole('button', { name: 'Avançar' }).click()

      cy.findByLabelText('Capacidade máxima *').type('300')
      cy.findByRole('radio', { name: 'Online' }).click()
      cy.findByRole('button', { name: 'Avançar' }).click()

      cy.findAllByLabelText('Nome do lote').eq(0).clear().type('Lote 1')
      cy.findAllByLabelText('Preço em reais').eq(0).type('50')
      cy.findAllByLabelText('Quantidade').eq(0).type('200')
      cy.findByRole('button', { name: 'Adicionar Lote' }).click()
      cy.findAllByLabelText('Nome do lote').eq(1).clear().type('Gratuito')
      cy.findAllByLabelText('Preço em reais').eq(1).type('0')
      cy.findAllByLabelText('Quantidade').eq(1).type('100')
      cy.findByRole('button', { name: 'Publicar Evento' }).click()
    })
    cy.findByRole('dialog', { name: 'Novo Evento' }).should('not.exist')
  }

  it('cria um evento online com dois lotes e publica', () => {
    createOnlineEventWithLots()

    cy.contains('article', 'Workshop de React').within(() => {
      cy.findByText('Publicado').should('be.visible')
      cy.findByText('0 / 300 (0%)').should('be.visible')
    })
    // Contract checks: created as draft with ISO dates, lots created, then published.
    cy.then(() => {
      const [created] = api.requestsTo('POST', '/events')
      expect(created.body).to.include({ title: 'Workshop de React', category: 'tech', locationType: 'online', status: 'draft' })
      expect(String((created.body as { startDate: string }).startDate)).to.match(/Z$/)
      expect(created.body).not.to.have.property('cityId')
      const lots = api.requestsTo('POST', /\/ticket-types$/).map((request) => request.body)
      expect(lots).to.have.length(2)
      expect(lots[0]).to.include({ name: 'Lote 1', price: 50, totalQuantity: 200 })
      expect(lots[1]).to.include({ name: 'Gratuito', price: 0, totalQuantity: 100 })
      expect(api.requestsTo('PATCH', /^\/events\/event-\d+$/).at(-1)?.body).to.deep.equal({ status: 'opened' })
    })
  })

  it('exige endereço completo em eventos presenciais e salva como rascunho', () => {
    cy.findByRole('button', { name: 'Criar evento' }).click()
    cy.findByRole('dialog', { name: 'Novo Evento' }).within(() => {
      cy.findByLabelText('Nome do Evento *').type('Feira Regional')
      cy.findByRole('button', { name: 'Avançar' }).click()
      cy.findByLabelText('Capacidade máxima *').type('100')

      cy.findByRole('button', { name: 'Avançar' }).click()
      cy.findByText('Informe o nome do local.').should('be.visible')

      cy.findByLabelText('Local / Estabelecimento *').type('Centro de Eventos')
      cy.findByLabelText('CEP *').type('17201000').should('have.value', '17201-000')
      cy.findByLabelText('Rua *').type('Rua das Flores')
      cy.findByLabelText('Número *').type('120')
      cy.findByLabelText('Bairro *').type('Centro')
      cy.findByLabelText('Estado *').select('35')
      cy.findByLabelText('Cidade *').select('3525300')
      cy.findByRole('button', { name: 'Avançar' }).click()

      cy.findByLabelText('Preço em reais').type('30')
      cy.findByLabelText('Quantidade').type('150')
      cy.findByRole('button', { name: 'Salvar rascunho' }).click()
      cy.findByText(/ultrapassa a capacidade do evento/).should('be.visible')
      cy.then(() => expect(api.requestsTo('POST', '/events')).to.have.length(0))

      cy.findByLabelText('Quantidade').clear().type('100')
      cy.findByRole('button', { name: 'Salvar rascunho' }).click()
    })

    cy.findByRole('dialog', { name: 'Novo Evento' }).should('not.exist')
    cy.contains('article', 'Feira Regional').within(() => {
      cy.findByText('Rascunho').should('be.visible')
      cy.findByText('Centro de Eventos, Jaú, SP').should('be.visible')
    })
    cy.then(() => {
      expect(api.requestsTo('POST', '/events')[0].body).to.include({ zipCode: '17201000', number: 120, cityId: 3525300, status: 'draft' })
    })
  })

  it('pede confirmação antes de descartar um evento em edição', () => {
    cy.findByRole('button', { name: 'Criar evento' }).click()
    cy.findByLabelText('Nome do Evento *').type('Rascunho importante')

    cy.get('body').type('{esc}')
    cy.findByRole('dialog', { name: 'Sair da criação do evento?' }).within(() => {
      cy.findByRole('button', { name: 'Continuar editando' }).click()
    })
    cy.findByLabelText('Nome do Evento *').should('have.value', 'Rascunho importante')

    cy.get('body').type('{esc}')
    cy.findByRole('dialog', { name: 'Sair da criação do evento?' }).within(() => {
      cy.findByRole('button', { name: 'Sair sem salvar' }).click()
    })
    cy.findByRole('dialog', { name: 'Novo Evento' }).should('not.exist')
  })

  context('layout mobile', () => {
    beforeEach(() => cy.viewport('iphone-x'))

    it('cria e publica um evento pelo botão do cabeçalho no celular', () => {
      createOnlineEventWithLots()
      cy.contains('article', 'Workshop de React').findByText('Publicado').should('be.visible')
    })
  })
})
