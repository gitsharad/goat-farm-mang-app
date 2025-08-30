import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure test id attribute
global.IS_REACT_ACT_ENVIRONMENT = true;

// Custom matchers
import '@testing-library/jest-dom/matchers';

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {},
  };
};

// Configure test timeout
jest.setTimeout(30000);

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

// Mock console.error to fail tests on PropType warnings
const originalConsoleError = console.error;
console.error = (message, ...args) => {
  if (/(Failed prop type|Invalid prop|Warning:)/i.test(message)) {
    throw new Error(message);
  }
  originalConsoleError(message, ...args);
};
