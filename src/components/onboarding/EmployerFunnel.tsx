"use client";

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { UserCheck, ArrowRight, Shield, AlertCircle } from 'lucide-react';

import { useEffect } from 'react';

interface EmployerFunnelProps {
  userId: string;
  onComplete: () => void;
}

export const EmployerFunnel: React.FC<EmployerFunnelProps> = ({ userId, onComplete }) => {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [preferredSociety, setPreferredSociety] = useState('');
  const [societiesList, setSocietiesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const { data } = await supabase.from('societies').select('*').order('name', { ascending: true });
        if (data && data.length > 0) {
          setSocietiesList(data);
        }
      } catch (err) {
        console.error("Error fetching societies:", err);
      }
    };
    fetchSocieties();
  }, []);

  // Strict Input Sanitizer - Only letters (A-Z, a-z) and spaces
  const handleFullNameChange = (val: string) => {
    const lettersOnly = val.replace(/[^a-zA-Z\s]/g, '');
    setFullName(lettersOnly);
  };

  const handleCompanyNameChange = (val: string) => {
    const lettersOnly = val.replace(/[^a-zA-Z\s]/g, '');
    setCompanyName(lettersOnly);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter a valid full name (letters only)');
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
        }, 1200);
        return;
      }

      // Live Supabase updates
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ role: 'employer', status: 'live' })
        .eq('id', userId);

      if (profileErr) throw profileErr;

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
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between">
              <span>Full Name</span>
              <span className="text-[9px] text-slate-400 font-normal lowercase">(letters only)</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => handleFullNameChange(e.target.value)}
              placeholder="E.g., Ananth Sharma"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between">
              <span>Company / Home Name (Optional)</span>
              <span className="text-[9px] text-slate-400 font-normal lowercase">(letters only)</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              placeholder="E.g., Sharma Residence"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Billing Address / Flat Number</label>
            <input
              type="text"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="E.g., Apt 402, Tower B"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Apartment Society</label>
            <select
              value={preferredSociety}
              onChange={(e) => setPreferredSociety(e.target.value)}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-all cursor-pointer"
            >
              <option value="">-- Choose Society --</option>
              {societiesList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl text-[11px] text-gray-500 font-medium leading-relaxed flex gap-2">
            <Shield className="text-[#34A853] shrink-0" size={16} />
            <span>Employer profiles undergo instant validation. Upon completion, you can browse workers in your selected society.</span>
          </div>

          <button
            type="submit"
            disabled={loading || !fullName.trim() || !billingAddress.trim() || !preferredSociety}
            className="w-full py-4 bg-[#34A853] hover:bg-[#2e954b] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-2xl shadow-sm transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 text-sm min-h-[48px] cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Please wait...</span>
            ) : (
              <>
                <span>Complete Employer Setup</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
