import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Subscription = () => {
  const [plans, setPlans] = useState(null);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyStatus, setHistoryStatus] = useState('all');
  const [historyPlan, setHistoryPlan] = useState('all');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const navigate = useNavigate();

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const load = async () => {
      setLoading(true);
      try {
        const [plansResponse, meResponse, historyResponse] = await Promise.all([
          api.get('/subscription/plans'),
          api.get('/subscription/me').catch(e => {
            if (e.response?.status === 404) {
              return { data: null }; // No active subscription
            }
            throw e;
          }),
          api.get('/subscription/history').catch(e => {
            console.warn('Could not load subscription history:', e.message);
            return { data: [] }; // Return empty array if history can't be loaded
          })
        ]);
        
        setPlans(plansResponse.data);
        setCurrent(meResponse?.data || null);
        setHistory(historyResponse?.data || []);
      } catch (err) {
        console.error('Error loading subscription data:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load subscription data';
        toast.error(errorMessage);
        
        // If unauthorized, redirect to login
        if (err.response?.status === 401) {
          const currentPath = window.location.pathname;
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          return;
        }
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [user]);

  // Trial actions temporarily disabled/removed from UI

  const handleUpgrade = async (planKey) => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ plan: planKey })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Upgrade failed');
      }
      const updated = await res.json();
      setCurrent(updated);
      toast.success(`Upgraded to ${planKey} plan`);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  };

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = (date) => {
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / msPerDay));
  };

  const filteredHistory = history.filter(h =>
    (historyStatus === 'all' || h.status === historyStatus) &&
    (historyPlan === 'all' || h.plan === historyPlan)
  );

  const exportHistoryCsv = () => {
    const rows = [['Date','Plan','Amount','Currency','Status']]
      .concat(filteredHistory.map(h => [
        new Date(h.createdAt).toISOString(),
        h.plan,
        String(h.amount),
        h.currency || 'USD',
        h.status
      ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'billing_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const planEntries = plans ? Object.entries(plans) : [];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button className="btn-secondary" onClick={() => navigate(-1)}>← Back</button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Manage Subscription</h1>
        {current && (
          <div className="text-gray-700 mb-8 space-y-2">
            <p>
              Active access:
              <span className="font-semibold ml-2">
                {['goat','poultry','dairy']
                  .filter(ft => current?.farmTypeAccess?.[ft])
                  .map(ft => ft.charAt(0).toUpperCase() + ft.slice(1))
                  .join(', ') || 'None'}
              </span>
            </p>
            {current.endDate && (
              <p className="text-gray-600">Paid access ends in {daysLeft(current.endDate)} days</p>
            )}
            {current.features && (
              <div className="mt-3 text-sm">
                <div className="font-medium mb-1">Features:</div>
                <ul className="list-disc ml-5 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <li>Max animals: {current.features.maxAnimals}</li>
                  <li>Health tracking: {current.features.healthTracking ? 'Yes' : 'No'}</li>
                  <li>Breeding management: {current.features.breedingManagement ? 'Yes' : 'No'}</li>
                  <li>Feed management: {current.features.feedManagement ? 'Yes' : 'No'}</li>
                  <li>Analytics: {current.features.analytics ? 'Yes' : 'No'}</li>
                  <li>Mobile App: {current.features.mobileApp ? 'Yes' : 'No'}</li>
                  <li>API Access: {current.features.apiAccess ? 'Yes' : 'No'}</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {planEntries.map(([key, p]) => {
            const isActive = !!current?.farmTypeAccess?.[key];
            return (
              <div key={key} className={`bg-white border rounded-xl p-6 shadow-sm ${isActive ? 'ring-2 ring-primary-500' : ''}`}>
                <h3 className="text-xl font-semibold mb-1">{p.name}</h3>
                <p className="text-gray-600 mb-4">${p.price} / {p.duration} days</p>
                <div className="text-sm text-gray-700 mb-4">
                  <div>Farm access:</div>
                  <ul className="list-disc ml-5">
                    <li>Goat: {p.farmTypeAccess.goat ? 'Yes' : 'No'}</li>
                    <li>Poultry: {p.farmTypeAccess.poultry ? 'Yes' : 'No'}</li>
                    <li>Dairy: {p.farmTypeAccess.dairy ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
                <button
                  className={`btn w-full ${isActive ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'btn-primary'}`}
                  onClick={() => handleUpgrade(key)}
                  disabled={isActive || upgrading}
                >
                  {isActive ? 'Active' : 'Subscribe'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Billing History</h2>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select className="border rounded px-3 py-2" value={historyStatus} onChange={(e)=>setHistoryStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select className="border rounded px-3 py-2" value={historyPlan} onChange={(e)=>setHistoryPlan(e.target.value)}>
              <option value="all">All plans</option>
              <option value="goat">Goat</option>
              <option value="poultry">Poultry</option>
              <option value="dairy">Dairy</option>
            </select>
            <button className="btn-secondary" onClick={exportHistoryCsv}>Export CSV</button>
          </div>
          {filteredHistory.length === 0 ? (
            <p className="text-gray-600">No transactions yet.</p>
          ) : (
            <div className="bg-white border rounded-xl divide-y">
              {filteredHistory.map(tx => (
                <div key={tx._id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium capitalize">{tx.plan}</div>
                    <div className="text-gray-500 text-sm">{new Date(tx.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{tx.currency || 'USD'} {tx.amount?.toFixed ? tx.amount.toFixed(2) : tx.amount}</div>
                    <div className={`text-sm capitalize ${tx.status === 'paid' ? 'text-green-600' : 'text-gray-600'}`}>{tx.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscription;
