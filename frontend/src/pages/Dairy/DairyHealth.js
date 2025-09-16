import React from 'react';
import { useTranslation } from 'react-i18next';

const DairyHealth = () => {
  const { t } = useTranslation('dairy');
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">
        {t('pages.health.title', 'Health Management')}
      </h1>
      <p className="text-gray-600 mb-6">
        {t('pages.health.subtitle', 'Record and manage animal health')}
      </p>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">
            {t('pages.health.upcomingVaccinations', 'Upcoming Vaccinations')}
          </h2>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
            {t('pages.health.addRecord', 'Add Record')}
          </button>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">
            {t('pages.health.recentTreatments', 'Recent Treatments')}
          </h3>
          <p className="text-gray-500">
            {t('common.noDataAvailable', 'No data available')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DairyHealth;
