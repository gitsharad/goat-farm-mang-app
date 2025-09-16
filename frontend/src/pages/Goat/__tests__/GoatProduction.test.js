import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../../test-utils';
import GoatProduction from '../GoatProduction';

// Mock child components
jest.mock('../../../components/ProductionChart', () => () => <div>ProductionChart</div>);

describe('GoatProduction', () => {
  const mockProductionData = {
    data: {
      dailyProduction: [
        { date: '2023-06-15', amount: 10.5 },
        { date: '2023-06-14', amount: 9.8 },
      ],
      weeklyAverage: 9.5,
      monthlyTotal: 285,
      topProducers: [
        { id: 'g1', name: 'Daisy', amount: 12.5 },
        { id: 'g2', name: 'Bella', amount: 11.8 },
      ]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('../../../services/api').get.mockResolvedValue(mockProductionData);
  });

  test('renders production dashboard with loading state', () => {
    render(<GoatProduction />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays production data after loading', async () => {
    render(<GoatProduction />);
    
    await waitFor(() => {
      expect(screen.getByText('ProductionChart')).toBeInTheDocument();
      expect(screen.getByText(/weekly average/i)).toBeInTheDocument();
      expect(screen.getByText(/monthly total/i)).toBeInTheDocument();
      expect(screen.getByText(/top producers/i)).toBeInTheDocument();
    });
  });

  test('allows filtering production data by date range', async () => {
    render(<GoatProduction />);
    
    await screen.findByText('ProductionChart');
    
    // Open date picker
    const dateFilter = screen.getByLabelText(/date range/i);
    fireEvent.mouseDown(dateFilter);
    
    // Select a date range (simplified for test)
    const startDate = screen.getByText('1');
    const endDate = screen.getByText('15');
    fireEvent.click(startDate);
    fireEvent.click(endDate);
    
    // Apply filter
    const applyButton = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);
    
    // Check if API was called with date range
    await waitFor(() => {
      expect(require('../../../services/api').get).toHaveBeenCalledWith(
        expect.stringContaining('startDate'),
        expect.anything()
      );
    });
  });

  test('handles API error', async () => {
    const error = new Error('Failed to fetch production data');
    require('../../../services/api').get.mockRejectedValue(error);
    
    const originalError = console.error;
    console.error = jest.fn();
    
    render(<GoatProduction />);
    
    expect(await screen.findByText(/error loading production data/i)).toBeInTheDocument();
    console.error = originalError;
  });
});
