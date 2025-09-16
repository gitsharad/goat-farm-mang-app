import React from 'react';
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from './i18n';

// Mock API
const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

// Mock context providers
const AllTheProviders = ({ children }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </I18nextProvider>
  );
};

// Custom render with providers
const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Export mock API
export { mockApi };

// Common test data
export const testUser = {
  _id: 'user1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  role: 'admin'
};

export const testDairyAnimal = {
  _id: 'd1',
  tagNumber: 'GOAT-001',
  name: 'Test Goat',
  breed: 'Saanen',
  dateOfBirth: '2020-01-01',
  gender: 'Female',
  status: 'Active',
  lastMilkingDate: '2023-06-15',
  lastBreedingDate: '2023-01-15',
  isPregnant: true,
  expectedDeliveryDate: '2023-10-15'
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
