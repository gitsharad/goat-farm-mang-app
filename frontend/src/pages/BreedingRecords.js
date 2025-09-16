import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import api from '../services/api';

const BreedingRecords = () => {
  const { t } = useTranslation(['goat', 'common']);
  
  // Define table columns with translations
  const tableColumns = useMemo(() => [
    { key: 'doe', label: t('pages.breedingPage.tableHeaders.doe') },
    { key: 'buck', label: t('pages.breedingPage.tableHeaders.buck') },
    { key: 'matingDate', label: t('pages.breedingPage.tableHeaders.breedingDate') },
    { key: 'expectedDue', label: t('pages.breedingPage.tableHeaders.expectedKiddingDate') },
    { key: 'status', label: t('pages.breedingPage.tableHeaders.status') },
    { key: 'kiddingDate', label: t('pages.breedingPage.tableHeaders.actualKiddingDate') },
    { key: 'kids', label: t('pages.breedingPage.tableHeaders.kids') },
    { key: 'actions', label: t('pages.breedingPage.tableHeaders.actions') }
  ], [t]);

  // Breeding methods with translations
  const breedingMethods = useMemo(() => [
    { value: 'natural', label: t('pages.breedingPage.form.fields.breedingMethod.options.natural') },
    { value: 'artificial', label: t('pages.breedingPage.form.fields.breedingMethod.options.artificial') },
    { value: 'embryoTransfer', label: t('pages.breedingPage.form.fields.breedingMethod.options.embryoTransfer') }
  ], [t]);

  // Health status options with translations
  const healthStatusOptions = useMemo(() => ({
    healthy: t('pages.breedingPage.status.healthy'),
    monitoring: t('pages.breedingPage.status.monitoring'),
    treatment: t('pages.breedingPage.status.treatment'),
    critical: t('pages.breedingPage.status.critical')
  }), [t]);

  // Status options for dropdown
  const statusOptions = useMemo(() => [
    { value: 'mated', label: t('pages.breedingPage.status.mated') },
    { value: 'pregnant', label: t('pages.breedingPage.status.pregnant') },
    { value: 'delivered', label: t('pages.breedingPage.status.delivered') },
    { value: 'failed', label: t('pages.breedingPage.status.failed') },
    { value: 'aborted', label: t('pages.breedingPage.status.aborted') }
  ], [t]);

  // Component state
  const [records, setRecords] = useState([]);
  const [goats, setGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGoat, setFilterGoat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const initialFormData = {
    doe: '',
    buck: '',
    matingDate: '',
    expectedDueDate: '',
    actualDueDate: '',
    pregnancyConfirmed: false,
    kiddingDate: '',
    kidsBorn: '',
    kidsSurvived: '',
    notes: '',
    breedingMethod: 'natural',
    breedingLocation: '',
    gestationPeriod: 150,
    isOverdue: false,
    breedingCost: 0,
    expectedValue: 0,
    veterinaryCost: 0,
    healthStatus: 'healthy',
    lastCheckupDate: '',
    nextCheckupDate: '',
    complications: [],
    expectedBreed: '',
    pedigreeNotes: '',
    inbreedingCoefficient: 0,
    doeAge: '',
    buckAge: '',
    status: 'mated'
  };

  const [formData, setFormData] = useState(initialFormData);

  // Create a map of status values to their translated labels
  const statusLabels = useMemo(() => ({
    mated: t('pages.breedingPage.status.mated'),
    pregnant: t('pages.breedingPage.status.pregnant'),
    delivered: t('pages.breedingPage.status.delivered'),
    failed: t('pages.breedingPage.status.failed'),
    aborted: t('pages.breedingPage.status.aborted')
  }), [t]);

  const getStatusLabel = (status) => {
    return statusLabels[status] || status;
  };

  useEffect(() => {
    fetchRecords();
    fetchGoats();
  }, [currentPage, searchTerm, filterGoat, filterStatus, filterDate]);

  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterGoat && { goat: filterGoat }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterDate && { date: filterDate })
      });

      const response = await api.get(`/breeding?${params}`);
      setRecords(response.data.records);
      setTotalPages(Math.ceil(response.data.total / 10));
      setLoading(false);
    } catch (error) {
      toast.error(t('breedingRecords.error'));
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterGoat, filterStatus, filterDate]);

  const fetchGoats = useCallback(async () => {
    try {
      const response = await api.get('/goats');
      setGoats(response.data.goats);
    } catch (error) {
      console.error(t('breedingRecords.error'));
    }
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = !searchTerm || 
        record.doeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.buckName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGoat = !filterGoat || 
        record.doe === filterGoat || 
        record.buck === filterGoat;
      
      const matchesStatus = !filterStatus || 
        record.status === filterStatus;
      
      const matchesDate = !filterDate || 
        record.matingDate?.startsWith(filterDate) ||
        record.expectedDueDate?.startsWith(filterDate) ||
        record.kiddingDate?.startsWith(filterDate);
      
      return matchesSearch && matchesGoat && matchesStatus && matchesDate;
    });
  }, [records, searchTerm, filterGoat, filterStatus, filterDate]);

  const resetForm = useCallback(() => {
    setFormData({
      doe: '',
      buck: '',
      matingDate: '',
      expectedDueDate: '',
      actualDueDate: '',
      pregnancyConfirmed: false,
      kiddingDate: '',
      kidsBorn: '',
      kidsSurvived: '',
      notes: '',
      breedingMethod: 'natural',
      breedingLocation: '',
      gestationPeriod: 150,
      isOverdue: false,
      breedingCost: 0,
      expectedValue: 0,
      veterinaryCost: 0,
      healthStatus: 'healthy',
      lastCheckupDate: '',
      nextCheckupDate: '',
      complications: [],
      expectedBreed: '',
      pedigreeNotes: '',
      inbreedingCoefficient: 0,
      doeAge: '',
      buckAge: '',
      status: 'mated'
    });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      if (selectedRecordId) {
        await api.put(`/api/breeding/${selectedRecordId}`, formData);
        toast.success(t('updateSuccess'));
      } else {
        await api.post('/api/breeding', formData);
        toast.success(t('addSuccess'));
      }
      setShowAddModal(false);
      setSelectedRecordId(null);
      resetForm();
      fetchRecords();
    } catch (error) {
      console.error('Error saving breeding record:', error);
      toast.error(t('breedingRecords.error'));
    }
  }, [formData, selectedRecordId, t, fetchRecords, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!selectedRecordId) return;
    
    try {
      await api.delete(`/api/breeding/${selectedRecordId}`);
      toast.success(t('deleteSuccess'));
      fetchRecords();
      setShowDeleteModal(false);
      setSelectedRecordId(null);
    } catch (error) {
      console.error('Error deleting breeding record:', error);
      toast.error(t('breedingRecords.error'));
    }
  }, [selectedRecordId, t, fetchRecords]);

  const handleEdit = useCallback((record) => {
    setFormData({
      ...record,
      // Convert dates to YYYY-MM-DD format for date inputs
      matingDate: record.matingDate ? record.matingDate.split('T')[0] : '',
      expectedDueDate: record.expectedDueDate ? record.expectedDueDate.split('T')[0] : '',
      actualDueDate: record.actualDueDate ? record.actualDueDate.split('T')[0] : '',
      kiddingDate: record.kiddingDate ? record.kiddingDate.split('T')[0] : '',
      lastCheckupDate: record.lastCheckupDate ? record.lastCheckupDate.split('T')[0] : '',
      nextCheckupDate: record.nextCheckupDate ? record.nextCheckupDate.split('T')[0] : ''
    });
    setSelectedRecordId(record._id);
    setShowAddModal(true);
  }, []);

  const getStatusColor = useCallback((status) => {
    const colors = {
      'mated': 'bg-blue-100 text-blue-800',
      'pregnant': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'aborted': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }, []);



  const getFemaleGoats = useCallback(() => 
    goats.filter(goat => goat.gender === 'Female'),
    [goats]
  );

  const getMaleGoats = useCallback(() => 
    goats.filter(goat => goat.gender === 'Male'),
    [goats]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-2">{t('common.messages.loading')}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{t('pages.breedingPage.title')}</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          {t('pages.breedingPage.addRecord')}
        </button>
      </div>
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('pages.breedingPage.filters.title')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('pages.breedingPage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <div>
            <label className="label">{t('pages.breedingPage.filters.goat')}</label>
            <select
              value={filterGoat}
              onChange={(e) => setFilterGoat(e.target.value)}
              className="input"
            >
              <option value="">{t('pages.breedingPage.filters.allGoats')}</option>
              {goats.map(goat => (
                <option key={goat._id} value={goat._id}>{goat.name} ({goat.tagNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('pages.breedingPage.filters.allStatus')}</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="">{t('pages.breedingPage.filters.allStatus')}</option>
              {statusOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('pages.breedingPage.tableHeaders.breedingDate')}</label>
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
                {tableColumns.map(column => (
                  <th key={column.key} className="table-header">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">
                        {record.doe?.name || record.doe?.tagNumber || t('common.unknown')}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">
                        {record.buck?.name || record.buck?.tagNumber || t('common.unknown')}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">{record.matingDate ? formatDate(record.matingDate) : '-'}</td>
                  <td className="table-cell">{record.expectedDueDate ? formatDate(record.expectedDueDate) : '-'}</td>
                  <td className="table-cell">
                    <span className={`badge ${getStatusColor(record.status)}`}>
                      {statusLabels[record.status] || record.status}
                    </span>
                  </td>
                  <td className="table-cell">{record.kiddingDate ? formatDate(record.kiddingDate) : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.kidsBorn !== undefined ? (
                      <div>
                        <div className="font-medium">
                          {t('pages.breedingPage.kidsBorn', { count: record.kidsBorn || 0 })}
                        </div>
                        {record.kidsSurvived !== undefined && (
                          <div className="text-sm text-gray-500">
                            {t('pages.breedingPage.kidsSurvived', { count: record.kidsSurvived || 0 })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">{t('common.notAvailable')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        title={t('common:edit')}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRecordId(record._id);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title={t('common:delete')}
                      >
                        <Trash2 size={16} />
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
                {t('common.previous')}
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                {t('common.next')}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t('common.pagination.showingPage', { current: currentPage, total: totalPages })}
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
                {selectedRecordId ? t('pages.breedingPage.form.titleEdit') : t('pages.breedingPage.form.titleAdd')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">{t('pages.breedingPage.form.fields.doe')}</label>
                  <select
                    value={formData.doe}
                    onChange={(e) => setFormData({...formData, doe: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">{t('pages.breedingPage.form.fields.selectDoe')}</option>
                    {getFemaleGoats().map(goat => (
                      <option key={goat._id} value={goat._id}>
                        {goat.name} ({goat.tagNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('pages.breedingPage.form.fields.buck')}</label>
                  <select
                    value={formData.buck}
                    onChange={(e) => setFormData({...formData, buck: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">{t('pages.breedingPage.form.fields.selectBuck')}</option>
                    {getMaleGoats().map(goat => (
                      <option key={goat._id} value={goat._id}>
                        {goat.name} ({goat.tagNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('pages.breedingPage.form.fields.matingDate')}</label>
                  <input
                    type="date"
                    value={formData.matingDate}
                    onChange={(e) => setFormData({...formData, matingDate: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">{t('pages.breedingPage.form.fields.expectedDueDate')}</label>
                  <input
                    type="date"
                    value={formData.expectedDueDate}
                    onChange={(e) => setFormData({...formData, expectedDueDate: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">{t('pages.breedingPage.form.fields.breedingMethod')}</label>
                  <select
                    value={formData.breedingMethod}
                    onChange={(e) => setFormData({...formData, breedingMethod: e.target.value})}
                    className="input"
                  >
                    {breedingMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('pages.breedingPage.form.fields.breedingLocation')}</label>
                  <input
                    type="text"
                    value={formData.breedingLocation}
                    onChange={(e) => setFormData({...formData, breedingLocation: e.target.value})}
                    className="input"
                    placeholder={t('pages.breedingPage.form.fields.breedingLocationPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('pages.breedingPage.form.fields.gestationPeriod')}</label>
                    <input
                      type="number"
                      min="140"
                      max="160"
                      value={formData.gestationPeriod}
                      onChange={(e) => setFormData({...formData, gestationPeriod: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('pages.breedingPage.form.fields.healthStatus')}</label>
                    <select
                      value={formData.healthStatus}
                      onChange={(e) => setFormData({...formData, healthStatus: e.target.value})}
                      className="input"
                    >
                      {Object.entries(healthStatusOptions).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">{t('pages.breedingPage.form.fields.status')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="input"
                    required
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pregnancyConfirmed"
                    checked={formData.pregnancyConfirmed}
                    onChange={(e) => setFormData({...formData, pregnancyConfirmed: e.target.checked})}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="pregnancyConfirmed" className="text-sm text-gray-700">
                    {t('pages.breedingPage.form.fields.pregnancyConfirmed')}
                  </label>
                </div>
                <div>
                  <label className="label">{t('pages.breedingPage.form.fields.kiddingDate')}</label>
                  <input
                    type="date"
                    value={formData.kiddingDate}
                    onChange={(e) => setFormData({...formData, kiddingDate: e.target.value})}
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('pages.breedingPage.form.fields.kidsBorn')}</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kidsBorn}
                      onChange={(e) => setFormData({...formData, kidsBorn: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('pages.breedingPage.form.fields.kidsSurvived')}</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kidsSurvived}
                      onChange={(e) => setFormData({...formData, kidsSurvived: e.target.value})}
                      className="input"
                    />
                  </div>
                </div>
                
                {/* Economic Tracking */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">{t('pages.breedingPage.form.fields.breedingCost')}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.breedingCost}
                      onChange={(e) => setFormData({...formData, breedingCost: e.target.value})}
                      className="input"
                      placeholder={t('pages.breedingPage.form.fields.amountPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="label">{t('pages.breedingPage.form.fields.expectedValue')}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.expectedValue}
                      onChange={(e) => setFormData({...formData, expectedValue: e.target.value})}
                      className="input"
                      placeholder={t('pages.breedingPage.form.fields.amountPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="label">{t('pages.breedingPage.form.fields.veterinaryCost')}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.veterinaryCost}
                      onChange={(e) => setFormData({...formData, veterinaryCost: e.target.value})}
                      className="input"
                      placeholder={t('pages.breedingPage.form.fields.amountPlaceholder')}
                    />
                  </div>
                </div>

                {/* Health Monitoring */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('pages.breedingPage.form.fields.lastCheckupDate')}</label>
                    <input
                      type="date"
                      value={formData.lastCheckupDate}
                      onChange={(e) => setFormData({...formData, lastCheckupDate: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('pages.breedingPage.form.fields.nextCheckupDate')}</label>
                    <input
                      type="date"
                      value={formData.nextCheckupDate}
                      onChange={(e) => setFormData({...formData, nextCheckupDate: e.target.value})}
                      className="input"
                    />
                  </div>
                </div>

                {/* Genetic Tracking */}
                <div>
                  <label className="label">{t('pages.breedingPage.form.fields.expectedBreed')}</label>
                  <input
                    type="text"
                    value={formData.expectedBreed}
                    onChange={(e) => setFormData({...formData, expectedBreed: e.target.value})}
                    className="input"
                    placeholder={t('pages.breedingPage.form.fields.expectedBreedPlaceholder')}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">{t('pages.breedingPage.form.fields.doeAge')}</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.doeAge}
                      onChange={(e) => setFormData({...formData, doeAge: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('pages.breedingPage.form.fields.buckAge')}</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.buckAge}
                      onChange={(e) => setFormData({...formData, buckAge: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('pages.breedingPage.form.fields.inbreedingCoefficient')}</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.inbreedingCoefficient}
                      onChange={(e) => setFormData({...formData, inbreedingCoefficient: e.target.value})}
                      className="input"
                      placeholder={t('pages.breedingPage.form.fields.amountPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">{t('pages.breedingPage.form.fields.pedigreeNotes')}</label>
                  <textarea
                    value={formData.pedigreeNotes}
                    onChange={(e) => setFormData({...formData, pedigreeNotes: e.target.value})}
                    className="input"
                    rows="2"
                    placeholder={t('pages.breedingPage.form.fields.pedigreeNotesPlaceholder')}
                  />
                </div>

                <div>
                  <label className="label">{t('pages.breedingPage.form.fields.notes')}</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="input"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary"
                  >
                    {t('pages.breedingPage.form.buttons.cancel')}
                  </button>
                  <button type="submit" className="btn-primary">
                    {selectedRecordId ? t('pages.breedingPage.form.buttons.update') : t('pages.breedingPage.form.buttons.save')}
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
              <h3 className="text-lg font-medium text-gray-900">
                {t('deleteConfirm.title')}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  {t('deleteConfirm.message')}
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {t('buttons.delete')}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-2 px-4 py-2 bg-white text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  {t('buttons.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

BreedingRecords.propTypes = {
  // Add any prop validations if needed
};

/**
 * @component
 * @description Main component for managing breeding records
 * @example
 * return (
 *   <BreedingRecords />
 * )
 */

export default BreedingRecords;