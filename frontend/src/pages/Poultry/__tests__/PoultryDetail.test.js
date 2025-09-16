import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../../test-utils';
import { useParams } from 'react-router-dom';
import PoultryDetail from '../PoultryDetail';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: () => jest.fn(),
}));

// Mock child components
jest.mock('../../../components/PoultryInfo', () => () => <div>PoultryInfo</div>);
jest.mock('../../../components/EggProductionChart', () => () => <div>EggProductionChart</div>);

describe('PoultryDetail', () => {
  const mockPoultryData = {
    data: {
      _id: 'p1',
      tagNumber: 'CH-001',
      breed: 'Rhode Island Red',
      dateOfBirth: '2023-01-01',
      gender: 'Female',
      status: 'Active',
      eggProduction: {
        dailyAverage: 0.9,
        weeklyAverage: 6.3,
        totalEggs: 189,
      },
      lastVaccination: '2023-05-10',
      healthStatus: 'Healthy',
      notes: 'Good layer, consistent production'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ id: 'p1' });
    require('../../../services/api').get.mockResolvedValue(mockPoultryData);
  });

  test('renders poultry details with loading state', () => {
    render(<PoultryDetail />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays poultry information after loading', async () => {
    render(<PoultryDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('PoultryInfo')).toBeInTheDocument();
      expect(screen.getByText('EggProductionChart')).toBeInTheDocument();
    });
    
    // Check if production stats are displayed
    expect(screen.getByText(/daily average/i)).toBeInTheDocument();
    expect(screen.getByText(/6.3\s*\/\s*week/i)).toBeInTheDocument();
    expect(screen.getByText(/189\s*total eggs/i)).toBeInTheDocument();
  });

  test('allows editing poultry information', async () => {
    render(<PoultryDetail />);
    
    await screen.findByText('PoultryInfo');
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    // Check if form is in edit mode
    expect(screen.getByRole('textbox', { name: /notes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  test('handles API error', async () => {
    const error = new Error('Failed to fetch poultry details');
    require('../../../services/api').get.mockRejectedValue(error);
    
    const originalError = console.error;
    console.error = jest.fn();
    
    render(<PoultryDetail />);
    
    expect(await screen.findByText(/error loading poultry details/i)).toBeInTheDocument();
    console.error = originalError;
  });

  test('displays health status correctly', async () => {
    render(<PoultryDetail />);
    
    await screen.findByText('PoultryInfo');
    
    // Check if health status is displayed with the correct color
    const healthStatus = screen.getByText(/healthy/i);
    expect(healthStatus).toHaveClass('MuiChip-colorSuccess');
    
    // Test with a different status
    const sickData = { ...mockPoultryData };
    sickData.data.healthStatus = 'Sick';
    require('../../../services/api').get.mockResolvedValueOnce(sickData);
    
    render(<PoultryDetail />);
    
    const sickStatus = await screen.findByText(/sick/i);
    expect(sickStatus).toHaveClass('MuiChip-colorError');
  });
});
