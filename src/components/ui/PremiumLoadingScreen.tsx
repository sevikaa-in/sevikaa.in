'use client';

import React from 'react';
import { ShieldCheck, UserCheck, Briefcase, Building2, Loader2 } from 'lucide-react';

interface PremiumLoadingScreenProps {
  portalType?: 'worker' | 'employer' | 'admin' | 'super-admin' | 'general';
  title?: string;
  subtitle?: string;
  mismatchNotice?: {
    requestedRole: 'worker' | 'employer' | string;
    actualRole: 'worker' | 'employer' | string;
  } | null;
}

export const PremiumLoadingScreen: React.FC<PremiumLoadingScreenProps> = ({
  portalType = 'general',
  title,
  subtitle,
  mismatchNotice,
}) => {
  const isWorker = portalType === 'worker' || mismatchNotice?.actualRole === 'worker';
  const isEmployer = portalType === 'employer' || mismatchNotice?.actualRole === 'employer';

  const defaultTitle = title || (
    mismatchNotice
      ? `Redirecting to ${mismatchNotice.actualRole === 'worker' ? 'Worker' : 'Employer'} Dashboard`
      : isWorker
      ? 'Worker Portal'
      : isEmployer
      ? 'Employer Portal'
      : 'Sevikaa Portal'
  );

  const defaultSubtitle = subtitle || (
    mismatchNotice
      ? `We found an existing ${mismatchNotice.actualRole} account associated with this mobile number.`
      : isWorker
      ? 'Securing session & loading your job portal...'
      : isEmployer
      ? 'Securing session & loading your hiring portal...'
      : 'Authenticating & loading your workspace...'
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Light Theme Soft Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-gradient-to-tr from-blue-200/40 via-indigo-200/30 to-purple-200/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-br from-emerald-200/30 via-teal-200/20 to-blue-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Card (Light Theme) */}
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-2xl shadow-blue-900/5 rounded-3xl p-8 flex flex-col items-center text-center relative z-10">
        
        {/* Brand Logo Container */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-lg animate-pulse" />
          <div className="relative w-20 h-20 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center p-3 shadow-md shadow-slate-200/60">
            <img
              src="/logo.png"
              alt="Sevikaa Logo"
              className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>

        {/* Role Mismatch Notice Badge */}
        {mismatchNotice ? (
          <div className="mb-4 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 animate-bounce shadow-xs">
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Existing Account Found</span>
          </div>
        ) : (
          <div className="mb-4 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold tracking-wide uppercase flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Secure Authentication</span>
          </div>
        )}

        {/* Informative Header */}
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
          {defaultTitle}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs mb-6 font-medium">
          {defaultSubtitle}
        </p>

        {/* Role Mismatch Explanatory Banner (Light Theme) */}
        {mismatchNotice && (
          <div className="w-full mb-6 p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl text-left text-xs text-amber-900 leading-relaxed flex items-start gap-3 shadow-xs">
            <div className="p-1.5 bg-amber-100 border border-amber-200 rounded-xl shrink-0 mt-0.5 text-amber-700">
              {mismatchNotice.actualRole === 'worker' ? (
                <Briefcase className="w-4 h-4 text-amber-700" />
              ) : (
                <Building2 className="w-4 h-4 text-amber-700" />
              )}
            </div>
            <div>
              <p className="font-bold text-amber-900 mb-0.5">
                Role Redirect Notice
              </p>
              <p className="text-[11px] text-amber-800/90 leading-normal">
                You selected <strong className="text-slate-900 capitalize">{mismatchNotice.requestedRole}</strong>, but your mobile number is registered as a <strong className="text-amber-950 font-bold capitalize">{mismatchNotice.actualRole}</strong>. Redirecting you automatically...
              </p>
            </div>
          </div>
        )}

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-5 overflow-hidden border border-slate-200/50">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full animate-pulse transition-all duration-500 w-3/4" />
        </div>

        {/* Informative Loading Status Indicator */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <span>Verifying credentials & session...</span>
        </div>

        {/* Powered by Yugayatra Retail */}
        <div className="mt-8 pt-4 border-t border-slate-100 w-full">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
            POWERED BY YUGAYATRA RETAIL
          </p>
        </div>
      </div>
    </div>
  );
};
