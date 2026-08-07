import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import hi from '../locales/hi.json';
import bn from '../locales/bn.json';
import kn from '../locales/kn.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';
import mr from '../locales/mr.json';
import gu from '../locales/gu.json';
import pa from '../locales/pa.json';
import or from '../locales/or.json';
import ml from '../locales/ml.json';
import as from '../locales/as.json';

// Native Indian Script Languages & Flags
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'or', name: 'ଓଡ଼ିଆ', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'as', name: 'অসমীয়া', nativeName: 'অসমীয়া', flag: '🇮🇳' }
];

const translations: Record<string, Record<string, any>> = {
  en, hi, bn, kn, ta, te, mr, gu, pa, or, ml, as
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, defaultText?: string) => string;
  selectedLangObj: typeof SUPPORTED_LANGUAGES[0];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
  selectedLangObj: SUPPORTED_LANGUAGES[0]
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('sevikaa_app_lang').then(saved => {
      if (saved) setLanguageState(saved);
    });
  }, []);

  const setLanguage = (langCode: string) => {
    setLanguageState(langCode);
    AsyncStorage.setItem('sevikaa_app_lang', langCode);
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language] || translations['en'];
    const val = langDict[key];
    if (typeof val === 'string' && val.trim().length > 0) return val;
    const fallbackVal = translations['en']?.[key];
    if (typeof fallbackVal === 'string' && fallbackVal.trim().length > 0) return fallbackVal;
    return defaultText || key;
  };

  const selectedLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, selectedLangObj }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useMobileLanguage = () => useContext(LanguageContext);
