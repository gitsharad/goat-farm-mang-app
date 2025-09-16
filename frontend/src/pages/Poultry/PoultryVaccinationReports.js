import React from 'react';
import { useTranslation } from 'react-i18next';

const PoultryVaccinationReports = () => {
  const { t } = useTranslation('poultry');
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">
        {t('pages.poultryVaccinationReports.title')}
      </h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          {t('pages.poultryVaccinationReports.comingSoon')}
        </p>
      </div>
    </div>
  );
};

export default PoultryVaccinationReports;
