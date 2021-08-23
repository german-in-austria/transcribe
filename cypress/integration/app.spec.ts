/// <reference types="cypress" />

// import * as transcriptService from '../../src/store/transcript'
const testBackend = 'dioedb.demo.dioe.at'

describe('My App', () => {
  it('loads without immediately crashing', () => {
    cy.visit('http://localhost:8080')
  })
  it('can select a private server', () => {
    cy.get('[data-cy=select-backend]').click()
    cy.contains(testBackend).click()
  })
  it('shows the login prompt when the user’s not logged in', () => {
    cy.get('[data-cy=login-link]').should('be.visible')
    // const addEventFn = cy.stub(transcriptService, 'addEvent').callsFake()
  })
})
