"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../utils/translator';

/**
 * React hook to automatically translate dynamic user-generated text
 * into the current active language (e.g., 'bn', 'hi', 'ta', 'te', 'kn').
 *
 * @param originalText The original text string (e.g. custom employer job description)
 * @returns { translatedText, isTranslating }
 */
export function useAutoTranslate(originalText: string) {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!originalText || language === 'en') {
      setTranslatedText(originalText);
      setIsTranslating(false);
      return;
    }

    setIsTranslating(true);
    translateText(originalText, language)
      .then((res) => {
        if (isMounted) {
          setTranslatedText(res);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTranslatedText(originalText);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsTranslating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [originalText, language]);

  return { translatedText, isTranslating };
}
