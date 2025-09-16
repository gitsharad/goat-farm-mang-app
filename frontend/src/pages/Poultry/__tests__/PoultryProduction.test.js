import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import PoultryProduction from '../PoultryProduction';

// Mock child components
jest.mock('../../../components/ProductionChart', () => () => <div>ProductionChart</div>);
jest.mock('../../../components/ProductionStats', () => () => <div>ProductionStats</div>);

describe('PoultryProduction', () => {
  const mockProductionData = {
    data: {
      dailyProduction: [
        { date: '2023-06-15', eggs: 45, feedConsumption: 5.5 },
        { date: '2023-06-14', eggs: 43, feedConsumption: 5.3 },
      ],
      weeklyAverage: 6.2,
      monthlyTotal: 1300,
      feedConversionRatio: 2.1,
      topLayers: [
        { id: 'p1', tagNumber: 'CH-001', eggs: 28 },
        { id: 'p2', tagNumber: 'CH-002', eggs: 26 },
      ]
    }
  };

  const mockPoultryList = {
    data: [
      { _id: 'p1', tagNumber: 'CH-001', name: 'Hen 1' },
      { _id: 'p2', tagNumber: 'CH-002', name: 'Hen 2' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    require('../../../services/api').get.mockImplementation((url) => {
      if (url.includes('poultry/production')) {
        return Promise.resolve(mockProductionData);
      }
      if (url.includes('poultry')) {
        return Promise.resolve(mockPoultryList);
      }
      return Promise.resolve({ data: [] });
    });
  });

  test('renders production dashboard with loading state', () => {
    render(<PoultryProduction />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays production data after loading', async () => {
    render(<PoultryProduction />);
    
    await waitFor(() => {
      expect(screen.getByText('ProductionChart')).toBeInTheDocument();
      expect(screen.getByText('ProductionStats')).toBeInTheDocument();
      expect(screen.getByText(/weekly average/i)).toBeInTheDocument();
      expect(screen.getByText(/monthly total/i)).toBeInTheDocument();
      expect(screen.getByText(/top layers/i)).toBeInTheDocument();
    });
  });

  test('allows filtering production data by date range', async () => {
    render(<PoultryProduction />);
    
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

  test('allows adding new production record', async () => {
    render(<PoultryProduction />);
    
    // Wait for data to load
    await screen.findByText('ProductionChart');
    
    // Click add record button
    const addButton = screen.getByRole('button', { name: /add record/i });
    fireEvent.click(addButton);
    
    // Check if form is displayed
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of eggs/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/feed consumption/i)).toBeInTheDocument();
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/number of eggs/i), { 
      target: { value: '50' } 
    });
    
    // Submit form
    const saveButton = screen.getByRole('button', { name: /save record/i });
    fireEvent.click(saveButton);
    
    // Check if API was called with correct data
    await waitFor(() => {
      expect(require('../../../services/api').post).toHaveBeenCalledWith(
        'poultry/production',
        expect.objectContaining({
          eggs: 50,
          date: expect.any(String)
        })
      );
    });
  });

  test('displays production statistics', async () => {
    render(<PoultryProduction />);
    
    // Wait for data to load
    await screen.findByText('ProductionStats');
    
    // Check if statistics are displayed
    expect(screen.getByText(/weekly average/i)).toHaveTextContent('6.2');
    expect(screen.getByText(/monthly total/i)).toHaveTextContent('1300');
    expect(screen.getByText(/feed conversion ratio/i)).toHaveTextContent('2.1');
  });

  test('handles API error when loading production data', async () => {
    const error = new Error('Failed to fetch production data');
    require('../../../services/api').get.mockRejectedValueOnce(error);
    
    const originalError = console.error;
    console.error = jest.fn();
    
    render(<PoultryProduction />);
    
    expect(await screen.findByText(/error loading production data/i)).toBeInTheDocument();
    console.error = originalError;
  });

  test('allows exporting production data', async () => {
    // Mock window.URL.createObjectURL
    const originalCreateObjectURL = global.URL.createObjectURL;
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    
    render(<PoultryProduction />);
    
    // Wait for data to load
    await screen.findByText('ProductionChart');
    
    // Click export button
    const exportButton = screen.getByRole('button', { name: /export data/i });
    fireEvent.click(exportButton);
    
    // Check if API was called with correct parameters
    await waitFor(() => {
      expect(require('../../../services/api').get).toHaveBeenCalledWith(
        'poultry/production/export',
        expect.objectContaining({
          responseType: 'blob'
        })
      );
    });
    
    // Restore original implementation
    global.URL.createObjectURL = originalCreateObjectURL;
  });
});
