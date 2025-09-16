import React from 'react';
import { render, screen, waitFor } from '../../test-utils';
import Dashboard from '../Dashboard';

// Mock child components
jest.mock('../../components/RecentActivity', () => () => <div>RecentActivity</div>);
jest.mock('../../components/StatsOverview', () => () => <div>StatsOverview</div>);

describe('Dashboard', () => {
  const mockStats = {
    data: {
      totalAnimals: 50,
      totalDairy: 30,
      totalPoultry: 20,
      recentActivities: [
        { id: 1, type: 'milking', description: 'Morning milking', date: '2023-06-15T06:00:00Z' },
        { id: 2, type: 'feeding', description: 'Distributed feed', date: '2023-06-15T08:00:00Z' },
      ],
      upcomingTasks: [
        { id: 1, type: 'vaccination', description: 'Annual vaccination', dueDate: '2023-06-20' },
        { id: 2, type: 'breeding', description: 'Breeding schedule', dueDate: '2023-06-25' },
      ]
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock successful API response
    require('../../services/api').get.mockResolvedValue(mockStats);
    
    // Mock user data in localStorage
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') {
        return JSON.stringify({
          _id: 'user1',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          role: 'admin'
        });
      }
      return null;
    });
  });

  test('renders dashboard with user greeting', async () => {
    render(<Dashboard />);
    
    // Check if user greeting is displayed
    expect(await screen.findByText(/welcome back, test!/i)).toBeInTheDocument();
    
    // Check if stats overview is rendered
    expect(screen.getByText('StatsOverview')).toBeInTheDocument();
    
    // Check if recent activities and upcoming tasks are rendered
    expect(screen.getByText('RecentActivity')).toBeInTheDocument();
  });

  test('displays loading state', () => {
    // Mock delayed API response
    require('../../services/api').get.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    render(<Dashboard />);
    
    // Check if loading indicator is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('handles API error', async () => {
    // Mock API error
    const error = new Error('Failed to fetch dashboard data');
    require('../../services/api').get.mockRejectedValue(error);
    
    // Mock console.error to avoid error logs in test output
    const originalError = console.error;
    console.error = jest.fn();
    
    render(<Dashboard />);
    
    // Check if error message is displayed
    expect(await screen.findByText(/error loading dashboard data/i)).toBeInTheDocument();
    
    // Restore console.error
    console.error = originalError;
  });

  test('displays different content based on user role', async () => {
    // Mock non-admin user
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'user') {
        return JSON.stringify({
          _id: 'user2',
          firstName: 'Regular',
          lastName: 'User',
          email: 'regular@example.com',
          role: 'user'
        });
      }
      return null;
    });
    
    render(<Dashboard />);
    
    // Check if user greeting is displayed correctly
    expect(await screen.findByText(/welcome back, regular!/i)).toBeInTheDocument();
    
    // Check if admin-only content is not displayed
    expect(screen.queryByText(/admin dashboard/i)).not.toBeInTheDocument();
  });

  test('refreshes data when refresh button is clicked', async () => {
    render(<Dashboard />);
    
    // Wait for initial data to load
    await screen.findByText(/welcome back, test!/i);
    
    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    // Check if API was called again
    await waitFor(() => {
      expect(require('../../services/api').get).toHaveBeenCalledTimes(2);
    });
  });
});
