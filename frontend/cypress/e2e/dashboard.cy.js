/// <reference types="cypress" />

describe('Goat Farm Dashboard', () => {
  beforeEach(() => {
    // Mock API responses
    cy.intercept('GET', '/api/goats*', {
      statusCode: 200,
      body: {
        data: [
          { id: 1, name: 'Daisy', age: 2, weight: 45, gender: 'female' },
          { id: 2, name: 'Max', age: 3, weight: 60, gender: 'male' },
        ],
      },
    }).as('getGoats');

    cy.intercept('GET', '/api/health*', {
      statusCode: 200,
      body: {
        data: [
          { id: 1, goatId: 1, status: 'healthy', date: '2023-05-01' },
          { id: 2, goatId: 2, status: 'healthy', date: '2023-05-01' },
        ],
      },
    }).as('getHealth');

    cy.intercept('GET', '/api/breeding*', {
      statusCode: 200,
      body: {
        data: [
          { id: 1, goatId: 1, status: 'pregnant', expectedDate: '2023-11-15' },
        ],
      },
    }).as('getBreeding');

    // Visit the login page
    cy.visit('/login');
  });

  it('successfully logs in and displays the dashboard', () => {
    // Fill in the login form
    cy.get('input[name="email"]').type('admin@example.com');
    cy.get('input[name="password"]').type('admin123');
    
    // Mock successful login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'test-token',
        user: { id: 1, name: 'Admin', role: 'admin' },
      },
    }).as('loginRequest');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Wait for the dashboard to load
    cy.wait(['@loginRequest', '@getGoats', '@getHealth', '@getBreeding']);

    // Verify dashboard content
    cy.contains('Goat Farm Dashboard').should('be.visible');
    cy.contains('Total Goats').should('be.visible');
    cy.contains('2').should('be.visible'); // Should show 2 goats
    cy.contains('Pregnant Goats').should('be.visible');
    cy.contains('1').should('be.visible'); // Should show 1 pregnant goat

    // Verify navigation
    cy.get('nav').should('be.visible');
    cy.get('nav a').should('have.length.at.least', 3); // At least 3 navigation items
  });

  it('displays an error for invalid login', () => {
    // Mock failed login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' },
    }).as('loginRequest');

    // Fill in the login form with invalid credentials
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Verify error message is displayed
    cy.contains('Invalid credentials').should('be.visible');
  });
});
