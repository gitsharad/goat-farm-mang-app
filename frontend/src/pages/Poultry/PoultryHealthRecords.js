import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, X, PlusCircle, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import api from '../../services/api';

const PoultryHealthRecords = () => {
  const { t, i18n } = useTranslation(['poultry', 'common']);
  const [records, setRecords] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    poultry: '',
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

  // Debug logging for translations
  useEffect(() => {
    console.log('Current language:', i18n.language);
    console.log('Poultry translations:', i18n.getResourceBundle(i18n.language, 'poultry') || 'Not loaded');
  }, [i18n]);

  const healthTypes = [
    { value: 'Vaccination', label: t('pages.healthPage.types.vaccination') },
    { value: 'Deworming', label: t('pages.healthPage.types.deworming') },
    { value: 'Treatment', label: t('pages.healthPage.types.treatment') },
    { value: 'Checkup', label: t('pages.healthPage.types.checkup') },
    { value: 'Surgery', label: t('pages.healthPage.types.surgery') },
    { value: 'Other', label: t('common:other') }
  ];

  useEffect(() => {
    fetchRecords();
    fetchBatches();
  }, [currentPage, searchTerm, filterBatch, filterType, filterDate]);

  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterBatch && { poultryId: filterBatch }),
        ...(filterType && { type: filterType }),
        ...(filterDate && { date: filterDate })
      });

      const response = await api.get(`/poultry-health?${params}`);
      setRecords(response.data.records || []);
      const total = response.data.total || response.data.records?.length || 0;
      setTotalPages(Math.max(1, Math.ceil(total / 10)));
      setLoading(false);
    } catch (error) {
      toast.error(t('pages.healthPage.error.loadFailed'));
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterBatch, filterType, filterDate]);

  const fetchBatches = useCallback(async () => {
    try {
      const response = await api.get('/poultry?limit=1000');
      const data = response.data.data || response.data.poultry || [];
      setBatches(data);
    } catch (error) {
      toast.error(t('pages.healthPage.error.loadFailed'));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await api.put(`/poultry-health/${selectedRecord._id}`, formData);
        toast.success(t('pages.healthPage.alerts.updateSuccess'));
      } else {
        await api.post('/poultry-health', formData);
        toast.success(t('pages.healthPage.alerts.addSuccess'));
      }
      setShowAddModal(false);
      setSelectedRecord(null);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || t('pages.healthPage.alerts.error'));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/poultry-health/${selectedRecord._id}`);
      toast.success(t('pages.healthPage.alerts.deleteSuccess'));
      setShowDeleteModal(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error(t('pages.healthPage.alerts.error'));
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      poultry: (record.poultry && (record.poultry._id || record.poultry)) || '',
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
      poultry: '',
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">{t('pages.healthPage.title')}</h2>
          <p className="text-gray-600">{t('pages.healthPage.subtitle')}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('pages.healthPage.addRecord')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">{t('pages.healthPage.filters.search')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('pages.healthPage.filters.search')}
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">{t('pages.healthPage.filters.batch')}</label>
            <select
              className="input w-full"
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
            >
              <option value="">{t('pages.healthPage.filters.allBatches')}</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name || `Batch ${batch.batchNumber}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('pages.healthPage.filters.type')}</label>
            <select
              className="input w-full"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">{t('pages.healthPage.filters.allTypes')}</option>
              {healthTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('pages.healthPage.filters.date')}</label>
            <input
              type="date"
              className="input w-full"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.healthPage.table.poultryId')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.healthPage.table.date')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.healthPage.table.type')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.healthPage.table.description')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.healthPage.table.veterinarian')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.healthPage.table.cost')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.healthPage.table.nextDue')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.healthPage.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">
                        {(record.poultry && (record.poultry.batchNumber || record.poultry.name)) || 'Batch'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Qty {record.poultry?.quantity || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(record.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getTypeColor(record.type)}`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate" title={record.description}>
                      {record.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.veterinarian || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.cost ? `$${parseFloat(record.cost).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.nextDueDate ? format(new Date(record.nextDueDate), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title={t('pages.healthPage.table.edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title={t('pages.healthPage.table.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    {t('pages.healthPage.table.noRecords')}
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50"
            >
              {t('common:previous')}
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary disabled:opacity-50 ml-3"
            >
              {t('common:next')}
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
                {selectedRecord ? t('pages.healthPage.form.editTitle') : t('pages.healthPage.form.addTitle')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">{t('pages.healthPage.form.batch')}</label>
                  <select
                    value={formData.poultry}
                    onChange={(e) => setFormData({...formData, poultry: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">{t('pages.healthPage.form.selectBatch')}</option>
                    {batches.map(batch => (
                      <option key={batch._id} value={batch._id}>
                        {batch.batchNumber || batch.name} ({batch.quantity || 0} birds)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('pages.healthPage.form.date')}</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">{t('pages.healthPage.form.type')}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">{t('pages.healthPage.form.selectType')}</option>
                    {healthTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('pages.healthPage.form.description')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="label">{t('pages.healthPage.form.veterinarian')}</label>
                  <input
                    type="text"
                    value={formData.veterinarian}
                    onChange={(e) => setFormData({...formData, veterinarian: e.target.value})}
                    className="input"
                    placeholder={t('pages.healthPage.form.veterinarianPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('pages.healthPage.form.cost')}</label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: e.target.value})}
                      className="input"
                      min="0"
                      step="0.01"
                      placeholder={t('pages.healthPage.form.costPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="label">{t('pages.healthPage.form.nextDueDate')}</label>
                    <input
                      type="date"
                      value={formData.nextDueDate}
                      onChange={(e) => setFormData({...formData, nextDueDate: e.target.value})}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">{t('pages.healthPage.form.notes')}</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="input"
                    rows="2"
                    placeholder={t('pages.healthPage.form.notesPlaceholder')}
                  />
                </div>
                <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    {t('common:cancel')}
                  </button>
                  <button type="submit" className="btn-primary">
                    {selectedRecord ? t('common:update') : t('common:save')}
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
                Are you sure you want to delete this record? This action cannot be undone.
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

export default PoultryHealthRecords;
