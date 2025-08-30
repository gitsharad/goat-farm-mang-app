import React, { useEffect, useMemo, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
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
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-gray-500">Start</label>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500">End</label>
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="border rounded px-2 py-1" />
      </div>
    </div>
  );
}

export default function DairyReports() {
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
    if (!selectedId) return;
    try {
      setLoading(true);
      setError('');
      const url = `/dairy/${selectedId}/milk-report?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
      const { data } = await api.get(url);
      setReport(data?.data || { records: [], totalMilk: 0, averageDaily: 0, totalDays: 0 });
    } catch (e) {
      const status = e.response?.status;
      if (status === 403 || status === 404) setError('This animal is not accessible under your account.');
      else setError(e.response?.data?.message || 'Failed to load report');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dairy Reports</h1>
          <p className="text-gray-600">Milk production analytics per animal</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">{error}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Select Animal</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">-- Choose --</option>
              {animals.map(a => (
                <option key={a._id} value={a._id}>
                  {(a.animalId || a.name || a._id)} ({a.breed})
                </option>
              ))}
            </select>
          </div>
          <DateRange start={start} end={end} setStart={setStart} setEnd={setEnd} />
          <div className="flex gap-2">
            <button disabled={!selectedId || loading} onClick={fetchReport} className="btn-primary disabled:opacity-60">{loading ? 'Loading...' : 'Refresh'}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3 bg-blue-50 rounded">
            <div className="text-xs text-gray-500">Total Milk (L)</div>
            <div className="text-xl font-semibold">{report.totalMilk || 0}</div>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <div className="text-xs text-gray-500">Average Daily (L)</div>
            <div className="text-xl font-semibold">{report.averageDaily || 0}</div>
          </div>
          <div className="p-3 bg-amber-50 rounded">
            <div className="text-xs text-gray-500">Days</div>
            <div className="text-xl font-semibold">{report.totalDays || 0}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Records</div>
            <div className="text-xl font-semibold">{rows.length}</div>
          </div>
        </div>

        {/* Milk Daily Trend */}
        <div className="h-64">
          <Line
            data={{
              labels: milkTrend.labels,
              datasets: [
                {
                  label: 'Morning (L)',
                  data: milkTrend.morning,
                  borderColor: 'rgba(59, 130, 246, 1)',
                  backgroundColor: 'rgba(59, 130, 246, 0.25)',
                  tension: 0.3,
                  pointRadius: 0
                },
                {
                  label: 'Evening (L)',
                  data: milkTrend.evening,
                  borderColor: 'rgba(16, 185, 129, 1)',
                  backgroundColor: 'rgba(16, 185, 129, 0.25)',
                  tension: 0.3,
                  pointRadius: 0
                },
                {
                  label: 'Total (L)',
                  data: milkTrend.total,
                  borderColor: 'rgba(139, 92, 246, 1)',
                  backgroundColor: 'rgba(139, 92, 246, 0.25)',
                  tension: 0.3,
                  pointRadius: 0
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: { legend: { position: 'bottom' } },
              scales: { x: { ticks: { maxTicksLimit: 6 } } }
            }}
          />
        </div>

        {/* Milk Records Table */}
        <div className="flex items-center justify-between mt-6 mb-2">
          <h2 className="text-lg font-medium">Milk Records</h2>
          <button
            onClick={() => {
              const headers = ['date','morning','evening','total','fat','snf','notes'];
              downloadCSV(`dairy_milk_${new Date().toISOString().slice(0,10)}.csv`, rows, headers);
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Morning</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Evening</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Fat %</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">SNF %</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">No data</td>
                </tr>
              )}
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap hidden sm:table-cell">{r.morning}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap hidden sm:table-cell">{r.evening}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{r.total}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap hidden sm:table-cell">{r.fat}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap hidden sm:table-cell">{r.snf}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 max-w-[200px] truncate">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feed Consumption Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
          <h2 className="text-lg font-medium mb-4">Dairy Feed Daily Trend</h2>
          <div className="h-64">
            <Line
              data={{
                labels: feed.dailyTrend.map(d => d._id?.date || d._id || ''),
                datasets: [
                  {
                    label: 'Quantity',
                    data: feed.dailyTrend.map(d => d.quantity || d.totalQuantity || 0),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.4)'
                  },
                  {
                    label: 'Cost',
                    data: feed.dailyTrend.map(d => d.cost || 0),
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
                labels: feed.consumption.map(c => c._id),
                datasets: [{
                  label: 'Quantity',
                  data: feed.consumption.map(c => c.totalQuantity || 0),
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
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent Feed Records</h2>
          <button
            onClick={() => {
              const headers = ['date','animal','feedType','quantity','unit','cost','notes'];
              const rows = (feed.recent || []).map(r => ({
                date: new Date(r.date).toISOString().slice(0,10),
                animal: r.dairy?.tagNumber || r.dairy?.animalId || '-',
                feedType: r.feedType || '',
                quantity: r.quantity ?? '',
                unit: r.unit || '',
                cost: r.cost ?? '',
                notes: r.notes || ''
              }));
              downloadCSV(`dairy_feed_${new Date().toISOString().slice(0,10)}.csv`, rows, headers);
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
                {['Date','Animal','Feed Type','Qty','Unit','Cost','Notes'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
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

      {/* Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow lg:col-span-1">
          <h2 className="text-lg font-medium mb-4">Health by Type</h2>
          <ul className="space-y-2">
            {(health.byType || []).map((h, idx) => (
              <li key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">{h._id}</span>
                <span className="text-gray-900 font-medium">
                  {h.count} • {'$'}{(h.totalCost || 0).toFixed ? (h.totalCost || 0).toFixed(2) : (h.totalCost || 0)}
                </span>
              </li>
            ))}
            {(health.byType || []).length === 0 && (
              <li className="text-sm text-gray-500">No health records</li>
            )}
          </ul>
        </div>
        <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Recent Health Records</h2>
            <button
              onClick={() => {
                const headers = ['date','animal','type','cost','nextDueDate','description'];
                const rows = (health.recent || []).map(r => ({
                  date: new Date(r.date).toISOString().slice(0,10),
                  animal: r.dairy?.tagNumber || r.dairy?.animalId || '-',
                  type: r.type || '',
                  cost: r.cost ?? '',
                  nextDueDate: r.nextDueDate ? new Date(r.nextDueDate).toISOString().slice(0,10) : '',
                  description: r.description || ''
                }));
                downloadCSV(`dairy_health_${new Date().toISOString().slice(0,10)}.csv`, rows, headers);
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
                  {['Date','Animal','Type','Cost','Next Due','Description'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
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
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">No records</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
