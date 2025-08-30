import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Egg, Milk } from 'lucide-react';

const DashboardSelector = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Default farm types that are always available
  const availableFarmTypes = [
    { 
      id: 'goat', 
      name: 'Goat Farm', 
      icon: <GitBranch className="w-12 h-12 mb-2 text-primary-600" />,
      description: 'Manage your goat farming operations',
      enabled: true
    },
    { 
      id: 'poultry', 
      name: 'Poultry Farm', 
      icon: <Egg className="w-12 h-12 mb-2 text-yellow-500" />,
      description: 'Manage your poultry farming operations',
      enabled: true
    },
    { 
      id: 'dairy', 
      name: 'Dairy Farm', 
      icon: <Milk className="w-12 h-12 mb-2 text-blue-500" />,
      description: 'Manage your dairy farming operations',
      enabled: true
    }
  ];

  const handleSelectFarm = (farmType) => {
    navigate(`/dashboard/${farmType}`);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Farm Management</h1>
          <p className="text-lg text-gray-600">Select a farm type to get started</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {availableFarmTypes.map((farm) => (
            <div 
              key={farm.id}
              onClick={() => handleSelectFarm(farm.id)}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${!farm.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                border: '1px solid #e5e7eb',
                minHeight: '250px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              <div className="mb-4">
                {farm.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{farm.name}</h3>
              <p className="text-gray-600 mb-4">{farm.description}</p>
              <button 
                className={`px-4 py-2 rounded-md ${farm.enabled ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                disabled={!farm.enabled}
              >
                {farm.enabled ? 'Select Farm' : 'Coming Soon'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSelector;
