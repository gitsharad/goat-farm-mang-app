import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGoatById, createGoat, updateGoat } from '../../api/goats';
import { toast } from 'react-hot-toast';

const GoatForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      tagNumber: '',
      breed: 'Jamunapari',
      dateOfBirth: '',
      gender: 'female',
      color: '',
      weight: '',
      status: 'active',
      notes: ''
    }
  });

  // Fetch goat data if in edit mode
  const { isLoading: isLoadingGoat } = useQuery(
    ['goat', id],
    () => getGoatById(id),
    {
      enabled: isEditMode,
      onSuccess: (data) => {
        reset(data);
      },
      onError: () => {
        toast.error('Failed to load goat data');
      }
    }
  );

  const mutation = useMutation(
    isEditMode ? (data) => updateGoat(id, data) : createGoat,
    {
      onSuccess: () => {
        const message = isEditMode ? 'Goat updated successfully' : 'Goat created successfully';
        toast.success(message);
        queryClient.invalidateQueries(['goats']);
        navigate('/goats');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'An error occurred');
      }
    }
  );

  const onSubmit = (data) => {
    const formattedData = {
      ...data,
      dateOfBirth: new Date(data.dateOfBirth).toISOString(),
      weight: parseFloat(data.weight)
    };
    mutation.mutate(formattedData);
  };

  if (isLoadingGoat) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">
        {isEditMode ? 'Edit Goat' : 'Add New Goat'}
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              {...register('name', { required: 'Name is required' })}
              className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          {/* Tag Number */}
          <div>
            <label htmlFor="tagNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Tag Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="tagNumber"
              {...register('tagNumber', { required: 'Tag number is required' })}
              className={`w-full px-3 py-2 border rounded-md ${errors.tagNumber ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.tagNumber && <p className="mt-1 text-sm text-red-600">{errors.tagNumber.message}</p>}
          </div>

          {/* Breed */}
          <div>
            <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
              Breed <span className="text-red-500">*</span>
            </label>
            <select
              id="breed"
              {...register('breed', { required: 'Breed is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Jamunapari">Jamunapari</option>
              <option value="Sirohi">Sirohi</option>
              <option value="Barbari">Barbari</option>
              <option value="Osmanabadi">Osmanabadi</option>
              <option value="Malabari">Malabari</option>
              <option value="Surti">Surti</option>
              <option value="Jakhrana">Jakhrana</option>
              <option value="Marwari">Marwari</option>
              <option value="Boer">Boer</option>
              <option value="Nubian">Nubian</option>
              <option value="Alpine">Alpine</option>
              <option value="Saanen">Saanen</option>
              <option value="Toggenburg">Toggenburg</option>
              <option value="LaMancha">LaMancha</option>
              <option value="Oberhasli">Oberhasli</option>
              <option value="Nigerian Dwarf">Nigerian Dwarf</option>
              <option value="Pygmy">Pygmy</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              {...register('dateOfBirth')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="female"
                  {...register('gender', { required: 'Gender is required' })}
                  className="text-primary-600 focus:ring-primary-500 h-4 w-4"
                />
                <span className="ml-2 text-gray-700">Female</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="male"
                  {...register('gender')}
                  className="text-primary-600 focus:ring-primary-500 h-4 w-4"
                />
                <span className="ml-2 text-gray-700">Male</span>
              </label>
            </div>
          </div>

          {/* Color */}
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              id="color"
              {...register('color')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Weight */}
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              id="weight"
              {...register('weight')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="deceased">Deceased</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            {...register('notes')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/goats')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {mutation.isLoading ? 'Saving...' : isEditMode ? 'Update Goat' : 'Add Goat'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoatForm;
