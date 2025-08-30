import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GoatDashboard from '../GoatDashboard.new';
import { MemoryRouter } from 'react-router-dom';

// Mock the API calls
jest.mock('../../../services/api', () => ({
  get: jest.fn().mockImplementation((url) => {
    if (url.includes('goats')) {
      return Promise.resolve({
        data: {
          data: [
            { id: 1, name: 'Daisy', age: 2, weight: 45, gender: 'female' },
            { id: 2, name: 'Max', age: 3, weight: 60, gender: 'male' },
          ],
        },
      });
    }
    if (url.includes('health')) {
      return Promise.resolve({
        data: {
          data: [
            { id: 1, goatId: 1, status: 'healthy', date: '2023-05-01' },
            { id: 2, goatId: 2, status: 'healthy', date: '2023-05-01' },
          ],
        },
      });
    }
    if (url.includes('breeding')) {
      return Promise.resolve({
        data: {
          data: [
            { id: 1, goatId: 1, status: 'pregnant', expectedDate: '2023-11-15' },
          ],
        },
      });
    }
    return Promise.resolve({ data: { data: [] } });
  }),
}));

describe('GoatDashboard', () => {
  const renderDashboard = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <GoatDashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    renderDashboard();
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('displays goat statistics after loading', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Goat Farm Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Goats')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 goats
      expect(screen.getByText('Healthy Goats')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 healthy
      expect(screen.getByText('Pregnant Goats')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 pregnant
    });
  });

  it('displays recent alerts', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Recent Alerts')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Make the API call fail
    require('../../../services/api').get.mockRejectedValueOnce(new Error('API Error'));
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard data/i)).toBeInTheDocument();
    });
    
    mockConsoleError.mockRestore();
  });
});
