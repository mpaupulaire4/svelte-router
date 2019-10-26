/// <reference types="Cypress" />

context('Home', () => {
  beforeEach(() => {
  })

  it('should have basic title ', () => {
    cy.visit('/')
    cy.title().should('eq', 'Svelte App')
  })

  it('should have home ', () => {
    cy.visit('/home')
    cy.title().should('eq', 'home')
  })
})
