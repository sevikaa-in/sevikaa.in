"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEmployerDashboard } from '../../layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Building, ArrowLeft, Search, Check, Upload, Save, ShieldAlert, FileText, CheckCircle2 
} from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';

export default function EmployerRelocatePage() {
  const router = useRouter();
  const { employerProfile, setEmployerProfile, handleSaveEmployerProfile, showToast } = useEmployerDashboard();
  const { t } = useLanguage();

  const [relocationReason, setRelocationReason] = useState('Moved to new residential gated society');
  const [targetSociety, setTargetSociety] = useState('');
  const [societySearchQuery, setSocietySearchQuery] = useState('');
  const [relocationProofUrl, setRelocationProofUrl] = useState<string | null>(null);
  const [relocationSubmitLoading, setRelocationSubmitLoading] = useState(false);

  // Live Supabase DB Societies State (100% Real Data Only, Zero Mock Data)
  const [dbSocieties, setDbSocieties] = useState<any[]>([]);
  const [loadingSocieties, setLoadingSocieties] = useState(true);

  React.useEffect(() => {
    async function loadRealDBSocieties() {
      setLoadingSocieties(true);
      try {
        const { data, error } = await supabase
          .from('societies')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data) {
          const realSocieties = data.map((soc: any) => ({
            id: soc.id,
            value: soc.name + (soc.locality ? ` - ${soc.locality}` : soc.city ? ` - ${soc.city}` : ''),
            label: soc.name,
            locality: soc.locality || soc.city || soc.address || 'Verified Gated Society'
          }));
          setDbSocieties(realSocieties);
        } else if (error) {
          console.error("Supabase societies fetch error:", error);
        }
      } catch (err) {
        console.error("Error fetching dynamic societies from DB:", err);
      } finally {
        setLoadingSocieties(false);
      }
    }
    loadRealDBSocieties();
  }, []);

  const filteredVerifiedSocieties = dbSocieties.filter((soc) =>
    soc.label.toLowerCase().includes(societySearchQuery.toLowerCase()) ||
    soc.locality.toLowerCase().includes(societySearchQuery.toLowerCase())
  );

  const handleRelocationProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      showToast('Relocation Proof: Only JPG, PNG, or PDF files allowed.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(`File size must be under 5MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)}MB.`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRelocationProofUrl(reader.result as string);
      showToast('New residence proof document attached successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRelocationRequest = async () => {
    if (!targetSociety.trim()) {
      showToast('Please select a target new gated society from the list.', 'error');
      return;
    }
    if (!relocationProofUrl) {
      showToast('Please upload a proof of residence document for the new society.', 'error');
      return;
    }
    setRelocationSubmitLoading(true);
    try {
      const noteMsg = `⏳ Society Relocation Request to "${targetSociety.trim()}" submitted for admin verification. Reason: ${relocationReason}`;
      if (typeof handleSaveEmployerProfile === 'function') {
        await handleSaveEmployerProfile({
          ...employerProfile,
          status: 'changes_requested',
          admin_note: noteMsg,
          residency_proof_url: relocationProofUrl
        });
      } else {
        setEmployerProfile((prev: any) => ({
          ...prev,
          status: 'changes_requested',
          admin_note: noteMsg,
          residency_proof_url: relocationProofUrl
        }));
      }
      showToast(`Society relocation request to "${targetSociety.trim()}" submitted to admin for audit!`, 'success');
      router.push('/employer/account');
    } catch (err: any) {
      showToast(`Error submitting relocation request: ${err.message}`, 'error');
    } finally {
      setRelocationSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl pb-24 mx-auto">
      
      {/* Back Button Link */}
      <div>
        <Link 
          href="/employer/account" 
          className="inline-flex items-center gap-2 text-xs font-black text-[#1A73E8] hover:underline bg-blue-50/80 px-3.5 py-2 rounded-xl border border-blue-200/80 transition-all active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>Back to Employer Account Settings</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#1A73E8] text-white rounded-2xl shadow-xs shrink-0">
            <Building size={24} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gated Society Relocation Request
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
              Updating your residential society requires admin audit & new residence proof verification to maintain neighborhood trust & candidate matching security.
            </p>
          </div>
        </div>
      </div>

      {/* Current Active Society Box */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-5 rounded-3xl border border-blue-200/90 space-y-1">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Current Registered Gated Society</span>
        <div className="flex items-center justify-between">
          <span className="text-base font-black text-slate-900">{employerProfile.society_name || 'Society Not Assigned'}</span>
          <span className="bg-blue-100 text-[#1A73E8] text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-blue-200">
            Active Registered
          </span>
        </div>
      </div>

      {/* Main Relocation Form Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
        
        {/* Step 1: Relocation Reason */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white text-[10px] flex items-center justify-center font-black">1</span>
            Primary Reason for Society Relocation
          </label>
          <select
            value={relocationReason}
            onChange={(e) => setRelocationReason(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8] focus:bg-white cursor-pointer"
          >
            <option value="Moved to new residential gated society">Moved to new residential gated society</option>
            <option value="Selected incorrect society during initial registration">Selected incorrect society during initial registration</option>
            <option value="Temporary apartment relocation">Temporary apartment relocation</option>
            <option value="Other">Other specific relocation reason</option>
          </select>
        </div>

        {/* Step 2: Search & Select Target Verified Society (INLINE ON PAGE, NO MODAL) */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white text-[10px] flex items-center justify-center font-black">2</span>
              Select Target New Verified Gated Society
            </label>
            <Link 
              href="/societies" 
              target="_blank"
              className="text-[11px] font-black text-[#1A73E8] hover:underline"
            >
              Request New Addition ↗
            </Link>
          </div>

          {/* Search Bar Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={societySearchQuery}
              onChange={(e) => setSocietySearchQuery(e.target.value)}
              placeholder="Search society name or locality..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8] focus:bg-white"
            />
          </div>

          {/* Inline Scrollable List of Societies (No Modal Overlay) */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
            {loadingSocieties ? (
              <div className="p-8 text-center text-xs font-bold text-slate-400 space-y-2">
                <div className="w-5 h-5 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading verified societies live from database...</p>
              </div>
            ) : filteredVerifiedSocieties.length > 0 ? (
              filteredVerifiedSocieties.map((soc) => (
                <button
                  key={soc.id || soc.value}
                  type="button"
                  onClick={() => setTargetSociety(soc.value)}
                  className={`w-full text-left p-3.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    targetSociety === soc.value 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/80'
                  }`}
                >
                  <div>
                    <span className="block font-black text-sm">{soc.label}</span>
                    <span className={`block text-[11px] mt-0.5 font-normal ${targetSociety === soc.value ? 'text-blue-100' : 'text-slate-500'}`}>
                      {soc.locality}
                    </span>
                  </div>
                  {targetSociety === soc.value && (
                    <span className="p-1 bg-white text-[#1A73E8] rounded-full shrink-0">
                      <Check size={14} className="stroke-[3]" />
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <p>No verified society found matching "{societySearchQuery}".</p>
                <Link 
                  href="/societies" 
                  target="_blank" 
                  className="text-[#1A73E8] font-black hover:underline block text-xs"
                >
                  Request new society addition on public directory ↗
                </Link>
              </div>
            )}
          </div>

          {targetSociety && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Selected Target Society: <strong>{targetSociety}</strong></span>
            </div>
          )}
        </div>

        {/* Step 3: Upload New Residence Proof */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="text-xs font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5 justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white text-[10px] flex items-center justify-center font-black">3</span>
              Upload New Residence Proof
            </span>
            <span className="text-[10px] text-slate-400 font-semibold lowercase">(JPG, PNG, PDF · Max 5MB)</span>
          </label>
          <p className="text-xs text-slate-500 font-medium">
            Please attach a copy of your Rent Agreement, Maintenance Bill, Electricity Bill, or Society Allotment Letter for the target society.
          </p>

          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <input 
              type="file" 
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleRelocationProofChange}
              className="hidden"
              id="relocation-proof-page-file"
            />
            <label 
              htmlFor="relocation-proof-page-file"
              className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-2 shadow-sm transition-all shrink-0"
            >
              <Upload size={14} />
              <span>{relocationProofUrl ? 'Change Residence Proof' : 'Upload Residence Proof'}</span>
            </label>
            <span className="text-xs font-bold text-slate-700 truncate flex-1">
              {relocationProofUrl ? '✓ Residence proof document attached' : 'No document selected yet'}
            </span>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/employer/account"
            className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmitRelocationRequest}
            disabled={relocationSubmitLoading || !targetSociety.trim() || !relocationProofUrl}
            className="py-2.5 px-6 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Save size={14} className="shrink-0" />
            <span>{relocationSubmitLoading ? 'Submitting Transfer...' : 'Submit Society Transfer Request'}</span>
          </button>
        </div>

      </div>

      {/* Powered by Ygayatra Footer */}
      <div className="pt-8 pb-2 flex flex-col items-center justify-center gap-1.5 opacity-75 hover:opacity-100 transition-opacity select-none">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          Powered By
        </span>
        <img 
          src="/ygayatra.png" 
          alt="Ygayatra" 
          className="h-6 sm:h-7 object-contain grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100" 
        />
      </div>

    </div>
  );
}
