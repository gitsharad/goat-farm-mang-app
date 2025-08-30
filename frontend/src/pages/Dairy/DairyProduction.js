import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const DairyProduction = () => {
  const [animals, setAnimals] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [ownershipError, setOwnershipError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    morning: '',
    evening: '',
    fatPercentage: '',
    snfPercentage: '',
    notes: ''
  });

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dairy?limit=1000');
        setAnimals(res.data?.data || []);
      } catch (e) {
        console.error('Failed to load dairy animals', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimals();
  }, []);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!selectedId) return;
      try {
        setLoading(true);
        const res = await api.get(`/dairy/${selectedId}`);
        const recs = res.data?.data?.milkProduction?.records || [];
        // newest first
        setRecords([...recs].reverse());
        setOwnershipError('');
      } catch (e) {
        console.error('Failed to load milk records', e);
        const status = e.response?.status;
        if (status === 403 || status === 404) {
          setOwnershipError('This animal is not accessible under your account. Please select an animal you own or create a new one.');
          setRecords([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [selectedId]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      setSubmitting(true);
      const payload = {
        morning: Number(form.morning),
        evening: Number(form.evening),
      };
      if (form.fatPercentage !== '') payload.fatPercentage = Number(form.fatPercentage);
      if (form.snfPercentage !== '') payload.snfPercentage = Number(form.snfPercentage);
      if (form.notes) payload.notes = form.notes;

      await api.post(`/dairy/${selectedId}/milk`, payload);
      // refresh
      const res = await api.get(`/dairy/${selectedId}`);
      const recs = res.data?.data?.milkProduction?.records || [];
      setRecords([...recs].reverse());
      setForm({ morning: '', evening: '', fatPercentage: '', snfPercentage: '', notes: '' });
    } catch (e) {
      console.error('Failed to add milk record', e);
      const status = e.response?.status;
      if (status === 403 || status === 404) {
        setOwnershipError('You do not have permission to update this animal. Select another or create a new one.');
      } else {
        alert(e.response?.data?.message || 'Failed to add milk record');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Milk Production</h1>
          <p className="text-gray-600">Track and manage daily milk production records</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {ownershipError && (
          <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
            {ownershipError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Animal</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">-- Choose --</option>
              {animals.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.animalId || a.name || a._id} ({a.breed})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedId && !ownershipError && (
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Morning (L)</label>
              <input name="morning" type="number" step="0.01" className="w-full border rounded-md px-3 py-2" value={form.morning} onChange={onChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evening (L)</label>
              <input name="evening" type="number" step="0.01" className="w-full border rounded-md px-3 py-2" value={form.evening} onChange={onChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fat (%)</label>
              <input name="fatPercentage" type="number" step="0.01" className="w-full border rounded-md px-3 py-2" value={form.fatPercentage} onChange={onChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SNF (%)</label>
              <input name="snfPercentage" type="number" step="0.01" className="w-full border rounded-md px-3 py-2" value={form.snfPercentage} onChange={onChange} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input name="notes" type="text" className="w-full border rounded-md px-3 py-2" value={form.notes} onChange={onChange} />
            </div>
            <div className="md:col-span-6">
              <button disabled={submitting} type="submit" className="btn-primary">
                {submitting ? 'Saving...' : 'Add Milk Record'}
              </button>
            </div>
          </form>
        )}
      </div>

      {loading && (
        <div className="text-gray-500">Loading...</div>
      )}

      {selectedId && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Milk Records</h2>
          {records.length === 0 ? (
            <p className="text-gray-600">No records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Morning</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Evening</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fat%</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">SNF%</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-700">{new Date(r.date).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.morning}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.evening}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium">{r.total}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.fatPercentage ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.snfPercentage ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DairyProduction;
