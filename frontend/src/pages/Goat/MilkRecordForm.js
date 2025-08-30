import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from '../../utils/toast';
import api from '../../services/api';

const MilkRecordForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [goats, setGoats] = useState([]);
  const [formData, setFormData] = useState({
    goat: '',
    quantity: '',
    fat: '',
    snf: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    timeOfDay: 'morning',
  });

  useEffect(() => {
    if (id) {
      fetchMilkRecord();
    }
    fetchGoats();
  }, [id]);

  const fetchGoats = async () => {
    try {
      const response = await api.get('/api/goats?limit=1000');
      setGoats(response.data.goats || response.data.data || []);
    } catch (error) {
      console.error('Error fetching goats:', error);
      toast.error('Failed to load goats');
    }
  };

  const fetchMilkRecord = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/goats/milk-records/${id}`);
      const record = response.data;
      setFormData({
        goat: record.goatId?._id || record.goatId,
        quantity: record.amount.toString(),
        fat: record.fat ? record.fat.toString() : '',
        snf: record.snf ? record.snf.toString() : '',
        notes: record.notes || '',
        date: record.date ? record.date.split('T')[0] : new Date().toISOString().split('T')[0],
        timeOfDay: record.timeOfDay || 'morning',
      });
    } catch (error) {
      console.error('Error fetching milk record:', error);
      toast.error('Failed to load milk record');
      navigate('/goat-production');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.goat || !formData.quantity) {
      toast.error('Goat and quantity are required');
      return;
    }

    try {
      setLoading(true);
      
      // Format data to match backend expectations
      const { goat, quantity, fat, snf, notes, date, timeOfDay } = formData;
      const data = {
        goatId: goat,
        amount: parseFloat(quantity),
        fat: fat ? parseFloat(fat) : undefined,
        snf: snf ? parseFloat(snf) : undefined,
        date: date || new Date().toISOString(),
        timeOfDay: timeOfDay,
        notes: notes || ''
      };

      if (id) {
        await api.put(`/goats/milk-records/${id}`, data);
        toast.success('Milk record updated successfully');
      } else {
        await api.post('/goats/milk-records', data);
        toast.success('Milk record added successfully');
      }
      
      navigate('/goat-production');
    } catch (error) {
      console.error('Error saving milk record:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save milk record';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="flex items-center mb-6">
        <Link 
          to="/goat-production" 
          className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Edit Milk Record' : 'Add New Milk Record'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="goat" className="block text-sm font-medium text-gray-700">
              Goat <span className="text-red-500">*</span>
            </label>
            <select
              id="goat"
              name="goat"
              value={formData.goat}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              required
              disabled={loading || id}
            >
              <option value="">Select a goat</option>
              {goats.map(goat => (
                <option key={goat._id} value={goat._id}>
                  {goat.tagId} - {goat.name || 'Unnamed'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="timeOfDay">
                Time of Day
              </label>
              <select
                id="timeOfDay"
                name="timeOfDay"
                value={formData.timeOfDay}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                disabled={loading}
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Quantity (L) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="block w-full pr-12 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="0.00"
                required
                disabled={loading}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">L</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="fat" className="block text-sm font-medium text-gray-700">
              Fat %
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="fat"
                name="fat"
                value={formData.fat}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="20"
                className="block w-full pr-12 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="0.0"
                disabled={loading}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="snf" className="block text-sm font-medium text-gray-700">
              SNF %
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="snf"
                name="snf"
                value={formData.snf}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="20"
                className="block w-full pr-12 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="0.0"
                disabled={loading}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <div className="mt-1">
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                placeholder="Any additional notes about this milk record..."
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/goat-production')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={loading}
          >
            <X className="-ml-1 mr-2 h-5 w-5" />
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="-ml-1 mr-2 h-5 w-5" />
                {id ? 'Update Record' : 'Save Record'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MilkRecordForm;
