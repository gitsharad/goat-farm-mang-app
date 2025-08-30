import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const DairyBreeding = () => {
  const [animals, setAnimals] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [animal, setAnimal] = useState(null);
  const [ownershipError, setOwnershipError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    bullId: '',
    bullBreed: '',
    method: 'Natural',
    result: 'Open',
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
      if (!selectedId) return setAnimal(null);
      try {
        setLoading(true);
        const res = await api.get(`/dairy/${selectedId}`);
        setAnimal(res.data?.data || null);
        setOwnershipError('');
      } catch (e) {
        console.error('Failed to load dairy detail', e);
        const status = e.response?.status;
        if (status === 403 || status === 404) {
          setOwnershipError('This animal is not accessible under your account. Please select an animal you own or create a new one.');
          setAnimal(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [selectedId]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addBreeding = async (e) => {
    e.preventDefault();
    if (!animal) return;
    try {
      setSaving(true);
      const newEntry = {
        date: new Date(form.date),
        bullId: form.bullId || undefined,
        bullBreed: form.bullBreed || undefined,
        method: form.method,
        result: form.result,
        notes: form.notes || undefined,
      };
      const existing = animal.breeding?.breedingHistory || [];
      const updated = [...existing, newEntry];

      const payload = { breeding: { breedingHistory: updated } };
      const res = await api.put(`/dairy/${animal._id}`, payload);
      setAnimal(res.data?.data);
      setForm({ date: new Date().toISOString().slice(0, 10), bullId: '', bullBreed: '', method: 'Natural', result: 'Open', notes: '' });
    } catch (e) {
      console.error('Failed to add breeding entry', e);
      const status = e.response?.status;
      if (status === 403 || status === 404) {
        setOwnershipError('You do not have permission to update this animal. Select another or create a new one.');
      } else {
        alert(e.response?.data?.message || 'Failed to add breeding entry');
      }
    } finally {
      setSaving(false);
    }
  };

  const history = (animal?.breeding?.breedingHistory || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dairy Breeding</h1>
          <p className="text-gray-600">Manage breeding programs for dairy cattle</p>
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

        {animal && (
          <form onSubmit={addBreeding} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" name="date" value={form.date} onChange={onChange} className="w-full border rounded-md px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bull ID</label>
              <input type="text" name="bullId" value={form.bullId} onChange={onChange} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bull Breed</label>
              <input type="text" name="bullBreed" value={form.bullBreed} onChange={onChange} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select name="method" value={form.method} onChange={onChange} className="w-full border rounded-md px-3 py-2">
                <option>Natural</option>
                <option>AI</option>
                <option>ET</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
              <select name="result" value={form.result} onChange={onChange} className="w-full border rounded-md px-3 py-2">
                <option>Open</option>
                <option>Pregnant</option>
                <option>Aborted</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" name="notes" value={form.notes} onChange={onChange} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div className="md:col-span-6">
              <button disabled={saving || !!ownershipError} type="submit" className="btn-primary disabled:opacity-60">
                {saving ? 'Saving...' : 'Add Breeding Entry'}
              </button>
            </div>
          </form>
        )}
      </div>

      {loading && <div className="text-gray-500">Loading...</div>}

      {animal && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Breeding History</h2>
          {history.length === 0 ? (
            <p className="text-gray-600">No entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Method</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Result</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Bull ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Bull Breed</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((h, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-700">{new Date(h.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{h.method}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{h.result}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{h.bullId || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{h.bullBreed || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{h.notes || '-'}</td>
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

export default DairyBreeding;
