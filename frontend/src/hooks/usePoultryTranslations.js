import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const usePoultryTranslations = () => {
  const { t, i18n } = useTranslation(['poultry', 'common']);

  // Initialize translations if not present
  useEffect(() => {
    if (i18n.language === 'mr' && !i18n.hasResourceBundle('mr', 'poultry')) {
      console.log('Initializing Marathi translations for poultry...');
      
      const mrTranslations = {
        dashboard: {
          title: 'कोंबडीपालन डॅशबोर्ड',
          subtitle: 'तुमचे कोंबडीपालन फार्म व्यवस्थापित करा',
          totalBirds: 'एकूण पक्षी',
          addBatch: 'नवीन बॅच जोडा'
        }
      };
      
      i18n.addResourceBundle('mr', 'poultry', mrTranslations, true, true);
      console.log('Translations initialized:', i18n.getDataByLanguage('mr')?.poultry);
    }
  }, [i18n]);

  // Debug logs
  useEffect(() => {
    console.log('=== DEBUG TRANSLATIONS ===');
    console.log('Current language:', i18n.language);
    console.log('Available namespaces:', i18n.options.ns);
    
    const allTranslations = i18n.getDataByLanguage(i18n.language);
    console.log('All translations:', allTranslations);
    
    const poultryTranslations = allTranslations?.poultry;
    console.log('Poultry translations:', poultryTranslations);
    
    if (poultryTranslations) {
      console.log('Poultry translation keys:', Object.keys(poultryTranslations));
      if (poultryTranslations.dashboard) {
        console.log('Dashboard translation keys:', Object.keys(poultryTranslations.dashboard));
      }
    }
    
    console.log('Translation test - title:', t('poultry.dashboard.title'));
  }, [i18n.language, t]);

  return { t, i18n };
};
