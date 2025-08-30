import React, { useEffect, useState } from 'react';
import { Egg, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import ProductionRecords from './components/ProductionRecords';

const PoultryProduction = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const res = await api.get('/poultry?limit=1000');
        const list = res?.data?.data || [];
        setBatches(list);
        if (list.length > 0) setSelectedId(list[0]._id);
      } catch (e) {
        console.error(e);
        setError('Failed to load poultry batches');
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Egg className="w-6 h-6 text-yellow-600 mr-2" />
            Poultry Production
          </h1>
          <p className="text-gray-600">Track egg production by batch</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
        <div className="relative">
          <select
            className="input w-full appearance-none pr-10"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.batchName || b.name || 'Unnamed'} (Qty: {b.quantity || 0})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {selectedId ? (
        <div className="bg-white rounded-lg shadow p-4">
          <ProductionRecords poultryId={selectedId} />
        </div>
      ) : (
        <div className="text-gray-500">No batches available.</div>
      )}
    </div>
  );
};

export default PoultryProduction;
