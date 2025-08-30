import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import 'chart.js/auto';
import { Line, Bar } from 'react-chartjs-2';

const groupOptions = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

function useDateRange(initialDays = 30) {
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - (initialDays - 1));
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  return { start, end, setStart, setEnd };
}

function qs(params) {
  const esc = encodeURIComponent;
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${esc(k)}=${esc(v)}`)
    .join('&');
}

function formatNum(n) {
  if (n === null || n === undefined) return '0';
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toLocaleString();
}

function Section({ title, children, right }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function Table({ cols, rows, empty = 'No data' }) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols.length} className="px-3 py-6 text-center text-sm text-gray-500">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((r, idx) => (
            <tr key={idx}>
              {cols.map((c) => (
                <td key={c.key} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DateGroupFilters({ start, end, setStart, setEnd, group, setGroup, extra }) {
  return (
    <div className="flex flex-wrap items-end gap-3 mb-4">
      <div>
        <label className="block text-xs text-gray-500">Start</label>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-xs text-gray-500">End</label>
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="border rounded px-2 py-1" />
      </div>
      {group !== undefined && (
        <div>
          <label className="block text-xs text-gray-500">Group</label>
          <select value={group} onChange={(e) => setGroup(e.target.value)} className="border rounded px-2 py-1">
            {groupOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}
      {extra}
    </div>
  );
}

export default function Reports() {
  const base = api.defaults.baseURL?.replace(/\/$/, '') || '';

  const downloadCsv = async (url, filename) => {
    try {
      const res = await api.get(url.replace(base, ''), { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const csvUrl = window.URL.createObjectURL(blob);
      link.href = csvUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(csvUrl);
    } catch (e) {
      // noop
    }
  };

  // Sales
  const sales = useDateRange(30);
  const [salesGroup, setSalesGroup] = useState('day');
  const [buyer, setBuyer] = useState('');
  const [showSalesFilters, setShowSalesFilters] = useState(false);
  const [salesRows, setSalesRows] = useState([]);
  const [salesTotals, setSalesTotals] = useState(null);
  useEffect(() => {
    const fetchSales = async () => {
      const params = { start: sales.start, end: sales.end, group: salesGroup, buyer };
      const { data } = await api.get(`/reports/sales?${qs(params)}`);
      setSalesRows(data.summary || []);
      setSalesTotals(data.totals || null);
    };
    fetchSales().catch(() => {});
  }, [sales.start, sales.end, salesGroup, buyer]);
  const salesCsvUrl = useMemo(() => `${base}/reports/sales?${qs({ start: sales.start, end: sales.end, group: salesGroup, buyer, format: 'csv' })}`,[base, sales.start, sales.end, salesGroup, buyer]);

  const salesChart = useMemo(() => {
    const labels = salesRows.map(r => r.period);
    return {
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Qty (Goats)',
            data: salesRows.map(r => r.goatQuantity || 0),
            backgroundColor: 'rgba(59, 130, 246, 0.4)',
            borderColor: 'rgba(59, 130, 246, 1)',
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'Revenue',
            data: salesRows.map(r => r.revenue || 0),
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            tension: 0.25,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { mode: 'index', intersect: false },
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Qty' } },
          y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Revenue' } },
        },
      },
    };
  }, [salesRows]);

  // Inventory
  const [invBreed, setInvBreed] = useState('');
  const [invGender, setInvGender] = useState('');
  const [inv, setInv] = useState({ totalGoats: 0, statusCounts: [], ageBuckets: [] });
  useEffect(() => {
    const fetchInv = async () => {
      const { data } = await api.get(`/reports/inventory?${qs({ breed: invBreed, gender: invGender })}`);
      setInv(data);
    };
    fetchInv().catch(() => {});
  }, [invBreed, invGender]);
  const invCsvUrl = useMemo(() => `${base}/reports/inventory?${qs({ breed: invBreed, gender: invGender, format: 'csv' })}`,[base, invBreed, invGender]);

  // Health
  const health = useDateRange(30);
  const [healthGroup, setHealthGroup] = useState('day');
  const [healthType, setHealthType] = useState('All');
  const [showHealthFilters, setShowHealthFilters] = useState(false);
  const [healthRows, setHealthRows] = useState([]);
  const [healthTotals, setHealthTotals] = useState(null);
  const [overdueUpcoming, setOverdueUpcoming] = useState({ overdueCount: 0, upcomingCount: 0 });
  useEffect(() => {
    const fetchHealth = async () => {
      const params = { start: health.start, end: health.end, group: healthGroup, type: healthType };
      const { data } = await api.get(`/reports/health?${qs(params)}`);
      setHealthRows(data.summary || []);
      setHealthTotals(data.totals || null);
      setOverdueUpcoming({ overdueCount: data.overdueCount || 0, upcomingCount: data.upcomingCount || 0 });
    };
    fetchHealth().catch(() => {});
  }, [health.start, health.end, healthGroup, healthType]);
  const healthCsvUrl = useMemo(() => `${base}/reports/health?${qs({ start: health.start, end: health.end, group: healthGroup, type: healthType, format: 'csv' })}`,[base, health.start, health.end, healthGroup, healthType]);

  const healthChart = useMemo(() => {
    const labels = healthRows.map(r => r.period);
    return {
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Records',
            data: healthRows.map(r => r.records || 0),
            backgroundColor: 'rgba(99, 102, 241, 0.4)',
            borderColor: 'rgba(99, 102, 241, 1)',
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'Total Cost',
            data: healthRows.map(r => r.totalCost || 0),
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            tension: 0.25,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Records' } },
          y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Cost' } },
        },
      },
    };
  }, [healthRows]);

  // Breeding
  const breeding = useDateRange(120);
  const [breedGroup, setBreedGroup] = useState('day');
  const [breedType, setBreedType] = useState('all');
  const [showBreedFilters, setShowBreedFilters] = useState(false);
  const [breedRows, setBreedRows] = useState([]);
  const [breedTotals, setBreedTotals] = useState(null);
  useEffect(() => {
    const fetchBreed = async () => {
      const params = { start: breeding.start, end: breeding.end, group: breedGroup, type: breedType };
      const { data } = await api.get(`/reports/breeding?${qs(params)}`);
      setBreedRows(data.summary || []);
      setBreedTotals(data.totals || null);
    };
    fetchBreed().catch(() => {});
  }, [breeding.start, breeding.end, breedGroup, breedType]);
  const breedCsvUrl = useMemo(() => `${base}/reports/breeding?${qs({ start: breeding.start, end: breeding.end, group: breedGroup, type: breedType, format: 'csv' })}`,[base, breeding.start, breeding.end, breedGroup, breedType]);

  const breedingChart = useMemo(() => {
    const labels = breedRows.map(r => r.period);
    return {
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Matings',
            data: breedRows.map(r => r.matings || 0),
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            stack: 'b',
            yAxisID: 'y',
          },
          {
            type: 'bar',
            label: 'Pregnancies',
            data: breedRows.map(r => r.pregnancies || 0),
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            stack: 'b',
            yAxisID: 'y',
          },
          {
            type: 'bar',
            label: 'Kiddings',
            data: breedRows.map(r => r.kiddings || 0),
            backgroundColor: 'rgba(234, 179, 8, 0.7)',
            stack: 'b',
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'Avg Litter Size',
            data: breedRows.map(r => Number(r.avgLitterSize || 0)),
            borderColor: 'rgba(99, 102, 241, 1)',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            tension: 0.25,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { beginAtZero: true, stacked: true, title: { display: true, text: 'Counts' } },
          y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Avg Litter' } },
        },
      },
    };
  }, [breedRows]);

  // Feed
  const feed = useDateRange(30);
  const [feedGroup, setFeedGroup] = useState('day');
  const [feedType, setFeedType] = useState('');
  const [unit, setUnit] = useState('');
  const [showFeedFilters, setShowFeedFilters] = useState(false);
  const [feedRows, setFeedRows] = useState([]);
  const [feedTotals, setFeedTotals] = useState(null);
  useEffect(() => {
    const fetchFeed = async () => {
      const params = { start: feed.start, end: feed.end, group: feedGroup, feedType, unit };
      const { data } = await api.get(`/reports/feed?${qs(params)}`);
      setFeedRows(data.summary || []);
      setFeedTotals(data.totals || null);
    };
    fetchFeed().catch(() => {});
  }, [feed.start, feed.end, feedGroup, feedType, unit]);
  const feedCsvUrl = useMemo(() => `${base}/reports/feed?${qs({ start: feed.start, end: feed.end, group: feedGroup, feedType, unit, format: 'csv' })}`,[base, feed.start, feed.end, feedGroup, feedType, unit]);

  const feedChart = useMemo(() => {
    const labels = feedRows.map(r => r.period);
    return {
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Total Qty',
            data: feedRows.map(r => r.totalQuantity || 0),
            backgroundColor: 'rgba(234, 88, 12, 0.6)',
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'Total Cost',
            data: feedRows.map(r => r.totalCost || 0),
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            tension: 0.25,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Quantity' } },
          y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Cost' } },
        },
      },
    };
  }, [feedRows]);

  // Finance
  const finance = useDateRange(60);
  const [finGroup, setFinGroup] = useState('day');
  const [finRows, setFinRows] = useState([]);
  const [finTotals, setFinTotals] = useState(null);
  useEffect(() => {
    const fetchFin = async () => {
      const params = { start: finance.start, end: finance.end, group: finGroup };
      const { data } = await api.get(`/reports/finance?${qs(params)}`);
      setFinRows(data.summary || []);
      setFinTotals(data.totals || null);
    };
    fetchFin().catch(() => {});
  }, [finance.start, finance.end, finGroup]);
  const finCsvUrl = useMemo(() => `${base}/reports/finance?${qs({ start: finance.start, end: finance.end, group: finGroup, format: 'csv' })}`,[base, finance.start, finance.end, finGroup]);

  const finChart = useMemo(() => {
    const labels = finRows.map(r => r.period);
    return {
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: finRows.map(r => r.revenue || 0),
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            tension: 0.25,
          },
          {
            label: 'Total Cost',
            data: finRows.map(r => r.totalCost || 0),
            borderColor: 'rgba(239, 68, 68, 1)',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            tension: 0.25,
          },
          {
            label: 'Net',
            data: finRows.map(r => r.net || 0),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            tension: 0.25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { mode: 'index', intersect: false },
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { beginAtZero: true },
        },
      },
    };
  }, [finRows]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <Section title="Sales" right={<div className="flex items-center gap-3"><button className="text-gray-600 text-sm md:hidden" onClick={() => setShowSalesFilters((s) => !s)}>{showSalesFilters ? 'Hide Filters' : 'Filters'}</button><button className="text-primary-600 text-sm" onClick={() => downloadCsv(salesCsvUrl, `sales-${salesGroup}.csv`)}>Download CSV</button></div>}>
        <div className={(showSalesFilters ? 'block' : 'hidden') + ' md:block'}>
        <DateGroupFilters {...sales} group={salesGroup} setGroup={setSalesGroup} extra={
          <div>
            <label className="block text-xs text-gray-500">Buyer</label>
            <input type="text" value={buyer} onChange={(e) => setBuyer(e.target.value)} className="border rounded px-2 py-1" placeholder="Buyer name" />
          </div>
        } />
        </div>
        <div className="w-full h-48 md:h-64 mb-4">
          <Bar data={salesChart.data} options={salesChart.options} />
        </div>
        <Table
          cols={[
            { key: 'period', label: 'Period' },
            { key: 'invoicesCount', label: 'Invoices' },
            { key: 'goatQuantity', label: 'Qty (Goats)' },
            { key: 'revenue', label: 'Revenue' },
          ]}
          rows={salesRows}
        />
        {salesTotals && (
          <div className="text-sm text-gray-700 mt-2">Totals: Invoices {salesTotals.invoicesCount} · Qty {salesTotals.goatQuantity} · Revenue {salesTotals.revenue}</div>
        )}
      </Section>

      <Section title="Inventory" right={<button className="text-primary-600 text-sm" onClick={() => downloadCsv(invCsvUrl, 'inventory.csv')}>Download CSV</button>}>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500">Breed</label>
            <input value={invBreed} onChange={(e) => setInvBreed(e.target.value)} className="border rounded px-2 py-1" placeholder="Breed" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Gender</label>
            <select value={invGender} onChange={(e) => setInvGender(e.target.value)} className="border rounded px-2 py-1">
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Total Goats</div>
            <div className="text-lg font-semibold">{inv.totalGoats}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">By Status</div>
            <ul className="text-sm text-gray-700 list-disc ml-5">
              {inv.statusCounts?.map((s) => (
                <li key={s.status || 'Unknown'}>{s.status || 'Unknown'}: {s.count}</li>
              ))}
            </ul>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Age Buckets</div>
            <ul className="text-sm text-gray-700 list-disc ml-5">
              {inv.ageBuckets?.map((a) => (
                <li key={a.bucket}>{a.bucket}: {a.count}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Health" right={<div className="flex items-center gap-3"><button className="text-gray-600 text-sm md:hidden" onClick={() => setShowHealthFilters((s) => !s)}>{showHealthFilters ? 'Hide Filters' : 'Filters'}</button><button className="text-primary-600 text-sm" onClick={() => downloadCsv(healthCsvUrl, `health-${healthGroup}.csv`)}>Download CSV</button></div>}>
        <div className={(showHealthFilters ? 'block' : 'hidden') + ' md:block'}>
        <DateGroupFilters {...health} group={healthGroup} setGroup={setHealthGroup} extra={
          <div>
            <label className="block text-xs text-gray-500">Type</label>
            <select value={healthType} onChange={(e) => setHealthType(e.target.value)} className="border rounded px-2 py-1">
              <option>All</option>
              <option>Treatment</option>
              <option>Vaccination</option>
            </select>
          </div>
        } />
        </div>
        <div className="w-full h-48 md:h-64 mb-4">
          <Bar data={healthChart.data} options={healthChart.options} />
        </div>
        <Table cols={[
          { key: 'period', label: 'Period' },
          { key: 'records', label: 'Records' },
          { key: 'totalCost', label: 'Total Cost' },
        ]} rows={healthRows} />
        <div className="flex items-center gap-4 text-sm text-gray-700 mt-2">
          <div>Totals: Records {healthTotals?.records || 0} · Cost {healthTotals?.totalCost || 0}</div>
          <div className="text-amber-700">Overdue: {overdueUpcoming.overdueCount}</div>
          <div className="text-emerald-700">Upcoming (30d): {overdueUpcoming.upcomingCount}</div>
        </div>
      </Section>

      <Section title="Breeding" right={<div className="flex items-center gap-3"><button className="text-gray-600 text-sm md:hidden" onClick={() => setShowBreedFilters((s) => !s)}>{showBreedFilters ? 'Hide Filters' : 'Filters'}</button><button className="text-primary-600 text-sm" onClick={() => downloadCsv(breedCsvUrl, `breeding-${breedGroup}-${breedType}.csv`)}>Download CSV</button></div>}>
        <div className={(showBreedFilters ? 'block' : 'hidden') + ' md:block'}>
        <DateGroupFilters {...breeding} group={breedGroup} setGroup={setBreedGroup} extra={
          <div>
            <label className="block text-xs text-gray-500">Type</label>
            <select value={breedType} onChange={(e) => setBreedType(e.target.value)} className="border rounded px-2 py-1">
              <option value="all">All</option>
              <option value="matings">Matings</option>
              <option value="pregnancies">Pregnancies</option>
              <option value="kiddings">Kiddings</option>
            </select>
          </div>
        } />
        </div>
        <div className="w-full h-48 md:h-64 mb-4">
          <Bar data={breedingChart.data} options={breedingChart.options} />
        </div>
        <Table cols={[
          { key: 'period', label: 'Period' },
          { key: 'matings', label: 'Matings' },
          { key: 'pregnancies', label: 'Pregnancies' },
          { key: 'kiddings', label: 'Kiddings' },
          { key: 'kidsBorn', label: 'Kids Born' },
          { key: 'kidsSurvived', label: 'Kids Survived' },
          { key: 'avgLitterSize', label: 'Avg Litter Size' },
        ]} rows={breedRows} />
        {breedTotals && (
          <div className="text-sm text-gray-700 mt-2">Totals: Matings {breedTotals.matings} · Preg {breedTotals.pregnancies} · Kiddings {breedTotals.kiddings} · Kids {breedTotals.kidsBorn} · Survived {breedTotals.kidsSurvived} · Avg Litter {Number(breedTotals.avgLitterSize || 0).toFixed(2)}</div>
        )}
      </Section>

      <Section title="Feed" right={<div className="flex items-center gap-3"><button className="text-gray-600 text-sm md:hidden" onClick={() => setShowFeedFilters((s) => !s)}>{showFeedFilters ? 'Hide Filters' : 'Filters'}</button><button className="text-primary-600 text-sm" onClick={() => downloadCsv(feedCsvUrl, `feed-${feedGroup}.csv`)}>Download CSV</button></div>}>
        <div className={(showFeedFilters ? 'block' : 'hidden') + ' md:block'}>
        <DateGroupFilters {...feed} group={feedGroup} setGroup={setFeedGroup} extra={
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-gray-500">Feed Type</label>
              <input value={feedType} onChange={(e) => setFeedType(e.target.value)} className="border rounded px-2 py-1" placeholder="e.g. Hay" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Unit</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} className="border rounded px-2 py-1" placeholder="e.g. kg" />
            </div>
          </div>
        } />
        </div>
        <div className="w-full h-48 md:h-64 mb-4">
          <Bar data={feedChart.data} options={feedChart.options} />
        </div>
        <Table cols={[
          { key: 'period', label: 'Period' },
          { key: 'records', label: 'Records' },
          { key: 'totalQuantity', label: 'Total Qty' },
          { key: 'totalCost', label: 'Total Cost' },
        ]} rows={feedRows} />
        {feedTotals && (
          <div className="text-sm text-gray-700 mt-2">Totals: Records {feedTotals.records} · Qty {feedTotals.totalQuantity} · Cost {feedTotals.totalCost}</div>
        )}
      </Section>

      <Section title="Finance" right={<button className="text-primary-600 text-sm" onClick={() => downloadCsv(finCsvUrl, `finance-${finGroup}.csv`)}>Download CSV</button>}>
        <DateGroupFilters {...finance} group={finGroup} setGroup={setFinGroup} />
        <div className="w-full h-48 md:h-64 mb-4">
          <Line data={finChart.data} options={finChart.options} />
        </div>
        <Table cols={[
          { key: 'period', label: 'Period' },
          { key: 'revenue', label: 'Revenue' },
          { key: 'feedCost', label: 'Feed Cost' },
          { key: 'healthCost', label: 'Health Cost' },
          { key: 'breedingCost', label: 'Breeding Cost' },
          { key: 'totalCost', label: 'Total Cost' },
          { key: 'net', label: 'Net' },
        ]} rows={finRows} />
        {finTotals && (
          <div className="text-sm text-gray-700 mt-2">Totals: Revenue {finTotals.revenue} · Feed {finTotals.feedCost} · Health {finTotals.healthCost} · Breeding {finTotals.breedingCost} · Cost {finTotals.totalCost} · Net {finTotals.net}</div>
        )}
      </Section>
    </div>
  );
}
