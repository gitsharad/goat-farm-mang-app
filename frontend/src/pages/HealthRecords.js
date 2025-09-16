import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

// Status options for health records
const statusOptions = {
  healthy: 'Healthy',
  sick: 'Sick',
  underTreatment: 'Under Treatment',
  recovered: 'Recovered',
  chronic: 'Chronic'
};

// Health types from translations
const healthTypes = {
  vaccination: 'Vaccination',
  deworming: 'Deworming',
  treatment: 'Treatment',
  checkup: 'Checkup',
  other: 'Other'
};

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

// Health Records Table Component
const HealthRecordsTable = ({ records, getTypeColor, formatDate, handleEdit, setSelectedRecord, setShowDeleteModal, healthTypes, t }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pages.goatHealthPage.tableHeaders.goat')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pages.goatHealthPage.tableHeaders.date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pages.goatHealthPage.tableHeaders.type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pages.goatHealthPage.tableHeaders.description')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pages.goatHealthPage.tableHeaders.veterinarian')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pages.goatHealthPage.fields.cost')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pages.goatHealthPage.fields.nextCheckup')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('pages.goatHealthPage.tableHeaders.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">
                      {(record.goat && (record.goat.name || record.goat.tagNumber)) || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Tag #{record.goat?.tagNumber || 'N/A'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(record.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(record.type)}`}>
                    {healthTypes[record.type] || record.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="line-clamp-2">
                    {record.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.veterinarian || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.cost ? `$${record.cost}` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(record.nextDueDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(record)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    title={t('pages.goatHealthPage.actions.edit')}
                  >
                    {t('pages.goatHealthPage.actions.edit')}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRecord(record);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 hover:text-red-900"
                    title={t('pages.goatHealthPage.actions.delete')}
                  >
                    {t('pages.goatHealthPage.actions.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({ totalPages, currentPage, setCurrentPage, t }) => {
  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="btn-secondary disabled:opacity-50"
        >
          {t('goat.pages.goatHealthPage.pagination.previous')}
        </button>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="btn-secondary disabled:opacity-50"
        >
          {t('goat.pages.goatHealthPage.pagination.next')}
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            {t('goat.pages.goatHealthPage.pagination.showingPage', { current: currentPage, total: totalPages })}
          </p>
        </div>
      </div>
    </div>
  );
};

// Health Records Form Component
const HealthRecordsForm = ({ 
  handleSubmit, 
  formData, 
  setFormData, 
  selectedRecord, 
  setShowAddModal, 
  t, 
  goats, 
  healthTypes, 
  statusOptions 
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedRecord 
              ? t('pages.goatHealthPage.actions.editRecord')
              : t('pages.goatHealthPage.actions.addRecord')}
          </h3>
          <button
            onClick={() => setShowAddModal(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('pages.goatHealthPage.fields.goatId')}
              </label>
              <select
                name="goat"
                value={formData.goat}
                onChange={handleChange}
                className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              >
                <option value="">{t('pages.goatHealthPage.fields.selectGoat')}</option>
                {goats.map(goat => (
                  <option key={goat._id} value={goat._id}>
                    {goat.name} ({goat.tagNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('pages.goatHealthPage.fields.date')}
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('pages.goatHealthPage.fields.type')}
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  required
                >
                  <option value="">{t('pages.goatHealthPage.fields.selectType')}</option>
                  {Object.entries(healthTypes).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('pages.goatHealthPage.fields.description')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('pages.goatHealthPage.fields.veterinarian')}
                </label>
                <input
                  type="text"
                  name="veterinarian"
                  value={formData.veterinarian}
                  onChange={handleChange}
                  className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('pages.goatHealthPage.fields.status')}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  {Object.entries(statusOptions).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('pages.goatHealthPage.fields.medication')}
                </label>
                <input
                  type="text"
                  name="medication"
                  value={formData.medication}
                  onChange={handleChange}
                  className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('pages.goatHealthPage.fields.dosage')}
                </label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('pages.goatHealthPage.fields.nextCheckup')}
                </label>
                <input
                  type="date"
                  name="nextCheckup"
                  value={formData.nextCheckup}
                  onChange={handleChange}
                  className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('pages.goatHealthPage.fields.notes')}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn-secondary"
            >
              {t('pages.goatHealthPage.actions.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {selectedRecord 
                ? t('pages.goatHealthPage.actions.update')
                : t('pages.goatHealthPage.actions.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HealthRecords = () => {
  const { t } = useTranslation(['goat','common']);
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
    date: new Date().toISOString().split('T')[0],
    type: '',
    description: '',
    diagnosis: '',
    treatment: '',
    medication: '',
    dosage: '',
    nextCheckup: '',
    veterinarian: '',
    notes: '',
    status: 'healthy',
    attachments: []
  });

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
        toast.success(t('goat.pages.goatHealthPage.alerts.recordSaved'));
      } else {
        await api.post('/health', formData);
        toast.success(t('goat.pages.goatHealthPage.alerts.recordSaved'));
      }
      setShowAddModal(false);
      setSelectedRecord(null);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || t('goat.pages.goatHealthPage.alerts.error'));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/health/${selectedRecord._id}`);
      toast.success(t('goat.pages.goatHealthPage.alerts.recordDeleted'));
      setShowDeleteModal(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error(t('goat.pages.goatHealthPage.alerts.error'));
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
      diagnosis: '',
      treatment: '',
      medication: '',
      dosage: '',
      nextCheckup: '',
      veterinarian: '',
      notes: '',
      status: 'healthy',
      attachments: []
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      'vaccination': 'bg-green-100 text-green-800',
      'deworming': 'bg-blue-100 text-blue-800',
      'treatment': 'bg-yellow-100 text-yellow-800',
      'checkup': 'bg-purple-100 text-purple-800',
      'other': 'bg-gray-100 text-gray-800',
      'surgery': 'bg-red-100 text-red-800'
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.goatHealthPage.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('pages.goatHealthPage.subtitle')}
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedRecord(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary mt-4 md:mt-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('pages.goatHealthPage.actions.addRecord')}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('pages.goatHealthPage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full border rounded-md"
            />
          </div>
        </div>
        <div className="min-w-[200px]">
          <select
            value={filterGoat}
            onChange={(e) => setFilterGoat(e.target.value)}
            className="input w-full border rounded-md"
          >
            <option value="">{t('pages.goatHealthPage.filters.allGoats')}</option>
            {goats.map(goat => (
              <option key={goat._id} value={goat._id}>{goat.name} ({goat.tagNumber})</option>
            ))}
          </select>
        </div>
        <div className="min-w-[150px]">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input w-full border rounded-md"
          >
            <option value="">{t('pages.goatHealthPage.filters.allTypes')}</option>
            {Object.entries(healthTypes).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[150px]">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="input w-full border rounded-md"
            placeholder={t('pages.goatHealthPage.filters.allDates')}
          />
        </div>
      </div>
      <HealthRecordsTable 
        records={records} 
        getTypeColor={getTypeColor} 
        formatDate={formatDate} 
        handleEdit={handleEdit} 
        setSelectedRecord={setSelectedRecord} 
        setShowDeleteModal={setShowDeleteModal} 
        healthTypes={healthTypes} 
        t={t} 
      />
      {totalPages > 1 && (
        <Pagination 
          totalPages={totalPages} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          t={t} 
        />
      )}
      {showAddModal && (
        <HealthRecordsForm 
          handleSubmit={handleSubmit} 
          formData={formData} 
          setFormData={setFormData} 
          selectedRecord={selectedRecord} 
          setShowAddModal={setShowAddModal} 
          t={t} 
          goats={goats} 
          healthTypes={healthTypes} 
          statusOptions={statusOptions} 
        />
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('pages.goatHealthPage.deleteModal.title')}</h3>
              <p className="text-sm text-gray-500 mb-6">
                {t('pages.goatHealthPage.deleteModal.message')}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary"
                >
                  {t('pages.goatHealthPage.actions.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-danger"
                >
                  {t('pages.goatHealthPage.actions.delete')}
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