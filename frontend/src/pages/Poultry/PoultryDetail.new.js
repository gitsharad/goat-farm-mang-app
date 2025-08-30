import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, Trash, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const PoultryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poultry, setPoultry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPoultry = async () => {
      try {
        const response = await api.get(`/poultry/${id}`);
        setPoultry(response.data);
      } catch (err) {
        setError('Failed to load poultry details');
        console.error('Error fetching poultry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPoultry();
  }, [id]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!poultry) return <div className="p-4">Poultry not found</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
        >
          <ArrowLeft className="mr-1" size={20} />
          Back
        </button>
        <h1 className="text-2xl font-bold">Poultry Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold">{poultry.name || 'Unnamed Poultry'}</h2>
            <p className="text-gray-600">ID: {poultry._id}</p>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/poultry/${id}/edit`}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Edit size={16} className="mr-1" />
              Edit
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Basic Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Breed:</span> {poultry.breed || 'N/A'}</p>
              <p><span className="font-medium">Date of Birth:</span> {poultry.dateOfBirth ? new Date(poultry.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              <p><span className="font-medium">Gender:</span> {poultry.gender || 'N/A'}</p>
              <p><span className="font-medium">Status:</span> {poultry.status || 'Active'}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Health Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Health Status:</span> {poultry.healthStatus || 'Healthy'}</p>
              <p><span className="font-medium">Last Checkup:</span> {poultry.lastCheckup ? new Date(poultry.lastCheckup).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        {poultry.notes && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
            <p className="text-gray-700">{poultry.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoultryDetail;
