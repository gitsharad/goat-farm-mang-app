import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Heart, Milk, Utensils, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const DairyDashboard = () => {
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
        api.get('/dairy?limit=1000')
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
          <h1 className="text-3xl font-bold text-gray-900">Dairy Farm Dashboard</h1>
          <p className="text-gray-600">Overview of your dairy farm operations</p>
        </div>
        <Link
          to="/dairy/new"
          className="btn-primary"
        >
          Add New Cow
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cows</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCows}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Milk className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Milking Cows</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.milkingCows}</p>
            </div>
          </div>
        </div>

        <Link 
          to="/dairy/milk-production" 
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Daily Milk (L)</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.dailyMilkProduction}</p>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-pink-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pregnant Cows</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pregnantCows}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/dairy"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Users className="h-10 w-10 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Dairy</h3>
              <p className="text-gray-600">View and manage your dairy cattle</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dairy-health"
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
          to="/dairy-milk"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Milk className="h-10 w-10 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Milk Production</h3>
              <p className="text-gray-600">Track daily milk records</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dairy-breeding"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Heart className="h-10 w-10 text-pink-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Breeding</h3>
              <p className="text-gray-600">Manage breeding programs</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dairy-feed-records"
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
          to="/dairy-reports"
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

      {/* Milk Production Chart Preview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Milk Production Overview</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-blue-600">{stats.dailyMilkProduction}L</p>
              <p className="text-gray-600">Average daily production</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">{stats.milkingCows} cows</p>
              <p className="text-gray-600">Currently milking</p>
            </div>
          </div>
          <Link
            to="/dairy/production"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View detailed production records →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DairyDashboard;
