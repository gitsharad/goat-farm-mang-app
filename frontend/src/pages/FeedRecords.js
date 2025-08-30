import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, DollarSign, Utensils } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const FeedRecords = () => {
  const [records, setRecords] = useState([]);
  const [goats, setGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGoat, setFilterGoat] = useState('');
  const [filterFeedType, setFilterFeedType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    goat: '',
    pen: '',
    date: '',
    feedType: '',
    quantity: '',
    unit: '',
    cost: '',
    supplier: '',
    notes: '',
    feedingTime: '',
    consumed: '',
    waste: ''
  });

  const feedTypes = [
    'Hay',
    'Grain',
    'Silage',
    'Pasture',
    'Concentrate',
    'Mineral Supplement',
    'Vitamin Supplement',
    'Other'
  ];

  const units = [
    'kg',
    'lbs',
    'grams',
    'bales',
    'scoops',
    'handfuls'
  ];

  const feedingTimes = [
    'Morning',
    'Afternoon',
    'Evening',
    'Night',
    'All Day'
  ];

  useEffect(() => {
    fetchRecords();
    fetchGoats();
  }, [currentPage, searchTerm, filterGoat, filterFeedType, filterDate]);

  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterGoat && { goat: filterGoat }),
        ...(filterFeedType && { feedType: filterFeedType }),
        ...(filterDate && { date: filterDate })
      });

      const response = await api.get(`/feed?${params}`);
      setRecords(response.data.records);
      setTotalPages(Math.ceil(response.data.total / 10));
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch feed records');
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterGoat, filterFeedType, filterDate]);

  const fetchGoats = useCallback(async () => {
    try {
      const response = await api.get('/goats');
      setGoats(response.data.goats);
    } catch (error) {
      console.error('Failed to fetch goats');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await api.put(`/feed/${selectedRecord._id}`, formData);
        toast.success('Feed record updated successfully');
      } else {
        await api.post('/feed', formData);
        toast.success('Feed record added successfully');
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
      await api.delete(`/feed/${selectedRecord._id}`);
      toast.success('Feed record deleted successfully');
      setShowDeleteModal(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error('Failed to delete feed record');
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      goat: record.goat?._id || record.goat || '',
      pen: record.pen || '',
      date: record.date ? record.date.split('T')[0] : '',
      feedType: record.feedType,
      quantity: record.quantity || '',
      unit: record.unit || '',
      cost: record.cost || '',
      supplier: record.supplier || '',
      notes: record.notes || '',
      feedingTime: record.feedingTime || '',
      consumed: record.consumed || '',
      waste: record.waste || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      goat: '',
      pen: '',
      date: '',
      feedType: '',
      quantity: '',
      unit: '',
      cost: '',
      supplier: '',
      notes: '',
      feedingTime: '',
      consumed: '',
      waste: ''
    });
  };

  const getFeedTypeColor = (type) => {
    const colors = {
      'Hay': 'bg-green-100 text-green-800',
      'Grain': 'bg-yellow-100 text-yellow-800',
      'Silage': 'bg-blue-100 text-blue-800',
      'Pasture': 'bg-emerald-100 text-emerald-800',
      'Concentrate': 'bg-purple-100 text-purple-800',
      'Mineral Supplement': 'bg-indigo-100 text-indigo-800',
      'Vitamin Supplement': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateTotalCost = () => {
    return records.reduce((total, record) => total + (parseFloat(record.cost) || 0), 0);
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
          <h1 className="text-2xl font-bold text-gray-900">Feed Records</h1>
          <p className="text-gray-600">Manage goat feeding schedules and feed inventory</p>
        </div>
        <button
          onClick={() => {
            setSelectedRecord(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Feed Record
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Utensils className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="font-semibold text-gray-900">{records.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="font-semibold text-gray-900">${calculateTotalCost().toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Records</p>
              <p className="font-semibold text-gray-900">
                {records.filter(r => {
                  const today = new Date().toDateString();
                  const recordDate = new Date(r.date).toDateString();
                  return today === recordDate;
                }).length}
              </p>
            </div>
          </div>
        </div>
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
            <label className="label">Goat</label>
            <select
              value={filterGoat}
              onChange={(e) => setFilterGoat(e.target.value)}
              className="input"
            >
              <option value="">All Goats</option>
              {goats.map(goat => (
                <option key={goat._id} value={goat._id}>{goat.name} ({goat.tagNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Feed Type</label>
            <select
              value={filterFeedType}
              onChange={(e) => setFilterFeedType(e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              {feedTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Goat</th>
                <th className="table-header">Date</th>
                <th className="table-header">Feed Type</th>
                <th className="table-header">Quantity</th>
                <th className="table-header">Cost</th>
                <th className="table-header">Feeding Time</th>
                <th className="table-header">Consumed</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    {record.goat ? (
                      <div>
                        <div className="font-medium text-gray-900">
                          {record.goat.name || record.goat.tagNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          Tag #{record.goat.tagNumber}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">General Feeding</div>
                    )}
                  </td>
                  <td className="table-cell">{formatDate(record.date)}</td>
                  <td className="table-cell">
                    <span className={`badge ${getFeedTypeColor(record.feedType)}`}>
                      {record.feedType}
                    </span>
                  </td>
                  <td className="table-cell">
                    {record.quantity} {record.unit}
                  </td>
                  <td className="table-cell">
                    {record.cost ? `$${record.cost}` : 'N/A'}
                  </td>
                  <td className="table-cell">{record.feedingTime || 'N/A'}</td>
                  <td className="table-cell">
                    {record.consumed ? `${record.consumed} ${record.unit}` : 'N/A'}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="btn-icon btn-icon-secondary"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowDeleteModal(true);
                        }}
                        className="btn-icon btn-icon-danger"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedRecord ? 'Edit Feed Record' : 'Add Feed Record'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Goat (Optional)</label>
                  <select
                    value={formData.goat}
                    onChange={(e) => setFormData({...formData, goat: e.target.value})}
                    className="input"
                  >
                    <option value="">General Feeding</option>
                    {goats.map(goat => (
                      <option key={goat._id} value={goat._id}>
                        {goat.name} ({goat.tagNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Pen/Location</label>
                  <input
                    type="text"
                    value={formData.pen}
                    onChange={(e) => setFormData({...formData, pen: e.target.value})}
                    className="input"
                    placeholder="e.g., Pen A, Field 1"
                  />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Feed Type</label>
                    <select
                      value={formData.feedType}
                      onChange={(e) => setFormData({...formData, feedType: e.target.value})}
                      className="input"
                      required
                    >
                      <option value="">Select Type</option>
                      {feedTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Quantity</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="input"
                      required
                    >
                      <option value="">Select Unit</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: e.target.value})}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    className="input"
                    placeholder="e.g., Local Farm Supply"
                  />
                </div>
                <div>
                  <label className="label">Feeding Time</label>
                  <select
                    value={formData.feedingTime}
                    onChange={(e) => setFormData({...formData, feedingTime: e.target.value})}
                    className="input"
                  >
                    <option value="">Select Time</option>
                    {feedingTimes.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Consumed</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.consumed}
                      onChange={(e) => setFormData({...formData, consumed: e.target.value})}
                      className="input"
                      placeholder="Amount eaten"
                    />
                  </div>
                  <div>
                    <label className="label">Waste</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.waste}
                      onChange={(e) => setFormData({...formData, waste: e.target.value})}
                      className="input"
                      placeholder="Amount wasted"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="input"
                    rows="3"
                    placeholder="Additional notes about feeding..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {selectedRecord ? 'Update' : 'Add'} Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this feed record? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedRecords; 