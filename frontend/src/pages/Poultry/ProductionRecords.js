import React, { useState, useEffect } from 'react';
import { Plus, BarChart2, Calendar, Egg } from 'lucide-react';
import api from '../../services/api';

const ProductionRecords = ({ poultryId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    const fetchProduction = async () => {
      try {
        const response = await api.get(`/poultry/${poultryId}/production?range=${timeRange}`);
        setRecords(response.data);
      } catch (err) {
        setError('Failed to load production records');
        console.error('Error fetching production records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduction();
  }, [poultryId, timeRange]);

  const getTotalEggs = () => {
    return records.reduce((sum, record) => sum + record.quantity, 0);
  };

  if (loading) return <div>Loading production records...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Egg Production</h3>
          <p className="text-sm text-gray-500">Track and manage egg production records</p>
        </div>
        <div className="flex space-x-2">
          <select 
            className="border rounded-md px-3 py-1.5 text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">This year</option>
          </select>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-1" /> Add Record
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Egg className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Eggs</p>
              <p className="text-2xl font-semibold">{getTotalEggs()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Production History</h3>
        </div>
        {records.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No production records found for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Eggs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionRecords;
