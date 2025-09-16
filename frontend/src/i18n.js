import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enGoat from './locales/en/goat.json';
import enPoultry from './locales/en/poultry.json';
import enDairy from './locales/en/dairy.json';
import enCommon from './locales/en/common.json';
import mrGoat from './locales/mr/goat.json';
import mrPoultry from './locales/mr/poultry.json';
import mrDairy from './locales/mr/dairy.json';
import mrCommon from './locales/mr/common.json';

// Configure available languages
export const languages = [
  { code: 'en', name: 'English' },
  { code: 'mr', name: 'मराठी' }
];

// Common translations that can be used across modules
const commonTranslations = {
  en: {
    common: enCommon.common || {
      actions: {
        add: 'Add',
        edit: 'Edit',
        delete: 'Delete',
        view: 'View',
        save: 'Save',
        cancel: 'Cancel',
        back: 'Back',
        close: 'Close'
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
        sold: 'Sold',
        deceased: 'Deceased'
      },
      messages: {
        loading: 'Loading...',
        saving: 'Saving...',
        saved: 'Saved successfully',
        error: 'An error occurred',
        noData: 'No data available',
        confirmDelete: 'Are you sure you want to delete this item?',
        yes: 'Yes',
        no: 'No'
      },
      validation: {
        required: 'This field is required',
        invalid: 'Invalid value',
        minLength: 'Must be at least {{count}} characters',
        maxLength: 'Must be at most {{count}} characters'
      }
    }
  },
  mr: {
    common: mrCommon.common || {
      actions: {
        add: 'जोडा',
        edit: 'सुधारा',
        delete: 'हटवा',
        view: 'पहा',
        save: 'जतन करा',
        cancel: 'रद्द करा',
        back: 'मागे',
        close: 'बंद करा'
      },
      status: {
        active: 'सक्रिय',
        inactive: 'निष्क्रिय',
        sold: 'विक्री केली',
        deceased: 'मृत'
      },
      messages: {
        loading: 'लोड होत आहे...',
        saving: 'जतन करत आहे...',
        saved: 'यशस्वीरित्या जतन केले',
        error: 'एक त्रुटी आली',
        noData: 'डेटा उपलब्ध नाही',
        confirmDelete: 'तुम्हाला ही नोंद खरोखर हटवायची आहे का?',
        yes: 'होय',
        no: 'नाही'
      },
      validation: {
        required: 'हे फील्ड आवश्यक आहे',
        invalid: 'अवैध मूल्य',
        minLength: 'किमान {{count} अक्षरे असणे आवश्यक आहे',
        maxLength: 'जास्तीत जास्त {{count} अक्षरे असू शकतात'
      }
    }
  }
};

// Debug logs before initialization
console.log('=== I18N INITIALIZATION ===');
console.log('Environment:', process.env.NODE_ENV);

// Combine all translations
const resources = {
  en: {
    ...commonTranslations.en,
    goat: enGoat.goat || {},
    poultry: enPoultry.poultry || {},
    dairy: enDairy.dairy || {}
  },
  mr: {
    ...commonTranslations.mr,
    goat: mrGoat.goat || {},
    poultry: mrPoultry.poultry || {},
    dairy: mrDairy.dairy || {}
  }
};

// Debug log the resources structure
console.log('Resources structure:', {
  en: {
    common: Object.keys(resources.en.common || {}).length > 0 ? 'Loaded' : 'Empty',
    goat: Object.keys(resources.en.goat || {}).length > 0 ? 'Loaded' : 'Empty',
    poultry: Object.keys(resources.en.poultry || {}).length > 0 ? 'Loaded' : 'Empty',
    dairy: Object.keys(resources.en.dairy || {}).length > 0 ? 'Loaded' : 'Empty'
  },
  mr: {
    common: Object.keys(resources.mr.common || {}).length > 0 ? 'Loaded' : 'Empty',
    goat: Object.keys(resources.mr.goat || {}).length > 0 ? 'Loaded' : 'Empty',
    poultry: Object.keys(resources.mr.poultry || {}).length > 0 ? 'Loaded' : 'Empty',
    dairy: Object.keys(resources.mr.dairy || {}).length > 0 ? 'Loaded' : 'Empty'
  }
});

// Configure language detection
const languageDetector = new LanguageDetector(null, {
  order: ['localStorage', 'navigator'],
  lookupLocalStorage: 'i18nextLng',
  caches: ['localStorage'],
  checkForSimilarInLng: false,
  checkForSimilarInLngs: false,
  checkForSimilarInDefaultLanguage: false,
  checkForSimilarInAllLangs: false
});

// Initialize i18next
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    returnObjects: true,
    resources,
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'goat', 'poultry', 'dairy'],
    keySeparator: '.',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      nsMode: 'default',
      wait: true
    },
    initImmediate: false,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true
    },
    load: 'currentOnly',
    cleanCode: true,
    nonExplicitSupportedLngs: true,
    supportedLngs: ['en', 'mr'],
    resources: {
      en: {
        common: commonTranslations.en.common || {},
        ...enGoat,
        ...enPoultry,
        ...enDairy
      },
      mr: {
        common: commonTranslations.mr.common || {},
        ...mrGoat,
        ...mrPoultry,
        ...mrDairy
      }
    }
  });

// Log i18n initialization
i18n.on('initialized', (options) => {
  console.log('i18n initialized with language:', i18n.language);
  console.log('Available languages:', i18n.languages);
  console.log('Current language:', i18n.language);
  console.log('Available namespaces:', i18n.options.ns);
  console.log('Resources:', i18n.options.resources);
});

i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  console.log('Current language:', i18n.language);
  console.log('Available translations for current language:', i18n.getDataByLanguage(lng));
});

// Log when resources are loaded
i18n.on('loaded', (loaded) => {
  console.log('i18n resources loaded:', loaded);
});

// Log any loading errors
i18n.on('failedLoading', (lng, ns, msg) => {
  console.error(`Failed to load language ${lng} namespace ${ns}:`, msg);
});

i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
});

export default i18n;
