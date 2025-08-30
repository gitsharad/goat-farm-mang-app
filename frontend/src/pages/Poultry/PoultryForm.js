import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const PoultryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm({
    defaultValues: {
      tagNumber: '',
      batchNumber: '',
      breed: '',
      type: 'Layer',
      dateOfHatch: '',
      source: 'Hatchery',
      status: 'Active',
      location: '',
      notes: '',
      health: {
        status: 'Healthy',
        lastCheckup: new Date().toISOString().split('T')[0],
        issues: ''
      },
      vaccination: {
        lastVaccine: '',
        lastVaccineDate: '',
        nextVaccineDate: ''
      }
    }
  });

  useEffect(() => {
    if (isEditing) {
      const fetchPoultry = async () => {
        try {
          const response = await api.get(`/poultry/${id}`);
          reset({
            ...response.data,
            dateOfHatch: response.data.dateOfHatch
              ? new Date(response.data.dateOfHatch).toISOString().split('T')[0]
              : ''
          });
        } catch (error) {
          console.error('Error fetching poultry:', error);
          toast.error('Failed to load poultry data');
        } finally {
          setLoading(false);
        }
      };
      fetchPoultry();
    }
  }, [id, isEditing, reset]);

  const lastVaccine = watch('vaccination.lastVaccine');
  const lastVaccineDate = watch('vaccination.lastVaccineDate');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { ...data };

      if (data.vaccination.lastVaccine && data.vaccination.lastVaccineDate) {
        payload.vaccination = [{
          vaccine: data.vaccination.lastVaccine,
          date: data.vaccination.lastVaccineDate,
          nextDate: data.vaccination.nextVaccineDate || null,
        }];
      } else {
        payload.vaccination = [];
      }

      if (isEditing) {
        await api.put(`/poultry/${id}`, payload);
        toast.success('Poultry updated successfully');
      } else {
        await api.post('/poultry', payload);
        toast.success('Poultry added successfully');
      }
      navigate('/poultry');
    } catch (error) {
      console.error('Error saving poultry:', error);
      const errorMessage = error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} poultry`;
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Edit Poultry' : 'Add New Poultry'}
          </h1>
          <button
            onClick={() => navigate('/poultry')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tag Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('tagNumber', { required: 'Tag number is required' })}
                  className={`input ${errors.tagNumber ? 'border-red-500' : ''}`}
                  placeholder="P-001"
                />
                {errors.tagNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.tagNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                <input
                  type="text"
                  {...register('batchNumber')}
                  className="input"
                  placeholder="B-2023-01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Breed <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('breed', { required: 'Breed is required' })}
                  className={`input ${errors.breed ? 'border-red-500' : ''}`}
                >
                  <option value="">Select Breed</option>
                  <option value="Broiler">Broiler</option>
                  <option value="Layer">Layer</option>
                  <option value="Desi">Desi</option>
                  <option value="Kadaknath">Kadaknath</option>
                  <option value="Aseel">Aseel</option>
                  <option value="Rhode Island Red">Rhode Island Red</option>
                  <option value="Other">Other</option>
                </select>
                {errors.breed && (
                  <p className="mt-1 text-sm text-red-600">{errors.breed.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select {...register('type')} className="input">
                  <option value="Layer">Layer</option>
                  <option value="Broiler">Broiler</option>
                  <option value="Dual Purpose">Dual Purpose</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Hatch</label>
                <input
                  type="date"
                  {...register('dateOfHatch')}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select {...register('source')} className="input">
                  <option value="Hatchery">Hatchery</option>
                  <option value="Farm Raised">Farm Raised</option>
                  <option value="Purchased">Purchased</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select {...register('status')} className="input">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Sold">Sold</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  {...register('location')}
                  className="input"
                  placeholder="e.g., Coop A, Pen 3"
                />
              </div>
            </div>

            {/* Health Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Health Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
                <select {...register('health.status')} className="input">
                  <option value="Healthy">Healthy</option>
                  <option value="Sick">Sick</option>
                  <option value="Under Treatment">Under Treatment</option>
                  <option value="Recovering">Recovering</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Checkup</label>
                <input
                  type="date"
                  {...register('health.lastCheckup')}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Health Issues</label>
                <textarea
                  {...register('health.issues')}
                  className="input"
                  rows="3"
                  placeholder="Any health issues or observations..."
                ></textarea>
              </div>

              <h3 className="text-md font-medium text-gray-900 mt-6 mb-2">Vaccination</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Vaccine</label>
                <input
                  type="text"
                  {...register('vaccination.lastVaccine', {
                    validate: value => {
                      if (lastVaccineDate && !value) {
                        return 'Vaccine name is required if date is provided.';
                      }
                      return true;
                    }
                  })}
                  className={`input ${errors.vaccination?.lastVaccine ? 'border-red-500' : ''}`}
                  placeholder="Vaccine name"
                />
                {errors.vaccination?.lastVaccine && (
                  <p className="mt-1 text-sm text-red-600">{errors.vaccination.lastVaccine.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Date</label>
                  <input
                    type="date"
                    {...register('vaccination.lastVaccineDate', {
                      validate: value => {
                        if (lastVaccine && !value) {
                          return 'Date is required if vaccine name is provided.';
                        }
                        return true;
                      }
                    })}
                    className={`input ${errors.vaccination?.lastVaccineDate ? 'border-red-500' : ''}`}
                  />
                  {errors.vaccination?.lastVaccineDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.vaccination.lastVaccineDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Due</label>
                  <input
                    type="date"
                    {...register('vaccination.nextVaccineDate')}
                    className="input"
                  />
                </div>
              </div>

              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  {...register('notes')}
                  className="input"
                  rows="4"
                  placeholder="Additional notes..."
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/poultry')}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PoultryForm;
