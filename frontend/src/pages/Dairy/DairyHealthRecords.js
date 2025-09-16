import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
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

  const { t } = useTranslation('dairy');
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

  const healthTypes = ['Vaccination', 'Deworming', 'Treatment', 'Checkup', 'Surgery', 'Other'];
  
  // Helper function to get translated text with fallback
  const translate = (key, defaultValue = '') => {
    return t(`pages.health.${key}`, { defaultValue });
  };

  const getTranslatedType = (type) => {
    return translate(`types.${type}`, type);
  };

  // Common translations
  const translations = {
    title: translate('title', 'Health Management'),
    subtitle: translate('subtitle', 'Record and manage animal health'),
    addHealthRecord: translate('addRecord', 'Add Record'),
    searchPlaceholder: translate('searchPlaceholder', 'Search records...'),
    allAnimals: translate('allAnimals', 'All Animals'),
    allTypes: translate('allTypes', 'All Types'),
    filters: {
      search: translate('filters.search', 'Search'),
      animal: translate('filters.animal', 'Animal'),
      type: translate('filters.type', 'Type'),
      date: translate('filters.date', 'Date')
    },
    table: {
      date: translate('table.date', 'Date'),
      animal: translate('table.animal', 'Animal'),
      type: translate('table.type', 'Type'),
      description: translate('table.description', 'Description'),
      veterinarian: translate('table.veterinarian', 'Veterinarian'),
      cost: translate('table.cost', 'Cost'),
      nextDueDate: translate('table.nextDueDate', 'Next Due'),
      actions: translate('table.actions', 'Actions'),
      noRecords: translate('table.noRecords', 'No health records found')
    },
    form: {
      selectType: translate('form.selectType', 'Select Type'),
      description: translate('form.description', 'Description'),
      veterinarian: translate('form.veterinarian', 'Veterinarian'),
      cost: translate('form.cost', 'Cost'),
      nextDueDate: translate('form.nextDueDate', 'Next Due Date'),
      notes: translate('form.notes', 'Notes'),
      save: translate('form.save', 'Save'),
      cancel: translate('form.cancel', 'Cancel'),
      delete: translate('form.delete', 'Delete'),
      edit: translate('form.edit', 'Edit')
    }
  };

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
      toast.error(t('healthRecords.notifications.error'));
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterAnimal, filterType, filterDate]);

  const fetchAnimals = useCallback(async () => {
    try {
      const response = await api.get('/api/dairy?limit=1000');
      const data = response.data.data || [];
      // Filter out any null/undefined animals and ensure they have required fields
      const validAnimals = data.filter(animal => animal && (animal.tagNumber || animal.name));
      setAnimals(validAnimals);
      
      // If there's only one animal, preselect it
      if (validAnimals.length === 1 && !formData.dairy) {
        setFormData(prev => ({ ...prev, dairy: validAnimals[0]._id }));
      }
    } catch (error) {
      console.error('Failed to fetch dairy animals:', error);
      toast.error('Failed to load animals. Please try again.');
    }
  }, [formData.dairy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await api.put(`/dairy-health/${selectedRecord._id}`, formData);
        toast.success(t('healthRecords.notifications.updated'));
      } else {
        await api.post('/dairy-health', formData);
        toast.success(t('healthRecords.notifications.added'));
      }
      setShowAddModal(false);
      setSelectedRecord(null);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || t('healthRecords.notifications.error'));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/dairy-health/${selectedRecord._id}`);
      toast.success(t('healthRecords.notifications.deleted'));
      setShowDeleteModal(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error(t('healthRecords.notifications.error'));
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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="text-gray-600">{translate('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{translations.title}</h1>
          <p className="text-gray-600">{translations.subtitle}</p>
        </div>
        <button
          onClick={() => { setSelectedRecord(null); resetForm(); setShowAddModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {translations.addHealthRecord}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">{translations.filters.search}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={translations.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="label">{translations.filters.animal}</label>
            <select value={filterAnimal} onChange={(e) => setFilterAnimal(e.target.value)} className="input">
              <option value="">{translations.allAnimals}</option>
              {animals.map(animal => (
                <option key={animal._id} value={animal._id}>
                  {animal.tagNumber || animal.name || translations.table.animal}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{translations.filters.type}</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input">
              <option value="">{translations.allTypes}</option>
              {healthTypes.map((type, index) => (
                <option key={index} value={type}>
                  {getTranslatedType(type)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{translations.filters.date}</label>
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
                <th className="table-header">{translations.table.animal}</th>
                <th className="table-header">{translations.table.date}</th>
                <th className="table-header">{translations.table.type}</th>
                <th className="table-header">{translations.table.description}</th>
                <th className="table-header">{translations.table.veterinarian}</th>
                <th className="table-header">{translations.table.cost}</th>
                <th className="table-header">{translations.table.nextDueDate}</th>
                <th className="table-header">{translations.table.actions}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="table-cell">{record.dairy?.tagNumber || record.dairy?.name || translate('common.unknown', 'Unknown')}</td>
                  <td className="table-cell">{formatDate(record.date)}</td>
                  <td className="table-cell">
                    <span className={`badge ${getTypeColor(record.type)}`}>
                      {getTranslatedType(record.type) || record.type}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="max-w-xs truncate" title={record.description}>
                      {record.description || translate('common.notAvailable', 'N/A')}
                    </div>
                  </td>
                  <td className="table-cell">{record.veterinarian || translate('common.notAvailable', 'N/A')}</td>
                  <td className="table-cell">{record.cost ? `₹${record.cost}` : translate('common.notAvailable', 'N/A')}</td>
                  <td className="table-cell">{record.nextDueDate ? formatDate(record.nextDueDate) : translate('common.notAvailable', 'N/A')}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(record)} className="btn-icon btn-icon-secondary" title={translations.form.edit}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedRecord(record); setShowDeleteModal(true); }} className="btn-icon btn-icon-danger" title={translations.form.delete}>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedRecord ? translate('healthRecords.form.editTitle', 'Edit Health Record') : translate('healthRecords.form.addTitle', 'Add Health Record')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">{translations.table.animal}</label>
                  <select 
                    value={formData.dairy} 
                    onChange={(e) => setFormData({ ...formData, dairy: e.target.value })} 
                    className="input" 
                    required
                  >
                    <option value="">{translate('healthRecords.form.selectAnimal', 'Select Animal')}</option>
                    {animals.map(animal => {
                      const displayName = [animal.tagNumber, animal.name]
                        .filter(Boolean)
                        .join(' - ');
                      return (
                        <option key={animal._id} value={animal._id}>
                          {displayName || `Animal ${animal._id.substring(0, 6)}`}
                        </option>
                      );
                    })}
                  </select>
                  {animals.length === 0 && (
                    <p className="mt-1 text-sm text-red-600">
                      No animals found. Please add animals first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">{translations.table.date}</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">{translations.table.type}</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input" required>
                    <option value="">{translations.form.selectType}</option>
                    {healthTypes.map(type => (
                      <option key={type} value={type}>
                        {getTranslatedType(type)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{translations.table.description}</label>
                  <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">{translations.table.veterinarian}</label>
                  <input type="text" value={formData.veterinarian} onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">{translations.table.cost}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      className="input pl-8"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">{translations.table.nextDueDate}</label>
                  <input
                    type="date"
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">{translations.form.notes}</label>
                  <textarea
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary"
                  >
                    {translations.form.cancel}
                  </button>
                  <button type="submit" className="btn-primary">
                    {selectedRecord ? translations.form.edit : translations.form.save}
                  </button>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {translate('healthRecords.deleteModal.title', 'Delete Health Record')}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {translate('healthRecords.deleteModal.message', 'Are you sure you want to delete this health record? This action cannot be undone.')}
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">
                  {t('common.buttons.cancel')}
                </button>
                <button onClick={handleDelete} className="btn-danger">
                  {t('common.buttons.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DairyHealthRecords;
