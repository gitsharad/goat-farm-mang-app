import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const DairyHealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnimal, setFilterAnimal] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    dairy: '',
    date: '',
    type: '',
    description: '',
    veterinarian: '',
    medications: [],
    cost: '',
    nextDueDate: '',
    notes: ''
  });

  const healthTypes = [
    'Vaccination',
    'Deworming',
    'Treatment',
    'Checkup',
    'Surgery',
    'Other'
  ];

  useEffect(() => {
    fetchRecords();
    fetchAnimals();
  }, [currentPage, searchTerm, filterAnimal, filterType, filterDate]);

  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterAnimal && { dairyId: filterAnimal }),
        ...(filterType && { type: filterType }),
        ...(filterDate && { date: filterDate })
      });

      const response = await api.get(`/dairy-health?${params}`);
      setRecords(response.data.records || []);
      const total = response.data.total || response.data.records?.length || 0;
      setTotalPages(Math.max(1, Math.ceil(total / 10)));
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch dairy health records');
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterAnimal, filterType, filterDate]);

  const fetchAnimals = useCallback(async () => {
    try {
      const response = await api.get('/dairy?limit=1000');
      const data = response.data.data || response.data.dairy || [];
      setAnimals(data);
    } catch (error) {
      console.error('Failed to fetch dairy animals');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await api.put(`/dairy-health/${selectedRecord._id}`, formData);
        toast.success('Dairy health record updated');
      } else {
        await api.post('/dairy-health', formData);
        toast.success('Dairy health record added');
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
      await api.delete(`/dairy-health/${selectedRecord._id}`);
      toast.success('Dairy health record deleted');
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
      dairy: (record.dairy && (record.dairy._id || record.dairy)) || '',
      date: record.date ? record.date.split('T')[0] : '',
      type: record.type,
      description: record.description || '',
      veterinarian: record.veterinarian || '',
      medications: record.medications || [],
      cost: record.cost || '',
      nextDueDate: record.nextDueDate ? record.nextDueDate.split('T')[0] : '',
      notes: record.notes || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      dairy: '',
      date: '',
      type: '',
      description: '',
      veterinarian: '',
      medications: [],
      cost: '',
      nextDueDate: '',
      notes: ''
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      Vaccination: 'bg-green-100 text-green-800',
      Deworming: 'bg-blue-100 text-blue-800',
      Treatment: 'bg-yellow-100 text-yellow-800',
      Checkup: 'bg-purple-100 text-purple-800',
      Surgery: 'bg-red-100 text-red-800',
      Other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Dairy Health Records</h1>
          <p className="text-gray-600">Manage vaccinations and treatments for dairy animals</p>
        </div>
        <button
          onClick={() => { setSelectedRecord(null); resetForm(); setShowAddModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Health Record
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
            <label className="label">Animal</label>
            <select value={filterAnimal} onChange={(e) => setFilterAnimal(e.target.value)} className="input">
              <option value="">All Animals</option>
              {animals.map(animal => (
                <option key={animal._id} value={animal._id}>
                  {animal.tagNumber || animal.name || 'Animal'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input">
              <option value="">All Types</option>
              {healthTypes.map(t => (<option key={t} value={t}>{t}</option>))}
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
                <th className="table-header">Animal</th>
                <th className="table-header">Date</th>
                <th className="table-header">Type</th>
                <th className="table-header">Description</th>
                <th className="table-header">Vet</th>
                <th className="table-header">Cost</th>
                <th className="table-header">Next Due</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="table-cell">{record.dairy?.tagNumber || record.dairy?.name || 'Animal'}</td>
                  <td className="table-cell">{formatDate(record.date)}</td>
                  <td className="table-cell">
                    <span className={`badge ${getTypeColor(record.type)}`}>{record.type}</span>
                  </td>
                  <td className="table-cell"><div className="max-w-xs truncate" title={record.description}>{record.description}</div></td>
                  <td className="table-cell">{record.veterinarian || 'N/A'}</td>
                  <td className="table-cell">{record.cost ? `$${record.cost}` : 'N/A'}</td>
                  <td className="table-cell">{formatDate(record.nextDueDate)}</td>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedRecord ? 'Edit Health Record' : 'Add Health Record'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Animal</label>
                  <select value={formData.dairy} onChange={(e) => setFormData({ ...formData, dairy: e.target.value })} className="input" required>
                    <option value="">Select Animal</option>
                    {animals.map(animal => (
                      <option key={animal._id} value={animal._id}>{animal.tagNumber || animal.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input" required>
                    <option value="">Select Type</option>
                    {healthTypes.map(t => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">Veterinarian</label>
                  <input type="text" value={formData.veterinarian} onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })} className="input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Cost ($)</label>
                    <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Next Due Date</label>
                    <input type="date" value={formData.nextDueDate} onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input" />
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

export default DairyHealthRecords;
