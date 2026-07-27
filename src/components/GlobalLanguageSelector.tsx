"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Check, Globe, ChevronDown, Languages } from 'lucide-react';

const LANGUAGE_ICONS: Record<string, string> = {
  en: '/icons/languages/en.png',
  hi: '/icons/languages/hi.png',
  hn: '/icons/languages/hn.png',
  kn: '/icons/languages/kn.png',
  ta: '/icons/languages/ta.png',
  te: '/icons/languages/te.png',
  as: '/icons/languages/as.png',
  ne: '/icons/languages/ne.png',
  bn: '/icons/languages/bn.jpg',
  mr: '/icons/languages/mr.png',
  ml: '/icons/languages/ml.png',
  or: '/icons/languages/or.png',
  gu: '/icons/languages/gu.png',
  pa: '/icons/languages/pa.png',
};

const renderLangIcon = (code: string) => {
  const iconPath = LANGUAGE_ICONS[code];
  if (iconPath) {
    return (
      <img 
        src={iconPath} 
        alt={code} 
        className="w-6 h-6 object-contain rounded-md shrink-0 bg-slate-50 p-0.5 border border-slate-100" 
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }
  return <Globe size={16} className="text-[#1A73E8] shrink-0" />;
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

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all duration-200 select-none cursor-pointer"
      >
        {renderLangIcon(activeLang.code)}
        <span className="truncate max-w-[80px] font-black">{activeLang.nativeName}</span>
        <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[999] py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center gap-1.5">
            <Languages size={14} className="text-[#1A73E8]" />
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">App Language</span>
          </div>
          <div className="max-h-[260px] overflow-y-auto space-y-0.5 px-1">
            {supportedLanguages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 text-left text-xs font-bold transition-all rounded-xl flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A73E8]/10 text-[#1A73E8]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {renderLangIcon(lang.code)}
                    <span className="font-black text-xs">{lang.nativeName}</span>
                  </span>
                  {isSelected && <Check size={14} className="text-[#1A73E8] shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
