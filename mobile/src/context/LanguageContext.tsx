import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import hi from '../locales/hi.json';
import hn from '../locales/hn.json';
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
import ne from '../locales/ne.json';

// Native Indian Script Languages & Flags with Icons
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', icon: require('../../assets/icons/languages/en.png') },
  { code: 'hi', name: 'हिंदी', nativeName: 'हिंदी', flag: '🇮🇳', icon: require('../../assets/icons/languages/hi.png') },
  { code: 'hn', name: 'Hinglish', nativeName: 'Hinglish', flag: '🇮🇳', icon: require('../../assets/icons/languages/hn.png') },
  { code: 'bn', name: 'বাংলা', nativeName: 'বাংলা', flag: '🇮🇳', icon: require('../../assets/icons/languages/bn.jpg') },
  { code: 'kn', name: 'ಕನ್ನಡ', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', icon: require('../../assets/icons/languages/kn.png') },
  { code: 'ta', name: 'தமிழ்', nativeName: 'தமிழ்', flag: '🇮🇳', icon: require('../../assets/icons/languages/ta.png') },
  { code: 'te', name: 'తెలుగు', nativeName: 'తెలుగు', flag: '🇮🇳', icon: require('../../assets/icons/languages/te.png') },
  { code: 'mr', name: 'मराठी', nativeName: 'मराठी', flag: '🇮🇳', icon: require('../../assets/icons/languages/mr.png') },
  { code: 'gu', name: 'ગુજરાતી', nativeName: 'ગુજરાતી', flag: '🇮🇳', icon: require('../../assets/icons/languages/gu.png') },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', icon: require('../../assets/icons/languages/pa.png') },
  { code: 'or', name: 'ଓଡ଼ିଆ', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳', icon: require('../../assets/icons/languages/or.png') },
  { code: 'ml', name: 'മലയാളം', nativeName: 'മലയാളം', flag: '🇮🇳', icon: require('../../assets/icons/languages/ml.png') },
  { code: 'as', name: 'অসমীয়া', nativeName: 'অসমীয়া', flag: '🇮🇳', icon: require('../../assets/icons/languages/as.png') },
  { code: 'ne', name: 'नेपाली', nativeName: 'नेपाली', flag: '🇳🇵', icon: require('../../assets/icons/languages/ne.png') }
];

const translations: Record<string, Record<string, any>> = {
  en, hi, hn, bn, kn, ta, te, mr, gu, pa, or, ml, as, ne
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
