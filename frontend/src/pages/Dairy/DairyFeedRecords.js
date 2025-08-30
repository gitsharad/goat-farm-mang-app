import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../translations';

const DairyFeedRecords = () => {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
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

  // Must align with backend validator in backend/routes/dairyFeed.js
  const feedTypes = ['Grass', 'Silage', 'Hay', 'Concentrate', 'Mineral', 'Water', 'Other'];
  const units = ['kg', 'lbs', 'liters', 'gallons', 'bales', 'scoops'];

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
      toast.error(t('fetchDairyFeedError'));
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
      if (selectedRecord) {
        await api.put(`/dairy-feed/${selectedRecord._id}`, formData);
        toast.success(t('dairyFeedUpdated'));
      } else {
        await api.post('/dairy-feed', formData);
        toast.success(t('dairyFeedAdded'));
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
      toast.success(t('dairyFeedDeleted'));
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
    if (!dateString) return t('na');
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
          <h1 className="text-2xl font-bold text-gray-900">{t('dairyFeedTitle')}</h1>
          <p className="text-gray-600">{t('dairyFeedSubtitle')}</p>
        </div>
        <button
          onClick={() => { setSelectedRecord(null); resetForm(); setShowAddModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('addDairyFeedRecord')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">{t('search')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('searchRecordsPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="label">{t('animal')}</label>
            <select value={filterAnimal} onChange={(e) => setFilterAnimal(e.target.value)} className="input">
              <option value="">{t('allAnimals')}</option>
              {animals.map(animal => (
                <option key={animal._id} value={animal._id}>
                  {animal.tagNumber || animal.name || t('animal')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('feedType')}</label>
            <select value={filterFeedType} onChange={(e) => setFilterFeedType(e.target.value)} className="input">
              <option value="">{t('allTypes')}</option>
              {feedTypes.map(type => (<option key={type} value={type}>{t(type)}</option>))}
            </select>
          </div>
          <div>
            <label className="label">{t('date')}</label>
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
                <th className="table-header">{t('animal')}</th>
                <th className="table-header">{t('date')}</th>
                <th className="table-header">{t('type')}</th>
                <th className="table-header">{t('qty')}</th>
                <th className="table-header">{t('unit')}</th>
                <th className="table-header">{t('costHeader')}</th>
                <th className="table-header">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="table-cell">{record.dairy?.tagNumber || record.dairy?.name || t('animal')}</td>
                  <td className="table-cell">{formatDate(record.date)}</td>
                  <td className="table-cell">{t(record.feedType)}</td>
                  <td className="table-cell">{record.quantity}</td>
                  <td className="table-cell">{t(record.unit)}</td>
                  <td className="table-cell">{record.cost ? `$${record.cost}` : t('na')}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(record)} className="btn-icon btn-icon-secondary" title={t('edit')}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedRecord(record); setShowDeleteModal(true); }} className="btn-icon btn-icon-danger" title={t('delete')}>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedRecord ? t('editDairyFeedRecord') : t('addDairyFeedRecord')}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">{t('animal')}</label>
                  <select value={formData.dairy} onChange={(e) => setFormData({ ...formData, dairy: e.target.value })} className="input" required>
                    <option value="">{t('selectAnimal')}</option>
                    {animals.map(animal => (
                      <option key={animal._id} value={animal._id}>{animal.tagNumber || animal.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('date')}</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">{t('feedType')}</label>
                  <select value={formData.feedType} onChange={(e) => setFormData({ ...formData, feedType: e.target.value })} className="input" required>
                    <option value="">{t('selectType')}</option>
                    {feedTypes.map(type => (<option key={type} value={type}>{t(type)}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('quantity')}</label>
                    <input type="number" step="0.01" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="input" required />
                  </div>
                  <div>
                    <label className="label">{t('unit')}</label>
                    <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="input" required>
                      <option value="">{t('selectUnit')}</option>
                      {units.map(u => (<option key={u} value={u}>{t(u)}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">{t('costUSD')}</label>
                  <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">{t('notes')}</label>
                  <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input" />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">{t('cancel')}</button>
                  <button type="submit" className="btn-primary">{selectedRecord ? t('editDairyFeedRecord') : t('addDairyFeedRecord')}</button>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('confirmDeleteTitle')}</h3>
              <p className="text-sm text-gray-500 mb-6">{t('confirmDeleteBody')}</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">{t('cancel')}</button>
                <button onClick={handleDelete} className="btn-danger">{t('delete')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DairyFeedRecords;
