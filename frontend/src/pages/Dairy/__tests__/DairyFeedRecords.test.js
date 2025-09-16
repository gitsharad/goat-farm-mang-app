import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import DairyFeedRecords from '../DairyFeedRecords';

// Mock the API
jest.mock('../../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('DairyFeedRecords', () => {
  const mockData = {
    data: {
      records: [
        {
          _id: '1',
          dairy: { _id: 'd1', tagNumber: 'GOAT-001' },
          feedType: 'Grass',
          quantity: 5,
          unit: 'kg',
          cost: 100,
          date: '2023-06-15',
          notes: 'Morning feeding'
        }
      ],
      total: 1,
      totalPages: 1
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock the API response
    require('../../../services/api').get.mockResolvedValue(mockData);
  });

  const renderComponent = () => {
    return render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <DairyFeedRecords />
        </MemoryRouter>
      </I18nextProvider>
    );
  };

  test('renders the component with initial data', async () => {
    renderComponent();
    
    // Check if the title is rendered
    expect(screen.getByText(i18n.t('dairy.pages.feeding.title'))).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('GOAT-001')).toBeInTheDocument();
      expect(screen.getByText('Grass')).toBeInTheDocument();
      expect(screen.getByText('5 kg')).toBeInTheDocument();
      expect(screen.getByText('₹100')).toBeInTheDocument();
    });
  });

  test('opens add feed record modal when add button is clicked', async () => {
    renderComponent();
    
    // Click the add button
    const addButton = screen.getByRole('button', { name: /add record/i });
    fireEvent.click(addButton);
    
    // Check if the modal is opened
    expect(screen.getByText(i18n.t('dairy.pages.feeding.addRecord'))).toBeInTheDocument();
  });

  test('submits the form with valid data', async () => {
    // Mock successful form submission
    const mockPost = require('../../../services/api').post.mockResolvedValueOnce({
      data: {
        _id: '2',
        dairy: { _id: 'd1', tagNumber: 'GOAT-001' },
        feedType: 'Concentrate',
        quantity: 2,
        unit: 'kg',
        cost: 150,
        date: '2023-06-16',
        notes: 'Evening feeding'
      }
    });
    
    renderComponent();
    
    // Open the add modal
    const addButton = screen.getByRole('button', { name: /add record/i });
    fireEvent.click(addButton);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/feed type/i), { target: { value: 'Concentrate' } });
    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/cost/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Evening feeding' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    // Check if the API was called with the correct data
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/dairy-feed', {
        dairy: '', // This would be set when an animal is selected
        feedType: 'Concentrate',
        quantity: 2,
        unit: 'kg',
        cost: 150,
        notes: 'Evening feeding',
        date: expect.any(String)
      });
    });
  });

  test('deletes a feed record', async () => {
    // Mock successful deletion
    const mockDelete = require('../../../services/api').delete.mockResolvedValueOnce({});
    
    renderComponent();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('GOAT-001')).toBeInTheDocument();
    });
    
    // Click the delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /yes, delete/i });
    fireEvent.click(confirmButton);
    
    // Check if the delete API was called
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/dairy-feed/1');
    });
  });
});
