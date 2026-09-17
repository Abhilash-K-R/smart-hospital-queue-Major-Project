import React, { createContext, useContext, useState } from 'react';
import { KANNADA_TRANSLATIONS } from '../utils/constants';

// Shares the selected language and translation lookup function.
const LanguageContext = createContext();

// Provides English/Kannada language state to the whole patient app.
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('EN'); // 'EN' or 'KN'

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'EN' ? 'KN' : 'EN'));
  };

  const t = (key, fallback) => {
    if (language === 'KN' && KANNADA_TRANSLATIONS[key]) {
      return KANNADA_TRANSLATIONS[key];
    }
    return fallback;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Reads language state from the nearest language provider.
export const useLanguage = () => useContext(LanguageContext);
