import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../../test-utils';
import PoultryHealthRecords from '../PoultryHealthRecords';

// Mock child components
jest.mock('../../../components/HealthRecordForm', () => ({
  __esModule: true,
  default: ({ onSuccess }) => (
    <div>
      <div>HealthRecordForm</div>
      <button onClick={() => onSuccess({})}>Save Record</button>
    </div>
  )
}));

describe('PoultryHealthRecords', () => {
  const mockHealthRecords = {
    data: [
      {
        _id: 'hr1',
        date: '2023-06-15',
        type: 'Vaccination',
        description: 'Newcastle Disease',
        notes: 'Administered as scheduled',
        nextDueDate: '2023-09-15',
        status: 'Completed'
      },
      {
        _id: 'hr2',
        date: '2023-05-20',
        type: 'Treatment',
        description: 'Deworming',
        notes: 'All birds treated',
        status: 'Completed'
      }
    ]
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
      if (url.includes('poultry/health')) {
        return Promise.resolve(mockHealthRecords);
      }
      if (url.includes('poultry')) {
        return Promise.resolve(mockPoultryList);
      }
      return Promise.resolve({ data: [] });
    });
  });

  test('renders health records with loading state', () => {
    render(<PoultryHealthRecords />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays health records after loading', async () => {
    render(<PoultryHealthRecords />);
    
    await waitFor(() => {
      expect(screen.getByText('Newcastle Disease')).toBeInTheDocument();
      expect(screen.getByText('Deworming')).toBeInTheDocument();
    });
    
    // Check if records are displayed in a table
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(3); // Header + 2 records
  });

  test('allows adding a new health record', async () => {
    render(<PoultryHealthRecords />);
    
    // Wait for data to load
    await screen.findByText('Newcastle Disease');
    
    // Click add button
    const addButton = screen.getByRole('button', { name: /add health record/i });
    fireEvent.click(addButton);
    
    // Check if form is displayed
    expect(screen.getByText('HealthRecordForm')).toBeInTheDocument();
    
    // Simulate form submission
    const saveButton = screen.getByRole('button', { name: /save record/i });
    fireEvent.click(saveButton);
    
    // Check if form is closed after successful submission
    await waitFor(() => {
      expect(screen.queryByText('HealthRecordForm')).not.toBeInTheDocument();
    });
  });

  test('allows filtering health records by type', async () => {
    render(<PoultryHealthRecords />);
    
    // Wait for data to load
    await screen.findByText('Newcastle Disease');
    
    // Open type filter dropdown
    const typeFilter = screen.getByLabelText(/type/i);
    fireEvent.mouseDown(typeFilter);
    
    // Select 'Vaccination' filter
    const vaccinationOption = screen.getByRole('option', { name: /vaccination/i });
    fireEvent.click(vaccinationOption);
    
    // Check if only vaccination records are displayed
    await waitFor(() => {
      expect(screen.getByText('Newcastle Disease')).toBeInTheDocument();
      expect(screen.queryByText('Deworming')).not.toBeInTheDocument();
    });
  });

  test('handles API error when loading records', async () => {
    const error = new Error('Failed to fetch health records');
    require('../../../services/api').get.mockRejectedValueOnce(error);
    
    const originalError = console.error;
    console.error = jest.fn();
    
    render(<PoultryHealthRecords />);
    
    expect(await screen.findByText(/error loading health records/i)).toBeInTheDocument();
    console.error = originalError;
  });

  test('allows deleting a health record', async () => {
    // Mock successful delete
    require('../../../services/api').delete.mockResolvedValueOnce({});
    
    render(<PoultryHealthRecords />);
    
    // Wait for data to load
    await screen.findByText('Newcastle Disease');
    
    // Click delete button on first record
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /yes, delete/i });
    fireEvent.click(confirmButton);
    
    // Check if delete API was called
    await waitFor(() => {
      expect(require('../../../services/api').delete).toHaveBeenCalledWith(
        expect.stringContaining('poultry/health/hr1')
      );
    });
    
    // Check if success message is shown
    expect(await screen.findByText(/record deleted successfully/i)).toBeInTheDocument();
  });
});
