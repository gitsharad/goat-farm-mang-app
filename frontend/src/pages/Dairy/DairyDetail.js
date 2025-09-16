import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import MilkProductionChart from '../../components/MilkProductionChart';

const DairyDetail = () => {
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('dairy');

  useEffect(() => {
    console.log('Fetching animal with ID:', id);
    // Use the correct endpoint - /api/dairy/:id
    api.get(`/dairy/${id}`, {
      // Add a timestamp to prevent caching
      params: { _t: new Date().getTime() }
    })
    .then(response => {
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      if (response.data && response.data.success && response.data.data) {
        console.log('Setting animal data:', response.data.data);
        setAnimal(response.data.data);
      } else {
        console.error('Unexpected response format:', response.data);
        toast.error('Received unexpected data format from server');
        setAnimal(null);
      }
    })
    .catch(err => {
      console.error('Error fetching animal details:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load animal details';
      toast.error(errorMessage);
      console.error('Full error object:', {
        message: err.message,
        response: err.response,
        config: err.config
      });
      setAnimal(null);
    })
    .finally(() => {
      console.log('Loading complete');
      setLoading(false);
    });
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm(t('pages.dairyDetailsPage.confirmDelete'))) {
      try {
        await api.delete(`/dairy/${id}`);
        toast.success(t('pages.dairyDetailsPage.deleteSuccess'));
        navigate('/dairy');
      } catch (error) {
        console.error('Error deleting animal:', error);
        toast.error(t('pages.dairyDetailsPage.deleteError'));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-4">{t('pages.dairyDetailsPage.loading')}</span>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl text-gray-600">{t('pages.dairyDetailsPage.notFound')}</h2>
        <Link to="/dairy" className="text-primary-600 hover:underline mt-4 inline-block">
          {t('pages.dairyDetailsPage.backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dairy')} 
            className="btn-icon mr-4"
            aria-label={t('pages.dairyDetailsPage.backToList')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{animal.name || `${t('pages.dairyDetailsPage.animal')} #${animal.animalId}`}</h1>
            <p className="text-gray-500">{animal.breed}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => navigate(`/dairy/${id}/edit`)} 
            className="btn-secondary"
            aria-label={t('pages.dairyDetailsPage.edit')}
          >
            <Edit className="w-4 h-4 mr-2" /> {t('pages.dairyDetailsPage.edit')}
          </button>
          <button 
            onClick={handleDelete} 
            className="btn-danger"
            aria-label={t('pages.dairyDetailsPage.delete')}
          >
            <Trash2 className="w-4 h-4 mr-2" /> {t('pages.dairyDetailsPage.delete')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Animal Details Card */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold border-b pb-2 mb-4">
            {t('pages.dairyDetailsPage.animalDetails')}
          </h3>
          <div className="space-y-3">
            <p><strong>{t('pages.dairyDetailsPage.tagId')}:</strong> {animal.animalId}</p>
            <p><strong>{t('pages.dairyDetailsPage.gender')}:</strong> {animal.gender}</p>
            <p>
              <strong>{t('pages.dairyDetailsPage.dateOfBirth')}:</strong> {animal.dateOfBirth ? new Date(animal.dateOfBirth).toLocaleDateString() : t('pages.dairyDetailsPage.notAvailable')}
            </p>
            <p>
              <strong>{t('pages.dairyDetailsPage.status')}:</strong> 
              <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                animal.status && animal.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {animal.status ? (
                  t(`pages.dairyPage.statusOptions.${animal.status.toLowerCase()}`) || animal.status
                ) : t('pages.dairyDetailsPage.notAvailable')}
              </span>
            </p>
          </div>
        </div>

        {/* Lactation Status Card */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold border-b pb-2 mb-4">
            {t('pages.dairyDetailsPage.lactationBreeding')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <p>
              <strong>{t('pages.dairyDetailsPage.lactationNumber')}:</strong> {animal.lactation?.currentLactationNumber || t('pages.dairyDetailsPage.notAvailable')}
            </p>
            <p>
              <strong>{t('pages.dairyDetailsPage.daysInMilk')}:</strong> {animal.lactation?.daysInMilk || t('pages.dairyDetailsPage.notAvailable')}
            </p>
            <p>
              <strong>{t('pages.dairyDetailsPage.lastCalving')}:</strong> {animal.lactation?.lastCalvingDate ? new Date(animal.lactation.lastCalvingDate).toLocaleDateString() : t('pages.dairyDetailsPage.notAvailable')}
            </p>
            <p>
              <strong>{t('pages.dairyDetailsPage.pregnancy')}:</strong> {animal.lactation?.pregnancyStatus?.isPregnant ? t('pages.dairyDetailsPage.pregnant') : t('pages.dairyDetailsPage.open')}
            </p>
          </div>
        </div>
      </div>

      {/* Milk Production Section */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          {t('pages.dairyDetailsPage.milkProductionLast30Days')}
        </h3>
        <div style={{ height: '300px' }}>
          <MilkProductionChart records={animal.milkProduction?.records || []} />
        </div>
      </div>
    </div>
  );
};

export default DairyDetail;
