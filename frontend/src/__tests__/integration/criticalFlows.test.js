import React from 'react';
import { render, screen, fireEvent, waitFor } from 'test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

// Import components
import App from '../../App';
import Login from '../../pages/Login';
import Dashboard from '../../pages/Dashboard';
import GoatDetail from '../../pages/Goat/GoatDetail';
import PoultryProduction from '../../pages/Poultry/PoultryProduction';

// Mock API responses
const mockAuthResponse = {
  data: {
    token: 'test-token',
    user: {
      _id: 'user1',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      role: 'admin'
    }
  }
};

const mockGoatData = {
  data: {
    _id: 'g1',
    tagNumber: 'GT-001',
    name: 'Test Goat',
    breed: 'Boer',
    dateOfBirth: '2020-01-01',
    gender: 'Female',
    status: 'Active',
    weight: 45.5
  }
};

const mockPoultryProductionData = {
  data: {
    dailyProduction: [
      { date: '2023-06-15', eggs: 45, feedConsumption: 5.5 },
      { date: '2023-06-14', eggs: 43, feedConsumption: 5.3 },
    ],
    weeklyAverage: 6.2,
    monthlyTotal: 1300,
    feedConversionRatio: 2.1
  }
};

describe('Critical User Flows', () => {
  beforeEach(() => {
    // Clear all mocks and localStorage
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock API responses
    require('../../services/api').post.mockImplementation((url) => {
      if (url.includes('auth/login')) {
        return Promise.resolve(mockAuthResponse);
      }
      return Promise.resolve({ data: {} });
    });
    
    require('../../services/api').get.mockImplementation((url) => {
      if (url.includes('goats/g1')) {
        return Promise.resolve(mockGoatData);
      }
      if (url.includes('poultry/production')) {
        return Promise.resolve(mockPoultryProductionData);
      }
      return Promise.resolve({ data: [] });
    });
  });

  test('User login -> View goat details -> Update goat information', async () => {
    // Render the login page
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/goats/:id" element={<GoatDetail />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    );
    
    // 1. Login
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'password123' } 
    });
    
    const loginButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(loginButton);
    
    // Wait for login to complete and redirect
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
    });
    
    // 2. Navigate to goat detail (simulated by directly rendering GoatDetail with mock data)
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/goats/g1']}>
          <Routes>
            <Route path="/goats/:id" element={<GoatDetail />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
      { wrapper: undefined } // Don't wrap with providers again
    );
    
    // 3. Verify goat details are displayed
    await waitFor(() => {
      expect(screen.getByText('Test Goat')).toBeInTheDocument();
      expect(screen.getByText('GT-001')).toBeInTheDocument();
    });
    
    // 4. Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    // 5. Update goat information
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Goat Name' } });
    
    // 6. Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);
    
    // 7. Verify API was called with updated data
    await waitFor(() => {
      expect(require('../../services/api').put).toHaveBeenCalledWith(
        expect.stringContaining('goats/g1'),
        expect.objectContaining({
          name: 'Updated Goat Name',
          tagNumber: 'GT-001'
        })
      );
    });
  });

  test('User views poultry production dashboard and adds new record', async () => {
    // Mock successful POST for adding production record
    require('../../services/api').post.mockResolvedValueOnce({ 
      data: { message: 'Production record added successfully' } 
    });
    
    // Render the production dashboard
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/poultry/production']}>
          <Routes>
            <Route path="/poultry/production" element={<PoultryProduction />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    );
    
    // 1. Wait for production data to load
    await waitFor(() => {
      expect(screen.getByText(/weekly average/i)).toBeInTheDocument();
    });
    
    // 2. Click add record button
    const addButton = screen.getByRole('button', { name: /add record/i });
    fireEvent.click(addButton);
    
    // 3. Fill in the form
    fireEvent.change(screen.getByLabelText(/number of eggs/i), { 
      target: { value: '50' } 
    });
    
    // 4. Submit the form
    const saveButton = screen.getByRole('button', { name: /save record/i });
    fireEvent.click(saveButton);
    
    // 5. Verify API was called with correct data
    await waitFor(() => {
      expect(require('../../services/api').post).toHaveBeenCalledWith(
        'poultry/production',
        expect.objectContaining({
          eggs: 50,
          date: expect.any(String)
        })
      );
    });
    
    // 6. Verify success message is displayed
    expect(await screen.findByText(/record added successfully/i)).toBeInTheDocument();
  });

  test('User navigates through the application', async () => {
    // Render the app with initial route
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </I18nextProvider>
    );
    
    // 1. Verify login page is shown initially
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    
    // 2. Login
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'password123' } 
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // 3. Verify dashboard is shown after login
    await waitFor(() => {
      expect(screen.getByText(/welcome back, test!/i)).toBeInTheDocument();
    });
    
    // 4. Click on Poultry menu item (assuming there's a navigation menu)
    const poultryMenu = screen.getByRole('link', { name: /poultry/i });
    fireEvent.click(poultryMenu);
    
    // 5. Click on Production submenu
    const productionLink = screen.getByRole('link', { name: /production/i });
    fireEvent.click(productionLink);
    
    // 6. Verify production page is shown
    await waitFor(() => {
      expect(screen.getByText(/poultry production/i)).toBeInTheDocument();
    });
  });
});
