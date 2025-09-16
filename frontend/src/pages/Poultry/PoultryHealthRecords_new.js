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
    notes: ''
  });

  // Debug logging for translations
  useEffect(() => {
    console.log('Current language:', i18n.language);
    console.log('Poultry translations:', i18n.getResourceBundle(i18n.language, 'poultry') || 'Not loaded');
  }, [i18n]);

  const healthTypes = Object.entries({
    'Vaccination': t('healthPage.types.Vaccination'),
    'Deworming': t('healthPage.types.Deworming'),
    'Treatment': t('healthPage.types.Treatment'),
    'Checkup': t('healthPage.types.Checkup'),
    'Surgery': t('healthPage.types.Surgery'),
    'Other': t('healthPage.types.Other')
  }).map(([value, label]) => ({ value, label }));

  // Fetch records and batches on component mount and when filters change
  useEffect(() => {
    fetchRecords();
    fetchBatches();
  }, [currentPage, searchTerm, filterBatch, filterType, filterDate]);

  const fetchRecords = useCallback(async () => {
    try {
      const response = await api.get('/poultry-health', {
        params: {
          page: currentPage,
          search: searchTerm,
          batch: filterBatch,
          type: filterType,
          date: filterDate
        }
      });
      setRecords(response.data.records || []);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      toast.error(t('healthPage.alerts.loadError'));
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterBatch, filterType, filterDate, t]);

  const fetchBatches = useCallback(async () => {
    try {
      const response = await api.get('/poultry/batches');
      setBatches(response.data || []);
    } catch (error) {
      toast.error(t('healthPage.alerts.loadError'));
    }
  }, [t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await api.put(`/poultry-health/${selectedRecord._id}`, formData);
        toast.success(t('healthPage.alerts.updateSuccess'));
      } else {
        await api.post('/poultry-health', formData);
        toast.success(t('healthPage.alerts.addSuccess'));
      }
      setShowAddModal(false);
      setSelectedRecord(null);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(t('healthPage.alerts.error'));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/poultry-health/${selectedRecord._id}`);
      toast.success(t('healthPage.alerts.deleteSuccess'));
      setShowDeleteModal(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error(t('healthPage.alerts.error'));
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      poultry: record.poultry?._id || '',
      date: record.date ? format(new Date(record.date), 'yyyy-MM-dd') : '',
      type: record.type,
      description: record.description || '',
      veterinarian: record.veterinarian || '',
      medications: record.medications || [],
      cost: record.cost || '',
      nextDueDate: record.nextDueDate ? format(new Date(record.nextDueDate), 'yyyy-MM-dd') : '',
      notes: record.notes || ''
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
          <h2 className="text-2xl font-semibold">{t('healthPage.title')}</h2>
          <p className="text-gray-600">{t('healthPage.subtitle')}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('healthPage.addRecord')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('healthPage.filters.search')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('healthPage.filters.search')}
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('healthPage.filters.batch')}
            </label>
            <select
              className="input w-full"
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
            >
              <option value="">{t('healthPage.filters.allBatches')}</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name || `Batch ${batch.batchNumber}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('healthPage.filters.type')}
            </label>
            <select
              className="input w-full"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">{t('healthPage.filters.allTypes')}</option>
              {healthTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('healthPage.filters.date')}
            </label>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('healthPage.table.poultryId')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('healthPage.table.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('healthPage.table.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('healthPage.table.description')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('healthPage.table.veterinarian')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('healthPage.table.nextDue')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('healthPage.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.length > 0 ? (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.poultry?.tagNumber || record.poultry?._id || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(record.date), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(record.type)}`}>
                        {healthTypes.find(t => t.value === record.type)?.label || record.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={record.description}>
                        {record.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.veterinarian || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.nextDueDate ? format(new Date(record.nextDueDate), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title={t('healthPage.table.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title={t('healthPage.table.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    {t('healthPage.table.noRecords')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {t('common:previous')}
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {t('common:next')}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {t('common:showingPage', { current: currentPage, total: totalPages })}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">{t('common:first')}</span>
                  <span>«</span>
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">{t('common:previous')}</span>
                  <span>‹</span>
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {t('common:pageOf', { current: currentPage, total: totalPages })}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">{t('common:next')}</span>
                  <span>›</span>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">{t('common:last')}</span>
                  <span>»</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {selectedRecord ? t('healthPage.form.editTitle') : t('healthPage.form.addTitle')}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedRecord(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('healthPage.form.poultry')}
                  </label>
                  <select
                    className="input w-full"
                    value={formData.poultry}
                    onChange={(e) => setFormData({...formData, poultry: e.target.value})}
                    required
                  >
                    <option value="">{t('healthPage.form.selectPoultry')}</option>
                    {batches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name || `Batch ${batch.batchNumber}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('healthPage.form.type')}
                  </label>
                  <select
                    className="input w-full"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="">{t('healthPage.form.selectType')}</option>
                    {healthTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('healthPage.form.date')}
                  </label>
                  <input
                    type="date"
                    className="input w-full"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('healthPage.form.cost')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input w-full"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('healthPage.form.description')}
                  </label>
                  <textarea
                    className="input w-full"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('healthPage.form.veterinarian')}
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.veterinarian}
                    onChange={(e) => setFormData({...formData, veterinarian: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('healthPage.form.nextDueDate')}
                  </label>
                  <input
                    type="date"
                    className="input w-full"
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData({...formData, nextDueDate: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('healthPage.form.notes')}
                  </label>
                  <textarea
                    className="input w-full"
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedRecord(null);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  {t('common:cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {selectedRecord ? t('common:update') : t('common:add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('healthPage.deleteConfirm.title')}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {t('healthPage.deleteConfirm.message')}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary"
                >
                  {t('healthPage.deleteConfirm.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-danger"
                >
                  {t('healthPage.deleteConfirm.confirm')}
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
