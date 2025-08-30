import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Heart, Egg, Utensils, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const PoultryDashboard = () => {
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
        api.get('/poultry?limit=1000'),
        api.get('/poultry/reports/production?timeRange=7d')
      ]);

      const poultry = poultryRes.data.data || [];
      const production = productionRes.data.data || [];

      // Calculate stats
      const totalBirds = poultry.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
      const activeBirds = poultry
        .filter(batch => batch.status === 'Active')
        .reduce((sum, batch) => sum + (batch.quantity || 0), 0);
      
      // Calculate total egg production for the week
      const weeklyEggProduction = production.reduce((sum, day) => sum + (day.totalEggs || 0), 0);

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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Poultry Farm Dashboard</h1>
          <p className="text-gray-600">Overview of your poultry farm operations</p>
        </div>
        <Link
          to="/poultry/new"
          className="btn-primary"
        >
          Add New Batch
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Birds</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalBirds}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Birds</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeBirds}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Egg className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Weekly Eggs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.eggProduction}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Utensils className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fed Today</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.recentFeeding}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/poultry"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Users className="h-10 w-10 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Poultry</h3>
              <p className="text-gray-600">View and manage your poultry batches</p>
            </div>
          </div>
        </Link>

        <Link
          to="/poultry-health"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Heart className="h-10 w-10 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Health Records</h3>
              <p className="text-gray-600">Track vaccinations and treatments</p>
            </div>
          </div>
        </Link>

        <Link
          to="/poultry-reports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Egg className="h-10 w-10 text-yellow-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Production</h3>
              <p className="text-gray-600">Track egg production</p>
            </div>
          </div>
        </Link>

        <Link
          to="/poultry-feed-records"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Utensils className="h-10 w-10 text-orange-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Feed Management</h3>
              <p className="text-gray-600">Track feeding schedules</p>
            </div>
          </div>
        </Link>

        <Link
          to="/poultry-reports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <TrendingUp className="h-10 w-10 text-purple-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
              <p className="text-gray-600">View analytics and reports</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Upcoming Vaccinations */}
      {stats.upcomingVaccinations > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              Upcoming Vaccinations
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600">
              You have {stats.upcomingVaccinations} batches with upcoming vaccinations in the next 30 days.
            </p>
            <Link
              to="/poultry/reports/vaccinations"
              className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
            >
              View vaccination schedule →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoultryDashboard;
