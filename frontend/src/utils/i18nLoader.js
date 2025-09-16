import i18n from 'i18next';

// List of all translation namespaces
const namespaces = ['common', 'health', 'dairy'];

// Cache to store loaded translations
const loadedNamespaces = new Set();

/**
 * Load translations for a specific language and namespace
 */
export const loadTranslations = async (language, namespace) => {
  const cacheKey = `${language}-${namespace}`;
  
  // Skip if already loaded
  if (loadedNamespaces.has(cacheKey)) {
    console.log(`[i18n] Translations already loaded for ${cacheKey}`);
    return;
  }

  try {
    console.log(`[i18n] Loading translations for ${cacheKey}`);
    // Dynamic import of the translation file
    const module = await import(
      /* webpackChunkName: "locales-[request]" */
      `../locales/${language}/${namespace}.json`
    );
    
    console.log(`[i18n] Loaded ${namespace} for ${language}:`, module.default);
    
    if (!module || !module.default) {
      throw new Error(`No translations found for ${cacheKey}`);
    }
    
    // Add to i18n
    i18n.addResourceBundle(language, namespace, module.default, true, true);
    loadedNamespaces.add(cacheKey);
    console.log(`[i18n] Successfully loaded ${cacheKey}`);
    
    console.log(`[i18n] Loaded ${namespace} for ${language}`);
  } catch (error) {
    console.error(`[i18n] Failed to load ${namespace} for ${language}:`, error);
    throw error;
  }
};

/**
 * Load all namespaces for a language
 */
export const loadLanguage = async (language) => {
  try {
    // Load all namespaces in parallel
    await Promise.all(
      namespaces.map(ns => loadTranslations(language, ns))
    );
    
    // Change the language
    await i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
    
    return true;
  } catch (error) {
    console.error(`[i18n] Failed to load language ${language}:`, error);
    return false;
  }
};

/**
 * Preload translations for better UX
 */
export const preloadTranslations = (language) => {
  // Start loading in the background but don't wait
  namespaces.forEach(ns => {
    loadTranslations(language, ns).catch(console.error);
  });
};
