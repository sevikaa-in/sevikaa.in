"use client";

import React, { useState } from 'react';
import { PhoneCall, Building, ArrowRight, Loader2, ShieldCheck, Sparkles, Home } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface EmployerOnboardingChoiceModalProps {
  userId: string;
  onChoiceSelected: (mode: 'assisted' | 'self', helplinePhone?: string) => void;
}

export const EmployerOnboardingChoiceModal: React.FC<EmployerOnboardingChoiceModalProps> = ({
  userId,
  onChoiceSelected
}) => {
  const { t } = useLanguage();
  const [loadingMode, setLoadingMode] = useState<'assisted' | 'self' | null>(null);
  const [error, setError] = useState('');

  const handleSelectMode = async (mode: 'assisted' | 'self') => {
    setLoadingMode(mode);
    setError('');

    try {
      const savedLang = (typeof window !== 'undefined' && localStorage.getItem('sevikaa_language')) || 'en';
      const res = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role: 'employer',
          onboarding_mode: mode,
          preferred_language: savedLang
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize employer profile');
      }

      onChoiceSelected(mode, data.helplinePhone);
    } catch (err: any) {
      setError(err.message || 'Error processing choice. Please try again.');
      setLoadingMode(null);
    }
  };

  return (
    <div className="relative min-h-[80vh] flex flex-col justify-center items-center px-4 py-8 max-w-2xl mx-auto w-full animate-fade-in">
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#34A853] border border-emerald-200/80 rounded-full text-xs font-black uppercase tracking-wider">
          <Home size={14} />
          <span>Household Setup Mode</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          How would you like to set up your Household Profile?
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
          Select your preferred onboarding method. You can enter details yourself or request a Relationship Manager to assist over phone.
        </p>
      </div>

      {error && (
        <div className="w-full mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 text-center">
          {error}
        </div>
      )}

      {/* CHOICE CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        
        {/* OPTION A: SELF-SERVICE */}
        <button
          type="button"
          disabled={loadingMode !== null}
          onClick={() => handleSelectMode('self')}
          className="group relative bg-white hover:bg-emerald-50/40 border-2 border-slate-200 hover:border-[#34A853] p-6 rounded-3xl text-left transition-all shadow-sm hover:shadow-xl flex flex-col justify-between space-y-4 cursor-pointer disabled:opacity-50"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-[#34A853] flex items-center justify-center font-black">
              <Building size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-[#34A853] tracking-widest block">Instant Setup</span>
              <h3 className="text-base font-black text-slate-900 group-hover:text-[#34A853] transition-colors">
                Self-Service Setup
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Enter your Gated Society, Tower &amp; Flat address myself and post domestic help job requirements directly.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs font-black text-[#34A853]">
            {loadingMode === 'self' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initializing...</span>
              </>
            ) : (
              <>
                <span>Proceed to Profile Form</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </div>
        </button>

        {/* OPTION B: TELEPHONIC ASSISTED */}
        <button
          type="button"
          disabled={loadingMode !== null}
          onClick={() => handleSelectMode('assisted')}
          className="group relative bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border-2 border-blue-200 hover:border-[#1A73E8] p-6 rounded-3xl text-left transition-all shadow-sm hover:shadow-xl flex flex-col justify-between space-y-4 cursor-pointer disabled:opacity-50"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
              <PhoneCall size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-[#1A73E8] tracking-widest block">Helpline Assistance</span>
              <h3 className="text-base font-black text-slate-900 group-hover:text-[#1A73E8] transition-colors">
                Request Assisted Call Setup
              </h3>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Have a Sevikaa Relationship Manager call you to take your society details, post job requirements, and complete setup over phone.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs font-black text-[#1A73E8]">
            {loadingMode === 'assisted' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Requesting Call...</span>
              </>
            ) : (
              <>
                <span>Request Free Assistance Call</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </div>
        </button>

      </div>
    </div>
  );
};
