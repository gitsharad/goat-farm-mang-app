import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Calendar, Filter, Download } from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../translations';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PoultryReports = () => {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [reportData, setReportData] = useState({
    production: [],
    vaccinations: [],
    inventory: [],
    feed: { consumption: [], dailyTrend: [], recent: [] }
  });

  // CSV export helper
  const downloadCSV = (filename, rows, headers) => {
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Map UI range -> backend timeRange and explicit dates
      const tr = timeRange === 'week' ? '7d' : timeRange === 'month' ? '30d' : '90d';
      const end = new Date();
      const start = new Date(end);
      start.setDate(end.getDate() - (timeRange === 'week' ? 6 : timeRange === 'month' ? 29 : 89));
      const startStr = start.toISOString().slice(0,10);
      const endStr = end.toISOString().slice(0,10);

      const [productionRes, vaccinationsRes, inventoryRes, feedStatsRes, feedListRes] = await Promise.all([
        api.get(`/poultry/reports/production?timeRange=${tr}`),
        api.get(`/poultry/reports/vaccinations?timeRange=${tr}`),
        api.get('/poultry/reports/inventory'),
        api.get(`/poultryFeed/stats/consumption?startDate=${startStr}&endDate=${endStr}`),
        api.get(`/poultryFeed?startDate=${startStr}&endDate=${endStr}&limit=50&sortBy=date&sortOrder=desc`)
      ]);

      // Normalize production: {_id, totalEggs, totalDamaged} -> {date, eggsProduced, eggsDamaged}
      const productionRaw = (productionRes?.data?.data) || [];
      const production = Array.isArray(productionRaw)
        ? productionRaw.map(p => ({
            date: p._id,
            eggsProduced: p.totalEggs || 0,
            eggsDamaged: p.totalDamaged || 0,
          }))
        : [];

      // Normalize vaccinations: { upcoming: [...], recent: [...] } -> [{vaccine, count}]
      const vaccData = vaccinationsRes?.data?.data || {};
      const vaccAll = [
        ...(Array.isArray(vaccData.upcoming) ? vaccData.upcoming : []),
        ...(Array.isArray(vaccData.recent) ? vaccData.recent : []),
      ];
      const vaccCounts = vaccAll.reduce((acc, v) => {
        const vaccine = (v.vaccination && v.vaccination[0]?.vaccine) || v.vaccine || t('unknown');
        acc[vaccine] = (acc[vaccine] || 0) + 1;
        return acc;
      }, {});
      const vaccinations = Object.entries(vaccCounts).map(([vaccine, count]) => ({ vaccine, count }));

      // Normalize inventory nested aggregation into [{status, count}]
      const invRaw = inventoryRes?.data?.data || [];
      const statusCounts = {};
      if (Array.isArray(invRaw)) {
        invRaw.forEach(breedGroup => {
          (breedGroup.types || []).forEach(typeGroup => {
            (typeGroup.statuses || []).forEach(s => {
              const key = s.status;
              statusCounts[key] = (statusCounts[key] || 0) + (s.count || 0);
            });
          });
        });
      }
      const inventory = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

      const feedStats = feedStatsRes?.data || { consumption: [], dailyTrend: [] };
      const recent = Array.isArray(feedListRes?.data?.records) ? feedListRes.data.records : [];
      setReportData({ production, vaccinations, inventory, feed: { consumption: feedStats.consumption || [], dailyTrend: feedStats.dailyTrend || [], recent } });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const productionChartData = {
    labels: reportData.production.map(item => item.date),
    datasets: [
      {
        label: t('eggsProduced'),
        data: reportData.production.map(item => item.eggsProduced),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: t('eggsDamaged'),
        data: reportData.production.map(item => item.eggsDamaged || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const vaccinationChartData = {
    labels: reportData.vaccinations.map(item => item.vaccine),
    datasets: [
      {
        label: t('vaccinationsAdministered'),
        data: reportData.vaccinations.map(item => item.count),
        backgroundColor: [
          'rgba(16, 185, 129, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(139, 92, 246, 0.5)',
          'rgba(20, 184, 166, 0.5)',
          'rgba(244, 63, 94, 0.5)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(20, 184, 166, 1)',
          'rgba(244, 63, 94, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const inventoryChartData = {
    labels: reportData.inventory.map(item => item.status),
    datasets: [
      {
        label: t('numberOfBirds'),
        data: reportData.inventory.map(item => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(16, 185, 129, 0.5)',
          'rgba(245, 158, 11, 0.5)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const exportToCSV = () => {
    // This is a placeholder for CSV export functionality
    // In a real app, you would generate and download a CSV file
    console.log('Exporting data to CSV...');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('poultryAnalytics')}</h1>
          <p className="text-gray-600">{t('poultryAnalyticsSubtitle')}</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="week">{t('last7Days')}</option>
              <option value="month">{t('last30Days')}</option>
              <option value="year">{t('last12Months')}</option>
            </select>
            <Filter className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-1" />
            {t('export')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">{t('eggProduction')}</h2>
          <div className="h-64">
            <Line
              data={productionChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">{t('vaccinationSummary')}</h2>
          <div className="h-64">
            <Pie
              data={vaccinationChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
          <h2 className="text-lg font-medium mb-4">{t('inventoryStatus')}</h2>
          <div className="h-64">
            <Bar
              data={inventoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">{t('quickStats')}</h2>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">{t('totalBirds')}</p>
              <p className="text-2xl font-semibold">
                {reportData.inventory.reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">{t('totalEggs7d')}</p>
              <p className="text-2xl font-semibold">
                {reportData.production
                  .slice(-7)
                  .reduce((sum, item) => sum + (parseInt(item.eggsProduced) || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-500">{t('vaccinations30d')}</p>
              <p className="text-2xl font-semibold">
                {reportData.vaccinations.reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Consumption Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
          <h2 className="text-lg font-medium mb-4">Poultry Feed Daily Trend</h2>
          <div className="h-64">
            <Line
              data={{
                labels: reportData.feed.dailyTrend.map(d => d._id?.date || d._id || ''),
                datasets: [
                  {
                    label: 'Quantity',
                    data: reportData.feed.dailyTrend.map(d => d.quantity || d.totalQuantity || 0),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.4)'
                  },
                  {
                    label: 'Cost',
                    data: reportData.feed.dailyTrend.map(d => d.cost || 0),
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.4)'
                  }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Feed by Type</h2>
          <div className="h-64">
            <Pie
              data={{
                labels: reportData.feed.consumption.map(c => c._id),
                datasets: [{
                  label: 'Quantity',
                  data: reportData.feed.consumption.map(c => c.totalQuantity || 0),
                  backgroundColor: [
                    'rgba(59, 130, 246, 0.5)',
                    'rgba(16, 185, 129, 0.5)',
                    'rgba(245, 158, 11, 0.5)',
                    'rgba(244, 63, 94, 0.5)',
                    'rgba(139, 92, 246, 0.5)'
                  ],
                  borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(244, 63, 94, 1)',
                    'rgba(139, 92, 246, 1)'
                  ],
                  borderWidth: 1
                }]
              }}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
      </div>

      {/* Recent Feed Records */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent Feed Records</h2>
          <button
            onClick={() => {
              const headers = ['date','poultry','feedType','quantity','unit','cost','coop','notes'];
              const rows = (reportData.feed.recent || []).map(r => ({
                date: new Date(r.date).toISOString().slice(0,10),
                poultry: r.poultry?.tagNumber || r.poultry?.batchNumber || '-',
                feedType: r.feedType || '',
                quantity: r.quantity ?? '',
                unit: r.unit || '',
                cost: r.cost ?? '',
                coop: r.coop || '',
                notes: r.notes || ''
              }));
              downloadCSV(`poultry_feed_${new Date().toISOString().slice(0,10)}.csv`, rows, headers);
            }}
            className="btn-secondary text-sm"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Poultry</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feed Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Unit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Cost</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Coop</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {(reportData.feed.recent || []).map((r, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{new Date(r.date).toISOString().slice(0,10)}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap hidden sm:table-cell">{r.poultry?.tagNumber || r.poultry?.batchNumber || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.feedType}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.quantity}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap hidden sm:table-cell">{r.unit}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap hidden sm:table-cell">{r.cost || 0}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap hidden sm:table-cell">{r.coop || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 max-w-[150px] truncate">{r.notes || ''}</td>
                </tr>
              ))}
              {(!reportData.feed.recent || reportData.feed.recent.length === 0) && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-sm text-gray-500">No records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PoultryReports;
