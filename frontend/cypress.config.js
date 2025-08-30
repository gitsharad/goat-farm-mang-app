const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // Implement node event listeners here
    },
  },
  env: {
    apiUrl: 'http://localhost:5000/api',
    testUser: {
      email: 'test@example.com',
      password: 'Test@1234',
    },
  },
});
