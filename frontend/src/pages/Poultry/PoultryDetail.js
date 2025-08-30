import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, Trash, ArrowLeft, Info, Syringe, BarChart2 } from 'lucide-react';
import VaccinationRecords from './VaccinationRecords';
import ProductionRecords from './ProductionRecords';
import api from '../../services/api';

const PoultryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poultry, setPoultry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'vaccinations':
        return <VaccinationRecords poultryId={id} />;
      case 'production':
        return <ProductionRecords poultryId={id} />;
      case 'overview':
      default:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Details</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Tag:</span> {poultry.tagNumber}</p>
                  <p><span className="text-gray-600">Batch:</span> {poultry.batchNumber || 'N/A'}</p>
                  <p><span className="text-gray-600">Breed:</span> {poultry.breed}</p>
                  <p><span className="text-gray-600">Type:</span> {poultry.type}</p>
                  <p><span className="text-gray-600">Status:</span> {poultry.status}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Health</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Status:</span> {poultry.health?.status || 'Unknown'}</p>
                  {poultry.dateOfHatch && (
                    <p><span className="text-gray-600">Age:</span> {Math.floor((new Date() - new Date(poultry.dateOfHatch)) / (1000 * 60 * 60 * 24))} days</p>
                  )}
                  <p><span className="text-gray-600">Location:</span> {poultry.location || 'N/A'}</p>
                </div>
              </div>
            </div>

            {poultry.notes && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-gray-700">{poultry.notes}</p>
              </div>
            )}
          </>
        );
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this poultry record?')) {
      try {
        await api.delete(`/poultry/${id}`);
        navigate('/poultry');
      } catch (err) {
        setError('Failed to delete poultry record');
        console.error('Error deleting poultry:', err);
      }
    }
  };

  if (!poultry) return <div>Not found</div>;

  return (
    <div className="container mx-auto p-4">
      <Link to="/poultry" className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Poultry
      </Link>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{poultry.tagNumber}</h1>
              <p className="mt-1 text-sm text-gray-500">{poultry.breed} • {poultry.type}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <Link to={`/poultry/${id}/edit`} className="btn-secondary">
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Link>
              <button onClick={handleDelete} className="btn-danger">
                <Trash className="w-4 h-4 mr-1" /> Delete
              </button>
            </div>
          </div>

          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Info className="w-4 h-4 mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('vaccinations')}
                className={`${activeTab === 'vaccinations' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Syringe className="w-4 h-4 mr-2" />
                Vaccinations
              </button>
              <button
                onClick={() => setActiveTab('production')}
                className={`${activeTab === 'production' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <BarChart2 className="w-4 h-4 mr-2" />
                Production
              </button>
            </nav>
          </div>
        </div>

        <div className="px-6 py-5">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default PoultryDetail;
