"use client";

import React, { useState } from 'react';
import { Building2, UserCheck, ArrowRight, Loader2, Sparkles, PhoneCall, CheckCircle2, ShieldCheck } from 'lucide-react';
import { WorkerOnboardingChoiceModal } from './WorkerOnboardingChoiceModal';

interface NewUserRoleSelectorProps {
  userId: string;
  initialRole?: 'worker' | 'employer' | null;
  onRoleSelected: (selectedRole: 'worker' | 'employer') => void;
}

export const NewUserRoleSelector: React.FC<NewUserRoleSelectorProps> = ({ userId, initialRole, onRoleSelected }) => {
  const [loadingRole, setLoadingRole] = useState<'worker' | 'employer' | null>(null);
  const [showWorkerChoice, setShowWorkerChoice] = useState(initialRole === 'worker');
  const [assistedInfo, setAssistedInfo] = useState<{ phone: string; slot: string } | null>(null);
  const [error, setError] = useState('');

  const handleSelectRole = async (role: 'worker' | 'employer') => {
    if (role === 'worker') {
      setShowWorkerChoice(true);
      return;
    }

    setLoadingRole(role);
    setError('');

    try {
      const savedLang = (typeof window !== 'undefined' && localStorage.getItem('sevikaa_language')) || 'hi';
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/auth/set-role', { userId, role, preferred_language: savedLang });

      if (data.error) {
        throw new Error(data.error || 'Failed to set account role');
      }

      onRoleSelected(role);
    } catch (err: any) {
      setError(err.message || 'Error assigning role. Please try again.');
      setLoadingRole(null);
    }
  };

  const handleWorkerChoiceSelected = (mode: 'assisted' | 'self', helplinePhone?: string, scheduledSlot?: string) => {
    if (mode === 'assisted') {
      setAssistedInfo({
        phone: helplinePhone || '+91 7096093039',
        slot: scheduledSlot || 'the scheduled daytime slot'
      });
    } else {
      onRoleSelected('worker');
    }
  };

  if (assistedInfo) {
    return (
      <div className="relative min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 max-w-lg mx-auto w-full animate-scale-up">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-200/80 w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#34A853] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Telephonic Onboarding Booked!</h3>
            <p className="text-xs text-slate-600 font-bold mt-2 leading-relaxed">
              Namaste! Your verification call is scheduled for <strong className="text-slate-900">{assistedInfo.slot}</strong>. A Sevikaa verification agent will call your phone.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-left">
            <span className="block text-[10px] font-black uppercase text-slate-500">Need Immediate Help?</span>
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="flex items-center gap-1.5"><PhoneCall size={14} className="text-[#34A853]" /> Official Sevikaa Helpline:</span>
              <a href={`tel:${assistedInfo.phone}`} className="text-[#1A73E8] underline font-extrabold">{assistedInfo.phone}</a>
            </div>
          </div>

          <button
            onClick={() => onRoleSelected('worker')}
            className="w-full py-3.5 bg-[#34A853] hover:bg-[#2b8a43] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Proceed to Worker Dashboard</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (showWorkerChoice) {
    return <WorkerOnboardingChoiceModal userId={userId} onChoiceSelected={handleWorkerChoiceSelected} />;
  }

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 max-w-xl mx-auto w-full">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-10 w-96 h-96 bg-gradient-to-tr from-blue-400/20 via-indigo-400/20 to-purple-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 w-full text-center space-y-6">
        
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>Welcome to Sevikaa Platform</span>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How would you like to use Sevikaa?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 max-w-md mx-auto leading-relaxed">
            Select your account type to customize your experience. You can manage your profile anytime.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-semibold">
            {error}
          </div>
        )}

        {/* Role Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
          
          {/* Card 1: Employer */}
          <button
            type="button"
            disabled={loadingRole !== null}
            onClick={() => handleSelectRole('employer')}
            className="group relative p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-600 bg-white hover:bg-blue-50/40 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                  Hire Help (Employer)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Hire verified maids, cooks, nannies, or drivers for your home in gated societies.
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex items-center text-xs font-extrabold text-blue-600 gap-1 group-hover:translate-x-1 transition-transform">
              <span>Continue as Employer</span>
              {loadingRole === 'employer' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </div>
          </button>

          {/* Card 2: Worker */}
          <button
            type="button"
            disabled={loadingRole !== null}
            onClick={() => handleSelectRole('worker')}
            className="group relative p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 bg-white hover:bg-emerald-50/40 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                  Find Work (Worker Partner)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Apply for daily domestic jobs, manage your shifts, and earn verified income.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center text-xs font-extrabold text-emerald-600 gap-1 group-hover:translate-x-1 transition-transform">
              <span>Continue as Worker</span>
              {loadingRole === 'worker' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};
