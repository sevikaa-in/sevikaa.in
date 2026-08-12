"use client";

import React, { useState } from 'react';
import { PhoneCall, Edit3, ArrowRight, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface WorkerOnboardingChoiceModalProps {
  userId: string;
  onChoiceSelected: (mode: 'assisted' | 'self', helplinePhone?: string, scheduledSlot?: string) => void;
}

export const WorkerOnboardingChoiceModal: React.FC<WorkerOnboardingChoiceModalProps> = ({
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
      const savedLang = (typeof window !== 'undefined' && localStorage.getItem('sevikaa_language')) || 'hi';
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/auth/set-role', {
        userId,
        role: 'worker',
        onboarding_mode: mode,
        preferred_language: savedLang
      });

      if (data.error) {
        throw new Error(data.error || 'Failed to initialize worker profile');
      }

      onChoiceSelected(mode, data.helplinePhone, data.scheduledSlot);
    } catch (err: any) {
      setError(err.message || 'Error processing choice. Please try again.');
      setLoadingMode(null);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 max-w-2xl mx-auto w-full animate-fade-in">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-10 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 via-blue-400/20 to-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 w-full text-center space-y-6">
        
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-black shadow-xs">
          <Sparkles className="w-4 h-4 text-[#34A853] animate-pulse" />
          <span>{t('workerRegistrationMode') || 'Worker Registration Mode'}</span>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('chooseOnboardingTitle') || "How would you like to register?"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 max-w-lg mx-auto leading-relaxed">
            {t('chooseOnboardingDesc') || "Choose the method that works best for you. Our team is ready to guide you or you can fill your profile yourself."}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 font-bold">
            {error}
          </div>
        )}

        {/* 2 Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
          
          {/* Option 1: Assisted Setup (Recommended) */}
          <button
            type="button"
            disabled={loadingMode !== null}
            onClick={() => handleSelectMode('assisted')}
            className="group relative p-6 rounded-3xl border-2 border-emerald-500/80 bg-gradient-to-b from-emerald-50/60 to-white hover:border-[#34A853] transition-all duration-200 shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-[#34A853] text-white text-[9.5px] font-black uppercase tracking-wider shadow-xs">
              {t('recommendedBadge') || 'Recommended ⭐'}
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <PhoneCall className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg group-hover:text-emerald-700 transition-colors">
                  {t('assistedCallModeTitle') || "📞 Call & Verify Setup"}
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">
                  {t('assistedCallModeDesc') || "Sit back! A Sevikaa agent will call your phone to set up your profile, record your details, and activate your account."}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center text-xs font-black text-[#34A853] gap-1.5 group-hover:translate-x-1 transition-transform border-t border-emerald-100 pt-3">
              <span>{t('assistedCallButton') || 'Request Phone Call Setup'}</span>
              {loadingMode === 'assisted' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </div>
          </button>

          {/* Option 2: Self Setup */}
          <button
            type="button"
            disabled={loadingMode !== null}
            onClick={() => handleSelectMode('self')}
            className="group relative p-6 rounded-3xl border-2 border-slate-200 hover:border-[#1A73E8] bg-white hover:bg-blue-50/40 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3.5 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#1A73E8] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Edit3 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg group-hover:text-[#1A73E8] transition-colors">
                  {t('selfSetupModeTitle') || "📝 Self Profile Setup"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                  {t('selfSetupModeDesc') || "Fill your category, salary, experience, selfie, and Aadhaar photos directly on screen right now."}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center text-xs font-black text-[#1A73E8] gap-1.5 group-hover:translate-x-1 transition-transform border-t border-slate-100 pt-3">
              <span>{t('fillProfileMyselfButton') || 'Fill My Profile Myself'}</span>
              {loadingMode === 'self' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </div>
          </button>

        </div>

        <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-bold">
          <ShieldCheck size={14} className="text-[#34A853]" />
          <span>Sevikaa Official Worker Verification Guarantee</span>
        </div>
      </div>
    </div>
  );
};
