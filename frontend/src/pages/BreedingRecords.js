import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const BreedingRecords = () => {
  const [records, setRecords] = useState([]);
  const [goats, setGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGoat, setFilterGoat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
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

  const breedingStatuses = [
    'mated',
    'pregnancy-confirmed',
    'pregnant',
    'kidding',
    'completed',
    'failed'
  ];

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
      toast.error('Failed to fetch breeding records');
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterGoat, filterStatus, filterDate]);

  const fetchGoats = useCallback(async () => {
    try {
      const response = await api.get('/goats');
      setGoats(response.data.goats);
    } catch (error) {
      console.error('Failed to fetch goats');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRecord) {
        await api.put(`/breeding/${selectedRecord._id}`, formData);
        toast.success('Breeding record updated successfully');
      } else {
        await api.post('/breeding', formData);
        toast.success('Breeding record added successfully');
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
      await api.delete(`/breeding/${selectedRecord._id}`);
      toast.success('Breeding record deleted successfully');
      setShowDeleteModal(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error('Failed to delete breeding record');
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      doe: record.doe._id || record.doe,
      buck: record.buck._id || record.buck,
      matingDate: record.matingDate ? record.matingDate.split('T')[0] : '',
      expectedDueDate: record.expectedDueDate ? record.expectedDueDate.split('T')[0] : '',
      actualDueDate: record.actualDueDate ? record.actualDueDate.split('T')[0] : '',
      pregnancyConfirmed: record.pregnancyConfirmed || false,
      kiddingDate: record.kiddingDate ? record.kiddingDate.split('T')[0] : '',
      kidsBorn: record.kidsBorn || '',
      kidsSurvived: record.kidsSurvived || '',
      notes: record.notes || '',
      status: record.status
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
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
  };

  const getStatusColor = (status) => {
    const colors = {
      'mated': 'bg-blue-100 text-blue-800',
      'pregnancy-confirmed': 'bg-green-100 text-green-800',
      'pregnant': 'bg-green-100 text-green-800',
      'kidding': 'bg-purple-100 text-purple-800',
      'completed': 'bg-gray-100 text-gray-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };



  const getFemaleGoats = () => goats.filter(goat => goat.gender === 'Female');
  const getMaleGoats = () => goats.filter(goat => goat.gender === 'Male');

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
          <h1 className="text-2xl font-bold text-gray-900">Breeding Records</h1>
          <p className="text-gray-600">Manage goat breeding and pregnancy tracking</p>
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
          Add Breeding Record
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
            <label className="label">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              {breedingStatuses.map(status => (
                <option key={status} value={status}>
                  {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Mating Date</label>
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
                <th className="table-header">Doe</th>
                <th className="table-header">Buck</th>
                <th className="table-header">Mating Date</th>
                <th className="table-header">Expected Due</th>
                <th className="table-header">Status</th>
                <th className="table-header">Kidding Date</th>
                <th className="table-header">Kids</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">
                        {record.doe.name || record.doe.tagNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Tag #{record.doe.tagNumber}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">
                        {record.buck.name || record.buck.tagNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Tag #{record.buck.tagNumber}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">{formatDate(record.matingDate)}</td>
                  <td className="table-cell">{formatDate(record.expectedDueDate)}</td>
                  <td className="table-cell">
                    <span className={`badge ${getStatusColor(record.status)}`}>
                      {record.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="table-cell">{formatDate(record.kiddingDate)}</td>
                  <td className="table-cell">
                    {record.kidsBorn ? (
                      <div>
                        <div className="font-medium text-gray-900">{record.kidsBorn} born</div>
                        <div className="text-sm text-gray-500">{record.kidsSurvived} survived</div>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
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
                {selectedRecord ? 'Edit Breeding Record' : 'Add Breeding Record'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Doe (Female Goat)</label>
                  <select
                    value={formData.doe}
                    onChange={(e) => setFormData({...formData, doe: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">Select Doe</option>
                    {getFemaleGoats().map(goat => (
                      <option key={goat._id} value={goat._id}>
                        {goat.name} ({goat.tagNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Buck (Male Goat)</label>
                  <select
                    value={formData.buck}
                    onChange={(e) => setFormData({...formData, buck: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">Select Buck</option>
                    {getMaleGoats().map(goat => (
                      <option key={goat._id} value={goat._id}>
                        {goat.name} ({goat.tagNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Mating Date</label>
                  <input
                    type="date"
                    value={formData.matingDate}
                    onChange={(e) => setFormData({...formData, matingDate: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Expected Due Date</label>
                  <input
                    type="date"
                    value={formData.expectedDueDate}
                    onChange={(e) => setFormData({...formData, expectedDueDate: e.target.value})}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Breeding Method</label>
                  <select
                    value={formData.breedingMethod}
                    onChange={(e) => setFormData({...formData, breedingMethod: e.target.value})}
                    className="input"
                  >
                    <option value="natural">Natural</option>
                    <option value="artificial-insemination">Artificial Insemination</option>
                  </select>
                </div>
                <div>
                  <label className="label">Breeding Location</label>
                  <input
                    type="text"
                    value={formData.breedingLocation}
                    onChange={(e) => setFormData({...formData, breedingLocation: e.target.value})}
                    className="input"
                    placeholder="Farm location, pen number, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Gestation Period (days)</label>
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
                    <label className="label">Health Status</label>
                    <select
                      value={formData.healthStatus}
                      onChange={(e) => setFormData({...formData, healthStatus: e.target.value})}
                      className="input"
                    >
                      <option value="healthy">Healthy</option>
                      <option value="at-risk">At Risk</option>
                      <option value="complications">Complications</option>
                      <option value="monitoring">Monitoring</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="input"
                    required
                  >
                    {breedingStatuses.map(status => (
                      <option key={status} value={status}>
                        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                    Pregnancy Confirmed
                  </label>
                </div>
                <div>
                  <label className="label">Kidding Date</label>
                  <input
                    type="date"
                    value={formData.kiddingDate}
                    onChange={(e) => setFormData({...formData, kiddingDate: e.target.value})}
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Kids Born</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kidsBorn}
                      onChange={(e) => setFormData({...formData, kidsBorn: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Kids Survived</label>
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
                    <label className="label">Breeding Cost</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.breedingCost}
                      onChange={(e) => setFormData({...formData, breedingCost: e.target.value})}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="label">Expected Value</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.expectedValue}
                      onChange={(e) => setFormData({...formData, expectedValue: e.target.value})}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="label">Veterinary Cost</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.veterinaryCost}
                      onChange={(e) => setFormData({...formData, veterinaryCost: e.target.value})}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Health Monitoring */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Last Checkup Date</label>
                    <input
                      type="date"
                      value={formData.lastCheckupDate}
                      onChange={(e) => setFormData({...formData, lastCheckupDate: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Next Checkup Date</label>
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
                  <label className="label">Expected Breed</label>
                  <input
                    type="text"
                    value={formData.expectedBreed}
                    onChange={(e) => setFormData({...formData, expectedBreed: e.target.value})}
                    className="input"
                    placeholder="Predicted offspring breed"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Doe Age (months)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.doeAge}
                      onChange={(e) => setFormData({...formData, doeAge: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Buck Age (months)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.buckAge}
                      onChange={(e) => setFormData({...formData, buckAge: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Inbreeding Coefficient</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.inbreedingCoefficient}
                      onChange={(e) => setFormData({...formData, inbreedingCoefficient: e.target.value})}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Pedigree Notes</label>
                  <textarea
                    value={formData.pedigreeNotes}
                    onChange={(e) => setFormData({...formData, pedigreeNotes: e.target.value})}
                    className="input"
                    rows="2"
                    placeholder="Genetic lineage, breeding goals, etc."
                  />
                </div>

                <div>
                  <label className="label">Notes</label>
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
                Are you sure you want to delete this breeding record? This action cannot be undone.
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

export default BreedingRecords; 