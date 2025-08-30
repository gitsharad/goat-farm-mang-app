import React, { useState, useEffect } from 'react';
import { Plus, Trash, Edit, Egg, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

const ProductionRecords = ({ poultryId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    eggsProduced: '',
    eggsDamaged: '0',
    notes: ''
  });

  useEffect(() => {
    fetchRecords();
  }, [poultryId]);

  const fetchRecords = async () => {
    try {
      const response = await api.get(`/poultry/${poultryId}/production`);
      setRecords(response.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load production records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/poultry/${poultryId}/production`, formData);
      toast.success('Record added');
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        eggsProduced: '',
        eggsDamaged: '0',
        notes: ''
      });
      fetchRecords();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save record');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this production record?')) {
      try {
        await api.delete(`/poultry/production/${id}`);
        toast.success('Record deleted');
        fetchRecords();
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to delete record');
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Production Records</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-1" />
          {showForm ? 'Cancel' : 'Add Record'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="input w-full"
                  required
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Eggs Produced *</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.eggsProduced}
                  onChange={(e) => setFormData({...formData, eggsProduced: e.target.value})}
                  className="input w-full"
                  min="0"
                  required
                />
                <Egg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Eggs Damaged</label>
              <input
                type="number"
                value={formData.eggsDamaged}
                onChange={(e) => setFormData({...formData, eggsDamaged: e.target.value})}
                className="input w-full"
                min="0"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="input w-full"
              rows="2"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Record
            </button>
          </div>
        </form>
      )}

      {records.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No production records found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">Produced</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">Damaged</th>
                <th className="px-6 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-sm">{record.eggsProduced}</td>
                  <td className="px-6 py-3 text-sm">{record.eggsDamaged || '0'}</td>
                  <td className="px-6 py-3 text-right text-sm">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleDelete(record._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductionRecords;
