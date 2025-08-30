import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import MilkProductionChart from '../../components/MilkProductionChart';

const DairyDetail = () => {
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/dairy/${id}`)
      .then(response => setAnimal(response.data.data))
      .catch(err => {
        console.error('Error fetching animal details:', err);
        toast.error('Failed to load animal details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this animal?')) {
      try {
        await api.delete(`/dairy/${id}`);
        toast.success('Animal deleted successfully');
        navigate('/dairy');
      } catch (error) {
        console.error('Error deleting animal:', error);
        toast.error('Failed to delete animal.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl text-gray-600">Animal not found.</h2>
        <Link to="/dairy" className="text-primary-600 hover:underline mt-4 inline-block">Back to Dairy List</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button onClick={() => navigate('/dairy')} className="btn-icon mr-4">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{animal.name || `Animal #${animal.animalId}`}</h1>
            <p className="text-gray-500">{animal.breed}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate(`/dairy/${id}/edit`)} className="btn-secondary">
            <Edit className="w-4 h-4 mr-2" /> Edit
          </button>
          <button onClick={handleDelete} className="btn-danger">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Animal Details Card */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold border-b pb-2 mb-4">Animal Details</h3>
          <div className="space-y-3">
            <p><strong>Tag ID:</strong> {animal.animalId}</p>
            <p><strong>Gender:</strong> {animal.gender}</p>
            <p><strong>Date of Birth:</strong> {new Date(animal.dateOfBirth).toLocaleDateString()}</p>
            <p><strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${animal.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {animal.status}
              </span>
            </p>
          </div>
        </div>

        {/* Lactation Status Card */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold border-b pb-2 mb-4">Lactation & Breeding</h3>
          <div className="grid grid-cols-2 gap-4">
            <p><strong>Lactation #:</strong> {animal.lactation?.currentLactationNumber || 'N/A'}</p>
            <p><strong>Days in Milk:</strong> {animal.lactation?.daysInMilk || 'N/A'}</p>
            <p><strong>Last Calving:</strong> {animal.lactation?.lastCalvingDate ? new Date(animal.lactation.lastCalvingDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Pregnancy:</strong> {animal.lactation?.pregnancyStatus?.isPregnant ? 'Pregnant' : 'Open'}</p>
          </div>
        </div>
      </div>

      {/* Milk Production Section */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Milk Production (Last 30 Days)</h3>
        <div style={{ height: '300px' }}>
          <MilkProductionChart records={animal.milkProduction?.records || []} />
        </div>
      </div>
    </div>
  );
};

export default DairyDetail;
