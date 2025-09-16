import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * Checks if a translation key exists
 * @param {string} key - The translation key to check
 * @param {object} options - i18next options
 * @returns {boolean} - True if the key exists
 */
export const hasTranslation = (key, options = {}) => {
  return i18n.exists(key, options);
};

/**
 * Safely adds a translation if it doesn't exist
 * @param {string} lng - Language code (e.g., 'en', 'mr')
 * @param {string} ns - Namespace (e.g., 'health', 'common')
 * @param {object} resources - Translation resources to add
 */
export const safeAddTranslations = (lng, ns, resources) => {
  if (!i18n.hasResourceBundle(lng, ns)) {
    i18n.addResourceBundle(lng, ns, resources);
  } else {
    console.warn(`[i18n] Resource bundle '${ns}' for language '${lng}' already exists`);
  }
};

/**
 * Initialize i18n with namespaced resources
 * @param {object} resources - Object with language codes as keys and namespaces as values
 * @returns {Promise} - Promise that resolves when i18n is initialized
 */
export const initI18n = async (resources) => {
  return i18n
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: ['common', 'health'],
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: true,
      },
    });
};

/**
 * Validates a translations object for duplicate keys
 * @param {Object} translations - The translations object to validate
 * @returns {{hasDuplicates: boolean, duplicates: string[]}} - Object containing validation results
 */
export const validateTranslations = (translations) => {
  const keys = new Set();
  const duplicates = [];

  function checkObject(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (keys.has(currentPath)) {
        duplicates.push(currentPath);
      } else {
        keys.add(currentPath);
      }
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        checkObject(value, currentPath);
      }
    }
  }

  checkObject(translations);
  return {
    hasDuplicates: duplicates.length > 0,
    duplicates
  };
};
