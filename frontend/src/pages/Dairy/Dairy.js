import React, { useState, useEffect } from 'react';
import { Plus, Search, Milk, Eye, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Dairy = () => {
  const [dairy, setDairy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDairy();
  }, []);

  const fetchDairy = async () => {
    try {
      const response = await api.get('/dairy');
      setDairy(response.data.data || []);
    } catch (error) {
      console.error('Error fetching dairy animals:', error);
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
          <h1 className="text-2xl font-bold">Dairy Management</h1>
          <p className="text-gray-600">Manage your dairy animals</p>
        </div>
        <button
          onClick={() => navigate('/dairy/new')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Animal
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by ID or name..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Milk (L/day)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDairy.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  <p className="mb-2">No dairy animals found.</p>
                  <button
                    onClick={() => navigate('/dairy/new')}
                    className="btn-primary-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Animal
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
                      animal.status === 'Active' ? 'bg-green-100 text-green-800' :
                      animal.status === 'Dry' ? 'bg-yellow-100 text-yellow-800' :
                      animal.status === 'Pregnant' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {animal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {animal.milkProduction?.dailyAverage?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/dairy/${animal._id}/milk`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Add Milk Record"
                      >
                        <Milk className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/dairy/${animal._id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/dairy/${animal._id}/edit`)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit Animal"
                      >
                        <Edit className="w-4 h-4" />
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
