import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../../test-utils';
import { useParams } from 'react-router-dom';
import GoatDetail from '../GoatDetail';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: () => jest.fn(),
}));

// Mock child components
jest.mock('../../../components/GoatInfo', () => () => <div>GoatInfo</div>);
jest.mock('../../../components/WeightChart', () => () => <div>WeightChart</div>);

describe('GoatDetail', () => {
  const mockGoatData = {
    data: {
      _id: 'g1',
      tagNumber: 'GT-001',
      name: 'Test Goat',
      breed: 'Boer',
      dateOfBirth: '2020-01-01',
      gender: 'Female',
      status: 'Active',
      weight: 45.5,
      lastWeightDate: '2023-06-15',
      lastVaccinationDate: '2023-05-10',
      isPregnant: true,
      expectedKiddingDate: '2023-10-15',
      medicalHistory: [
        { date: '2023-05-10', type: 'Vaccination', description: 'Annual vaccination' },
      ],
      breedingRecords: [
        { date: '2023-01-15', type: 'Breeding', status: 'Confirmed' },
      ],
      weightHistory: [
        { date: '2023-06-15', weight: 45.5 },
        { date: '2023-05-15', weight: 44.0 },
      ]
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock route params
    useParams.mockReturnValue({ id: 'g1' });
    
    // Mock successful API response
    require('../../../services/api').get.mockResolvedValue(mockGoatData);
  });

  test('renders goat details with loading state', () => {
    render(<GoatDetail />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays goat information after loading', async () => {
    render(<GoatDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('GoatInfo')).toBeInTheDocument();
      expect(screen.getByText('WeightChart')).toBeInTheDocument();
    });
    
    // Check if tabs are rendered
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /medical/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /breeding/i })).toBeInTheDocument();
  });

  test('handles API error', async () => {
    const error = new Error('Failed to fetch goat details');
    require('../../../services/api').get.mockRejectedValue(error);
    
    const originalError = console.error;
    console.error = jest.fn();
    
    render(<GoatDetail />);
    
    expect(await screen.findByText(/error loading goat details/i)).toBeInTheDocument();
    console.error = originalError;
  });

  test('allows editing goat information', async () => {
    render(<GoatDetail />);
    
    await screen.findByText('GoatInfo');
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});
