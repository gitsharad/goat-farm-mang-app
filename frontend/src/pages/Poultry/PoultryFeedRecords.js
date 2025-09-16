import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, X as CloseIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const PoultryFeedRecords = () => {
  const { t } = useTranslation(['poultry', 'common']);
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
    { value: 'Starter', label: t('pages.feedPage.feedTypes.starter') },
    { value: 'Grower', label: t('pages.feedPage.feedTypes.grower') },
    { value: 'Finisher', label: t('pages.feedPage.feedTypes.finisher') },
    { value: 'Layer', label: t('pages.feedPage.feedTypes.layer') },
    { value: 'Broiler', label: t('pages.feedPage.feedTypes.broiler') },
    { value: 'Other', label: t('pages.feedPage.feedTypes.custom') }
  ];

  const units = [
    { value: 'kg', label: t('pages.feedPage.units.kg') },
    { value: 'g', label: t('pages.feedPage.units.g') },
    { value: 'lbs', label: t('pages.feedPage.units.lbs') },
    { value: 'tonnes', label: t('pages.feedPage.units.tonnes') },
    { value: 'litres', label: t('pages.feedPage.units.litres') }
  ];

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
      toast.error(t('pages.feedPage.alerts.error'));
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterBatch, filterFeedType, filterDate]);

  const fetchBatches = useCallback(async () => {
    try {
      const response = await api.get('/poultry?limit=1000');
      const data = response.data.data || response.data.poultry || [];
      setBatches(data);
    } catch (error) {
      toast.error(t('feedPage.alerts.loadBatchesError'));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await api.put(`/poultry-feed/${selectedRecord._id}`, formData);
        toast.success(t('feedPage.alerts.updateSuccess'));
      } else {
        await api.post('/poultry-feed', formData);
        toast.success(t('feedPage.alerts.addSuccess'));
      }
      setShowAddModal(false);
      setSelectedRecord(null);
      resetForm();
      fetchRecords();
    } catch (error) {
      console.error('Error saving feed record:', error);
      toast.error(t('pages.feedPage.alerts.error'));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/poultry-feed/${selectedRecord._id}`);
      toast.success(t('pages.feedPage.alerts.deleteSuccess'));
      setShowDeleteModal(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      console.error('Error deleting feed record:', error);
      toast.error(t('pages.feedPage.alerts.error'));
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('pages.feedPage.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t('pages.feedPage.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setSelectedRecord(null);
            setFormData({
              poultry: '',
              date: new Date().toISOString().split('T')[0],
              feedType: '',
              quantity: '',
              unit: 'kg',
              cost: '',
              notes: '',
              consumed: '',
              waste: ''
            });
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <Plus size={18} />
          {t('pages.feedPage.addRecord')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label dark:text-gray-300">{t('common.search')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('pages.feedPage.filters.search')}
                className="input pl-10 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label dark:text-gray-300">{t('pages.feedPage.filters.batch')}</label>
            <select
              className="input w-full"
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
            >
              <option value="">{t('pages.feedPage.filters.allBatches')}</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name || `${t('pages.feedPage.batch')} ${batch.batchNumber}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label dark:text-gray-300">{t('pages.feedPage.filters.feedType')}</label>
            <select
              className="input w-full "
              value={filterFeedType}
              onChange={(e) => setFilterFeedType(e.target.value)}
            >
              <option value="">{t('pages.feedPage.filters.allTypes')}</option>
              {feedTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label dark:text-gray-300">{t('pages.feedPage.filters.dateRange')}</label>
            <input
              type="date"
              className="input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('pages.feedPage.table.batchId')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('pages.feedPage.table.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('pages.feedPage.table.feedType')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('pages.feedPage.table.quantity')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('pages.feedPage.table.consumed')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('pages.feedPage.table.waste')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('pages.feedPage.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="font-medium text-gray-900">{record.poultry?.batchNumber || record.poultry?.name || 'Batch'}</div>
                    <div className="text-sm text-gray-500">Qty {record.poultry?.quantity || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(record.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.feedType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.consumed}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.waste}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(record)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      title={t('common:edit')}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title={t('common:delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {selectedRecord ? t('pages.feedPage.form.title.edit') : t('pages.feedPage.form.title.add')}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <CloseIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('pages.feedPage.form.fields.batchId')}
                    </label>
                    <select
                      className="input w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.poultry}
                      onChange={(e) =>
                        setFormData({ ...formData, poultry: e.target.value })
                      }
                      required
                    >
                      <option value="">{t('pages.feedPage.form.fields.selectBatch')}</option>
                      {batches.map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.name || `${t('pages.feedPage.batch')} ${batch.batchNumber}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('pages.feedPage.form.fields.date')}
                    </label>
                    <input
                      type="date"
                      className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('pages.feedPage.form.fields.feedType')}
                    </label>
                    <select
                      className="input w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.feedType}
                      onChange={(e) =>
                        setFormData({ ...formData, feedType: e.target.value })
                      }
                      required
                    >
                      <option value="">{t('pages.feedPage.form.fields.selectFeedType')}</option>
                      {feedTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('pages.feedPage.form.fields.quantity')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('pages.feedPage.form.fields.unit')}
                      </label>
                      <select
                        className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2 px-2 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.unit}
                        onChange={(e) =>
                          setFormData({ ...formData, unit: e.target.value })
                        }
                      >
                        {units.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('pages.feedPage.form.fields.cost')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.cost}
                      onChange={(e) =>
                        setFormData({ ...formData, cost: e.target.value })
                      }
                      placeholder={t('pages.feedPage.form.fields.costPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('pages.feedPage.form.fields.consumed')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.consumed}
                      onChange={(e) =>
                        setFormData({ ...formData, consumed: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('pages.feedPage.form.fields.waste')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.waste}
                      onChange={(e) =>
                        setFormData({ ...formData, waste: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('pages.feedPage.form.fields.notes')}
                  </label>
                  <textarea
                    rows="3"
                    className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder={t('pages.feedPage.form.fields.notesPlaceholder')}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    {t('common:cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {selectedRecord ? t('common:update') : t('common:save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-3">
                {t('feedPage.deleteModal.title')}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('feedPage.deleteModal.message')}
                </p>
              </div>
              <div className="mt-4 flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {t('common:cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {t('common:delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoultryFeedRecords;
