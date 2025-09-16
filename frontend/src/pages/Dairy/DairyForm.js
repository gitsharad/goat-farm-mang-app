import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';

const DairyForm = () => {
  // Initialize form with values that match translation keys exactly
  // Initialize form with default values that match the translation keys exactly
  const [formData, setFormData] = useState({
    animalId: '',
    name: '',
    breed: 'Holstein Friesian',
    dateOfBirth: '',
    gender: 'Female',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { t } = useTranslation('dairy');
  const tForm = (key) => t(`pages.animals.form.${key}`);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      setLoading(true);
      api.get(`/dairy/${id}`)
        .then(response => {
          const animal = response.data.data;
          setFormData({
            animalId: animal.animalId,
            name: animal.name || '',
            breed: animal.breed,
            dateOfBirth: animal.dateOfBirth ? new Date(animal.dateOfBirth).toISOString().split('T')[0] : '',
            gender: animal.gender,
            status: animal.status,
          });
        })
        .catch(err => {
          console.error('Error fetching animal data:', err);
          toast.error('Failed to load animal data.');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const apiCall = isEditMode 
      ? api.put(`/dairy/${id}`, formData) 
      : api.post('/dairy', formData);

    try {
      await apiCall;
      toast.success(`Animal ${isEditMode ? 'updated' : 'added'} successfully!`);
      navigate('/dairy');
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMsg = error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} animal.`;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/dairy')} className="btn-icon mr-4">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">{isEditMode ? tForm('editTitle') : tForm('title')}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">{tForm('animalId')}</label>
              <input type="text" name="animalId" value={formData.animalId} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="label">{tForm('name')}</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">{tForm('breed')}</label>
              <select name="breed" value={formData.breed} onChange={handleChange} className="input" required>
                {Object.entries(t('pages.animals.form.breedOptions', { returnObjects: true })).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{tForm('dateOfBirth')}</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">{tForm('gender')}</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="input" required>
                {Object.entries(t('pages.animals.form.genderOptions', { returnObjects: true })).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{tForm('status')}</label>
              <select name="status" value={formData.status} onChange={handleChange} className="input" required>
                {Object.entries(t('pages.animals.form.statusOptions', { returnObjects: true })).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="button" onClick={() => navigate('/dairy')} className="btn-secondary mr-4" disabled={loading}>
              {tForm('cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? tForm('saving') : (isEditMode ? tForm('updateAnimal') : tForm('addAnimal'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DairyForm;
