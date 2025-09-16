import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, DollarSign, Utensils } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const FeedRecords = () => {
  const { t } = useTranslation('goat');
  const ns = 'pages.feedRecords';
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
    { value: 'hay', label: t(`${ns}.feedTypes.hay`) },
    { value: 'grain', label: t(`${ns}.feedTypes.grain`) },
    { value: 'silage', label: t(`${ns}.feedTypes.silage`) },
    { value: 'pasture', label: t(`${ns}.feedTypes.pasture`) },
    { value: 'concentrate', label: t(`${ns}.feedTypes.concentrate`) },
    { value: 'mineralSupplement', label: t(`${ns}.feedTypes.mineralSupplement`) },
    { value: 'vitaminSupplement', label: t(`${ns}.feedTypes.vitaminSupplement`) },
    { value: 'other', label: t(`${ns}.feedTypes.other`) }
  ];

  const units = [
    { value: 'kg', label: t(`${ns}.units.kg`) },
    { value: 'lbs', label: t(`${ns}.units.lbs`) },
    { value: 'grams', label: t(`${ns}.units.grams`) },
    { value: 'bales', label: t(`${ns}.units.bales`) },
    { value: 'scoops', label: t(`${ns}.units.scoops`) },
    { value: 'handfuls', label: t(`${ns}.units.handfuls`) }
  ];

  const feedingTimes = [
    { value: 'morning', label: t(`${ns}.feedingTimes.morning`) },
    { value: 'afternoon', label: t(`${ns}.feedingTimes.afternoon`) },
    { value: 'evening', label: t(`${ns}.feedingTimes.evening`) },
    { value: 'night', label: t(`${ns}.feedingTimes.night`) },
    { value: 'allDay', label: t(`${ns}.feedingTimes.allDay`) }
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
      toast.error(t(`${ns}.error.fetch`));
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterGoat, filterFeedType, filterDate]);

  const fetchGoats = useCallback(async () => {
    try {
      const response = await api.get('/goats');
      setGoats(response.data.goats);
    } catch (error) {
      console.error(t(`${ns}.error.fetchGoats`));
    }
  }, []);

  // Update the form data when dropdown values change
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value // Store only the selected value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // No need to clean the data here since we're handling it in the change handlers
      if (selectedRecord) {
        await api.put(`/feed/${selectedRecord._id}`, formData);
        toast.success(t(`${ns}.success.update`));
      } else {
        await api.post('/feed', formData);
        toast.success(t(`${ns}.success.create`));
      }
      setShowAddModal(false);
      fetchRecords();
      resetForm();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 
        (selectedRecord ? t(`${ns}.error.update`) : t(`${ns}.error.create`))
      );
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/feed/${selectedRecord._id}`);
      toast.success(t(`${ns}.success.delete`));
      setShowDeleteModal(false);
      fetchRecords();
    } catch (error) {
      toast.error(t(`${ns}.error.delete`));
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    
    // Ensure we're only using primitive values in formData
    const formDataUpdate = {
      goat: record.goat?._id || record.goat || '',
      pen: record.pen || '',
      date: record.date ? (typeof record.date === 'string' ? record.date.split('T')[0] : record.date) : '',
      feedType: record.feedType?.value || record.feedType || '',
      quantity: record.quantity || '',
      unit: record.unit?.value || record.unit || '',
      cost: record.cost || '',
      supplier: record.supplier || '',
      notes: record.notes || '',
      feedingTime: record.feedingTime?.value || record.feedingTime || '',
      consumed: record.consumed || '',
      waste: record.waste || ''
    };
    
    setFormData(formDataUpdate);
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

  const getFeedTypeColor = (feedType) => {
    const type = typeof feedType === 'object' ? feedType.value : feedType;
    switch (type) {
      case 'hay': return 'bg-yellow-100 text-yellow-800';
      case 'grain': return 'bg-amber-100 text-amber-800';
      case 'silage': return 'bg-green-100 text-green-800';
      case 'pasture': return 'bg-emerald-100 text-emerald-800';
      case 'concentrate': return 'bg-blue-100 text-blue-800';
      case 'mineralSupplement': return 'bg-purple-100 text-purple-800';
      case 'vitaminSupplement': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.NA');
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
          <h1 className="text-2xl font-bold text-gray-900">{t(`${ns}.title`)}</h1>
          <p className="text-gray-600">{t(`${ns}.subtitle`)}</p>
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
          {t(`${ns}.addRecord`)}
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
              <p className="text-sm text-gray-600">{t(`${ns}.summary.totalRecords`)}</p>
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
              <p className="text-sm text-gray-600">{t(`${ns}.summary.totalCost`)}</p>
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
              <p className="text-sm text-gray-600">{t(`${ns}.summary.todaysRecords`)}</p>
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
            <label className="label">{t(`${ns}.filters.search`)}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t(`${ns}.filters.searchPlaceholder`)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="label">{t(`${ns}.filters.goat`)}</label>
            <select
              value={filterGoat}
              onChange={(e) => setFilterGoat(e.target.value)}
              className="input"
            >
              <option value="">{t(`${ns}.filters.allGoats`)}</option>
              {goats.map(goat => (
                <option key={goat._id} value={goat._id}>{goat.name} ({goat.tagNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t(`${ns}.filters.feedType`)}</label>
            <select
              value={filterFeedType}
              onChange={(e) => setFilterFeedType(e.target.value)}
              className="input"
            >
              <option value="">{t(`${ns}.filters.allTypes`)}</option>
              {feedTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t(`${ns}.filters.date`)}</label>
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
                <th className="table-header">{t(`${ns}.table.goat`)}</th>
                <th className="table-header">{t(`${ns}.table.date`)}</th>
                <th className="table-header">{t(`${ns}.table.feedType`)}</th>
                <th className="table-header">{t(`${ns}.table.quantity`)}</th>
                <th className="table-header">{t(`${ns}.table.cost`)}</th>
                <th className="table-header">{t(`${ns}.table.feedingTime`)}</th>
                <th className="table-header">{t(`${ns}.table.consumed`)}</th>
                <th className="table-header">{t(`${ns}.table.actions`)}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    {record.goat ? (
                      <div>
                        <div className="font-medium text-gray-900">
                          {record.goat.name} ({record.goat.tagNumber})
                        </div>
                        <div className="text-sm text-gray-500">
                          Tag #{record.goat.tagNumber}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">{t(`${ns}.table.generalFeeding`)}</div>
                    )}
                  </td>
                  <td className="table-cell">{formatDate(record.date)}</td>
                  <td className="table-cell">
                    <span className={`badge ${getFeedTypeColor(record.feedType)}`}>
                      {typeof record.feedType === 'object' 
                        ? record.feedType.label || ''
                        : (feedTypes.find(ft => ft.value === record.feedType)?.label || record.feedType || 'N/A')}
                    </span>
                  </td>
                  <td className="table-cell">
                    {record.quantity} {typeof record.unit === 'object' ? record.unit.label : record.unit}
                  </td>
                  <td className="table-cell">
                    {record.cost ? `$${record.cost}` : 'N/A'}
                  </td>
                  <td className="table-cell">
                    {record.feedingTime 
                      ? (typeof record.feedingTime === 'object' 
                          ? record.feedingTime.label 
                          : (feedingTimes.find(ft => ft.value === record.feedingTime)?.label || record.feedingTime))
                      : 'N/A'}
                  </td>
                  <td className="table-cell">
                    {record.consumed ? `${record.consumed} ${record.unit}` : 'N/A'}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="btn-icon btn-icon-secondary"
                        title={t(`${ns}.table.edit`)}
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
                {selectedRecord ? t(`${ns}.form.titleEdit`) : t(`${ns}.form.titleAdd`)}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">{t(`${ns}.form.fields.selectGoat`)}</label>
                  <select
                    value={formData.goat}
                    onChange={(e) => setFormData({...formData, goat: e.target.value})}
                    className="input"
                  >
                    <option value="">{t(`${ns}.form.fields.generalFeeding`)}</option>
                    {goats.map(goat => (
                      <option key={goat._id} value={goat._id}>
                        {goat.name} ({goat.tagNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t(`${ns}.form.fields.pen`)}</label>
                  <input
                    type="text"
                    value={formData.pen}
                    onChange={(e) => setFormData({...formData, pen: e.target.value})}
                    className="input"
                    placeholder={t(`${ns}.form.fields.penPlaceholder`)}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary"
                  >
                    {t(`${ns}.form.buttons.cancel`)}
                  </button>
                  <button type="submit" className="btn-primary">
                    {selectedRecord ? t(`${ns}.form.buttons.update`) : t(`${ns}.form.buttons.save`)}
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