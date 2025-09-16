import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('goat');
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  // Load breeds when component mounts
  useEffect(() => {
    fetchBreeds();
  }, []);

  // Handle URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status) setFilterStatus(status);
    
    // Cleanup function to cancel pending requests on unmount
    return () => {
      // Any cleanup if needed
    };
  }, [location.search]);

  // Default breeds to use if API calls fail
  const defaultBreeds = useMemo(() => {
    const breeds = [
      'boer', 'nubian', 'alpine', 'saanen', 'toggenburg', 'lamancha',
      'jamunapari', 'sirohi', 'barbari', 'osmanabadi', 'malabari', 'surti',
      'jakhrana', 'marwari', 'mixed', 'other'
    ];
    console.log('Default breeds initialized:', breeds);
    return breeds;
  }, []);

  const fetchBreeds = useCallback(async () => {
    console.log('Fetching goat breeds...');
    
    // Set default breeds immediately while we fetch
    const defaultBreeds = [
      'Boer', 'Nubian', 'Alpine', 'Saanen', 'Toggenburg', 'LaMancha',
      'Jamunapari', 'Sirohi', 'Barbari', 'Osmanabadi', 'Malabari', 'Surti',
      'Jakhrana', 'Marwari', 'Mixed', 'Other'
    ];
    
    // Set default breeds immediately for better UX
    setBreeds(defaultBreeds);
    
    try {
      // First try to fetch from the breeds endpoint
      const response = await api.get('/goats/breeds', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 5000 // 5 second timeout
      }).catch(() => ({}));
      
      if (response.data && Array.isArray(response.data)) {
        console.log('Successfully fetched breeds from API');
        setBreeds(prev => [...new Set([...prev, ...response.data])]);
        return;
      }
      
      // If breeds endpoint fails, try to get breeds from Goat model schema
      try {
        const schemaResponse = await api.get('/goats/schema').catch(() => ({}));
        if (schemaResponse.data?.breed?.enum) {
          console.log('Using breeds from Goat model schema');
          setBreeds(prev => [...new Set([...prev, ...schemaResponse.data.breed.enum])]);
          return;
        }
      } catch (schemaError) {
        console.warn('Could not fetch breeds from schema:', schemaError);
      }
      
      // If all else fails, use the default breeds we set earlier
      console.log('Using default breeds as fallback');
      setBreeds(defaultBreeds);
      
    } catch (error) {
      console.error('Error in fetchBreeds:', error);
      // Ensure we always have the default breeds
      setBreeds(defaultBreeds);
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
    } finally {
      setIsSubmitting(false);
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

  // Filter goats based on search term and filters
  const filteredGoats = Array.isArray(goats) ? goats.filter(goat => {
    if (!goat) return false;
    
    const matchesSearch = !searchTerm || 
      (goat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goat.tagNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goat.breed?.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesBreed = !filterBreed || goat.breed === filterBreed;
    const matchesStatus = !filterStatus || goat.status === filterStatus;
    const matchesGender = !filterGender || goat.gender === filterGender;
    
    return matchesSearch && matchesBreed && matchesStatus && matchesGender;
  }) : [];

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
          <h1 className="text-2xl font-bold text-gray-900">
            {t('pages.goats.title')}
          </h1>
          <p className="text-gray-600">
            {t('pages.goats.subtitle')}
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedGoat(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="btn-primary flex items-center gap-2"
          aria-label={t('pages.goats.addGoat')}
        >
          <Plus className="w-4 h-4" />
          {t('pages.goats.addGoat')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-700">{t('pages.goats.filters.title')}</h3>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="md:hidden flex items-center text-sm text-gray-600 hover:text-gray-900"
            data-tooltip-id="filter-tooltip"
            data-tooltip-content={showFilters ? t('pages.goats.filters.hide') : t('pages.goats.filters.show')}
          >
            {showFilters ? (
              <X className="w-4 h-4 mr-1" />
            ) : (
              <Filter className="w-4 h-4 mr-1" />
            )}
            {showFilters ? t('pages.goats.filters.hide') : t('pages.goats.filters.show')}
          </button>
        </div>
        <div className={`${showFilters ? 'block' : 'hidden md:grid'} md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-200 ease-in-out`}>
          <div>
            <label className="label">{t('pages.goats.common.search')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('pages.goats.searchPlaceholder')}
                className="input pl-10 w-full border rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={t('common.clear')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="label">{t('pages.goats.filters.breed')}</label>
            <select
              value={filterBreed}
              onChange={(e) => setFilterBreed(e.target.value)}
              className="input w-full border rounded-md"
              disabled={breeds.length === 0}
            >
              <option value="">{t('pages.goats.filters.allBreeds')}</option>
              {(breeds.length > 0 ? breeds : defaultBreeds).map(breed => {
                const breedKey = breed.toLowerCase();
                // Get the translated breed name with the correct path
                const translatedBreed = t(`pages.goats.filters.breeds.${breedKey}`, { 
                  defaultValue: breed.charAt(0).toUpperCase() + breed.slice(1) 
                });
                return (
                  <option key={breed} value={breed}>
                    {translatedBreed}
                  </option>
                );
              })}
              {breeds.length === 0 && (
                <option value="" disabled>
                  {t('pages.goats.filters.loadingBreeds')}
                </option>
              )}
            </select>
          </div>
          <div>
            <label className="label">{t('pages.goats.filters.status')}</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input w-full border rounded-md"
            >
              <option value="">{t('pages.goats.filters.allStatuses')}</option>
              <option value="active">{t('pages.goats.filters.statusOption.Active')}</option>
              <option value="sold">{t('pages.goats.filters.statusOption.Sold')}</option>
              <option value="deceased">{t('pages.goats.filters.statusOption.deceased')}</option>
              <option value="retired">{t('pages.goats.filters.statusOption.retired')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('pages.goats.filters.gender')}</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="input w-full border rounded-md"
            >
              <option value="">{t('pages.goats.filters.allGenders')}</option>
              <option value="female">{t('pages.goats.filters.genderOptions.female')}</option>
              <option value="male">{t('pages.goats.filters.genderOptions.male')}</option>
              <option value="castrated">{t('pages.goats.filters.genderOptions.castrated')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedGoats.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4 flex flex-wrap items-center gap-4">
          <div className="font-medium text-blue-800">
            {t('pages.goats.bulkActions.selectedCount', {
              count: selectedGoats.length,
              goat: t(`pages.goats.${selectedGoats.length === 1 ? 'goat' : 'goats'}`)
            })}
          </div>
          
          <div className="flex-1 flex flex-wrap gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="input flex-1 min-w-[200px] border rounded-md"
              disabled={isBulkProcessing}
              aria-label={t('pages.goats.bulkActions.chooseAction')}
            >
              <option value="">{t('pages.goats.bulkActions.chooseAction')}</option>
              <option value="active">{t('pages.goats.bulkActions.markAsActive')}</option>
              <option value="sold">{t('pages.goats.bulkActions.markAsSold')}</option>
              <option value="deceased">{t('pages.goats.bulkActions.markAsDeceased')}</option>
              <option value="retired">{t('pages.goats.bulkActions.markAsRetired')}</option>
              <option value="delete">{t('pages.goats.bulkActions.deleteSelected')}</option>
            </select>
            
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || isBulkProcessing}
              className="btn-primary flex items-center gap-2"
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.processing')}
                </>
              ) : (
                t('pages.goats.bulkActions.applyAction')
              )}
            </button>
            
            <button
              onClick={() => {
                setSelectedGoats([]);
                setBulkAction('');
              }}
              className="btn-secondary"
              disabled={isBulkProcessing}
              aria-label={t('common.cancel')}
            >
              {t('common.cancel')}
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    className="input h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={selectedGoats.length > 0 && selectedGoats.length === filteredGoats.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGoats(filteredGoats.map(goat => goat._id));
                      } else {
                        setSelectedGoats([]);
                      }
                    }}
                    aria-label={t('pages.goats.table.selectAll')}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goats.table.id')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goats.table.name')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goats.table.breed')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goats.table.gender')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goats.table.age')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goats.table.weight')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goats.table.status')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.goats.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGoats.map((goat) => (
                <tr key={goat._id} className={selectedGoats.includes(goat._id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="input h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={selectedGoats.includes(goat._id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedGoats([...selectedGoats, goat._id]);
                        } else {
                          setSelectedGoats(selectedGoats.filter(id => id !== goat._id));
                        }
                      }}
                      aria-label={`Select ${goat.name || 'goat'}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {goat.tagNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {goat.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {t(`pages.goats.breeds.${goat.breed?.toLowerCase()}`, { defaultValue: goat.breed })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getGenderColor(goat.gender)}`}>
                      {t(`pages.goats.filters.genderOptions.${goat.gender}`, { defaultValue: goat.gender })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {goat.dateOfBirth ? 
                      `${Math.floor((new Date() - new Date(goat.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365))} ${t('pages.goats.common.years')}` : 
                      'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {goat.weight?.current ? `${goat.weight.current} kg` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusColor(goat.status)}`}>
                      {goat.status === 'active' || goat.status === 'sold' 
                        ? t(`goats.activeStatus.${goat.status.charAt(0).toUpperCase() + goat.status.slice(1)}`)
                        : t(`pages.goats.status.${goat.status}`, { defaultValue: goat.status })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/goats/${goat._id}`}
                        className="btn-icon btn-icon-primary group relative"
                        data-tooltip-id={`view-tooltip-${goat._id}`}
                        data-tooltip-content="View Details"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="sr-only">View Details</span>
                      </Link>
                      <button
                        onClick={() => handleEdit(goat)}
                        className="btn-icon btn-icon-secondary group relative"
                        data-tooltip-id={`edit-tooltip-${goat._id}`}
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
                        data-tooltip-id={`delete-tooltip-${goat._id}`}
                        data-tooltip-content="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete</span>
                      </button>
                      <Tooltip id={`view-tooltip-${goat._id}`} place="top" effect="solid" />
                      <Tooltip id={`edit-tooltip-${goat._id}`} place="top" effect="solid" />
                      <Tooltip id={`delete-tooltip-${goat._id}`} place="top" effect="solid" />
                    </div>
                  </td>
                </tr>
              ))}
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
                {selectedGoat ? t('pages.goatForm.editTitle') : t('pages.goatForm.title')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('pages.goatForm.fields.tagNumber')}</label>
                    <input
                      type="text"
                      value={goatForm.tagNumber || ''}
                      onChange={(e) => setGoatForm({...goatForm, tagNumber: e.target.value})}
                      className="input w-full border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">{t('pages.goatForm.fields.name')}</label>
                    <input
                      type="text"
                      value={goatForm.name || ''}
                      onChange={(e) => setGoatForm({...goatForm, name: e.target.value})}
                      className="input w-full border rounded-md"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('pages.goats.filters.breed')}</label>
                    <select
                      value={goatForm.breed || ''}
                      onChange={(e) => setGoatForm({...goatForm, breed: e.target.value})}
                      className="input w-full border rounded-md"
                      required
                    >
                      <option value="">{t('pages.goatForm.fields.selectBreed')}</option>
                      {Object.entries(t('pages.goats.filters.breeds', { returnObjects: true })).map(([key, value]) => (
                        <option key={key} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('pages.goats.filters.gender')}</label>
                    <select
                      value={goatForm.gender || 'female'}
                      onChange={(e) => setGoatForm({...goatForm, gender: e.target.value})}
                      className="input w-full border rounded-md"
                      required
                    >
                      <option value="">{t('pages.goatForm.fields.selectGender')}</option>
                      <option value="male">{t('pages.goats.filters.gender.male')}</option>
                      <option value="female">{t('pages.goats.filters.gender.female')}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('pages.goatForm.fields.dateOfBirth')}</label>
                    <input
                      type="date"
                      value={goatForm.dateOfBirth || ''}
                      onChange={(e) => setGoatForm({...goatForm, dateOfBirth: e.target.value})}
                      className="input w-full border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="label">{t('pages.goatForm.fields.weight')}</label>
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
                      className="input w-full border rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">{t('pages.goats.filters.status')}</label>
                  <select
                    value={goatForm.status || 'active'}
                    onChange={(e) => setGoatForm({...goatForm, status: e.target.value})}
                    className="input w-full border rounded-md"
                    required
                  >
                    <option value="Active">{t('pages.goats.filters.status.Active')}</option>
                    <option value="Sold">{t('pages.goats.filters.status.Sold')}</option>
                    <option value="Deceased">{t('pages.goats.filters.status.deceased')}</option>
                    <option value="Retired">{t('pages.goats.filters.status.retired')}</option>
                  </select>
                </div>
                <div>
                  <label className="label">{t('pages.goatForm.fields.location')}</label>
                  <input
                    type="text"
                    value={goatForm.location || ''}
                    onChange={(e) => setGoatForm({...goatForm, location: e.target.value})}
                    className="input w-full border rounded-md"
                    placeholder={t('pages.goatForm.fields.locationPlaceholder')}
                  />
                </div>
                <div>
                  <label className="label">{t('pages.goatForm.fields.notes')}</label>
                  <textarea
                    value={goatForm.notes || ''}
                    onChange={(e) => setGoatForm({...goatForm, notes: e.target.value})}
                    className="input w-full border rounded-md"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('common.saving') : t('common.save')}
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