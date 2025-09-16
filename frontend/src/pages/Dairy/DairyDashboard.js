import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Heart, Milk, Utensils, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const DairyDashboard = () => {
  const { t } = useTranslation('dairy');

  const [stats, setStats] = useState({
    totalCows: 0,
    milkingCows: 0,
    dailyMilkProduction: 0,
    pregnantCows: 0,
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
      const [dairyRes] = await Promise.all([
        api.get('/api/dairy?limit=1000')
      ]);

      const dairy = dairyRes.data.data || [];

      // Calculate stats
      const totalCows = dairy.length;
      const milkingCows = dairy.filter(cow => 
        cow.status === 'Active' && cow.lactation?.currentLactationNumber > 0
      ).length;
      const pregnantCows = dairy.filter(cow => 
        cow.lactation?.pregnancyStatus?.isPregnant
      ).length;

      // Calculate daily milk production (sum of dailyAverage)
      const dailyMilkProduction = dairy.reduce((sum, cow) => 
        sum + (cow.milkProduction?.dailyAverage || 0), 0
      );

      setStats({
        totalCows,
        milkingCows,
        dailyMilkProduction: Math.round(dailyMilkProduction * 100) / 100,
        pregnantCows,
        recentFeeding: Math.floor(totalCows * 0.85), // Mock data
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('pages.dashboard.title')}</h1>
          <p className="text-gray-600">{t('pages.dashboard.subtitle')}</p>
        </div>
        <Link
          to="/dairy/new"
          className="btn-primary"
        >
          {t('pages.animals.addAnimal')}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/dairy" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('pages.dashboard.stats.totalAnimals')}</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCows}</p>
            </div>
          </div>
        </Link>

        <Link to="/dairy/health" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Health Records</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.milkingCows} Active</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/dairy/milk" 
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Milk className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Daily Milk Production</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.dailyMilkProduction} L</p>
            </div>
          </div>
        </Link>

        <Link to="/dairy/breeding" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-pink-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pregnant Animals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pregnantCows}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-800 col-span-full mb-2">Quick Actions</h2>
        
        {/* Manage Animals */}
        <Link
          to="/dairy"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-transform hover:scale-105 border-l-4 border-blue-500"
        >
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Animals</h3>
              <p className="text-sm text-gray-500">View and manage your dairy animals</p>
            </div>
          </div>
        </Link>

        {/* Health Records */}
        <Link
          to="/dairy/health"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-transform hover:scale-105 border-l-4 border-green-500"
        >
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-50">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Health Records</h3>
              <p className="text-sm text-gray-500">Track vaccinations and treatments</p>
            </div>
          </div>
        </Link>

        {/* Milk Production */}
        <Link
          to="/dairy/milk"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-transform hover:scale-105 border-l-4 border-yellow-500"
        >
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-yellow-50">
              <Milk className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Milk Production</h3>
              <p className="text-sm text-gray-500">Record and track milk yields</p>
            </div>
          </div>
        </Link>

        {/* Breeding */}
        <Link
          to="/dairy/breeding"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-transform hover:scale-105 border-l-4 border-pink-500"
        >
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-pink-50">
              <Heart className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Breeding</h3>
              <p className="text-sm text-gray-500">Track breeding and pregnancy</p>
            </div>
          </div>
        </Link>

        {/* Feeding */}
        <Link
          to="/dairy/feeding"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-transform hover:scale-105 border-l-4 border-purple-500"
        >
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-purple-50">
              <Utensils className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Feeding</h3>
              <p className="text-sm text-gray-500">Manage feed and nutrition</p>
            </div>
          </div>
        </Link>

        {/* Reports */}
        <Link
          to="/dairy/reports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-transform hover:scale-105 border-l-4 border-indigo-500"
        >
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-indigo-50">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Reports</h3>
              <p className="text-sm text-gray-500">View farm analytics</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Milk Production Chart Preview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('pages.dashboard.milkProductionOverview')}</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {t('pages.dashboard.dailyMilkProduction', { liters: stats.dailyMilkProduction })}
              </p>
              <p className="text-gray-600">{t('pages.dashboard.averageDailyProduction')}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">{t('pages.dashboard.milkingCows')} {stats.milkingCows} </p>
              <p className="text-gray-600">{t('pages.dashboard.currentlyMilking')}</p>
            </div>
          </div>
          <Link
            to="/dairy/production"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('pages.dashboard.viewDetailedProduction')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DairyDashboard;
