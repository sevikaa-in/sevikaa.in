"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { UserCheck, ArrowRight, Shield, AlertCircle, Search, ChevronDown, Check } from 'lucide-react';

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
  const [societyDropdownOpen, setSocietyDropdownOpen] = useState(false);
  const [societySearch, setSocietySearch] = useState('');
  const societyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (societyDropdownRef.current && !societyDropdownRef.current.contains(e.target as Node)) {
        setSocietyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const res = await fetch('/api/societies');
        const data = await res.json();
        if (data.success && data.societies && data.societies.length > 0) {
          setSocietiesList(data.societies);
        } else {
          // Fallback to client query if endpoint returns empty
          const { data: clientData } = await supabase.from('societies').select('*').order('name', { ascending: true });
          if (clientData && clientData.length > 0) {
            setSocietiesList(clientData);
          }
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
      const activeUserId = userId || localStorage.getItem('sevikaa_user_id') || 'temp_emp';

      // Submit via Server API to bypass RLS restrictions
      const res = await fetch('/api/employer/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          full_name: fullName,
          company_name: companyName || fullName,
          billing_address: billingAddress,
          society_name: preferredSociety,
          preferredSociety: preferredSociety,
          status: 'active'
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        // Fallback client update attempt
        await supabase
          .from('profiles')
          .update({ role: 'employer', status: 'live' })
          .eq('id', activeUserId);
      }

      setLoading(false);
      onComplete();
    } catch (err: any) {
      console.warn("Employer onboarding submit notice:", err);
      setLoading(false);
      onComplete();
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
                <option key={s.id || s.name} value={s.name || s.id}>{s.name}</option>
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
