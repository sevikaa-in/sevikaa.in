"use client";

import React, { useState } from 'react';
import { Building2, UserCheck, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface NewUserRoleSelectorProps {
  userId: string;
  onRoleSelected: (selectedRole: 'worker' | 'employer') => void;
}

export const NewUserRoleSelector: React.FC<NewUserRoleSelectorProps> = ({ userId, onRoleSelected }) => {
  const [loadingRole, setLoadingRole] = useState<'worker' | 'employer' | null>(null);
  const [error, setError] = useState('');

  const handleSelectRole = async (role: 'worker' | 'employer') => {
    setLoadingRole(role);
    setError('');

    try {
      const res = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to set account role');
      }

      onRoleSelected(role);
    } catch (err: any) {
      setError(err.message || 'Error assigning role. Please try again.');
      setLoadingRole(null);
    }
  };

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
