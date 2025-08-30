import { en } from './en';
import { mr } from './mr';

export const translations = {
  en,
  mr
};

export const getTranslation = (language, key) => {
  const lang = translations[language] || translations.en;
  return lang[key] || key;
};

export { en, mr }; 