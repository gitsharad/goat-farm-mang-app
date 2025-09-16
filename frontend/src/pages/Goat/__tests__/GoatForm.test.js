import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test-utils';
import GoatForm from '../GoatForm';

describe('GoatForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  const initialValues = {
    tagNumber: 'GT-001',
    name: 'Test Goat',
    breed: 'Boer',
    dateOfBirth: '2022-01-01',
    gender: 'Female',
    status: 'Active',
    weight: 40.5,
    lastVaccinationDate: '2023-05-15',
    isPregnant: false,
    notes: 'Test notes'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all form fields', () => {
    render(<GoatForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByLabelText(/tag number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/breed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last vaccination date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/is pregnant/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  test('populates form with initial values in edit mode', () => {
    render(
      <GoatForm 
        initialValues={initialValues}
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
        isEdit
      />
    );
    
    expect(screen.getByDisplayValue('GT-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Goat')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Boer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('40.5')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(<GoatForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
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

  test('submits form with valid data', async () => {
    render(<GoatForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/tag number/i), { 
      target: { value: 'GT-002' } 
    });
    fireEvent.change(screen.getByLabelText(/name/i), { 
      target: { value: 'New Goat' } 
    });
    fireEvent.change(screen.getByLabelText(/breed/i), { 
      target: { value: 'Saanen' } 
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { 
      target: { value: '2022-01-01' } 
    });
    fireEvent.change(screen.getByLabelText(/gender/i), { 
      target: { value: 'Male' } 
    });
    fireEvent.change(screen.getByLabelText(/status/i), { 
      target: { value: 'Active' } 
    });
    fireEvent.change(screen.getByLabelText(/weight/i), { 
      target: { value: '45.5' } 
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);
    
    // Check if form was submitted with correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        tagNumber: 'GT-002',
        name: 'New Goat',
        breed: 'Saanen',
        dateOfBirth: '2022-01-01',
        gender: 'Male',
        status: 'Active',
        weight: 45.5,
        lastVaccinationDate: '',
        isPregnant: false,
        notes: ''
      });
    });
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(<GoatForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('shows pregnancy date field when isPregnant is checked', () => {
    render(<GoatForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Check if pregnancy date field is not visible initially
    expect(screen.queryByLabelText(/pregnancy date/i)).not.toBeInTheDocument();
    
    // Check the isPregnant checkbox
    const isPregnantCheckbox = screen.getByLabelText(/is pregnant/i);
    fireEvent.click(isPregnantCheckbox);
    
    // Check if pregnancy date field is now visible
    expect(screen.getByLabelText(/pregnancy date/i)).toBeInTheDocument();
  });
});
