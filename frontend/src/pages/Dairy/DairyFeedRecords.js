import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const DairyFeedRecords = () => {
  const { t } = useTranslation(['dairy', 'common']);
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnimal, setFilterAnimal] = useState('');
  const [filterFeedType, setFilterFeedType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    dairy: '',
    date: '',
    feedType: '',
    quantity: '',
    unit: '',
    cost: '',
    notes: ''
  });

  // Define feed types and units that match the backend validation
  const feedTypes = ['Grass', 'Silage', 'Hay', 'Concentrate', 'Mineral', 'Water', 'Other'];
  const units = ['kg', 'lbs', 'liters', 'gallons', 'bales', 'scoops'];
  
  // Set default unit to 'kg' if not set
  if (!formData.unit) {
    setFormData(prev => ({ ...prev, unit: 'kg' }));
  }

  useEffect(() => {
    fetchRecords();
    fetchAnimals();
  }, [currentPage, searchTerm, filterAnimal, filterFeedType, filterDate]);

  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterAnimal && { dairyId: filterAnimal }),
        ...(filterFeedType && { feedType: filterFeedType }),
        ...(filterDate && { date: filterDate })
      });
      const response = await api.get(`/dairy-feed?${params}`);
      setRecords(response.data.records || []);
      const total = response.data.total || response.data.records?.length || 0;
      setTotalPages(Math.max(1, Math.ceil(total / 10)));
      setLoading(false);
    } catch (error) {
      toast.error(t('pages.feeding.messages.error'));
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterAnimal, filterFeedType, filterDate]);

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
      // Convert string values to numbers and prepare payload
      const payload = {
        dairy: formData.dairy,
        feedType: formData.feedType,
        quantity: formData.quantity ? parseFloat(formData.quantity) : 0,
        unit: formData.unit || 'kg',
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        notes: formData.notes || '',
        date: formData.date || new Date().toISOString().split('T')[0]
      };

      console.log('Submitting payload:', JSON.stringify(payload, null, 2));

      if (selectedRecord) {
        const response = await api.put(`/dairy-feed/${selectedRecord._id}`, payload);
        console.log('Update response:', response);
        toast.success(t('pages.feeding.messages.updated'));
      } else {
        const response = await api.post('/dairy-feed', payload);
        console.log('Create response:', response);
        toast.success(t('pages.feeding.messages.added'));
      }
      setShowAddModal(false);
      setSelectedRecord(null);
      resetForm();
      fetchRecords();
    } catch (error) {
      const apiErr = error.response?.data;
      const msg = Array.isArray(apiErr?.errors) && apiErr.errors.length
        ? apiErr.errors[0].msg
        : (apiErr?.message || 'Operation failed');
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/dairy-feed/${selectedRecord._id}`);
      toast.success(t('pages.feeding.messages.deleted'));
      setShowDeleteModal(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error(t('pages.feeding.messages.error'));
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      dairy: (record.dairy && (record.dairy._id || record.dairy)) || '',
      date: record.date ? record.date.split('T')[0] : '',
      feedType: record.feedType,
      quantity: record.quantity || '',
      unit: record.unit || '',
      cost: record.cost || '',
      notes: record.notes || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      dairy: '',
      date: '',
      feedType: '',
      quantity: '',
      unit: '',
      cost: '',
      notes: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('dairyFeed.na');
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
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.feeding.title')}</h1>
          <p className="text-gray-600">{t('pages.feeding.subtitle')}</p>
        </div>
        <button
          onClick={() => { setSelectedRecord(null); resetForm(); setShowAddModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('pages.feeding.addRecord')}
        </button>
      </div>
      
      {/* Main Content */}
      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">{t('pages.feeding.search')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('pages.feeding.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div>
              <label className="label">{t('pages.feeding.animal')}</label>
              <select 
                value={filterAnimal} 
                onChange={(e) => setFilterAnimal(e.target.value)} 
                className="input w-full"
              >
                <option value="">{t('pages.feeding.allAnimals')}</option>
                {animals.map(animal => (
                  <option key={animal._id} value={animal._id}>
                    {animal.tagNumber || animal.name || t('pages.feeding.animal')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('pages.feeding.feedType')}</label>
              <select 
                value={filterFeedType} 
                onChange={(e) => setFilterFeedType(e.target.value)} 
                className="input w-full"
              >
                <option value="">{t('pages.feeding.allTypes')}</option>
                {feedTypes.map(type => (
                  <option key={type} value={type}>
                    {t(`pages.feeding.feedTypes.${type}`, type)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('pages.feeding.date')}</label>
              <input 
                type="date" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)} 
                className="input w-full" 
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
                    {t('pages.feeding.animal')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('pages.feeding.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('pages.feeding.feedType')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('pages.feeding.quantity')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('pages.feeding.cost')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('pages.feeding.notes')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('pages.feeding.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.dairy?.tagNumber || record.dairy?.name || t('pages.feeding.na')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {t(`pages.feeding.feedTypes.${record.feedType}`, record.feedType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.quantity} {record.unit ? t(`pages.feeding.units.${record.unit}`, record.unit) : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.cost ? `${t('pages.feeding.currencySymbol')}${record.cost}` : t('pages.feeding.na')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {record.notes || t('pages.feeding.na')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(record)} 
                          className="btn-icon btn-icon-secondary" 
                          title={t('pages.feeding.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedRecord(record); setShowDeleteModal(true); }} 
                          className="btn-icon btn-icon-danger" 
                          title={t('pages.feeding.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      {t('pages.feeding.noRecords')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedRecord ? t('pages.feeding.editRecord') : t('pages.feeding.addRecord')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">{t('pages.feeding.animal')}</label>
                  <select 
                    value={formData.dairy} 
                    onChange={(e) => setFormData({ ...formData, dairy: e.target.value })} 
                    className="input w-full" 
                    required
                  >
                    <option value="">{t('pages.feeding.selectAnimal')}</option>
                    {animals.map(animal => (
                      <option key={animal._id} value={animal._id}>
                        {animal.tagNumber || animal.name || t('pages.feeding.animal')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('pages.feeding.date')}</label>
                  <input 
                    type="date" 
                    value={formData.date} 
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                    className="input w-full" 
                    required 
                  />
                </div>
                <div>
                  <label className="label">{t('pages.feeding.feedType')}</label>
                  <select 
                    value={formData.feedType} 
                    onChange={(e) => setFormData({ ...formData, feedType: e.target.value })} 
                    className="input w-full" 
                    required
                  >
                    <option value="">{t('pages.feeding.selectType')}</option>
                    {feedTypes.map(type => (
                      <option key={type} value={type}>
                        {t(`pages.feeding.feedTypes.${type}`, type)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('pages.feeding.quantity')}</label>
                    <div className="flex">
                      <input 
                        type="number" 
                        value={formData.quantity} 
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
                        className="input rounded-r-none flex-1" 
                        min="0"
                        step="0.01"
                        required 
                      />
                      <select 
                        value={formData.unit} 
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })} 
                        className="input rounded-l-none border-l-0 w-24" 
                        required
                      >
                        <option value="">{t('pages.feeding.select')}</option>
                        {units.map(unit => (
                          <option key={unit} value={unit}>
                            {t(`pages.feeding.units.${unit}`, unit)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">
                      {t('pages.feeding.cost')} ({t('pages.feeding.currency')})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {t('pages.feeding.currencySymbol')}
                      </span>
                      <input 
                        type="number" 
                        value={formData.cost} 
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })} 
                        className="input pl-8 w-full" 
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">{t('pages.feeding.notes')}</label>
                  <textarea 
                    value={formData.notes} 
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                    className="input min-h-[100px] w-full" 
                    placeholder={t('pages.feeding.optionalNotes')} 
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)} 
                    className="btn-secondary"
                  >
                    {t('pages.feeding.cancel')}
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                  >
                    {selectedRecord ? t('pages.feeding.update') : t('pages.feeding.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('pages.feeding.confirmDelete')}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {t('pages.feeding.deleteConfirmation')}
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowDeleteModal(false)} 
                  className="btn-secondary"
                >
                  {t('pages.feeding.cancel')}
                </button>
                <button 
                  type="button" 
                  onClick={handleDelete}
                  className="btn-danger"
                >
                  {t('pages.feeding.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DairyFeedRecords;
