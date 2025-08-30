import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

const PoultryForm = ({ poultry, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      tagNumber: '',
      batchNumber: '',
      breed: '',
      type: '',
      dateOfHatch: '',
      source: '',
      quantity: 1,
      status: 'Active',
      location: '',
      notes: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const { getValues } = useForm();

  useEffect(() => {
    if (poultry) {
      const fields = [
        'tagNumber', 'batchNumber', 'breed', 'type', 'dateOfHatch', 
        'source', 'quantity', 'status', 'location', 'notes'
      ];
      fields.forEach(field => {
        if (poultry[field] !== undefined) setValue(field, poultry[field]);
      });
    }
  }, [poultry, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (poultry) {
        await api.put(`/poultry/${poultry._id}`, data);
        toast.success('Poultry record updated');
      } else {
        await api.post('/poultry', data);
        toast.success('Poultry record created');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving poultry:', error);
      toast.error(error.response?.data?.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tag Number <span className="text-red-500">*</span>
          </label>
          <input
            {...register('tagNumber', { required: 'Required' })}
            className={`input ${errors.tagNumber ? 'border-red-500' : ''}`}
            placeholder="PT-001"
          />
          {errors.tagNumber && <p className="text-red-500 text-xs mt-1">{errors.tagNumber.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Batch Number</label>
          <input
            {...register('batchNumber')}
            className="input"
            placeholder="BATCH-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Breed <span className="text-red-500">*</span></label>
          <select
            {...register('breed', { required: 'Required' })}
            className={`input ${errors.breed ? 'border-red-500' : ''}`}
          >
            <option value="">Select Breed</option>
            <option value="Broiler">Broiler</option>
            <option value="Layer">Layer</option>
            <option value="Desi">Desi</option>
            <option value="Kadaknath">Kadaknath</option>
            <option value="Aseel">Aseel</option>
            <option value="Other">Other</option>
          </select>
          {errors.breed && <p className="text-red-500 text-xs mt-1">{errors.breed.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Type <span className="text-red-500">*</span></label>
          <select
            {...register('type', { required: 'Required' })}
            className={`input ${errors.type ? 'border-red-500' : ''}`}
          >
            <option value="">Select Type</option>
            <option value="Broiler">Broiler</option>
            <option value="Layer">Layer</option>
            <option value="Breeder">Breeder</option>
            <option value="Dual Purpose">Dual Purpose</option>
          </select>
          {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Hatch</label>
          <input
            type="date"
            {...register('dateOfHatch')}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            {...register('status')}
            className="input"
          >
            <option value="Active">Active</option>
            <option value="Sold">Sold</option>
            <option value="Mortality">Mortality</option>
            <option value="Culled">Culled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            min="1"
            {...register('quantity', { valueAsNumber: true, min: 1 })}
            className="input"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            {...register('notes')}
            rows="3"
            className="input"
            placeholder="Additional notes..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Poultry'}
        </button>
      </div>
    </form>
  );
};

export default PoultryForm;
