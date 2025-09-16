import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 text-sm rounded-md ${
          i18n.language === 'en' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('mr')}
        className={`px-3 py-1 text-sm rounded-md ${
          i18n.language === 'mr'
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }`}
        aria-label="Switch to Marathi"
      >
        मराठी
      </button>
    </div>
  );
};

export default LanguageSwitcher;
