import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Heart, Egg, Utensils, TrendingUp, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const PoultryDashboard = () => {
  const { t, i18n } = useTranslation('poultry');
  
  // Debug logs
  useEffect(() => {
    const logTranslations = () => {
      console.log('=== POULTRY DASHBOARD DEBUG ===');
      console.log('Current language:', i18n.language);
      console.log('Available languages:', i18n.languages);
      
      // Get all loaded namespaces and resources
      const allResources = i18n.store.data[i18n.language];
      console.log('All loaded resources:', allResources);
      
      // Get the translations for the current language and namespace
      const translations = i18n.getResourceBundle(i18n.language, 'poultry');
      console.log('Poultry translations:', translations);
      
      // Test different translation keys with explicit namespace
      const testKeys = [
        'pages.poultryDashboard.dashboard.title',
        'pages.poultryDashboard.dashboard.managePoultry',
        'pages.poultryDashboard.navigation.dashboard'
      ];
      
      testKeys.forEach(key => {
        const value = i18n.t(key, { 
          ns: 'poultry',
          lng: i18n.language,
          defaultValue: `[MISSING: ${key}]`
        });
        console.log(`Translation for ${key}:`, value);
      });
      
      // Log available translations structure
      if (allResources?.poultry?.pages?.poultryDashboard) {
        console.log('Poultry dashboard translations:', allResources.poultry.pages.poultryDashboard);
      }
    };
    
    // Log translations on mount and when language changes
    logTranslations();
    i18n.on('languageChanged', logTranslations);
    
    return () => {
      i18n.off('languageChanged', logTranslations);
    };
  }, [i18n, t]);
  
  // Access translations using the correct path that matches the JSON structure
  const tDashboard = (key) => t(`pages.poultryDashboard.dashboard.${key}`, { ns: 'poultry', defaultValue: key });
  const tNav = (key) => t(`pages.poultryDashboard.navigation.${key}`, { ns: 'poultry', defaultValue: key });
  const [stats, setStats] = useState({
    totalBirds: 0,
    activeBirds: 0,
    eggProduction: 0,
    upcomingVaccinations: 0,
    recentFeeding: 0,
    alerts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [poultryRes, productionRes] = await Promise.all([
        api.get('/api/poultry?limit=1000'),
        api.get('/api/poultry/reports/production?timeRange=7d')
      ]);

      const poultry = Array.isArray(poultryRes?.data?.data) ? poultryRes.data.data : [];
      const production = Array.isArray(productionRes?.data?.data) ? productionRes.data.data : [];

      // Calculate stats
      const totalBirds = poultry?.reduce((sum, batch) => sum + (Number(batch?.quantity) || 0), 0) || 0;
      const activeBirds = poultry
        ?.filter(batch => batch?.status === 'Active')
        ?.reduce((sum, batch) => sum + (Number(batch?.quantity) || 0), 0) || 0;
      
      // Calculate total egg production for the week
      const weeklyEggProduction = production?.reduce((sum, day) => sum + (Number(day?.totalEggs) || 0), 0) || 0;

      // Get upcoming vaccinations (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const upcomingVaccinations = poultry.filter(batch => 
        batch.vaccination && 
        batch.vaccination.some(v => 
          v.nextDate && new Date(v.nextDate) <= thirtyDaysFromNow
        )
      ).length;

      setStats({
        totalBirds,
        activeBirds,
        eggProduction: weeklyEggProduction,
        upcomingVaccinations,
        recentFeeding: Math.floor(activeBirds * 0.9), // Mock data
        alerts: []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tDashboard('title')}</h1>
          <p className="text-gray-600">{tDashboard('subtitle')}</p>
        </div>
        <Link
          to="/dashboard/poultry/animals/new"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          {tDashboard('addBatch')}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{tDashboard('recentActivity')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalBirds}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{tDashboard('healthRecords')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeBirds}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Egg className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{tDashboard('managePoultry')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.eggProduction}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Utensils className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{tDashboard('feedConsumption')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.recentFeeding}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link
          to="/dashboard/poultry/animals"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Users className="h-10 w-10 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{tDashboard('quickActions')}</h3>
              <p className="text-gray-600">{tDashboard('managePoultry')}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/poultry/health"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Heart className="h-10 w-10 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{tDashboard('healthAlerts')}</h3>
              <p className="text-gray-600">{tDashboard('noAlerts')}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/poultry/reports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Egg className="h-10 w-10 text-yellow-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{tDashboard('eggProduction')}</h3>
              <p className="text-gray-600">{tDashboard('noRecentActivity')}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/poultry/feed"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Utensils className="h-10 w-10 text-orange-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{tDashboard('feedManagement')}</h3>
              <p className="text-gray-600">{tDashboard('noRecentActivity')}</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/poultry/reports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <TrendingUp className="h-10 w-10 text-purple-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{tDashboard('salesInventory')}</h3>
              <p className="text-gray-600">{tDashboard('noRecentActivity')}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Upcoming Vaccinations */}
      {stats.upcomingVaccinations > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-yellow-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {t('pages.poultryDashboard.dashboard.vaccinationAlert')}
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600">
              {t('pages.poultryDashboard.dashboard.vaccinationMessage', { count: stats.upcomingVaccinations })}
            </p>
            <Link
              to="/dashboard/poultry/reports/vaccinations"
              className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
            >
              {t('pages.poultryDashboard.dashboard.viewSchedule')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoultryDashboard;
