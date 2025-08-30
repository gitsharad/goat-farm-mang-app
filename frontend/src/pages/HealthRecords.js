import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const HealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [goats, setGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGoat, setFilterGoat] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    goat: '',
    date: '',
    type: '',
    description: '',
    veterinarian: '',
    medications: [],
    cost: '',
    nextDueDate: '',
    notes: '',
    attachments: []
  });

  const healthTypes = [
    'Vaccination',
    'Deworming',
    'Treatment',
    'Checkup',
    'Surgery',
    'Other'
  ];

  // Helper function to persist logs
  const logToStorage = (message, data = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, data };
    console.log(`[${timestamp}]`, message, data);
    
    // Keep last 10 log entries
    const logs = JSON.parse(localStorage.getItem('healthRecordsLogs') || '[]');
    logs.push(logEntry);
    if (logs.length > 10) logs.shift();
    localStorage.setItem('healthRecordsLogs', JSON.stringify(logs));
  };

  useEffect(() => {
    logToStorage('HealthRecords mounted', { currentPage, searchTerm });
    
    // Add an unload handler to prevent navigation during debugging
    const handleBeforeUnload = (e) => {
      logToStorage('HealthRecords unmounting', { path: window.location.pathname });
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    fetchRecords().catch(err => {
      logToStorage('Failed to fetch records', { error: err.message });
    });
    
    fetchGoats().catch(err => {
      logToStorage('Failed to fetch goats', { error: err.message });
    });
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentPage, searchTerm, filterGoat, filterType, filterDate]);

  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterGoat && { goat: filterGoat }),
        ...(filterType && { type: filterType }),
        ...(filterDate && { date: filterDate })
      });

      logToStorage('Fetching health records', { 
        url: `/health?${params.toString()}`,
        params: Object.fromEntries(params.entries()) 
      });
      
      // Make request with custom error handling
      const response = await api.get(`/health?${params}`, {
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });
      
      logToStorage('Health records response', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data ? 'Data received' : 'No data'
      });
      
      if (response.status === 401) {
        logToStorage('Authentication required', { status: 401 });
        // Don't redirect, just show error
        toast.error('Please log in to view health records');
        setLoading(false);
        return;
      }
      
      if (response.status !== 200) {
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
      }
      
      if (!response.data || !Array.isArray(response.data.records)) {
        throw new Error('Invalid response format');
      }
      
      logToStorage('Health records fetched successfully', { 
        count: response.data.records.length,
        total: response.data.total
      });
      
      setRecords(response.data.records);
      setTotalPages(Math.ceil(response.data.total / 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching health records:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(`Failed to fetch health records: ${error.response?.data?.message || error.message}`);
      setLoading(false);
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    }
  }, [currentPage, searchTerm, filterGoat, filterType, filterDate]);

  const fetchGoats = useCallback(async () => {
    try {
      console.log('Fetching goats...');
      const response = await api.get('/goats');
      
      if (!response.data || !Array.isArray(response.data.goats)) {
        console.error('Invalid goats data format:', response.data);
        return;
      }
      
      console.log('Goats fetched successfully:', response.data.goats.length);
      setGoats(response.data.goats);
    } catch (error) {
      console.error('Failed to fetch goats:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await api.put(`/health/${selectedRecord._id}`, formData);
        toast.success('Health record updated successfully');
      } else {
        await api.post('/health', formData);
        toast.success('Health record added successfully');
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
      await api.delete(`/health/${selectedRecord._id}`);
      toast.success('Health record deleted successfully');
      setShowDeleteModal(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error('Failed to delete health record');
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      goat: (record.goat && (record.goat._id || record.goat)) || '',
      date: record.date ? record.date.split('T')[0] : '',
      type: record.type,
      description: record.description,
      veterinarian: record.veterinarian || '',
      medications: record.medications || [],
      cost: record.cost || '',
      nextDueDate: record.nextDueDate ? record.nextDueDate.split('T')[0] : '',
      notes: record.notes || '',
      attachments: record.attachments || []
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      goat: '',
      date: '',
      type: '',
      description: '',
      veterinarian: '',
      medications: [],
      cost: '',
      nextDueDate: '',
      notes: '',
      attachments: []
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      'Vaccination': 'bg-green-100 text-green-800',
      'Deworming': 'bg-blue-100 text-blue-800',
      'Treatment': 'bg-yellow-100 text-yellow-800',
      'Checkup': 'bg-purple-100 text-purple-800',
      'Surgery': 'bg-red-100 text-red-800',
      'Other': 'bg-gray-100 text-gray-800'
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
          <h1 className="text-2xl font-bold text-gray-900">Health Records</h1>
          <p className="text-gray-600">Manage goat health records and medical treatments</p>
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
            <label className="label">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              {healthTypes.map(type => (
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
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">
                        {(record.goat && (record.goat.name || record.goat.tagNumber)) || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Tag #{record.goat?.tagNumber || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">{formatDate(record.date)}</td>
                  <td className="table-cell">
                    <span className={`badge ${getTypeColor(record.type)}`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="max-w-xs truncate" title={record.description}>
                      {record.description}
                    </div>
                  </td>
                  <td className="table-cell">{record.veterinarian || 'N/A'}</td>
                  <td className="table-cell">
                    {record.cost ? `$${record.cost}` : 'N/A'}
                  </td>
                  <td className="table-cell">{formatDate(record.nextDueDate)}</td>
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
                {selectedRecord ? 'Edit Health Record' : 'Add Health Record'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Goat</label>
                  <select
                    value={formData.goat}
                    onChange={(e) => setFormData({...formData, goat: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">Select Goat</option>
                    {goats.map(goat => (
                      <option key={goat._id} value={goat._id}>
                        {goat.name} ({goat.tagNumber})
                      </option>
                    ))}
                  </select>
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
                <div>
                  <label className="label">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">Select Type</option>
                    {healthTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="label">Veterinarian</label>
                  <input
                    type="text"
                    value={formData.veterinarian}
                    onChange={(e) => setFormData({...formData, veterinarian: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Medications</label>
                  <div className="space-y-2">
                    {formData.medications.map((medication, index) => (
                      <div key={index} className="border rounded p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Medication {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newMedications = formData.medications.filter((_, i) => i !== index);
                              setFormData({...formData, medications: newMedications});
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Medication name"
                            value={medication.name || ''}
                            onChange={(e) => {
                              const newMedications = [...formData.medications];
                              newMedications[index] = {...newMedications[index], name: e.target.value};
                              setFormData({...formData, medications: newMedications});
                            }}
                            className="input text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Dosage"
                            value={medication.dosage || ''}
                            onChange={(e) => {
                              const newMedications = [...formData.medications];
                              newMedications[index] = {...newMedications[index], dosage: e.target.value};
                              setFormData({...formData, medications: newMedications});
                            }}
                            className="input text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Frequency"
                            value={medication.frequency || ''}
                            onChange={(e) => {
                              const newMedications = [...formData.medications];
                              newMedications[index] = {...newMedications[index], frequency: e.target.value};
                              setFormData({...formData, medications: newMedications});
                            }}
                            className="input text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            value={medication.duration || ''}
                            onChange={(e) => {
                              const newMedications = [...formData.medications];
                              newMedications[index] = {...newMedications[index], duration: e.target.value};
                              setFormData({...formData, medications: newMedications});
                            }}
                            className="input text-sm"
                          />
                        </div>
                        <textarea
                          placeholder="Notes"
                          value={medication.notes || ''}
                          onChange={(e) => {
                            const newMedications = [...formData.medications];
                            newMedications[index] = {...newMedications[index], notes: e.target.value};
                            setFormData({...formData, medications: newMedications});
                          }}
                          className="input text-sm"
                          rows="1"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          medications: [...formData.medications, { name: '', dosage: '', frequency: '', duration: '', notes: '' }]
                        });
                      }}
                      className="btn-secondary text-sm"
                    >
                      Add Medication
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="label">Next Due Date</label>
                    <input
                      type="date"
                      value={formData.nextDueDate}
                      onChange={(e) => setFormData({...formData, nextDueDate: e.target.value})}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="input"
                    rows="2"
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
                Are you sure you want to delete this health record? This action cannot be undone.
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

export default HealthRecords; 