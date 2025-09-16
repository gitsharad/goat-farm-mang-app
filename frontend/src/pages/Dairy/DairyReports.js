import React, { useEffect, useMemo, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function DateRange({ start, end, setStart, setEnd }) {
  const { t } = useTranslation(['dairy', 'common']);
  
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-gray-500">
          {t('pages.reports.dateRange.start')}
        </label>
        <input 
          type="date" 
          value={start} 
          onChange={(e) => setStart(e.target.value)} 
          className="border rounded px-2 py-1" 
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500">
          {t('pages.reports.dateRange.end')}
        </label>
        <input 
          type="date" 
          value={end} 
          onChange={(e) => setEnd(e.target.value)} 
          className="border rounded px-2 py-1" 
        />
      </div>
    </div>
  );
}

export default function DairyReports() {
  const { t } = useTranslation('dairy');
  const [animals, setAnimals] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState({ records: [], totalMilk: 0, averageDaily: 0, totalDays: 0 });
  const [error, setError] = useState('');
  const [feed, setFeed] = useState({ consumption: [], dailyTrend: [], recent: [] });
  const [health, setHealth] = useState({ byType: [], monthlyTrend: [], recent: [] });

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
    const fetchAnimals = async () => {
      try {
        const res = await api.get('/dairy?limit=1000');
        setAnimals(res.data?.data || []);
      } catch (e) {
        // noop
      }
    };
    fetchAnimals();
  }, []);

  const fetchReport = async () => {
    if (!selectedId) {
      setError(t('pages.reports.errors.selectAnimal'));
      return;
    }
    try {
      setLoading(true);
      setError('');
      const url = `/dairy/${selectedId}/milk-report?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
      const { data } = await api.get(url);
      setReport(data?.data || { records: [], totalMilk: 0, averageDaily: 0, totalDays: 0 });
    } catch (e) {
      const status = e.response?.status;
      if (status === 403 || status === 404) {
        setError(t('pages.reports.errors.notAccessible'));
      } else {
        setError(e.response?.data?.message || t('pages.reports.errors.loadError'));
      }
      setReport({ records: [], totalMilk: 0, averageDaily: 0, totalDays: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const [feedStatsRes, feedListRes, healthOverviewRes, healthListRes] = await Promise.all([
        api.get(`/dairyFeed/stats/consumption?startDate=${start}&endDate=${end}`),
        api.get(`/dairyFeed?startDate=${start}&endDate=${end}&limit=50&sortBy=date&sortOrder=desc`),
        api.get('/dairyHealth/stats/overview'),
        api.get(`/dairyHealth?startDate=${start}&endDate=${end}&limit=50&sortBy=date&sortOrder=desc`),
      ]);

      const feedStats = feedStatsRes?.data || { consumption: [], dailyTrend: [] };
      const feedRecent = Array.isArray(feedListRes?.data?.records) ? feedListRes.data.records : [];
      setFeed({ consumption: feedStats.consumption || [], dailyTrend: feedStats.dailyTrend || [], recent: feedRecent });

      const healthOverview = healthOverviewRes?.data || { byType: [], monthlyTrend: [] };
      const healthRecent = Array.isArray(healthListRes?.data?.records) ? healthListRes.data.records : [];
      setHealth({ byType: healthOverview.byType || [], monthlyTrend: healthOverview.monthlyTrend || [], recent: healthRecent });
    } catch (e) {
      // Non-fatal; keep existing state
    }
  };

  useEffect(() => {
    // Auto-fetch when selection or dates change
    fetchReport();
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, start, end]);

  const rows = useMemo(() => {
    return (report.records || [])
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(r => ({
        date: new Date(r.date).toISOString().slice(0, 10),
        morning: r.morning,
        evening: r.evening,
        total: r.total,
        fat: r.fatPercentage ?? '-',
        snf: r.snfPercentage ?? '-',
        notes: r.notes || '',
      }));
  }, [report.records]);

  const milkTrend = useMemo(() => {
    const recs = (report.records || [])
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = recs.map(r => new Date(r.date).toISOString().slice(0,10));
    return {
      labels,
      morning: recs.map(r => r.morning || 0),
      evening: recs.map(r => r.evening || 0),
      total: recs.map(r => r.total || 0),
    };
  }, [report.records]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('pages.reports.title')}</h1>
        <p className="text-gray-600">{t('pages.reports.subtitle')}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('pages.reports.selectAnimal')}
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">-- {t('pages.reports.selectAnimal')} --</option>
              {animals.map((animal) => (
                <option key={animal._id} value={animal._id}>
                  {animal.animalId} - {animal.name}
                </option>
              ))}
            </select>
          </div>
          <DateRange start={start} end={end} setStart={setStart} setEnd={setEnd} />
          <div className="flex gap-2">
            <button disabled={!selectedId || loading} onClick={fetchReport} className="btn-primary disabled:opacity-60">{loading ? 'Loading...' : t('refresh')}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">
              {t('pages.reports.milkProduction.totalMilk')}
            </h3>
            <p className="text-2xl font-bold">{report.totalMilk.toFixed(2)} L</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">
              {t('pages.reports.milkProduction.averageDaily')}
            </h3>
            <p className="text-2xl font-bold">{report.averageDaily.toFixed(2)} L</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800">
              {t('pages.reports.milkProduction.totalDays')}
            </h3>
            <p className="text-2xl font-bold">{report.totalDays}</p>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">{t('pages.reports.milkProduction.records')}</div>
          <div className="text-xl font-semibold">{rows.length}</div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">
            {t('pages.reports.milkProduction.chart.title')}
          </h3>
          <div className="h-64">
            <Line
              data={{
                labels: milkTrend.labels,
                datasets: [
                  {
                    label: t('pages.reports.milkProduction.chart.yAxis'),
                    data: milkTrend.total,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: t('pages.reports.milkProduction.chart.yAxis'),
                    },
                  },
                  x: {
                    title: {
                      display: true,
                      text: t('pages.reports.milkProduction.chart.xAxis'),
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {t('pages.reports.milkProduction.table.title')}
          </h3>
          <button
            onClick={() =>
              downloadCSV(
                `milk-production-${new Date().toISOString().slice(0, 10)}.csv`,
                rows,
                ['date', 'morning', 'evening', 'total', 'fat', 'snf', 'notes']
              )
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            {t('pages.reports.milkProduction.exportCSV')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.reports.milkProduction.table.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.reports.milkProduction.table.morning')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.reports.milkProduction.table.evening')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.reports.milkProduction.table.total')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.reports.milkProduction.table.fat')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.reports.milkProduction.table.snf')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.reports.milkProduction.table.notes')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">
                {t('pages.reports.feedConsumption.noRecords')}
              </td>
                </tr>
              )}
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.morning}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.evening}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.total}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.fat}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.snf}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">
            {t('pages.reports.feedConsumption.title')}
          </h3>
          {feed.consumption.length > 0 ? (
            <div className="h-64">
              <Pie
                data={{
                  labels: feed.consumption.map((f) => f.feedType),
                  datasets: [
                    {
                      data: feed.consumption.map((f) => f.amount),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(245, 158, 11, 0.7)',
                        'rgba(139, 92, 246, 0.7)',
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                    title: {
                      display: true,
                      text: t('pages.reports.feedConsumption.chartTitle'),
                    },
                  },
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              {t('pages.reports.feedConsumption.noData')}
            </p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">
            {t('pages.reports.health.title')}
          </h3>
          {health.byType.length > 0 ? (
            <div className="h-64">
              <Pie
                data={{
                  labels: health.byType.map((h) => h.type),
                  datasets: [
                    {
                      data: health.byType.map((h) => h.count),
                      backgroundColor: [
                        'rgba(239, 68, 68, 0.7)',
                        'rgba(249, 115, 22, 0.7)',
                        'rgba(234, 179, 8, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(59, 130, 246, 0.7)',
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                    title: {
                      display: true,
                      text: t('pages.reports.health.byType'),
                    },
                  },
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              {t('pages.reports.health.noData')}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">{t('pages.reports.feedConsumption.recentRecords')}</h2>
          <button
            onClick={() => {
              const headers = Object.values(t('pages.reports.feedConsumption.tableHeaders', { returnObjects: true }));
              const rows = (feed.recent || []).map(r => ({
                date: new Date(r.date).toISOString().slice(0,10),
                animal: r.dairy?.tagNumber || r.dairy?.animalId || '-',
                feedType: r.feedType || '',
                quantity: r.quantity ?? '',
                unit: r.unit || '',
                cost: r.cost ?? '',
                notes: r.notes || ''
              }));
              downloadCSV(
                `dairy_feed_${new Date().toISOString().slice(0,10)}.csv`,
                rows,
                Object.keys(t('pages.reports.feedConsumption.tableHeaders', { returnObjects: true }))
              );
            }}
            className="btn-secondary text-sm"
          >
            {t('pages.reports.feedConsumption.exportCSV')}
          </button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feed Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {(feed.recent || []).map((r, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{new Date(r.date).toISOString().slice(0,10)}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.dairy?.tagNumber || r.dairy?.animalId || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.feedType}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.quantity}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.unit}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.cost || 0}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{r.notes || ''}</td>
                </tr>
              ))}
              {(!feed.recent || feed.recent.length === 0) && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">No records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow lg:col-span-1">
          <h2 className="text-lg font-medium mb-4">{t('pages.reports.health.byType')}</h2>
          <ul className="space-y-2">
            {(health.byType || []).map((h, idx) => (
              <li key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">{h.type}</span>
                <span className="text-gray-900 font-medium">
                  {h.count} • {'$'}{(h.totalCost || 0).toFixed ? (h.totalCost || 0).toFixed(2) : (h.totalCost || 0)}
                </span>
              </li>
            ))}
            {(health.byType || []).length === 0 && (
              <li className="text-sm text-gray-500">{t('pages.reports.health.noRecords')}</li>
            )}
          </ul>
        </div>
        <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">{t('pages.reports.health.recentRecords')}</h2>
            <button
              onClick={() => {
                const headers = Object.values(t('pages.reports.health.tableHeaders', { returnObjects: true }));
                const rows = (health.recent || []).map(r => ({
                  date: new Date(r.date).toISOString().slice(0,10),
                  animal: r.dairy?.tagNumber || r.dairy?.animalId || '-',
                  type: r.type || '',
                  cost: r.cost ?? '',
                  nextDueDate: r.nextDueDate ? new Date(r.nextDueDate).toISOString().slice(0,10) : '',
                  description: r.description || ''
                }));
                downloadCSV(
                  `dairy_health_${new Date().toISOString().slice(0,10)}.csv`,
                  rows,
                  Object.keys(t('pages.reports.health.tableHeaders', { returnObjects: true }))
                );
              }}
              className="btn-secondary text-sm"
            >
              {t('pages.reports.health.exportCSV')}
            </button>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.values(t('pages.reports.health.tableHeaders', { returnObjects: true })).map((header, index) => (
                    <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {(health.recent || []).map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{new Date(r.date).toISOString().slice(0,10)}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.dairy?.tagNumber || r.dairy?.animalId || '-'}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.type}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.cost || 0}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.nextDueDate ? new Date(r.nextDueDate).toISOString().slice(0,10) : '-'}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{r.description || ''}</td>
                  </tr>
                ))}
                {(!health.recent || health.recent.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">
                      {t('pages.reports.health.noRecords')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
