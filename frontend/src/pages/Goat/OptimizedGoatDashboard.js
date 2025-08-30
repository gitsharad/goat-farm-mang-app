import React, { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../lib/queryClient';
import { useOptimizedQuery } from '../../hooks/useOptimizedQuery';
import { logger } from '../../services/logger';
import { DashboardSkeleton } from '../../components/ui/SkeletonLoader';
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary';
import api from '../../services/api';

// API functions
const fetchGoats = async () => {
  try {
    const response = await api.get('/goats?limit=1000');
    return response.data?.data || [];
  } catch (error) {
    logger.error('Failed to fetch goats', error);
    throw error;
  }
};

const fetchHealthRecords = async () => {
  try {
    const response = await api.get('/health?limit=100');
    return response.data?.data || [];
  } catch (error) {
    logger.error('Failed to fetch health records', error);
    throw error;
  }
};

const fetchBreedingRecords = async () => {
  try {
    const response = await api.get('/breeding?limit=100');
    return response.data?.data || [];
  } catch (error) {
    logger.error('Failed to fetch breeding records', error);
    throw error;
  }
};

// Memoized stats calculator
const calculateStats = (goats = [], healthRecords = [], breedingRecords = []) => {
  const totalGoats = goats.length;
  const healthyGoats = healthRecords.filter(record => record.status === 'healthy').length;
  const pregnantGoats = breedingRecords.filter(record => record.status === 'pregnant').length;
  const upcomingBreeding = breedingRecords.filter(record => 
    new Date(record.expectedBreedingDate) > new Date()
  ).length;
  
  const recentAlerts = healthRecords
    .filter(record => record.alertLevel === 'high')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return {
    totalGoats,
    healthyGoats,
    pregnantGoats,
    upcomingBreeding,
    recentFeeding: Math.floor(totalGoats * 0.8), // Mock data
    alerts: recentAlerts
  };
};

const OptimizedGoatDashboard = () => {
  // Fetch data with React Query
  const {
    data: goats = [],
    isLoading: isLoadingGoats,
    error: goatsError
  } = useOptimizedQuery(
    [QUERY_KEYS.GOATS],
    fetchGoats
  );

  const {
    data: healthRecords = [],
    isLoading: isLoadingHealth,
    error: healthError
  } = useOptimizedQuery(
    [QUERY_KEYS.HEALTH_RECORDS],
    fetchHealthRecords
  );

  const {
    data: breedingRecords = [],
    isLoading: isLoadingBreeding,
    error: breedingError
  } = useOptimizedQuery(
    [QUERY_KEYS.BREEDING_RECORDS],
    fetchBreedingRecords
  );

  // Calculate stats with memoization
  const stats = useMemo(
    () => calculateStats(goats, healthRecords, breedingRecords),
    [goats, healthRecords, breedingRecords]
  );

  // Loading and error states
  const isLoading = isLoadingGoats || isLoadingHealth || isLoadingBreeding;
  const error = goatsError || healthError || breedingError;

  // Log any errors
  React.useEffect(() => {
    if (error) {
      logger.error('Error loading dashboard data', error);
    }
  }, [error]);

  // Show loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="flex items-center">
          <div className="text-red-500 mr-3">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Failed to load dashboard data
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {error.message || 'Please try again later'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render the dashboard
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Goat Farm Dashboard</h1>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Goats" 
          value={stats.totalGoats} 
          icon={<Users className="h-6 w-6 text-blue-500" />}
        />
        <StatCard 
          title="Healthy Goats" 
          value={stats.healthyGoats}
          icon={<Heart className="h-6 w-6 text-green-500" />}
        />
        <StatCard 
          title="Pregnant Goats" 
          value={stats.pregnantGoats}
          icon={<Baby className="h-6 w-6 text-pink-500" />}
        />
        <StatCard 
          title="Upcoming Breeding" 
          value={stats.upcomingBreeding}
          icon={<TrendingUp className="h-6 w-6 text-purple-500" />}
        />
      </div>
      
      {/* Recent Alerts */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Alerts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.alerts.length > 0 ? (
            stats.alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">No recent alerts</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-blue-50 p-3 rounded-md">
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd className="flex items-baseline">
            <div className="text-2xl font-semibold text-gray-900">{value}</div>
          </dd>
        </div>
      </div>
    </div>
  </div>
);

// Alert Item Component
const AlertItem = ({ alert }) => (
  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-red-600 truncate">
        {alert.title}
      </p>
      <div className="ml-2 flex-shrink-0 flex">
        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
          {alert.severity || 'High'}
        </p>
      </div>
    </div>
    <div className="mt-2 sm:flex sm:justify-between">
      <div className="sm:flex">
        <p className="flex items-center text-sm text-gray-500">
          {alert.description}
        </p>
      </div>
      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
        <p>
          {new Date(alert.date).toLocaleDateString()}
        </p>
      </div>
    </div>
  </div>
);

export default function OptimizedGoatDashboardWithBoundary() {
  return (
    <ErrorBoundary 
      fallbackMessage="Something went wrong with the dashboard"
      onRetry={() => window.location.reload()}
    >
      <OptimizedGoatDashboard />
    </ErrorBoundary>
  );
}
