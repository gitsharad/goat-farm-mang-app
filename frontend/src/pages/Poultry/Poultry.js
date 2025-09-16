import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit, Trash, Eye, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const Poultry = () => {
  const { t, i18n } = useTranslation('poultry');
  
  // Debug logging for translations
  useEffect(() => {
    console.log('Current language:', i18n.language);
    console.log('Poultry translations:', i18n.getResourceBundle(i18n.language, 'poultry') || 'Not loaded');
  }, [i18n]);
  const [poultry, setPoultry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    breed: '',
    type: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPoultry = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...filters,
        ...(searchTerm && { search: searchTerm })
      };

      const response = await api.get('/poultry', { params });
      setPoultry(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching poultry:', error);
      toast.error('Failed to load poultry data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, searchTerm]);

  useEffect(() => {
    fetchPoultry();
  }, [fetchPoultry]);

  const handleDelete = async (id) => {
    if (window.confirm(t('pages.poultryPage.deleteConfirm'))) {
      try {
        await api.delete(`/poultry/${id}`);
        toast.success(t('pages.poultryPage.deleteSuccess'));
        fetchPoultry();
      } catch (error) {
        console.error('Error deleting poultry:', error);
        toast.error(t('pages.poultryPage.deleteError'));
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      breed: '',
      type: '',
      status: ''
    });
    setSearchTerm('');
  };

  if (loading && poultry.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('pages.poultryPage.title')}</h1>
          <p className="text-gray-600">{t('pages.poultryPage.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/poultry/reports" className="btn-secondary">
            <BarChart2 className="w-4 h-4 mr-2" />
            {t('pages.poultryPage.viewReports')}
          </Link>
          <Link to="/dashboard/poultry/animals/new" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            {t('pages.poultryPage.addPoultry')}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border mb-6 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-700">{t('pages.poultryPage.filters.title')}</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
            aria-label={showFilters ? t('pages.poultryPage.filters.hideFilters') : t('pages.poultryPage.filters.showFilters')}
          >
            {showFilters ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" /> {t('pages.poultryPage.filters.hideFilters')}
              </>
            ) : (
              <>
                <Filter className="w-4 h-4 mr-1" /> {t('pages.poultryPage.filters.showFilters')}
              </>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.poultryPage.filters.breed')}</label>
              <select
                name="breed"
                value={filters.breed}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">{t('pages.poultryPage.filters.allBreeds')}</option>
                <option value="Broiler">{t('common:breeds.Broiler')}</option>
                <option value="Layer">{t('common:breeds.Layer')}</option>
                <option value="Desi">{t('common:breeds.Desi')}</option>
                <option value="Kadaknath">{t('common:breeds.Kadaknath')}</option>
                <option value="Aseel">{t('common:breeds.Aseel')}</option>
                <option value="Other">{t('common:other')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.poultryPage.filters.type')}</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">{t('pages.poultryPage.filters.allTypes')}</option>
                <option value="Broiler">{t('common:types.Broiler')}</option>
                <option value="Layer">{t('common:types.Layer')}</option>
                <option value="Breeder">{t('common:types.Breeder')}</option>
                <option value="Dual Purpose">{t('common:types.DualPurpose')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.poultryPage.filters.status')}</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">{t('pages.poultryPage.filters.allStatus')}</option>
                <option value="Active">{t('common:status.Active')}</option>
                <option value="Sold">{t('common:status.Sold')}</option>
                <option value="Mortality">{t('common:status.Mortality')}</option>
                <option value="Culled">{t('common:status.Culled')}</option>
                <option value="Other">{t('common:other')}</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="btn-secondary w-full"
              >
                {t('pages.poultryPage.filters.resetFilters')}
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('pages.poultryPage.filters.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Poultry Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.poultryPage.table.tagNumber')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.poultryPage.table.batchNumber')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.poultryPage.table.breed')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.poultryPage.table.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.poultryPage.table.age')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.poultryPage.table.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.poultryPage.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {poultry.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    {t('pages.poultryPage.table.noRecords')}
                  </td>
                </tr>
              ) : (
                poultry.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.tagNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.batchNumber || t('pages.poultryPage.table.na')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.breed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.dateOfHatch ? 
                        t('pages.poultryPage.table.months', { 
                          count: Math.floor((new Date() - new Date(item.dateOfHatch)) / (1000 * 60 * 60 * 24 * 30)) 
                        }) : 
                        t('pages.poultryPage.table.na')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'Active' ? 'bg-green-100 text-green-800' :
                        item.status === 'Sold' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'Mortality' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/poultry/animals/${item._id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" title={t('pages.poultryPage.table.viewDetails')} />
                        </Link>
                        <Link
                          to={`/poultry/animals/${item._id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" title={t('pages.poultryPage.table.edit')} />
                        </Link>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash className="w-4 h-4" title={t('pages.poultryPage.table.delete')} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {t('poultryPage.pagination.previous')}
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {t('poultryPage.pagination.next')}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t('poultryPage.pagination.showingPage', {
                  current: <span className="font-medium">{currentPage}</span>,
                  total: <span className="font-medium">{totalPages}</span>
                })}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">{t('poultryPage.pagination.previousPage')}</span>
                    <ChevronUp className="h-5 w-5 transform -rotate-90" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">{t('poultryPage.pagination.nextPage')}</span>
                    <ChevronDown className="h-5 w-5 transform rotate-90" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Poultry;
