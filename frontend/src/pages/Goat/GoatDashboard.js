import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Heart, 
  Baby, 
  Utensils, 
  AlertTriangle, 
  Milk, 
  TrendingUp,
  Plus,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import api from '../../services/api';

// Cache for storing API responses
const cache = {
  data: null,
  timestamp: 0,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  isStale: function() {
    return Date.now() - this.timestamp > this.CACHE_DURATION;
  },
  set: function(data) {
    this.data = data;
    this.timestamp = Date.now();
  }
};

const GoatDashboard = () => {
  const { t } = useTranslation('goat');
  const [stats, setStats] = useState({
    totalGoats: 0,
    healthyGoats: 0,
    pregnantGoats: 0,
    upcomingBreeding: 0,
    recentFeeding: 0,
    milkProduction: 0,
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Use useCallback to memoize the fetch function
  const fetchDashboardData = useCallback(async (force = false) => {
    // Use cached data if available and not forcing refresh
    if (!force && !cache.isStale() && cache.data) {
      console.log('Using cached dashboard data');
      setStats(cache.data.stats);
      setLastUpdated(new Date(cache.timestamp).toLocaleTimeString());
      setLoading(false);
      return;
    }

    console.log('Fetching fresh dashboard data...');
    setLoading(true);
    setError(null);

    try {
      // Add cache-busting and rate limiting headers
      const config = {
        params: { _t: Date.now() },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        validateStatus: (status) => status < 500 // Don't throw for client errors
      };

      // Fetch data with staggered requests to avoid rate limiting
      let goats = [];
      let healthRecords = [];
      let breedingRecords = [];

      try {
        // Fetch goats
        const goatsRes = await api.get('/goats?limit=500', config);
        console.log('Goats response:', { status: goatsRes.status, data: goatsRes.data });
        
        // Handle different response structures for goats
        if (Array.isArray(goatsRes.data)) {
          goats = goatsRes.data;
        } else if (goatsRes.data?.data) {
          goats = Array.isArray(goatsRes.data.data) ? goatsRes.data.data : [];
        } else if (goatsRes.data?.goats) {
          goats = Array.isArray(goatsRes.data.goats) ? goatsRes.data.goats : [];
        }
        
        // Fetch health records
        try {
          const healthRes = await api.get('/health?limit=50', config);
          console.log('Health response:', { status: healthRes.status, data: healthRes.data });
          
          if (healthRes.data?.records) {
            healthRecords = Array.isArray(healthRes.data.records) ? healthRes.data.records : [];
          } else if (Array.isArray(healthRes.data)) {
            healthRecords = healthRes.data;
          } else if (healthRes.data?.data) {
            healthRecords = Array.isArray(healthRes.data.data) ? healthRes.data.data : [];
          }
        } catch (healthError) {
          console.error('Error fetching health records:', {
            message: healthError.message,
            response: healthError.response?.data,
            status: healthError.response?.status
          });
        }
        
        // Fetch breeding records
        try {
          const breedingRes = await api.get('/breeding?limit=50', config);
          console.log('Breeding response:', { status: breedingRes.status, data: breedingRes.data });
          
          if (breedingRes.data?.records) {
            breedingRecords = Array.isArray(breedingRes.data.records) ? breedingRes.data.records : [];
          } else if (Array.isArray(breedingRes.data)) {
            breedingRecords = breedingRes.data;
          } else if (breedingRes.data?.data) {
            breedingRecords = Array.isArray(breedingRes.data.data) ? breedingRes.data.data : [];
          }
        } catch (breedingError) {
          console.error('Error fetching breeding records:', {
            message: breedingError.message,
            response: breedingError.response?.data,
            status: breedingError.response?.status
          });
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        // If we have partial data, we can still proceed
        if (!goats || !Array.isArray(goats)) goats = [];
        if (!healthRecords || !Array.isArray(healthRecords)) healthRecords = [];
        if (!breedingRecords || !Array.isArray(breedingRecords)) breedingRecords = [];
      }
      
      console.log('Fetched data counts:', { 
        goats: goats.length, 
        healthRecords: healthRecords.length, 
        breedingRecords: breedingRecords.length 
      });

      // Calculate stats
      const now = new Date();
      const thirtyDaysFromNow = new Date(now);
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      // Process data in chunks to prevent UI freeze
      const processInChunks = (array, chunkSize, processFn) => {
        const results = [];
        for (let i = 0; i < array.length; i += chunkSize) {
          const chunk = array.slice(i, i + chunkSize);
          results.push(...chunk.filter(processFn));
        }
        return results;
      };

      const totalGoats = goats.length;
      const healthyGoats = processInChunks(goats, 50, goat => goat?.status === 'Active').length;
      
      const pregnantGoats = processInChunks(goats, 50, goat => 
        (goat?.breeding?.isPregnant === true) || 
        (goat?.breeding?.status === 'Pregnant') ||
        (goat?.pregnancyStatus === 'P')
      ).length;
      
      const upcomingBreeding = processInChunks(goats, 50, goat => {
        if (!goat?.breeding?.dueDate) return false;
        try {
          const dueDate = new Date(goat.breeding.dueDate);
          return !isNaN(dueDate) && dueDate > now && dueDate <= thirtyDaysFromNow;
        } catch (e) {
          console.warn('Invalid date in breeding record:', goat.breeding.dueDate);
          return false;
        }
      }).length;

      // Calculate milk production (example calculation)
      const milkProduction = Math.floor(healthyGoats * 1.5);
      const recentFeeding = Math.floor(healthyGoats * 0.9);

      const newStats = {
        totalGoats,
        healthyGoats,
        pregnantGoats,
        upcomingBreeding,
        recentFeeding,
        milkProduction,
        alerts: []
      };

      // Update cache and state
      cache.set({ stats: newStats });
      setStats(newStats);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Handle rate limiting with exponential backoff
      if (error.response?.status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'] || 5;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s delay
        
        console.warn(`Rate limited. Retrying in ${delay/1000} seconds...`);
        
        // Show error but schedule a retry
        setError({
          message: `Server busy. Retrying in ${delay/1000} seconds...`,
          isRateLimit: true
        });
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchDashboardData();
        }, delay);
        
        return;
      }
      
      // For other errors, show the error but keep the last good data if available
      setError({
        message: error.message || 'Failed to load dashboard data',
        isRateLimit: error.response?.status === 429
      });
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    
    // Set up refresh interval (every 5 minutes)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    }, 5 * 60 * 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Add a refresh button to the UI
  const refreshButton = (
    <button
      onClick={() => fetchDashboardData(true)}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md ${
        loading 
          ? 'bg-gray-300 cursor-not-allowed' 
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      }`}
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? t('common:refreshing') : t('common:refresh')}
    </button>
  );

  if (error) {
    return (
      <div className="p-4 space-y-3">
        <div className="p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{t('dashboard.error.loading')}</h3>
              <p className="text-sm">{error.message}</p>
            </div>
            {refreshButton}
          </div>
        </div>
        {!error.isRateLimit && cache.data && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">{t('dashboard.cachedData', { date: new Date(cache.timestamp).toLocaleString() })}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('pages.dashboard.goatFarmDashboard')}</h1>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                {t('pages.dashboard.lastUpdated', { date: lastUpdated })}
                {loading && ` (${t('common.updating')}...)`}
              </p>
            )}
          </div>
          <div className="w-full sm:w-auto">
            {refreshButton}
          </div>
          <p className="text-gray-600">{t('pages.dashboard.overview')}</p>
        </div>
       
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('pages.dashboard.stats.totalGoats')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalGoats}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('pages.dashboard.stats.healthyGoats')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.healthyGoats}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Baby className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('pages.dashboard.stats.pregnantGoats')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pregnantGoats}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('pages.dashboard.stats.upcomingBreeding')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.upcomingBreeding}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/sales"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <DollarSign className="h-10 w-10 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('pages.dashboard.quickActions.sales.title')}</h3>
              <p className="text-gray-600">{t('pages.dashboard.quickActions.sales.description')}</p>
            </div>
          </div>
        </Link>
        <Link
          to="/goats"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Users className="h-10 w-10 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('pages.dashboard.quickActions.manageGoats.title')}</h3>
              <p className="text-gray-600">{t('pages.dashboard.quickActions.manageGoats.description')}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/goats/health"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Heart className="h-10 w-10 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('pages.dashboard.quickActions.health.title')}</h3>
              <p className="text-gray-600">{t('pages.dashboard.quickActions.health.description')}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/goats/breeding"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Baby className="h-10 w-10 text-purple-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('pages.dashboard.quickActions.breeding.title')}</h3>
              <p className="text-gray-600">{t('pages.dashboard.quickActions.breeding.description')}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/goats/feed"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Utensils className="h-10 w-10 text-orange-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('pages.dashboard.quickActions.feeding.title')}</h3>
              <p className="text-gray-600">{t('pages.dashboard.quickActions.feeding.description')}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/goat-production"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Milk className="h-10 w-10 text-pink-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('pages.dashboard.quickActions.milkProduction.title')}</h3>
              <p className="text-gray-600">{t('pages.dashboard.quickActions.milkProduction.description')}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/reports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <TrendingUp className="h-10 w-10 text-indigo-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('pages.dashboard.quickActions.reports.title')}</h3>
              <p className="text-gray-600">{t('pages.dashboard.quickActions.reports.description')}</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

// Wrap the component with error boundary for export
export default function GoatDashboardWithBoundary() {
  const { t } = useTranslation();
  
  return (
    <ErrorBoundary 
      fallbackMessage={t('dashboard.unableToLoad')}
      onRetry={() => window.location.reload()}
      retryLabel={t('dashboard.reloadDashboard')}
    >
      <GoatDashboard />
    </ErrorBoundary>
  );
}
