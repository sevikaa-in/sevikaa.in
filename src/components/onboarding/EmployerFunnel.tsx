"use client";

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { UserCheck, ArrowRight, Shield, AlertCircle } from 'lucide-react';

interface EmployerFunnelProps {
  userId: string;
  onComplete: () => void;
}

const MOCK_SOCIETIES = [
  { id: '91cb520f-d5b7-4b71-9f20-b44c3c3de101', name: 'DLF Westend Heights - Akshayanagar' },
  { id: 'c7e2d9a3-5bc5-442a-a921-ef743bd2b6d2', name: 'Prestige Song of the South - Bangalore' },
  { id: 'b1a2f3c4-e888-4c91-a1b2-3f8c8dcb2e83', name: 'SNN Raj Serenity - Bangalore' }
];

export const EmployerFunnel: React.FC<EmployerFunnelProps> = ({ userId, onComplete }) => {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [preferredSociety, setPreferredSociety] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!billingAddress.trim()) {
      setError('Please enter your address');
      return;
    }
    if (!preferredSociety) {
      setError('Please select your apartment society');
      return;
    }

    setLoading(true);

    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setTimeout(() => {
          setLoading(false);
          onComplete();
        }, 1500);
        return;
      }

      // Live Supabase inserts
      // 1. Update profiles table: role to employer, status to approved (employers approve quickly or go live)
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ role: 'employer', status: 'approved' })
        .eq('id', userId);

      if (profileErr) throw profileErr;

      // 2. Insert into employer_profiles
      const { error: employerErr } = await supabase
        .from('employer_profiles')
        .insert({
          user_id: userId,
          name: fullName,
          company_name: companyName || null,
          billing_address: billingAddress,
          subscription_status: 'free'
        });

      if (employerErr) throw employerErr;

      setLoading(false);
      onComplete();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Onboarding submission failed. Check connections.');
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-8">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-[#34A853]/10 rounded-full flex items-center justify-center mb-2 text-[#34A853]">
            <UserCheck size={24} />
          </div>
          <h2 className="text-lg font-bold text-[#202124]">Employer Details</h2>
          <p className="text-xs text-gray-500 mt-1">Complete your profile to start hiring</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#EA4335]/5 border border-[#EA4335]/20 rounded-2xl text-xs text-[#EA4335] text-center font-medium flex items-center justify-center gap-1.5">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="E.g., Ananth Sharma"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company / Home Name (Optional)</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="E.g., Sharma Residence"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Billing Address / Flat Number</label>
            <input
              type="text"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="Flat 402, Block B"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Apartment Society</label>
            <select
              value={preferredSociety}
              onChange={(e) => setPreferredSociety(e.target.value)}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8]"
            >
              <option value="">-- Choose Society --</option>
              {MOCK_SOCIETIES.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-[#34A853]/5 rounded-2xl text-[11px] text-gray-500 font-medium leading-relaxed flex gap-2 pt-2">
            <Shield className="text-[#34A853] shrink-0" size={16} />
            <span>Employer profiles undergo instant validation. Upon completion, you can browse workers in your selected society.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-[#34A853] hover:bg-[#34A853]/90 active:scale-[0.98] text-white font-bold rounded-2xl shadow-sm transition-all duration-150 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-1.5 text-sm min-h-[46px]"
          >
            {loading ? <span>{t('loading')}</span> : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
