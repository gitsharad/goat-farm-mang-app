import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Settings, User, RefreshCw } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getFarmStatistics } from '../services/farmService';

// Import farm-specific icons
import { GiFarmTractor, GiBarn, GiCow, GiChicken } from 'react-icons/gi';
import { FaDrumstickBite, FaSeedling } from 'react-icons/fa';

const DashboardSelector = () => {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [farmStats, setFarmStats] = useState({
    goat: { count: 0 },
    poultry: { count: 0 },
    dairy: { count: 0 },
    crops: { count: 0 },
    equipment: { count: 0 },
    loading: true,
    lastUpdated: null
  });

  // Fetch farm statistics on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getFarmStatistics();
        setFarmStats(prev => ({
          ...prev,
          ...stats,
          loading: false,
          lastUpdated: new Date()
        }));
      } catch (error) {
        console.error('Failed to fetch farm statistics:', error);
        setFarmStats(prev => ({
          ...prev,
          loading: false
        }));
      }
    };

    fetchStats();
    
    // Set up refresh interval (every 5 minutes)
    const intervalId = setInterval(fetchStats, 5 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setFarmStats(prev => ({ ...prev, loading: true }));
    try {
      const stats = await getFarmStatistics();
      setFarmStats({
        ...stats,
        loading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Failed to refresh farm statistics:', error);
      setFarmStats(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  // Farm types with enhanced details and realistic icons
  const availableFarmTypes = [
    { 
      id: 'goat', 
      name: t('dashboardSelectorPage.goatFarm'), 
      icon: <GiBarn className="w-16 h-16 mb-4 text-amber-700" />,
      description: t('dashboardSelectorPage.manageGoats'),
      stats: farmStats.loading ? '...' : `${farmStats.goat?.count || 0} ${farmStats.goat?.count === 1 ? 'goat' : 'goats'}`,
      color: 'from-amber-500 to-amber-700',
      enabled: true
    },
    { 
      id: 'poultry', 
      name: t('dashboardSelectorPage.poultryFarm'), 
      icon: <GiChicken className="w-16 h-16 mb-4 text-red-600" />,
      description: t('dashboardSelectorPage.managePoultry'),
      stats: farmStats.loading ? '...' : `${farmStats.poultry?.count || 0} ${farmStats.poultry?.count === 1 ? 'bird' : 'birds'}`,
      color: 'from-red-500 to-red-700',
      enabled: true
    },
    { 
      id: 'dairy', 
      name: t('dashboardSelectorPage.dairyFarm'), 
      icon: <GiCow className="w-16 h-16 mb-4 text-blue-600" />,
      description: t('dashboardSelectorPage.manageDairy'),
      stats: farmStats.loading ? '...' : `${farmStats.dairy?.count || 0} ${farmStats.dairy?.count === 1 ? 'cow' : 'cows'}`,
      color: 'from-blue-500 to-blue-700',
      enabled: true
    },
    { 
      id: 'crops', 
      name: 'Crop Management', 
      icon: <FaSeedling className="w-16 h-16 mb-4 text-green-600" />,
      description: 'Manage your crop cycles and harvests',
      stats: farmStats.loading ? '...' : `${farmStats.crops?.count || 0} ${farmStats.crops?.count === 1 ? 'acre' : 'acres'}`,
      color: 'from-green-500 to-green-700',
      enabled: false
    },
    { 
      id: 'equipment', 
      name: 'Equipment', 
      icon: <GiFarmTractor className="w-16 h-16 mb-4 text-purple-600" />,
      description: 'Track and maintain farm equipment',
      stats: farmStats.loading ? '...' : `${farmStats.equipment?.count || 0} ${farmStats.equipment?.count === 1 ? 'machine' : 'machines'}`,
      color: 'from-purple-500 to-purple-700',
      enabled: false
    }
  ];

  const handleSelectFarm = (farmType) => {
    navigate(`/dashboard/${farmType}`);
  };

  const handleLogout = () => {
    // Add logout logic here
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Enhanced Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <GiBarn className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  {t('dashboardSelectorPage.title')}
                </h1>
              </div>
              <button 
                onClick={handleRefresh}
                disabled={farmStats.loading}
                className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200 ${farmStats.loading ? 'animate-spin' : ''}`}
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${farmStats.loading ? 'text-gray-400' : 'text-gray-500 hover:text-primary-600'}`} />
              </button>
              {farmStats.lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated: {new Date(farmStats.lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <div className="h-8 w-px bg-gray-200"></div>
              <LanguageSwitcher />
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <span className="hidden md:inline text-sm font-medium text-gray-700">
                  {user?.username || 'User'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {t('selectFarmType')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('getStarted')}
            </p>
          </div>
          
          {/* Farm Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableFarmTypes.map((farm) => (
              <div 
                key={farm.id}
                onClick={() => farm.enabled && handleSelectFarm(farm.id)}
                className={`group relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  !farm.enabled ? 'opacity-60' : 'hover:shadow-2xl hover:ring-2 hover:ring-primary-200 cursor-pointer'
                }`}
              >
                {/* Card Header with Gradient */}
                <div className={`h-2 bg-gradient-to-r ${farm.color}`}></div>
                
                {/* Card Content */}
                <div className="p-6 text-center">
                  <div className="mx-auto w-20 h-20 flex items-center justify-center mb-4 rounded-full bg-opacity-10 bg-gray-200 group-hover:bg-opacity-20 transition-all duration-300">
                    {farm.icon}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {farm.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {farm.description}
                  </p>
                  
                  <div className="text-sm text-gray-500 mb-6">
                    {farm.stats}
                  </div>
                  
                  <button 
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${
                      farm.enabled 
                        ? `bg-gradient-to-r ${farm.color} text-white hover:opacity-90`
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!farm.enabled}
                  >
                    {farm.enabled ? t('selectFarm') : t('comingSoon')}
                  </button>
                </div>
                
                {/* Hover Effect */}
                {farm.enabled && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Additional Information */}
          <div className="mt-16 text-center">
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Need help selecting a dashboard?
            </h3>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Each dashboard provides specialized tools and analytics for managing different aspects of your farm operations. 
              Select the one that matches your current needs.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Farm Management System. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">Help Center</span>
                <span className="text-sm">Help Center</span>
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">Privacy</span>
                <span className="text-sm">Privacy Policy</span>
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">Terms</span>
                <span className="text-sm">Terms of Service</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardSelector;
