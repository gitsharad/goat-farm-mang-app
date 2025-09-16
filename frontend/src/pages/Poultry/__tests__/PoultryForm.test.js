import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import PoultryForm from '../PoultryForm';

describe('PoultryForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  const initialValues = {
    tagNumber: 'CH-001',
    breed: 'Rhode Island Red',
    dateOfBirth: '2023-01-15',
    gender: 'Female',
    status: 'Active',
    eggProductionRate: 0.85,
    lastVaccinationDate: '2023-05-20',
    notes: 'Good layer',
    isActive: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all form fields', () => {
    render(<PoultryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByLabelText(/tag number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/breed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/egg production rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last vaccination date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/is active/i)).toBeInTheDocument();
  });

  test('populates form with initial values in edit mode', () => {
    render(
      <PoultryForm 
        initialValues={initialValues}
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
        isEdit
      />
    );
    
    expect(screen.getByDisplayValue('CH-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rhode Island Red')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0.85')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Good layer')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(<PoultryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    // Check for validation errors
    expect(await screen.findByText(/tag number is required/i)).toBeInTheDocument();
    expect(screen.getByText(/breed is required/i)).toBeInTheDocument();
    expect(screen.getByText(/date of birth is required/i)).toBeInTheDocument();
    expect(screen.getByText(/gender is required/i)).toBeInTheDocument();
    expect(screen.getByText(/status is required/i)).toBeInTheDocument();
    
    // Form submission should not be called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('validates egg production rate format', async () => {
    render(<PoultryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Enter invalid egg production rate
    const eggRateInput = screen.getByLabelText(/egg production rate/i);
    fireEvent.change(eggRateInput, { target: { value: '1.5' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    // Check for validation error
    expect(await screen.findByText(/must be between 0 and 1/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    render(<PoultryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/tag number/i), { 
      target: { value: 'CH-002' } 
    });
    fireEvent.change(screen.getByLabelText(/breed/i), { 
      target: { value: 'Plymouth Rock' } 
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { 
      target: { value: '2023-02-15' } 
    });
    fireEvent.change(screen.getByLabelText(/gender/i), { 
      target: { value: 'Female' } 
    });
    fireEvent.change(screen.getByLabelText(/status/i), { 
      target: { value: 'Active' } 
    });
    fireEvent.change(screen.getByLabelText(/egg production rate/i), { 
      target: { value: '0.9' } 
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    // Check if form was submitted with correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        tagNumber: 'CH-002',
        breed: 'Plymouth Rock',
        dateOfBirth: '2023-02-15',
        gender: 'Female',
        status: 'Active',
        eggProductionRate: 0.9,
        lastVaccinationDate: '',
        notes: '',
        isActive: true
      });
    });
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(<PoultryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('disables form when isSubmitting is true', () => {
    render(
      <PoultryForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
        isSubmitting 
      />
    );
    
    // Check if all inputs are disabled
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input).toBeDisabled();
    });
    
    // Check if buttons are disabled
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
});
