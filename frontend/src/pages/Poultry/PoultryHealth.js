import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const PoultryHealth = () => {
  const { t } = useTranslation('poultry');
  const healthPage = t('pages.healthPage', { returnObjects: true });
  const navigate = useNavigate();

  // Redirect to the health records page which has the full implementation
  useEffect(() => {
    navigate('/poultry/health-records');
  }, [navigate]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">{healthPage.title}</h2>
      <p>{healthPage.subtitle}</p>
    </div>
  );
};

export default PoultryHealth;
