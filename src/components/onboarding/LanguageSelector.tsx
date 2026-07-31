"use client";

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Check, Globe, Sparkles, ArrowRight, Languages, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LanguageSelectorProps {
  onNext: () => void;
  onBack?: () => void;
}

const renderLanguageImage = (code: string, name: string) => {
  const extension = code === 'bn' ? 'jpg' : 'png';
  const sizeClass = code === 'bn' 
    ? 'w-12 h-9 object-contain mix-blend-multiply' 
    : 'w-10 h-10 object-contain';
  return (
    <img 
      src={`/icons/languages/${code}.${extension}`} 
      className={`${sizeClass} mb-1.5 group-hover:scale-110 transition-transform duration-300 select-none pointer-events-none drop-shadow-sm`} 
      alt={name}
      onError={(e) => {
        // Hide image if missing fallback gracefully
        (e.target as HTMLElement).style.display = 'none';
      }}
    />
  );
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onNext, onBack }) => {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(language);

  const handleSelect = (code: typeof language) => {
    setSelectedLang(code);
  };

  const handleContinue = () => {
    setLanguage(selectedLang);
    onNext();
  };

  const selectedLanguageObj = supportedLanguages.find(l => l.code === selectedLang) || supportedLanguages[0];

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-between items-center px-4 py-8 max-w-xl mx-auto w-full">
      
      {/* Background Ambient Blur Blobs */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 -z-10 w-[28rem] h-[28rem] bg-gradient-to-tr from-blue-400/20 via-indigo-400/20 to-purple-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 -z-10 w-72 h-72 bg-gradient-to-br from-emerald-300/15 via-teal-300/15 to-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Branding */}
      <div className="w-full text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100/80 text-blue-700 text-xs font-bold mb-3 shadow-sm">
          <Globe className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Language Preference</span>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <img src="/logo.png" alt="Sevikaa Logo" className="h-16 w-auto object-contain drop-shadow-md transition-transform duration-300 hover:scale-105" />
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-2">POWERED BY YUGAYATRA RETAIL</p>
        </div>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="w-full bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl shadow-blue-900/5 p-6 sm:p-7 relative transition-all duration-300">
        
        {/* Back Button (if provided) */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute left-5 top-5 text-slate-400 hover:text-slate-700 transition-colors p-2 hover:bg-slate-100 rounded-full cursor-pointer group"
            title="Go back"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Card Header Icon & Titles */}
        <div className="text-center pt-2 mb-6">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/25 transition-transform duration-300 hover:scale-105">
            <Languages size={28} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Choose Your Preferred Language
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1.5 max-w-sm mx-auto leading-relaxed">
            Select the language you are most comfortable with. You can change this anytime later from Settings.
          </p>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto p-3 pb-6 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
          {supportedLanguages.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`py-4 px-3 rounded-2xl text-center border-2 transition-all duration-200 relative flex flex-col items-center justify-center min-h-[106px] cursor-pointer group ${
                  isSelected
                    ? 'border-blue-600 bg-gradient-to-b from-blue-50/80 to-indigo-50/50 shadow-md shadow-blue-500/10 text-blue-700 scale-[1.02]'
                    : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-0.5 text-slate-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 p-1 bg-blue-600 text-white rounded-full shadow-sm">
                    <Check size={10} strokeWidth={3.5} />
                  </div>
                )}
                
                {renderLanguageImage(lang.code, lang.name)}
                
                <span className="text-xs font-extrabold leading-tight tracking-tight mt-0.5">
                  {lang.nativeName}
                </span>
                
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {lang.code === 'hn' ? 'Hindi + English' : lang.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Banner & Continue Action Button */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">Selected Language:</span>
            <span className="font-extrabold text-blue-600 flex items-center gap-1.5">
              <span>{selectedLanguageObj.nativeName}</span>
              <span className="text-[10px] text-slate-400 font-normal">({selectedLanguageObj.name})</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <span>Continue in {selectedLanguageObj.nativeName}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Public & Compliance Footer */}
      <footer className="mt-8 space-y-3 w-full text-xs text-slate-400 text-center">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 font-bold">
          <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
          <Link href="/how-it-works" className="hover:text-blue-600 transition-colors">How It Works</Link>
          <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
          <Link href="/safety" className="hover:text-blue-600 transition-colors">Safety</Link>
          <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Us</Link>
          <Link href="/faq" className="hover:text-blue-600 transition-colors">FAQ</Link>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-400/80">
          <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
          <Link href="/refunds" className="hover:text-slate-600 transition-colors">Refund Policy</Link>
          <Link href="/shipping" className="hover:text-slate-600 transition-colors">Shipping Policy</Link>
        </div>
        <p className="text-[10px] mt-2 font-medium text-slate-400">
          Powered by YugaYatra Retail (OPC) Private Limited<br />
          © {new Date().getFullYear()} All Rights Reserved
        </p>
      </footer>
    </div>
  );
};
