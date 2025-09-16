import React, { useState, useEffect } from 'react';
import { Plus, Search, Milk, Eye, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const Dairy = () => {
  const [dairy, setDairy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation('dairy');
  // Using direct translation keys that match the structure in locale files
  const tPage = (key) => t(`pages.animals.${key}`);
  const tDairyPage = (key) => t(`pages.dairyPage.${key}`);

  useEffect(() => {
    fetchDairy();
  }, []);

  const fetchDairy = async () => {
    try {
      console.log('Fetching dairy animals...');
      const response = await api.get('/dairy', {
        params: {
          page: 1,
          limit: 100, // Adjust based on your needs
          _t: new Date().getTime(), // Prevent caching
          // Add any additional query parameters needed by the backend
          ...(searchTerm ? { search: searchTerm } : {})
        }
      });
      
      console.log('Dairy API response:', response);
      
      // Handle the response based on its structure
      if (response.data) {
        if (Array.isArray(response.data)) {
          // If the response is directly an array
          setDairy(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // If the response has a data property that's an array
          setDairy(response.data.data);
        } else if (response.data.animals && Array.isArray(response.data.animals)) {
          // If the response has an animals array
          setDairy(response.data.animals);
        } else {
          console.error('Unexpected API response format:', response.data);
          setDairy([]);
        }
      } else {
        console.error('Empty response from API');
        setDairy([]);
      }
    } catch (error) {
      console.error('Error fetching dairy animals:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      setDairy([]); // Ensure we have an empty array on error
      // Show error toast to user
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        toast.error(`Error ${error.response.status}: ${error.response.data?.message || 'Failed to fetch dairy animals'}`);
      } else if (error.request) {
        // The request was made but no response was received
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredDairy = dairy.filter(animal => 
    (animal.animalId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (animal.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

    if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{tPage('title')}</h1>
          <p className="text-gray-600">{tPage('subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/dairy/new')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          {tPage('addAnimal')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={tPage('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tDairyPage('animalId')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tDairyPage('name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tDairyPage('breed')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tDairyPage('status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tDairyPage('actions')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{tDairyPage('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDairy.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  <p className="mb-2">{tPage('noAnimalsFound')}</p>
                  <button
                    onClick={() => navigate('/dairy/new')}
                    className="btn-primary-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {tPage('addYourFirstAnimal')}
                  </button>
                </td>
              </tr>
            ) : (
              filteredDairy.map((animal) => (
                <tr key={animal._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {animal.animalId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {animal.name || 'Unnamed'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {animal.breed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      animal.status === 'Lactating' ? 'bg-green-100 text-green-800' :
                      animal.status === 'Dry' ? 'bg-yellow-100 text-yellow-800' :
                      animal.status === 'Pregnant' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {t(`pages.dairyPage.statusOptions.${animal.status?.toLowerCase() || 'active'}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {animal.milkProduction?.dailyAverage?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        title={t('pages.dairyPage.view')}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => navigate(`/dairy/${animal._id}`)}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        title={t('pages.dairyPage.edit')}
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => navigate(`/dairy/${animal._id}/edit`)}
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/dairy/${animal._id}/milk`)}
                        className="text-gray-600 hover:text-gray-900"
                        title={t('pages.milkProduction.addRecord')}
                      >
                        <Milk className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dairy;
