"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Check, Globe, ChevronDown } from 'lucide-react';

const FLAG_MAP: Record<string, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  hn: '🇮🇳',
  kn: '🇮🇳',
  ta: '🇮🇳',
  te: '🇮🇳',
  as: '🇮🇳',
  ne: '🇳🇵'
};

export const GlobalLanguageSelector: React.FC = () => {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLang = supportedLanguages.find(l => l.code === language) || supportedLanguages[0];
  const activeFlag = FLAG_MAP[activeLang.code] || '🌐';

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100/80 active:scale-95 border border-gray-200 text-xs font-bold text-gray-700 rounded-xl transition-all duration-200 select-none cursor-pointer"
      >
        <span className="text-sm shrink-0">{activeFlag}</span>
        <span className="truncate max-w-[65px] sm:max-w-none">{activeLang.nativeName}</span>
        <ChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-2xl shadow-xl z-[999] py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1 border-b border-gray-100 mb-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Select Language</span>
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {supportedLanguages.map((lang) => {
              const isSelected = language === lang.code;
              const flag = FLAG_MAP[lang.code] || '🌐';
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A73E8]/5 text-[#1A73E8]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{flag}</span>
                    <span>{lang.nativeName}</span>
                  </span>
                  {isSelected && <Check size={12} className="text-[#1A73E8] shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
