/// <reference types="cypress" />

// import * as transcriptService from '../../src/store/transcript'
const testBackend = 'dioedb.demo.dioe.at'

describe('My App', () => {
  it('loads without immediately crashing', () => {
    cy.visit('/')
  })
  // it('can select a private server', () => {
  //   cy.get('[data-cy=select-backend]').click()
  //   cy.contains(testBackend).click()
  // })
  // it('shows the login prompt when the user’s not logged in', () => {
  //   cy.get('[data-cy=login-link]').should('be.visible')
  //   // const addEventFn = cy.stub(transcriptService, 'addEvent').callsFake()
  // })

  // it('test', () => {
  //   cy.visit('https://dioedb.demo.dioe.at/')
  //   cy.get('input[name=username]').type('arni')
  //   cy.get('input[name=password]').type('arni')
  //   cy.get('form').submit()
  // })
  // it('is logged in', () => {
  //   cy.visit('/')
  // })
})
