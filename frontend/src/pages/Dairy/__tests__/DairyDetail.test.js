import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../../test-utils';
import { useParams } from 'react-router-dom';
import DairyDetail from '../DairyDetail';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: () => jest.fn(),
}));

// Mock child components
jest.mock('../../../components/DairyInfo', () => () => <div>DairyInfo</div>);
jest.mock('../../../components/MilkProductionChart', () => () => <div>MilkProductionChart</div>);

describe('DairyDetail', () => {
  const mockDairyData = {
    data: {
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
      expectedDeliveryDate: '2023-10-15',
      milkRecords: [
        { date: '2023-06-15', amount: 2.5, time: 'morning' },
        { date: '2023-06-14', amount: 2.3, time: 'morning' },
      ],
      healthRecords: [
        { date: '2023-05-10', type: 'Vaccination', description: 'Annual vaccination' },
      ],
      breedingRecords: [
        { date: '2023-01-15', type: 'Breeding', status: 'Confirmed' },
      ]
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock route params
    useParams.mockReturnValue({ id: 'd1' });
    
    // Mock successful API response
    require('../../../services/api').get.mockResolvedValue(mockDairyData);
  });

  test('renders dairy details with loading state', () => {
    render(<DairyDetail />);
    
    // Check if loading indicator is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays dairy information after loading', async () => {
    render(<DairyDetail />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('DairyInfo')).toBeInTheDocument();
      expect(screen.getByText('MilkProductionChart')).toBeInTheDocument();
    });
    
    // Check if tabs are rendered
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /milk records/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /health/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /breeding/i })).toBeInTheDocument();
  });

  test('switches between tabs', async () => {
    render(<DairyDetail />);
    
    // Wait for data to load
    await screen.findByText('DairyInfo');
    
    // Click on Milk Records tab
    const milkRecordsTab = screen.getByRole('tab', { name: /milk records/i });
    fireEvent.click(milkRecordsTab);
    
    // Check if Milk Records content is displayed
    expect(screen.getByText(/milk records for goat-001/i)).toBeInTheDocument();
    
    // Click on Health tab
    const healthTab = screen.getByRole('tab', { name: /health/i });
    fireEvent.click(healthTab);
    
    // Check if Health content is displayed
    expect(screen.getByText(/health records for goat-001/i)).toBeInTheDocument();
  });

  test('handles API error', async () => {
    // Mock API error
    const error = new Error('Failed to fetch dairy details');
    require('../../../services/api').get.mockRejectedValue(error);
    
    // Mock console.error to avoid error logs in test output
    const originalError = console.error;
    console.error = jest.fn();
    
    render(<DairyDetail />);
    
    // Check if error message is displayed
    expect(await screen.findByText(/error loading dairy details/i)).toBeInTheDocument();
    
    // Restore console.error
    console.error = originalError;
  });

  test('allows editing dairy information', async () => {
    render(<DairyDetail />);
    
    // Wait for data to load
    await screen.findByText('DairyInfo');
    
    // Click edit button (assuming there's an edit button in the DairyInfo component)
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    // Check if edit form is displayed (assuming it shows a form with a save button)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  test('displays pregnancy status correctly', async () => {
    render(<DairyDetail />);
    
    // Wait for data to load
    await screen.findByText('DairyInfo');
    
    // Check if pregnancy status is displayed correctly
    expect(screen.getByText(/pregnancy status/i)).toBeInTheDocument();
    expect(screen.getByText(/expected delivery date: oct 15, 2023/i)).toBeInTheDocument();
  });
});
