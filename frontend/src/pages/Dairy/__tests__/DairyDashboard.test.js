import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import DairyDashboard from '../DairyDashboard';

// Mock the API
jest.mock('../../../services/api', () => ({
  get: jest.fn(),
}));

describe('DairyDashboard', () => {
  const mockStats = {
    data: {
      totalAnimals: 24,
      lactatingAnimals: 12,
      dailyMilkProduction: 45.5,
      pregnantAnimals: 5,
      recentMilkRecords: [
        { date: '2023-06-15', amount: 2.5 },
        { date: '2023-06-14', amount: 2.3 },
        { date: '2023-06-13', amount: 2.4 }
      ],
      upcomingBreeding: [
        {
          _id: '1',
          dairy: { tagNumber: 'GOAT-001' },
          breedingDate: '2023-06-20',
          expectedDeliveryDate: '2023-11-20',
          status: 'Confirmed'
        }
      ],
      recentHealthIssues: [
        {
          _id: '1',
          dairy: { tagNumber: 'GOAT-002' },
          type: 'Vaccination',
          date: '2023-06-10',
          status: 'Completed'
        }
      ]
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock the API response
    require('../../../services/api').get.mockResolvedValue(mockStats);
  });

  const renderComponent = () => {
    return render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <DairyDashboard />
        </MemoryRouter>
      </I18nextProvider>
    );
  };

  test('renders the dashboard with statistics', async () => {
    renderComponent();
    
    // Check if the title is rendered
    expect(screen.getByText(i18n.t('dairy.pages.dashboard.title'))).toBeInTheDocument();
    
    // Wait for data to load and check statistics
    await waitFor(() => {
      expect(screen.getByText('24')).toBeInTheDocument(); // Total animals
      expect(screen.getByText('12')).toBeInTheDocument(); // Lactating animals
      expect(screen.getByText('45.5 L')).toBeInTheDocument(); // Daily milk
      expect(screen.getByText('5')).toBeInTheDocument(); // Pregnant animals
    });
  });

  test('displays recent milk production data', async () => {
    renderComponent();
    
    // Check if recent milk production data is displayed
    await waitFor(() => {
      expect(screen.getByText('2.5 L')).toBeInTheDocument();
      expect(screen.getByText('2.3 L')).toBeInTheDocument();
      expect(screen.getByText('2.4 L')).toBeInTheDocument();
    });
  });

  test('displays upcoming breeding schedule', async () => {
    renderComponent();
    
    // Check if upcoming breeding is displayed
    await waitFor(() => {
      expect(screen.getByText('GOAT-001')).toBeInTheDocument();
      expect(screen.getByText('2023-06-20')).toBeInTheDocument();
      expect(screen.getByText('2023-11-20')).toBeInTheDocument();
    });
  });

  test('displays recent health issues', async () => {
    renderComponent();
    
    // Check if recent health issues are displayed
    await waitFor(() => {
      expect(screen.getByText('GOAT-002')).toBeInTheDocument();
      expect(screen.getByText('Vaccination')).toBeInTheDocument();
      expect(screen.getByText('2023-06-10')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock a failed API call
    const error = new Error('API Error');
    require('../../../services/api').get.mockRejectedValueOnce(error);
    
    // Mock console.error to avoid error logs in test output
    const originalError = console.error;
    console.error = jest.fn();
    
    renderComponent();
    
    // Check if error state is handled
    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard data/i)).toBeInTheDocument();
    });
    
    // Restore console.error
    console.error = originalError;
  });
});
