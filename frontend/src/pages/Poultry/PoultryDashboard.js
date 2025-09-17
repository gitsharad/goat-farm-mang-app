import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Heart, Egg, Utensils, TrendingUp, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const PoultryDashboard = () => {
  const { t } = useTranslation('poultry');
  
  // Helper function to get translations from the correct namespace
  const tDashboard = (key) => t(`pages.poultryDashboard.dashboard.${key}`, { defaultValue: key });
  
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
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">{tDashboard('quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Manage Poultry */}
          <Link
            to="/dashboard/poultry/animals"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-transform hover:scale-105 border-l-4 border-blue-500"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{tDashboard('managePoultry')}</h3>
                <p className="text-sm text-gray-500">{tDashboard('managePoultryDesc')}</p>
              </div>
            </div>
          </Link>

          {/* Health Records */}
          <Link
            to="/dashboard/poultry/health"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-transform hover:scale-105 border-l-4 border-green-500"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-50">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{tDashboard('healthAlerts')}</h3>
                <p className="text-sm text-gray-500">{tDashboard('healthAlertsDesc')}</p>
              </div>
            </div>
          </Link>

          {/* Egg Production */}
          <Link
            to="/dashboard/poultry/eggs"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-transform hover:scale-105 border-l-4 border-yellow-500"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-yellow-50">
                <Egg className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{tDashboard('eggProduction')}</h3>
                <p className="text-sm text-gray-500">{tDashboard('eggProductionDesc')}</p>
              </div>
            </div>
          </Link>

          {/* Feed Management */}
          <Link
            to="/dashboard/poultry/feed"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-transform hover:scale-105 border-l-4 border-orange-500"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-orange-50">
                <Utensils className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{tDashboard('feedManagement')}</h3>
                <p className="text-sm text-gray-500">{tDashboard('feedManagementDesc')}</p>
              </div>
            </div>
          </Link>

          {/* Sales & Inventory */}
          <Link
            to="/dashboard/poultry/sales"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-transform hover:scale-105 border-l-4 border-purple-500"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-50">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{tDashboard('salesInventory')}</h3>
                <p className="text-sm text-gray-500">{tDashboard('salesInventoryDesc')}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Upcoming Vaccinations */}
      {stats.upcomingVaccinations > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-yellow-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {tDashboard('vaccinationAlert')}
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600">
              {tDashboard('vaccinationMessage', { count: stats.upcomingVaccinations })}
            </p>
            <Link
              to="/dashboard/poultry/reports/vaccinations"
              className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
            >
              {tDashboard('viewSchedule')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoultryDashboard;
