import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import Login from '../Login';

describe('Login Page', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    render(<Login />);
    
    // Check if form elements are rendered
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  test('validates form inputs', async () => {
    render(<Login />);
    
    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    // Check for validation errors
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    
    // Enter invalid email
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    // Mock successful login
    const mockResponse = {
      data: {
        token: 'test-token',
        user: {
          _id: 'user1',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          role: 'admin'
        }
      }
    };
    
    require('../../services/api').post.mockResolvedValueOnce(mockResponse);
    
    render(<Login />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'password123' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check if API was called with correct data
    await waitFor(() => {
      expect(require('../../services/api').post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    // Check if token was saved to localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
  });

  test('handles login error', async () => {
    // Mock failed login
    const error = new Error('Invalid credentials');
    error.response = { data: { message: 'Invalid email or password' } };
    require('../../services/api').post.mockRejectedValueOnce(error);
    
    render(<Login />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'wrong@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'wrongpassword' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check if error message is displayed
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
