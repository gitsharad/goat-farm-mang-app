import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const PoultryFeedRecords = () => {
  const [records, setRecords] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterFeedType, setFilterFeedType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    poultry: '',
    date: '',
    feedType: '',
    quantity: '',
    unit: 'kg',
    cost: '',
    notes: '',
    consumed: '',
    waste: ''
  });

  const feedTypes = [
    'Starter', 'Pre-Starter', 'Grower', 'Finisher', 'Layer', 'Breeder',
    'Chick Starter', 'Broiler Starter', 'Broiler Grower', 'Broiler Finisher',
    'Grain', 'Maize/Corn', 'Soybean Meal', 'Fish Meal', 'Vitamins', 'Minerals',
    'Grit', 'Oyster Shell', 'Mash', 'Crumbles', 'Pellets', 'Scratch', 'Greens',
    'Water', 'Probiotics', 'Supplement', 'Medicated Feed', 'Other'
  ];
  const units = ['kg', 'g', 'lbs', 'tonnes', 'liters', 'ml', 'gallons', 'scoops', 'bags'];

  useEffect(() => {
    fetchRecords();
    fetchBatches();
  }, [currentPage, searchTerm, filterBatch, filterFeedType, filterDate]);

  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterBatch && { poultryId: filterBatch }),
        ...(filterFeedType && { feedType: filterFeedType }),
        ...(filterDate && { date: filterDate })
      });
      const response = await api.get(`/poultry-feed?${params}`);
      setRecords(response.data.records || []);
      const total = response.data.total || response.data.records?.length || 0;
      setTotalPages(Math.max(1, Math.ceil(total / 10)));
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch poultry feed records');
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterBatch, filterFeedType, filterDate]);

  const fetchBatches = useCallback(async () => {
    try {
      const response = await api.get('/poultry?limit=1000');
      const data = response.data.data || response.data.poultry || [];
      setBatches(data);
    } catch (error) {
      console.error('Failed to fetch poultry batches');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await api.put(`/poultry-feed/${selectedRecord._id}`, formData);
        toast.success('Poultry feed record updated');
      } else {
        await api.post('/poultry-feed', formData);
        toast.success('Poultry feed record added');
      }
      setShowAddModal(false);
      setSelectedRecord(null);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/poultry-feed/${selectedRecord._id}`);
      toast.success('Poultry feed record deleted');
      setShowDeleteModal(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      poultry: (record.poultry && (record.poultry._id || record.poultry)) || '',
      date: record.date ? record.date.split('T')[0] : '',
      feedType: record.feedType,
      quantity: record.quantity || '',
      unit: record.unit || 'kg',
      cost: record.cost || '',
      notes: record.notes || '',
      consumed: record.consumed || '',
      waste: record.waste || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      poultry: '',
      date: '',
      feedType: '',
      quantity: '',
      unit: 'kg',
      cost: '',
      notes: '',
      consumed: '',
      waste: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Poultry Feed Records</h1>
          <p className="text-gray-600">Track feed consumption and costs for poultry batches</p>
        </div>
        <button
          onClick={() => { setSelectedRecord(null); resetForm(); setShowAddModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Feed Record
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="label">Batch</label>
            <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="input">
              <option value="">All Batches</option>
              {batches.map(batch => (
                <option key={batch._id} value={batch._id}>
                  {batch.batchNumber || batch.name || 'Batch'} ({batch.quantity || 0} birds)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Feed Type</label>
            <select value={filterFeedType} onChange={(e) => setFilterFeedType(e.target.value)} className="input">
              <option value="">All Types</option>
              {feedTypes.map(type => (<option key={type} value={type}>{type}</option>))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Batch</th>
                <th className="table-header">Date</th>
                <th className="table-header">Type</th>
                <th className="table-header">Qty</th>
                <th className="table-header">Unit</th>
                <th className="table-header">Cost</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="font-medium text-gray-900">{record.poultry?.batchNumber || record.poultry?.name || 'Batch'}</div>
                    <div className="text-sm text-gray-500">Qty {record.poultry?.quantity || 'N/A'}</div>
                  </td>
                  <td className="table-cell">{formatDate(record.date)}</td>
                  <td className="table-cell">{record.feedType}</td>
                  <td className="table-cell">{record.quantity}</td>
                  <td className="table-cell">{record.unit}</td>
                  <td className="table-cell">{record.cost ? `$${record.cost}` : 'N/A'}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(record)} className="btn-icon btn-icon-secondary" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedRecord(record); setShowDeleteModal(true); }} className="btn-icon btn-icon-danger" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedRecord ? 'Edit Feed Record' : 'Add Feed Record'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Batch</label>
                  <select value={formData.poultry} onChange={(e) => setFormData({ ...formData, poultry: e.target.value })} className="input" required>
                    <option value="">Select Batch</option>
                    {batches.map(batch => (
                      <option key={batch._id} value={batch._id}>{batch.batchNumber || batch.name} ({batch.quantity || 0} birds)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">Feed Type</label>
                  <select value={formData.feedType} onChange={(e) => setFormData({ ...formData, feedType: e.target.value })} className="input" required>
                    <option value="">Select Type</option>
                    {feedTypes.map(type => (<option key={type} value={type}>{type}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Quantity</label>
                    <input type="number" step="0.01" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="input" required />
                  </div>
                  <div>
                    <label className="label">Unit</label>
                    <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="input" required>
                      {units.map(u => (<option key={u} value={u}>{u}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Cost ($)</label>
                  <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Consumed</label>
                    <input type="number" step="0.01" value={formData.consumed} onChange={(e) => setFormData({ ...formData, consumed: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Waste</label>
                    <input type="number" step="0.01" value={formData.waste} onChange={(e) => setFormData({ ...formData, waste: e.target.value })} className="input" />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">{selectedRecord ? 'Update' : 'Add'} Record</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this record? This action cannot be undone.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleDelete} className="btn-danger">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoultryFeedRecords;
