import React, { useState, useEffect } from 'react';
import { Plus, Trash, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

const VaccinationRecords = ({ poultryId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vaccine: '',
    date: new Date().toISOString().split('T')[0],
    nextDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchRecords();
  }, [poultryId]);

  const fetchRecords = async () => {
    try {
      const response = await api.get(`/poultry/${poultryId}/vaccinations`);
      setRecords(response.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load vaccination records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/poultry/${poultryId}/vaccinations`, formData);
      toast.success('Record added');
      setShowForm(false);
      setFormData({
        vaccine: '',
        date: new Date().toISOString().split('T')[0],
        nextDate: '',
        notes: ''
      });
      fetchRecords();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save record');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this record?')) {
      try {
        await api.delete(`/poultry/${poultryId}/vaccinations/${id}`);
        toast.success('Record deleted');
        fetchRecords();
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to delete record');
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Vaccination Records</h3>
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
          <div>
            <label className="block text-sm font-medium mb-1">Vaccine *</label>
            <input
              type="text"
              value={formData.vaccine}
              onChange={(e) => setFormData({...formData, vaccine: e.target.value})}
              className="input w-full"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Next Due</label>
              <input
                type="date"
                value={formData.nextDate}
                onChange={(e) => setFormData({...formData, nextDate: e.target.value})}
                className="input w-full"
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
              Save
            </button>
          </div>
        </form>
      )}

      {records.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No vaccination records found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">Vaccine</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">Next Due</th>
                <th className="px-6 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">{record.vaccine}</td>
                  <td className="px-6 py-3 text-sm">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm">
                    {record.nextDate ? new Date(record.nextDate).toLocaleDateString() : 'N/A'}
                  </td>
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

export default VaccinationRecords;
