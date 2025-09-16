import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Milk, Plus, BarChart2, Filter, Calendar, Download, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const GoatProduction = () => {
  const { t } = useTranslation('goat');
  const [milkRecords, setMilkRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchMilkRecords();
  }, [dateRange]);

  const fetchMilkRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/goats/milk-records?start=${dateRange.start}&end=${dateRange.end}`);
      // Ensure we always set an array, even if response.data is null/undefined
      setMilkRecords(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching milk records:', error);
      // Set to empty array on error to prevent reduce errors
      setMilkRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('pages.goatProduction.title')}</h1>
          <p className="text-gray-600">{t('pages.goatProduction.subtitle')}</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/goats/milk/entry')}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('pages.goatProduction.newRecord')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Milk className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('pages.goatProduction.totalProduction')}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Array.isArray(milkRecords) ? milkRecords.reduce((sum, record) => sum + (parseFloat(record?.quantity) || 0), 0).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BarChart2 className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('pages.goatProduction.avgPerGoat')}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Array.isArray(milkRecords) && milkRecords.length > 0 
                  ? (milkRecords.reduce((sum, record) => sum + (parseFloat(record?.quantity) || 0), 0) / milkRecords.length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('pages.goatProduction.dateRange')}</p>
              <div className="flex space-x-2">
                <input
                  type="date"
                  name="start"
                  value={dateRange.start}
                  onChange={handleDateChange}
                  className="text-sm border rounded p-1"
                />
                <span className="text-gray-500">{t('pages.goatProduction.to')}</span>
                <input
                  type="date"
                  name="end"
                  value={dateRange.end}
                  onChange={handleDateChange}
                  className="text-sm border rounded p-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">{t('pages.goatProduction.table.title')}</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('pages.goatProduction.searchPlaceholder')}
                className="pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              {t('pages.goatProduction.export')}
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goatProduction.table.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goatProduction.table.goatId')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goatProduction.table.quantity')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goatProduction.table.fat')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goatProduction.table.snf')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goatProduction.table.notes')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {milkRecords.length > 0 ? (
                milkRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.goatId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.quantity.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.fat || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.snf || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No milk records found for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GoatProduction;
