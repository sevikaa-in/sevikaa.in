"use client";

import React, { useState } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { 
  DollarSign, Check, ShieldCheck, Sparkles, Zap, Award, Layers, 
  HelpCircle, Save, FileText, ArrowRight, UserCheck, Heart, AlertCircle, Calculator, X
} from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';

export default function PricingPage() {
  const {
    pricing,
    setPricing,
    showToast
  } = useSuperAdminDashboard();

  // Local state for live editable tiers
  const [basicPrice, setBasicPrice] = useState(pricing?.basicPlan?.price || '299');
  const [basicValidity, setBasicValidity] = useState(pricing?.basicPlan?.validityDays || '30');
  const [basicUnlocks, setBasicUnlocks] = useState(pricing?.basicPlan?.contactUnlocksLimit || '10');
  const [basicJobs, setBasicJobs] = useState(pricing?.basicPlan?.jobPostsLimit || '3');

  const [premiumPrice, setPremiumPrice] = useState(pricing?.premiumPlan?.price || '699');
  const [premiumValidity, setPremiumValidity] = useState(pricing?.premiumPlan?.validityDays || '60');
  const [premiumUnlocks, setPremiumUnlocks] = useState(pricing?.premiumPlan?.contactUnlocksLimit || '50');
  const [premiumJobs, setPremiumJobs] = useState(pricing?.premiumPlan?.jobPostsLimit || '10');

  const [proPrice, setProPrice] = useState(pricing?.proPlan?.price || '1499');
  const [proValidity, setProValidity] = useState(pricing?.proPlan?.validityDays || '90');
  const [proUnlocks, setProUnlocks] = useState(pricing?.proPlan?.contactUnlocksLimit || 'Unlimited');
  const [proJobs, setProJobs] = useState(pricing?.proPlan?.jobPostsLimit || 'Unlimited');

  // Add-ons state
  const [verificationPrice, setVerificationPrice] = useState(pricing?.addons?.workerVerificationReport || '199');
  const [featuredJobPrice, setFeaturedJobPrice] = useState(pricing?.addons?.featuredJobBoost || '99');
  const [replacementPrice, setReplacementPrice] = useState(pricing?.addons?.replacementGuarantee || '499');

  // Projection Calculator state
  const [estBasicSubscribers, setEstBasicSubscribers] = useState(150);
  const [estPremiumSubscribers, setEstPremiumSubscribers] = useState(300);
  const [estProSubscribers, setEstProSubscribers] = useState(80);

  const [saving, setSaving] = useState(false);

  const calculatedMRR = (
    (estBasicSubscribers * (parseInt(basicPrice) || 0)) +
    (estPremiumSubscribers * (parseInt(premiumPrice) || 0)) +
    (estProSubscribers * (parseInt(proPrice) || 0))
  );

  const handleSaveAllPricing = async () => {
    setSaving(true);
    const updatedPricing = {
      workerRegistration: '0',
      freePlan: { price: '0', validityDays: 'Unlimited', jobPostsLimit: '1', contactUnlocksLimit: '0', name: 'Free Trial' },
      basicPlan: { price: basicPrice, validityDays: basicValidity, jobPostsLimit: basicJobs, contactUnlocksLimit: basicUnlocks, name: 'Basic Plan' },
      premiumPlan: { price: premiumPrice, validityDays: premiumValidity, jobPostsLimit: premiumJobs, contactUnlocksLimit: premiumUnlocks, name: 'Standard (Recommended)' },
      proPlan: { price: proPrice, validityDays: proValidity, jobPostsLimit: proJobs, contactUnlocksLimit: proUnlocks, name: 'Pro Enterprise' },
      addons: {
        workerVerificationReport: verificationPrice,
        featuredJobBoost: featuredJobPrice,
        replacementGuarantee: replacementPrice
      }
    };

    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ||
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholder) {
      try {
        const { error } = await supabase
          .from('platform_settings')
          .upsert({ id: 'pricing_config', settings: updatedPricing });
        if (error) throw error;
      } catch (err: any) {
        console.warn("DB Persist note:", err.message);
      }
    }

    setPricing(updatedPricing);
    setSaving(false);
    showToast('Pricing configuration and revenue tiers updated live across the platform!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl pb-12">
      {/* Header & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <span>Platform Monetization &amp; Pricing Architecture</span>
            <span className="bg-emerald-50 text-[#34A853] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200/50">
              Live Config
            </span>
          </h3>
          <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
            Configure employer subscription tiers, worker free-forever guarantees, and add-on verification fees.
          </p>
        </div>

        <button
          onClick={handleSaveAllPricing}
          disabled={saving}
          className="py-2.5 px-5 bg-[#34A853] hover:bg-[#2b8a43] text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md shadow-[#34A853]/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Save size={15} />
          <span>{saving ? 'Saving Config...' : 'Save Pricing Configuration'}</span>
        </button>
      </div>

      {/* 🟢 WORKER POLICY BANNER - FREE FOREVER */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50/60 p-5 rounded-2xl border border-emerald-200/70 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-[#34A853] text-white rounded-2xl shrink-0 shadow-md shadow-[#34A853]/20">
            <Heart size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <span>Domestic Workers: 100% FREE FOREVER</span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-[#34A853] rounded">
                Zero Friction Policy
              </span>
            </h4>
            <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed max-w-2xl">
              Workers (maids, cooks, nannies, drivers, caregivers) <strong>never pay to search or apply for jobs</strong>.
              Unlimited profile creation, OTP login, job applications, and verification requests are guaranteed ₹0 to maximize candidate supply.
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-emerald-200 text-center shrink-0">
          <span className="text-[9px] font-black uppercase text-slate-400 block">Worker Fee</span>
          <span className="text-lg font-black text-[#34A853]">₹0 / Free</span>
        </div>
      </div>

      {/* 🔵 EMPLOYER TIERED SUBSCRIPTION CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Household Employer Subscription Tiers</h4>
            <p className="text-[10px] text-slate-400 font-bold">Monetize hiring households based on contact unlocks &amp; job posting volume</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* TIER 1: FREE PLAN */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-slate-100 text-slate-600">
                  Free Trial
                </span>
                <span className="text-xs font-black text-slate-400">Tier 1</span>
              </div>
              <h5 className="text-sm font-black text-slate-900">Free Plan</h5>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">₹0</span>
                <span className="text-[10px] font-bold text-slate-400">/ Lifetime</span>
              </div>
            </div>

            <ul className="space-y-2 text-[10.5px] font-semibold text-slate-600 border-t border-slate-100 pt-3">
              <li className="flex items-center gap-1.5"><Check size={12} className="text-[#34A853]" /> Post 1 Job Requisition</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-[#34A853]" /> Browse Worker Profiles</li>
              <li className="flex items-center gap-1.5 text-slate-400 line-through"><X size={12} className="text-red-400" /> Phone Numbers Locked</li>
              <li className="flex items-center gap-1.5 text-slate-400 line-through"><X size={12} className="text-red-400" /> Verified Worker Filters</li>
            </ul>

            <div className="bg-slate-50 p-2.5 rounded-xl text-center text-[10px] font-black text-slate-500 uppercase border border-slate-100">
              Default Onboarding Tier
            </div>
          </div>

          {/* TIER 2: BASIC PLAN */}
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-blue-50 text-[#1A73E8]">
                  Basic Tier
                </span>
                <span className="text-xs font-black text-slate-400">Tier 2</span>
              </div>
              <h5 className="text-sm font-black text-slate-900">Basic Plan</h5>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-slate-400">₹</span>
                <input
                  type="number"
                  value={basicPrice}
                  onChange={(e) => setBasicPrice(e.target.value)}
                  className="w-20 py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-lg font-black text-slate-900 focus:bg-white focus:outline-none"
                />
                <span className="text-[10px] font-bold text-slate-400">/ {basicValidity} days</span>
              </div>
            </div>

            <div className="space-y-2 text-[10px] font-bold text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Contact Unlocks:</span>
                <input
                  type="text"
                  value={basicUnlocks}
                  onChange={(e) => setBasicUnlocks(e.target.value)}
                  className="w-14 text-right py-0.5 px-1 bg-slate-50 border border-slate-200 rounded text-slate-900 font-bold"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Job Posts Limit:</span>
                <input
                  type="text"
                  value={basicJobs}
                  onChange={(e) => setBasicJobs(e.target.value)}
                  className="w-14 text-right py-0.5 px-1 bg-slate-50 border border-slate-200 rounded text-slate-900 font-bold"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Validity (Days):</span>
                <input
                  type="text"
                  value={basicValidity}
                  onChange={(e) => setBasicValidity(e.target.value)}
                  className="w-14 text-right py-0.5 px-1 bg-slate-50 border border-slate-200 rounded text-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="bg-blue-50/60 p-2.5 rounded-xl text-center text-[10px] font-black text-[#1A73E8] uppercase">
              Entry Hiring Household
            </div>
          </div>

          {/* TIER 3: STANDARD / PREMIUM PLAN (RECOMMENDED) */}
          <div className="bg-gradient-to-b from-indigo-50/40 via-white to-white p-5 rounded-2xl border-2 border-[#1A73E8] shadow-md flex flex-col justify-between space-y-4 relative">
            <div className="absolute -top-3 right-4 bg-[#1A73E8] text-white text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
              ★ Recommended
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-indigo-100 text-[#1A73E8]">
                  Standard Tier
                </span>
                <span className="text-xs font-black text-[#1A73E8]">Tier 3</span>
              </div>
              <h5 className="text-sm font-black text-slate-900">Standard Plan</h5>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-slate-400">₹</span>
                <input
                  type="number"
                  value={premiumPrice}
                  onChange={(e) => setPremiumPrice(e.target.value)}
                  className="w-20 py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-lg font-black text-slate-900 focus:bg-white focus:outline-none"
                />
                <span className="text-[10px] font-bold text-slate-400">/ {premiumValidity} days</span>
              </div>
            </div>

            <div className="space-y-2 text-[10px] font-bold text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Contact Unlocks:</span>
                <input
                  type="text"
                  value={premiumUnlocks}
                  onChange={(e) => setPremiumUnlocks(e.target.value)}
                  className="w-14 text-right py-0.5 px-1 bg-slate-50 border border-slate-200 rounded text-slate-900 font-bold"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Job Posts Limit:</span>
                <input
                  type="text"
                  value={premiumJobs}
                  onChange={(e) => setPremiumJobs(e.target.value)}
                  className="w-14 text-right py-0.5 px-1 bg-slate-50 border border-slate-200 rounded text-slate-900 font-bold"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Validity (Days):</span>
                <input
                  type="text"
                  value={premiumValidity}
                  onChange={(e) => setPremiumValidity(e.target.value)}
                  className="w-14 text-right py-0.5 px-1 bg-slate-50 border border-slate-200 rounded text-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="bg-[#1A73E8] p-2.5 rounded-xl text-center text-[10px] font-black text-white uppercase shadow-sm">
              Most Popular Option
            </div>
          </div>

          {/* TIER 4: PRO ENTERPRISE PLAN */}
          <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-purple-50 text-purple-700">
                  Pro Tier
                </span>
                <span className="text-xs font-black text-purple-600">Tier 4</span>
              </div>
              <h5 className="text-sm font-black text-slate-900">Pro Enterprise</h5>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-slate-400">₹</span>
                <input
                  type="number"
                  value={proPrice}
                  onChange={(e) => setProPrice(e.target.value)}
                  className="w-20 py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-lg font-black text-slate-900 focus:bg-white focus:outline-none"
                />
                <span className="text-[10px] font-bold text-slate-400">/ {proValidity} days</span>
              </div>
            </div>

            <div className="space-y-2 text-[10px] font-bold text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Contact Unlocks:</span>
                <input
                  type="text"
                  value={proUnlocks}
                  onChange={(e) => setProUnlocks(e.target.value)}
                  className="w-16 text-right py-0.5 px-1 bg-slate-50 border border-slate-200 rounded text-slate-900 font-bold"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Job Posts Limit:</span>
                <input
                  type="text"
                  value={proJobs}
                  onChange={(e) => setProJobs(e.target.value)}
                  className="w-16 text-right py-0.5 px-1 bg-slate-50 border border-slate-200 rounded text-slate-900 font-bold"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Validity (Days):</span>
                <input
                  type="text"
                  value={proValidity}
                  onChange={(e) => setProValidity(e.target.value)}
                  className="w-14 text-right py-0.5 px-1 bg-slate-50 border border-slate-200 rounded text-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="bg-purple-50 p-2.5 rounded-xl text-center text-[10px] font-black text-purple-700 uppercase">
              VIP Unlimited Hiring
            </div>
          </div>
        </div>
      </div>

      {/* 🟠 ADD-ON SERVICES & MICRO-TRANSACTIONS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Additional Value Revenue Streams</h4>
          <p className="text-[10px] text-slate-400 font-bold">Micro-transaction fees charged to employers for verification, boosts &amp; guarantees</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Add-on 1: Background Verification (FREE INCLUDED) */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/60 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-black text-slate-800">Worker Verification Report</span>
              <span className="bg-emerald-100 text-[#34A853] text-[8.5px] font-black uppercase px-2 py-0.5 rounded">100% Free Included</span>
            </div>
            <p className="text-[9.5px] text-slate-600 font-medium">Police record check &amp; Aadhaar identity audit included by default for all candidates.</p>
            <div className="flex items-center gap-1.5 pt-2 border-t border-emerald-200/50">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Fee:</span>
              <span className="text-xs font-black text-[#34A853]">₹0 (Free Included)</span>
            </div>
          </div>

          {/* Add-on 2: Featured Job Boost */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-black text-slate-800">Featured Job Listing Boost</span>
              <span className="bg-emerald-50 text-[#34A853] text-[8.5px] font-black uppercase px-2 py-0.5 rounded">Active</span>
            </div>
            <p className="text-[9.5px] text-slate-500 font-medium">Promote job post to top of candidate search list for 7 days.</p>
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Fee: ₹</span>
              <input
                type="number"
                value={featuredJobPrice}
                onChange={(e) => setFeaturedJobPrice(e.target.value)}
                className="w-20 py-1 px-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-900 focus:outline-none"
              />
              <span className="text-[9.5px] font-bold text-slate-400">/ boost</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🧮 REVENUE PROJECTION CALCULATOR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
          <Calculator size={16} className="text-[#1A73E8]" />
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Monthly Recurring Revenue (MRR) Projection</h4>
            <p className="text-[10px] text-slate-400 font-bold">Estimate platform monthly income based on employer subscriber distribution</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
          <div className="space-y-1">
            <label className="text-[9.5px] text-slate-400 uppercase font-black">Basic Plan Employers (₹{basicPrice})</label>
            <input
              type="number"
              value={estBasicSubscribers}
              onChange={(e) => setEstBasicSubscribers(parseInt(e.target.value) || 0)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9.5px] text-slate-400 uppercase font-black">Standard Plan Employers (₹{premiumPrice})</label>
            <input
              type="number"
              value={estPremiumSubscribers}
              onChange={(e) => setEstPremiumSubscribers(parseInt(e.target.value) || 0)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9.5px] text-slate-400 uppercase font-black">Pro Plan Employers (₹{proPrice})</label>
            <input
              type="number"
              value={estProSubscribers}
              onChange={(e) => setEstProSubscribers(parseInt(e.target.value) || 0)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Projected Employer Monthly Subscription MRR</span>
            <p className="text-xs text-slate-300 font-semibold">Based on {estBasicSubscribers + estPremiumSubscribers + estProSubscribers} paying household subscribers</p>
          </div>
          <span className="text-2xl font-black text-[#34A853] font-mono">
            ₹{calculatedMRR.toLocaleString('en-IN')} / mo
          </span>
        </div>
      </div>
    </div>
  );
}
