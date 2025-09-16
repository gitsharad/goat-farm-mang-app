import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '../locales/en/common.json';
import enGoat from '../locales/en/goat.json';
import enPoultry from '../locales/en/poultry.json';
import enDairy from '../locales/en/dairy.json';
import mrCommon from '../locales/mr/common.json';
import mrGoat from '../locales/mr/goat.json';
import mrPoultry from '../locales/mr/poultry.json';
import mrDairy from '../locales/mr/dairy.json';

// Configure available languages
export const languages = [
  { code: 'en', name: 'English' },
  { code: 'mr', name: 'मराठी' }
];

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'goat', 'poultry', 'dairy'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
    resources: {
      en: {
        common: enCommon.common || {},
        goat: enGoat.goat || {},
        poultry: enPoultry?.poultry || {},
        dairy: enDairy?.dairy || {}
      },
      mr: {
        common: mrCommon.common || {},
        goat: mrGoat.goat || {},
        poultry: mrPoultry.poultry || {},
        dairy: mrDairy.dairy || {}
      }
    }
  });

export default i18n;
