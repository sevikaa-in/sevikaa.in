'use client';

import React from 'react';
import { ShieldCheck, UserCheck, Briefcase, Building2, Loader2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Dynamic Ambient Glowing Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-blue-600/25 via-indigo-600/20 to-purple-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Premium Card */}
      <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur-2xl border border-slate-800/90 shadow-2xl rounded-3xl p-8 flex flex-col items-center text-center relative z-10">
        
        {/* Brand Logo & Pulse Halo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl animate-pulse" />
          <div className="relative w-20 h-20 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center justify-center p-3 shadow-xl">
            <img
              src="/logo.png"
              alt="Sevikaa Logo"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Role Mismatch Notice Badge */}
        {mismatchNotice && (
          <div className="mb-4 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-bounce">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Existing Account Found</span>
          </div>
        )}

        {!mismatchNotice && (
          <div className="mb-4 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[11px] font-semibold tracking-wide uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Secure Authentication</span>
          </div>
        )}

        {/* Informative Header */}
        <h2 className="text-xl font-bold text-white tracking-tight mb-2">
          {defaultTitle}
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-6 font-medium">
          {defaultSubtitle}
        </p>

        {/* Role Mismatch Explanatory Banner */}
        {mismatchNotice && (
          <div className="w-full mb-6 p-3.5 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-left text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
            <div className="p-1 bg-amber-500/20 rounded-lg shrink-0 mt-0.5">
              {mismatchNotice.actualRole === 'worker' ? (
                <Briefcase className="w-4 h-4 text-amber-400" />
              ) : (
                <Building2 className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div>
              <p className="font-bold text-amber-300 mb-0.5">
                Role Redirect Notice
              </p>
              <p className="text-[11px] text-amber-200/80">
                You clicked <strong className="text-white capitalize">{mismatchNotice.requestedRole}</strong>, but your number is registered as a <strong className="text-amber-300 capitalize">{mismatchNotice.actualRole}</strong>. Redirecting you automatically...
              </p>
            </div>
          </div>
        )}

        {/* Animated Progress bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 mb-5 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full animate-pulse transition-all duration-500 w-3/4" />
        </div>

        {/* Informative Loading Status indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <span>Verifying credentials & session...</span>
        </div>

        {/* Powered by Yugayatra Retail */}
        <div className="mt-8 pt-4 border-t border-slate-800/60 w-full">
          <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">
            POWERED BY YUGAYATRA RETAIL
          </p>
        </div>
      </div>
    </div>
  );
};
