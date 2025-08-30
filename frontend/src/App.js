import React, { useEffect } from 'react';
import { testApiConnection } from './utils/testConnection';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth, usePermissions } from './contexts/AuthContext';
import Layout from './components/Layout';
import SimpleLayout from './components/SimpleLayout';
import Login from './pages/Login';
import DashboardSelector from './pages/DashboardSelector';
import Dashboard from './pages/Dashboard';

// Goat Management
import Goats from './pages/Goats';
import GoatDetail from './pages/GoatDetail';
import GoatForm from './pages/Goat/GoatForm';
import GoatDashboard from './pages/Goat/GoatDashboard';
import GoatProduction from './pages/Goat/GoatProduction';
import MilkRecordForm from './pages/Goat/MilkRecordForm';
import HealthRecords from './pages/HealthRecords';
import BreedingRecords from './pages/BreedingRecords';
import FeedRecords from './pages/FeedRecords';
import Sales from './pages/Sales';

// Poultry Management
import PoultryDashboard from './pages/Poultry/PoultryDashboard';
import PoultryHealthRecords from './pages/Poultry/PoultryHealthRecords';
import PoultryFeedRecords from './pages/Poultry/PoultryFeedRecords';
import PoultrySales from './pages/Poultry/PoultrySales';
import PoultryReports from './pages/Poultry/PoultryReports';
import Poultry from './pages/Poultry/Poultry';
import PoultryDetail from './pages/Poultry/PoultryDetail';
import PoultryForm from './pages/Poultry/PoultryForm';

// Dairy Management
import DairyDashboard from './pages/Dairy/DairyDashboard';
import DairyHealthRecords from './pages/Dairy/DairyHealthRecords';
import DairyBreeding from './pages/Dairy/DairyBreeding';
import DairyFeedRecords from './pages/Dairy/DairyFeedRecords';
import DairySales from './pages/Dairy/DairySales';
import DairyReports from './pages/Dairy/DairyReports';

// Common
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import LogViewer from './pages/LogViewer';
import UserManagement from './pages/Users/UserManagement';
import UserDetail from './pages/Users/UserDetail';
import Dairy from './pages/Dairy/Dairy';
import DairyForm from './pages/Dairy/DairyForm';

// Development Tools (lazy loaded in production)
const DevTools = React.lazy(() => import('./pages/DevTools'));


function App() {
  const { user, loading } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  // Test API connection on component mount and on route changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Only test connection if we haven't tested in the last minute
      const lastTest = localStorage.getItem('lastApiTest');
      const now = Date.now();
      
      if (!lastTest || (now - parseInt(lastTest, 10)) > 60000) {
        testApiConnection().then(success => {
          if (success) {
            localStorage.setItem('lastApiTest', now.toString());
          }
        });
      }
    }
  }, [location.pathname]); // Re-run when route changes
  
  // Debug logging
  React.useEffect(() => {
    console.log('App render - Auth state:', { 
      loading, 
      user: user ? { id: user._id, email: user.email } : null,
      pathname: location.pathname,
      search: location.search
    });
  }, [user, loading, location]);
  
  // Debug render logging
  console.log('App rendering', {
    loading,
    user: !!user,
    path: window.location.pathname
  });
  
  // Get redirect URL from query params if it exists
  const searchParams = new URLSearchParams(window.location.search);
  const redirectPath = searchParams.get('redirect') || '/';
  
  // Debug route resolution
  console.log('Route resolution:', {
    path: window.location.pathname,
    user: user ? 'authenticated' : 'not authenticated',
    redirectPath
  });

  if (loading) {
    console.log('App loading - showing loading spinner');
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600">Loading application...</p>
        <p className="text-sm text-gray-500 mt-2">Checking authentication status...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          
          {/* Root route with redirects */}
          <Route path="/" element={
            !user ? (
              <Navigate to="/login" state={{ from: location }} replace />
            ) : (
              <Navigate to="/dashboard-selector" replace />
            )
          } />
          
          {/* Dashboard Selector with SimpleLayout */}
          <Route element={<SimpleLayout />}>
            <Route path="/dashboard-selector" element={
              user ? <DashboardSelector /> : <Navigate to="/login" replace />
            } />
          </Route>
          
          {/* Protected routes with layout */}
          <Route element={
            user ? <Layout /> : <Navigate to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} replace />
          }>
            {/* Dashboard routes */}
            <Route path="/dashboard/goat" element={<GoatDashboard />} />
            <Route path="/dashboard/poultry" element={<PoultryDashboard />} />
            <Route path="/dashboard/dairy" element={<DairyDashboard />} />
            <Route path="/dashboard/:farmType" element={<Dashboard />} />
            
            {/* Development Tools */}
            {process.env.NODE_ENV === 'development' && (
              <Route path="/dev-tools" element={
                <React.Suspense fallback={<div>Loading...</div>}>
                  <DevTools />
                </React.Suspense>
              } />
            )}
            
            {/* Goat Management */}
            <Route path="/goats" element={<Goats />} />
            <Route path="/goats/new" element={<GoatForm />} />
            <Route path="/goats/:id" element={<GoatDetail />} />
            <Route path="/goats/:id/edit" element={<GoatForm />} />
            <Route path="/goat-health" element={<HealthRecords />} />
            
            {/* Catch-all route - must be the last route */}
            <Route path="*" element={
              user ? (
                <Navigate to="/dashboard-selector" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } />
            
            <Route path="/goat-breeding" element={<BreedingRecords />} />
            <Route path="/goat-feed" element={<FeedRecords />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/goat-production" element={<GoatProduction />} />
            <Route path="/goats/milk/entry" element={<MilkRecordForm />} />
            <Route path="/goats/milk/entry/:id" element={<MilkRecordForm />} />
            
            {/* Poultry Routes */}
            <Route path="/poultry" element={<Poultry />} />
            <Route path="/poultry/new" element={<PoultryForm />} />
            <Route path="/poultry/:id" element={<PoultryDetail />} />
            <Route path="/poultry/:id/edit" element={<PoultryForm />} />
            <Route path="/poultry-health" element={<PoultryHealthRecords />} />
            <Route path="/poultry-feed-records" element={<PoultryFeedRecords />} />
            <Route path="/poultry-sales" element={<PoultrySales />} />
            <Route path="/poultry-reports" element={<PoultryReports />} />
            
            {/* Dairy Management */}
            <Route path="/dairy" element={<Dairy />} />
            <Route path="/dairy/new" element={<DairyForm />} />
            <Route path="/dairy/:id/edit" element={<DairyForm />} />
            <Route path="/dairy-health" element={<DairyHealthRecords />} />
            <Route path="/dairy-breeding" element={<DairyBreeding />} />
            <Route path="/dairy-feed-records" element={<DairyFeedRecords />} />
            <Route path="/dairy-sales" element={<DairySales />} />
            <Route path="/dairy-reports" element={<DairyReports />} />
            
            {/* Common Routes */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Admin Routes */}
            {hasPermission('canManageUsers') && (
              <>
                <Route path="/users" element={<UserManagement />} />
                <Route path="/users/:id" element={<UserDetail />} />
              </>
            )}
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
    </QueryClientProvider>
  );
}

export default App;
