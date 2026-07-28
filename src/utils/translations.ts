import en from '../locales/en.json';
import hi from '../locales/hi.json';
import hn from '../locales/hn.json';
import kn from '../locales/kn.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';
import as from '../locales/as.json';
import ne from '../locales/ne.json';
import bn from '../locales/bn.json';
import mr from '../locales/mr.json';
import ml from '../locales/ml.json';
import or from '../locales/or.json';
import gu from '../locales/gu.json';
import pa from '../locales/pa.json';

export type LanguageCode = 'en' | 'hi' | 'hn' | 'kn' | 'ta' | 'te' | 'as' | 'ne' | 'bn' | 'mr' | 'ml' | 'or' | 'gu' | 'pa';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'hn', name: 'Hinglish', nativeName: 'Hinglish' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
];

export const translations: Record<LanguageCode, Record<string, string>> = {
  en,
  hi,
  hn,
  kn,
  ta,
  te,
  as,
  ne,
  bn,
  mr,
  ml,
  or,
  gu,
  pa
};
