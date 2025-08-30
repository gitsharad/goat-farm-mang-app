import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';

const DairyForm = () => {
  const [formData, setFormData] = useState({
    animalId: '',
    name: '',
    breed: 'Holstein Friesian',
    dateOfBirth: '',
    gender: 'Female',
    status: 'Active',
  });
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
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
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Dairy Animal' : 'Add New Dairy Animal'}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Animal ID / Tag Number</label>
              <input type="text" name="animalId" value={formData.animalId} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="label">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Breed</label>
              <select name="breed" value={formData.breed} onChange={handleChange} className="input" required>
                <option>Holstein Friesian</option>
                <option>Jersey</option>
                <option>Sahiwal</option>
                <option>Gir</option>
                <option>Red Sindhi</option>
                <option>Tharparkar</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="input" required>
                <option>Female</option>
                <option>Male</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="input" required>
                <option>Active</option>
                <option>Dry</option>
                <option>Pregnant</option>
                <option>Sick</option>
                <option>Sold</option>
                <option>Deceased</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="button" onClick={() => navigate('/dairy')} className="btn-secondary mr-4" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEditMode ? 'Update Animal' : 'Add Animal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DairyForm;
