import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '../../services/api';

const VaccinationRecords = ({ poultryId }) => {
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVaccinations = async () => {
      try {
        const response = await api.get(`/poultry/${poultryId}/vaccinations`);
        setVaccinations(response.data);
      } catch (err) {
        setError('Failed to load vaccination records');
        console.error('Error fetching vaccinations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVaccinations();
  }, [poultryId]);

  if (loading) return <div>Loading vaccination records...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Vaccination Records</h3>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-1" /> Add Record
        </button>
      </div>
      
      {vaccinations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No vaccination records found.
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {vaccinations.map((record) => (
              <li key={record._id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{record.vaccineName}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(record.dateAdministered).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    {record.status || 'Completed'}
                  </span>
                </div>
                {record.notes && (
                  <p className="mt-2 text-sm text-gray-600">{record.notes}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VaccinationRecords;
