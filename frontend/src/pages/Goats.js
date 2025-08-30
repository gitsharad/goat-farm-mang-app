import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Loader2, Filter, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { toast } from 'react-hot-toast';
import api from '../services/api';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef();

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timerRef.current);
  }, [value, delay]);

  return debouncedValue;
};

const Goats = () => {
  const location = useLocation();
  const [goats, setGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isFetching, setIsFetching] = useState(false);
  const [filterBreed, setFilterBreed] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGoat, setSelectedGoat] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [breeds, setBreeds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGoats, setSelectedGoats] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [goatForm, setGoatForm] = useState({
    name: '',
    breed: '',
    gender: 'female',
    dateOfBirth: '',
    status: 'active',
    health: {
      weight: '',
      height: '',
      condition: 'good',
      lastVaccinationDate: '',
      nextVaccinationDate: '',
      dewormingStatus: 'not-due',
      medicalHistory: ''
    },
    breeding: {
      isPregnant: false,
      lastBreedingDate: '',
      expectedKiddingDate: '',
      pregnancyStatus: 'not-pregnant'
    },
    production: {
      milkProduction: '',
      fiberProduction: ''
    }
  });

  // Apply initial filter from URL query (e.g., ?status=Sold)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status) setFilterStatus(status);
    
    // Cleanup function to cancel pending requests on unmount
    return () => {
      // Any cleanup if needed
    };
  }, [location.search]);

  const fetchBreeds = useCallback(async () => {
    try {
      const response = await api.get('/breeds');
      // Handle both direct array response or nested data property
      const breedsData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setBreeds(breedsData);
    } catch (error) {
      console.error('Error fetching breeds:', error);
      // Fallback to getting breeds from goats if the breeds endpoint fails
      try {
        const goatsResponse = await api.get('/goats');
        // Handle both direct response or nested data property
        const goatsData = goatsResponse.data?.goats || 
                         (Array.isArray(goatsResponse.data) ? goatsResponse.data : goatsResponse.data?.data || []);
        const uniqueBreeds = [...new Set(goatsData.map(goat => goat.breed))].filter(Boolean);
        setBreeds(uniqueBreeds);
      } catch (err) {
        console.error('Failed to fetch breeds from goats:', err);
        toast.error('Failed to load breeds');
      }
    }
  }, []);

  const fetchGoats = useCallback(async (abortController) => {
    try {
      setIsLoading(true);
      setIsFetching(true);
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(filterBreed && { breed: filterBreed }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterGender && { gender: filterGender })
      });

      const response = await api.get(`/goats?${params}`, {
        signal: abortController?.signal
      });
      
      if (!abortController?.signal.aborted) {
        // Check if response.data exists and has goats property (for backward compatibility)
        const responseData = response.data || response;
        const goatsData = responseData.goats || [];
        const totalCount = responseData.total || 0;
        
        setGoats(goatsData);
        setTotalPages(Math.ceil(totalCount / 10));
        setLoading(false); // Make sure to set loading to false when data is loaded
      }
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        console.error('Error fetching goats:', error);
        toast.error('Failed to fetch goats');
        setLoading(false); // Ensure loading is set to false on error
      }
    } finally {
      if (!abortController?.signal.aborted) {
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, [currentPage, debouncedSearchTerm, filterBreed, filterStatus, filterGender]);

  // Effect to handle data fetching with abort controller
  useEffect(() => {
    const abortController = new AbortController();
    fetchGoats(abortController);
    return () => abortController.abort();
  }, [fetchGoats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Structure the weight data properly for the backend
      const submitData = {
        ...goatForm,
        weight: {
          current: parseFloat(goatForm.health?.weight) || 0
        },
        health: {
          ...goatForm.health,
          weight: parseFloat(goatForm.health?.weight) || 0
        }
      };
      
      if (selectedGoat) {
        await api.put(`/goats/${selectedGoat._id}`, submitData);
        toast.success('Goat updated successfully');
      } else {
        await api.post('/goats', submitData);
        toast.success('Goat added successfully');
      }
      setShowAddModal(false);
      setSelectedGoat(null);
      resetForm();
      fetchGoats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/goats/${id}`);
      toast.success('Goat deleted successfully');
      if (id === selectedGoat?._id) {
        setShowDeleteModal(false);
        setSelectedGoat(null);
      }
      setSelectedGoats(prev => prev.filter(goatId => goatId !== id));
      fetchGoats();
    } catch (error) {
      toast.error('Failed to delete goat');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedGoats.length === 0) return;
    
    setIsBulkProcessing(true);
    try {
      if (bulkAction === 'delete') {
        await Promise.all(selectedGoats.map(id => 
          api.delete(`/goats/${id}`)
        ));
        toast.success(`${selectedGoats.length} goats deleted successfully`);
      } else {
        await Promise.all(selectedGoats.map(id =>
          api.patch(`/goats/${id}`, { status: bulkAction })
        ));
        toast.success(`Updated status for ${selectedGoats.length} goats`);
      }
      
      setSelectedGoats([]);
      setBulkAction('');
      setShowBulkActions(false);
      fetchGoats();
    } catch (error) {
      toast.error(`Failed to perform bulk action: ${error.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedGoats(goats.map(goat => goat._id));
    } else {
      setSelectedGoats([]);
    }
  };

  const toggleSelectGoat = (goatId, isSelected) => {
    if (isSelected) {
      setSelectedGoats(prev => [...prev, goatId]);
    } else {
      setSelectedGoats(prev => prev.filter(id => id !== goatId));
    }
  };

  const handleEdit = (goat) => {
    setSelectedGoat(goat);
    setGoatForm({
      tagNumber: goat.tagNumber,
      name: goat.name,
      breed: goat.breed,
      gender: goat.gender,
      dateOfBirth: goat.dateOfBirth ? goat.dateOfBirth.split('T')[0] : '',
      status: goat.status,
      health: {
        ...goat.health,
        weight: goat.weight?.current || ''
      },
      breeding: goat.breeding || {},
      production: goat.production || {},
      location: goat.location || '',
      notes: goat.notes || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setGoatForm({
      tagNumber: '',
      name: '',
      breed: '',
      gender: 'female',
      dateOfBirth: '',
      status: 'active',
      health: {
        weight: '',
        vaccinated: false,
        dewormed: false,
        lastVaccination: '',
        lastDeworming: ''
      },
      breeding: {
        status: 'not-bred',
        lastBreeding: '',
        pregnancyStatus: 'not-pregnant'
      },
      production: {
        milkProduction: '',
        fiberProduction: ''
      },
      location: '',
      notes: ''
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-green-100 text-green-800',
      'Sold': 'bg-blue-100 text-blue-800',
      'Deceased': 'bg-red-100 text-red-800',
      'Retired': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getGenderColor = (gender) => {
    return gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800';
  };

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 w-4 bg-gray-200 rounded"></div>
      </td>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
      ))}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  </th>
                  {[...Array(7)].map((_, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <Tooltip id="filter-tooltip" place="top" effect="solid" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goat Management</h1>
          <p className="text-gray-600">Manage your goat inventory and records</p>
        </div>
        <button
          onClick={() => {
            setSelectedGoat(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Goat
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-700">Filters</h3>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="md:hidden flex items-center text-sm text-gray-600 hover:text-gray-900"
            data-tooltip-id="filter-tooltip"
            data-tooltip-content={showFilters ? 'Hide filters' : 'Show filters'}
          >
            {showFilters ? (
              <X className="w-4 h-4 mr-1" />
            ) : (
              <Filter className="w-4 h-4 mr-1" />
            )}
            {showFilters ? 'Hide' : 'Filters'}
          </button>
        </div>
        <div className={`${showFilters ? 'block' : 'hidden md:grid'} md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-200 ease-in-out`}>
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search goats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 pr-8"
                disabled={isFetching}
              />
              {isFetching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
          </div>
          <div>
            <label className="label">Breed</label>
            <select
              value={filterBreed}
              onChange={(e) => setFilterBreed(e.target.value)}
              className="input"
            >
              <option value="">All Breeds</option>
              {breeds.map(breed => (
                <option key={breed} value={breed}>{breed}</option>
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
              <option value="Active">Active</option>
              <option value="Sold">Sold</option>
              <option value="Deceased">Deceased</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
          <div>
            <label className="label">Gender</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="input"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedGoats.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4 flex flex-wrap items-center gap-4">
          <div className="font-medium text-blue-800">
            {selectedGoats.length} {selectedGoats.length === 1 ? 'goat' : 'goats'} selected
          </div>
          
          <div className="flex-1 flex flex-wrap gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="input flex-1 min-w-[200px]"
              disabled={isBulkProcessing}
            >
              <option value="">Choose action...</option>
              <option value="Active">Mark as Active</option>
              <option value="Sold">Mark as Sold</option>
              <option value="Deceased">Mark as Deceased</option>
              <option value="Retired">Mark as Retired</option>
              <option value="delete">Delete Selected</option>
            </select>
            
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || isBulkProcessing}
              className="btn-primary flex items-center gap-2"
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : 'Apply'}
            </button>
            
            <button
              onClick={() => {
                setSelectedGoats([]);
                setBulkAction('');
              }}
              className="btn-secondary"
              disabled={isBulkProcessing}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Goats Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedGoats.length > 0 && selectedGoats.length === goats.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
                <th className="table-header">Tag #</th>
                <th className="table-header">Name</th>
                <th className="table-header">Breed</th>
                <th className="table-header">Gender</th>
                <th className="table-header">Age</th>
                <th className="table-header">Weight</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {goats.map((goat) => {
                const isSelected = selectedGoats.includes(goat._id);
                return (
                  <tr 
                    key={goat._id} 
                    className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectGoat(goat._id, e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="table-cell font-medium">{goat.tagNumber}</td>
                    <td className="table-cell">{goat.name}</td>
                    <td className="table-cell">{goat.breed}</td>
                    <td className="table-cell">
                      <span className={`badge ${getGenderColor(goat.gender)}`}>
                        {goat.gender}
                      </span>
                    </td>
                    <td className="table-cell">
                      {goat.dateOfBirth ? 
                        `${Math.floor((new Date() - new Date(goat.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365))} years` : 
                        'N/A'
                      }
                    </td>
                    <td className="table-cell">{goat.weight?.current || 'N/A'} kg</td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusColor(goat.status)}`}>
                        {goat.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/goats/${goat._id}`}
                          className="btn-icon btn-icon-primary group relative"
                          data-tooltip-id="action-tooltip"
                          data-tooltip-content="View Details"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="sr-only">View Details</span>
                        </Link>
                        <button
                          onClick={() => handleEdit(goat)}
                          className="btn-icon btn-icon-secondary group relative"
                          data-tooltip-id="action-tooltip"
                          data-tooltip-content="Edit"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGoat(goat);
                            setShowDeleteModal(true);
                            setSelectedGoats(prev => prev.filter(id => id !== goat._id));
                          }}
                          className="btn-icon btn-icon-danger group relative"
                          data-tooltip-id="action-tooltip"
                          data-tooltip-content="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </button>
                        <Tooltip id="action-tooltip" place="top" effect="solid" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && totalPages <= 10 && (
          <div className="bg-white px-2 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4">
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
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex flex-wrap justify-center rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}
              </nav>
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
                {selectedGoat ? 'Edit Goat' : 'Add New Goat'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Tag Number</label>
                    <input
                      type="text"
                      value={goatForm.tagNumber || ''}
                      onChange={(e) => setGoatForm({...goatForm, tagNumber: e.target.value})}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Name</label>
                    <input
                      type="text"
                      value={goatForm.name || ''}
                      onChange={(e) => setGoatForm({...goatForm, name: e.target.value})}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Breed</label>
                    <select
                      value={goatForm.breed || ''}
                      onChange={(e) => setGoatForm({...goatForm, breed: e.target.value})}
                      className="input"
                      required
                    >
                      <option value="">Select Breed</option>
                      <option value="Boer">Boer</option>
                      <option value="Nubian">Nubian</option>
                      <option value="Alpine">Alpine</option>
                      <option value="Saanen">Saanen</option>
                      <option value="Toggenburg">Toggenburg</option>
                      <option value="LaMancha">LaMancha</option>
                      <option value="Jamunapari">Jamunapari</option>
                      <option value="Sirohi">Sirohi</option>
                      <option value="Barbari">Barbari</option>
                      <option value="Osmanabadi">Osmanabadi</option>
                      <option value="Malabari">Malabari</option>
                      <option value="Surti">Surti</option>
                      <option value="Jakhrana">Jakhrana</option>
                      <option value="Marwari">Marwari</option>
                      <option value="Mixed">Mixed</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Gender</label>
                    <select
                      value={goatForm.gender || 'female'}
                      onChange={(e) => setGoatForm({...goatForm, gender: e.target.value})}
                      className="input"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Date of Birth</label>
                    <input
                      type="date"
                      value={goatForm.dateOfBirth || ''}
                      onChange={(e) => setGoatForm({...goatForm, dateOfBirth: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={goatForm.health?.weight || ''}
                      onChange={(e) => setGoatForm({
                        ...goatForm,
                        health: {
                          ...goatForm.health,
                          weight: e.target.value
                        }
                      })}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    value={goatForm.status || 'active'}
                    onChange={(e) => setGoatForm({...goatForm, status: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Sold">Sold</option>
                    <option value="Deceased">Deceased</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input
                    type="text"
                    value={goatForm.location || ''}
                    onChange={(e) => setGoatForm({...goatForm, location: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={goatForm.notes || ''}
                    onChange={(e) => setGoatForm({...goatForm, notes: e.target.value})}
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
                    {selectedGoat ? 'Update' : 'Add'} Goat
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
                Are you sure you want to delete goat "{selectedGoat?.name}"? This action cannot be undone.
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

export default Goats; 