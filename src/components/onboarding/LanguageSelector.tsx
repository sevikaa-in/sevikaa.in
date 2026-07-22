"use client";

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface LanguageSelectorProps {
  onNext: () => void;
}

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

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onNext }) => {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(language);

  const handleSelect = (code: typeof language) => {
    setSelectedLang(code);
  };

  const handleContinue = () => {
    setLanguage(selectedLang);
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-6 max-w-md mx-auto w-full text-center">
      {/* Brand Logo Header */}
      <div className="mb-4 flex flex-col items-center">
        <img src="/logo.png" alt="Sevikaa Logo" className="h-28 w-auto object-contain" />
        <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">
          POWERED BY YUGAYATRA RETAIL
        </p>
        <p className="text-xs text-gray-500 font-bold mt-1">
          Helping India hire trusted Maids, Cooks & Nannies.
        </p>
      </div>

      {/* Main Language Card Wrapper */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-sm p-6 w-full mt-2 transition-all duration-300">
        <h2 className="text-xl font-black text-[#202124] mb-1">Choose Your Preferred Language</h2>
        <p className="text-xs text-gray-500 font-bold mb-6">
          Select the language you're most comfortable with.<br />
          You can change it anytime later from Settings.
        </p>

        {/* Language Grid */}
        <div className="grid grid-cols-2 gap-3">
          {supportedLanguages.map((lang) => {
            const isSelected = selectedLang === lang.code;
            const flag = FLAG_MAP[lang.code] || '🌐';
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`py-3.5 px-3 rounded-2xl text-center border-2 transition-all duration-300 relative flex flex-col items-center justify-center min-h-[85px] cursor-pointer ${
                  isSelected
                    ? 'border-[#1A73E8] bg-[#1A73E8]/5 shadow-md shadow-blue-100/50 text-[#1A73E8] scale-[1.02] -translate-y-0.5'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:shadow-gray-100/55 hover:-translate-y-0.5 text-gray-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 p-0.5 bg-[#1A73E8] text-white rounded-full">
                    <Check size={8} strokeWidth={4} />
                  </div>
                )}
                <span className="text-base font-black leading-tight flex items-center gap-1.5">
                  <span className="text-lg leading-none shrink-0">{flag}</span>
                  {lang.nativeName}
                </span>
                <span className="text-[10px] text-gray-400 mt-1 font-bold">
                  {lang.code === 'hn' ? 'Hindi + English' : lang.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Continue Action Button */}
        <button
          type="button"
          onClick={handleContinue}
          className="w-full mt-6 py-3.5 bg-[#1A73E8] hover:bg-[#1A73E8]/90 text-white font-extrabold text-sm rounded-2xl transition-all duration-200 shadow-md shadow-blue-100/50 hover:shadow-lg hover:shadow-blue-200/50 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          Continue →
        </button>
      </div>

      {/* Public & Compliance Footer */}
      <footer className="mt-8 space-y-4 w-full text-xs text-gray-400">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 font-bold">
          <Link href="/about" className="hover:text-[#1A73E8] transition-colors">About</Link>
          <Link href="/how-it-works" className="hover:text-[#1A73E8] transition-colors">How It Works</Link>
          <Link href="/pricing" className="hover:text-[#1A73E8] transition-colors">Pricing</Link>
          <Link href="/safety" className="hover:text-[#1A73E8] transition-colors">Safety</Link>
          <Link href="/contact" className="hover:text-[#1A73E8] transition-colors">Contact Us</Link>
          <Link href="/faq" className="hover:text-[#1A73E8] transition-colors">FAQ</Link>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] font-semibold text-gray-400/80">
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <Link href="/refunds" className="hover:text-gray-600 transition-colors">Refund Policy</Link>
          <Link href="/shipping" className="hover:text-gray-600 transition-colors">Shipping Policy</Link>
        </div>
        <p className="text-[10px] mt-2 font-medium">
          Powered by YugaYatra Retail (OPC) Private Limited<br />
          © 2026 All Rights Reserved
        </p>
      </footer>
    </div>
  );
};
