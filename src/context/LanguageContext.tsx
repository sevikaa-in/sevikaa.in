"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  LanguageCode, 
  SUPPORTED_LANGUAGES, 
  translations, 
  LanguageInfo 
} from '../utils/translations';

import { translateText } from '../utils/translator';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string) => string;
  translateDynamic: (text: string) => Promise<string>;
  supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. Priority 1: Read ?ln= (or ?lang=) from URL query parameter
    let urlLang: LanguageCode | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryLang = params.get('ln') || params.get('lang');
      if (queryLang && Object.keys(translations).includes(queryLang)) {
        urlLang = queryLang as LanguageCode;
      }
    }

    if (urlLang) {
      setLanguageState(urlLang);
      localStorage.setItem('sevikaa_language', urlLang);
    } else {
      // 2. Priority 2: Load from localStorage on mount
      const savedLanguage = localStorage.getItem('sevikaa_language') as LanguageCode;
      if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
        setLanguageState(savedLanguage);
      } else {
        // 3. Priority 3: Default to browser language if supported
        const browserLang = navigator.language.split('-')[0] as LanguageCode;
        if (Object.keys(translations).includes(browserLang)) {
          setLanguageState(browserLang);
        }
      }
    }
    setIsInitialized(true);
  }, []);

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    localStorage.setItem('sevikaa_language', code);

    // Update URL ?ln= parameter smoothly without page refresh
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('ln', code);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const t = (key: string): string => {
    const langTranslations = translations[language] || translations['en'];
    return langTranslations[key] || translations['en'][key] || key;
  };

  // Prevent flash of untranslated content by delaying render until initialized
  if (!isInitialized) {
    return null;
  }

  const translateDynamic = async (text: string): Promise<string> => {
    return await translateText(text, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateDynamic, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
