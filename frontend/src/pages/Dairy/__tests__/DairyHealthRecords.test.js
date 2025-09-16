import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import DairyHealthRecords from '../DairyHealthRecords';

// Mock the API
jest.mock('../../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('DairyHealthRecords', () => {
  const mockData = {
    data: {
      records: [
        {
          _id: '1',
          dairy: { _id: 'd1', tagNumber: 'GOAT-001' },
          type: 'Vaccination',
          date: '2023-06-15',
          description: 'Annual vaccination',
          status: 'Completed',
          notes: 'No adverse reactions'
        }
      ],
      total: 1,
      totalPages: 1
    }
  };

  const mockAnimals = {
    data: [
      { _id: 'd1', tagNumber: 'GOAT-001' },
      { _id: 'd2', tagNumber: 'GOAT-002' }
    ]
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock the API responses
    require('../../../services/api').get
      .mockResolvedValueOnce(mockData) // Health records
      .mockResolvedValueOnce(mockAnimals); // Animals
  });

  const renderComponent = () => {
    return render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <DairyHealthRecords />
        </MemoryRouter>
      </I18nextProvider>
    );
  };

  test('renders the component with initial data', async () => {
    renderComponent();
    
    // Check if the title is rendered
    expect(screen.getByText(i18n.t('dairy.pages.health.title'))).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('GOAT-001')).toBeInTheDocument();
      expect(screen.getByText('Vaccination')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  test('filters records by animal', async () => {
    renderComponent();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('GOAT-001')).toBeInTheDocument();
    });
    
    // Select an animal from the filter
    const animalFilter = screen.getByLabelText(/animal/i);
    fireEvent.change(animalFilter, { target: { value: 'GOAT-001' } });
    
    // Check if the filter was applied
    expect(require('../../../services/api').get).toHaveBeenLastCalledWith(
      expect.stringContaining('dairyId=d1')
    );
  });

  test('opens add health record modal when add button is clicked', async () => {
    renderComponent();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('GOAT-001')).toBeInTheDocument();
    });
    
    // Click the add button
    const addButton = screen.getByRole('button', { name: /add record/i });
    fireEvent.click(addButton);
    
    // Check if the modal is opened
    expect(screen.getByText(i18n.t('dairy.pages.health.addRecord'))).toBeInTheDocument();
  });

  test('submits a new health record', async () => {
    // Mock successful form submission
    const mockPost = require('../../../services/api').post.mockResolvedValueOnce({
      data: {
        _id: '2',
        dairy: { _id: 'd1', tagNumber: 'GOAT-001' },
        type: 'Deworming',
        date: '2023-06-16',
        status: 'Scheduled',
        notes: 'Monthly deworming'
      }
    });
    
    renderComponent();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('GOAT-001')).toBeInTheDocument();
    });
    
    // Open the add modal
    const addButton = screen.getByRole('button', { name: /add record/i });
    fireEvent.click(addButton);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'Deworming' } });
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'Scheduled' } });
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2023-06-16' } });
    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Monthly deworming' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    // Check if the API was called with the correct data
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/dairy-health', {
        dairy: 'd1',
        type: 'Deworming',
        status: 'Scheduled',
        date: '2023-06-16',
        notes: 'Monthly deworming',
        description: ''
      });
    });
  });
});
