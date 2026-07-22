"use client";

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck, Check, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface StatusPendingProps {
  onReset: () => void;
}

export const StatusPending: React.FC<StatusPendingProps> = ({ onReset }) => {
  const { t } = useLanguage();

  const badges = [
    { name: 'Mobile Verified', status: 'approved', meaning: 'Phone authenticated via OTP' },
    { name: 'Aadhaar Verified', status: 'pending', meaning: 'Government ID pending inspection' },
    { name: 'Police Verified', status: 'pending', meaning: 'PCC document check pending' },
    { name: 'Interview Verified', status: 'pending', meaning: 'Interview session pending scheduling' },
    { name: 'Video Introduction', status: 'pending', meaning: 'Intro clip pending review' },
    { name: 'Profile Approved', status: 'pending', meaning: 'Overall profile pending launch' }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8 max-w-md mx-auto w-full text-center">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 w-full space-y-6">
        
        {/* Verification Success Header Card */}
        <div className="bg-[#34A853]/5 border border-[#34A853]/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#34A853]/10 rounded-bl-full flex items-center justify-center text-[#34A853] pl-4 pb-4">
            <Check size={28} strokeWidth={3} />
          </div>
          
          <div className="text-left">
            <h2 className="text-lg font-bold text-[#202124]">{t('onboardingComplete')}</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {t('onboardingCompleteSub')}
            </p>
          </div>
        </div>

        {/* Dynamic Verification Badges Table */}
        <div className="space-y-3 text-left">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Verification Status</h3>
          <div className="space-y-2.5">
            {badges.map((badge) => {
              const isApproved = badge.status === 'approved';
              return (
                <div 
                  key={badge.name} 
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                    isApproved 
                      ? 'bg-[#34A853]/5 border-[#34A853]/10' 
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      isApproved ? 'bg-[#34A853]/10 text-[#34A853]' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isApproved ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-gray-700">{badge.name}</span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">{badge.meaning}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    isApproved 
                      ? 'bg-[#34A853] text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Temporary simulation back link */}
        <button
          onClick={onReset}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs active:scale-95 transition-all"
        >
          Go Back (Simulate New Login)
        </button>
      </div>
    </div>
  );
};
