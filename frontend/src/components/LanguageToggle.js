import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../translations';

const LanguageToggle = () => {
  const { language, toggleLanguage, isEnglish, isMarathi } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
      title={isEnglish ? 'मराठीत बदला' : 'Switch to English'}
    >
      <span className="w-4 h-4 text-xs font-bold">
        {isEnglish ? 'म' : 'EN'}
      </span>
      <span className="hidden sm:inline">
        {isEnglish ? 'मराठी' : 'English'}
      </span>
    </button>
  );
};

export default LanguageToggle; 