"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles, Heart, ShieldCheck, Zap, Award, Star, ArrowRight, X } from 'lucide-react';
import { executeRazorpayCheckout } from '../../utils/razorpay';

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheckout = (planName: string, amount: number) => {
    setLoadingPlan(planName);
    setSuccessMsg('');
    setErrorMsg('');

    executeRazorpayCheckout({
      amount,
      planName,
      userEmail: 'employer@sevikaa.in',
      userName: 'Household Employer',
      onSuccess: (paymentId) => {
        setLoadingPlan(null);
        setSuccessMsg(`Payment Successful! Payment ID: ${paymentId}. Plan ${planName} activated.`);
      },
      onFailure: (err) => {
        setLoadingPlan(null);
        setErrorMsg(`Payment process error: ${err}`);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full text-slate-800 antialiased">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors p-1 hover:bg-slate-100 rounded-lg">
            <ArrowLeft size={18} />
          </Link>
          <img src="/logo.png" alt="Sevikaa Logo" className="h-9 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/employer/dashboard"
            className="py-2 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm hidden sm:inline-flex"
          >
            Employer Portal
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 sm:py-12 space-y-10">
        
        {/* Toast Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm">
            <span>✓ {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-800 font-bold">✕</button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold flex items-center justify-between shadow-sm">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-amber-600 hover:text-amber-900 font-bold">✕</button>
          </div>
        )}

        {/* Title & Subtitle Banner */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="bg-blue-50 text-[#1A73E8] text-[10px] font-black uppercase px-3 py-1 rounded-full border border-blue-200/60 inline-flex items-center gap-1">
            <Sparkles size={12} />
            Simple &amp; Transparent Household Hiring Plans
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Fair Pricing for Households. <br className="hidden sm:inline" />
            <span className="text-[#34A853]">100% Free Forever for Domestic Workers.</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
            Domestic help candidates search and apply at zero cost. Household employers pick a plan that fits their hiring needs with no hidden fees.
          </p>
        </div>

        {/* 🟢 WORKER FREE FOREVER PROMOTION CARD */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-3xl shadow-xl shadow-emerald-500/15 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-[9.5px] font-black uppercase px-3 py-1 rounded-full">
              <Heart size={12} className="fill-white" /> Domestic Help Network Promise
            </div>
            <h2 className="text-xl font-black">Are You a Worker Looking for a Job?</h2>
            <p className="text-xs text-emerald-100 font-medium max-w-xl leading-relaxed">
              Maids, Cooks, Nannies, Drivers, Caregivers &amp; Housekeeping staff <strong>never pay any fee</strong> to register, create profiles, or connect with households.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 z-10 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center w-full sm:w-auto">
              <span className="text-[9px] font-black uppercase text-emerald-200 block">Worker Registration</span>
              <span className="text-xl font-black text-white">₹0 / Free Forever</span>
            </div>
            <Link
              href="/?role=worker"
              className="py-3 px-6 bg-white hover:bg-emerald-50 text-emerald-700 font-black text-xs rounded-2xl transition-all shadow-lg active:scale-95 w-full sm:w-auto text-center"
            >
              Register Candidate Profile
            </Link>
          </div>
        </div>

        {/* 🔵 HOUSEHOLD EMPLOYER SUBSCRIPTION TIERS */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">Household Employer Hiring Plans</h2>
            <p className="text-xs text-slate-500 font-semibold">Choose the right tier to unlock verified candidate contact details &amp; schedule interviews</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* TIER 1: FREE TRIAL */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div>
                  <span className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                    Free Trial
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-3">Free Tier</h3>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    <sup>₹</sup>0<span className="text-xs text-slate-400 font-semibold"> / Lifetime</span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-medium mt-1">
                    Try the platform and receive worker applications for your first job posting.
                  </p>
                </div>

                <ul className="text-xs font-semibold text-slate-600 space-y-2.5 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500 shrink-0" /> 1 Active Job Posting</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500 shrink-0" /> Receive Worker Applications</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500 shrink-0" /> Basic Search Radius</li>
                </ul>
              </div>

              <Link
                href="/employer/dashboard"
                className="w-full py-3 text-center text-xs font-black rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all active:scale-[0.98] block"
              >
                Get Started Free
              </Link>
            </div>

            {/* TIER 2: STARTER PLAN */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div>
                  <span className="bg-blue-50 text-[#1A73E8] text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                    Starter Pass
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-3">Starter Plan</h3>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    <sup>₹</sup>299<span className="text-xs text-slate-400 font-semibold"> / 30 Days</span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-medium mt-1">
                    Ideal for single domestic help hiring (Cook OR Maid OR Nanny).
                  </p>
                </div>

                <ul className="text-xs font-semibold text-slate-600 space-y-2.5 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#1A73E8] shrink-0" /> Up to 3 Job Postings</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#1A73E8] shrink-0" /> <strong>Unlock 10 Worker Contacts</strong></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#1A73E8] shrink-0" /> Verified Worker Badges</li>
                </ul>
              </div>

              <button
                onClick={() => handleCheckout('Starter Plan', 299)}
                disabled={loadingPlan === 'Starter Plan'}
                className="w-full py-3 text-center text-xs font-black rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {loadingPlan === 'Starter Plan' ? 'Processing...' : 'Get Starter Plan'}
              </button>
            </div>

            {/* TIER 3: STANDARD PLAN (RECOMMENDED) */}
            <div className="bg-gradient-to-b from-blue-50/50 via-white to-white rounded-3xl border-2 border-[#1A73E8] p-6 flex flex-col justify-between space-y-6 shadow-xl shadow-blue-500/10 relative">
              <div className="absolute -top-3.5 right-6 bg-[#1A73E8] text-white text-[8.5px] font-black uppercase px-3 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1">
                <Star size={10} className="fill-white" /> Recommended
              </div>

              <div className="space-y-4">
                <div>
                  <span className="bg-indigo-100 text-[#1A73E8] text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                    Standard Pass
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-3">Standard Plan</h3>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    <sup>₹</sup>699<span className="text-xs text-slate-400 font-semibold"> / 60 Days</span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-medium mt-1">
                    Comprehensive plan for families needing multiple helpers (cook, maid, nanny, driver).
                  </p>
                </div>

                <ul className="text-xs font-semibold text-slate-600 space-y-2.5 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#1A73E8] shrink-0" /> Up to 10 Job Postings</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#1A73E8] shrink-0" /> <strong>Unlock 50 Worker Contacts</strong></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#1A73E8] shrink-0" /> Verified Worker Badges &amp; Filters</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#1A73E8] shrink-0" /> Smart Society-Based Matching</li>
                </ul>
              </div>

              <button
                onClick={() => handleCheckout('Standard Plan', 699)}
                disabled={loadingPlan === 'Standard Plan'}
                className="w-full py-3 text-center text-xs font-black rounded-2xl bg-[#1A73E8] text-white hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {loadingPlan === 'Standard Plan' ? 'Processing...' : 'Get Standard Plan'}
              </button>
            </div>

            {/* TIER 4: PRO PLAN */}
            <div className="bg-white rounded-3xl border-2 border-purple-100 p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div>
                  <span className="bg-purple-50 text-purple-700 text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                    Pro Hiring
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-3">Pro Plan</h3>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    <sup>₹</sup>1,499<span className="text-xs text-slate-400 font-semibold"> / 90 Days</span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-medium mt-1">
                    Unlimited hiring solution with dedicated priority support &amp; AI matching.
                  </p>
                </div>

                <ul className="text-xs font-semibold text-slate-600 space-y-2.5 border-t border-slate-100 pt-4">
                  <li className="flex items-center gap-2"><Check size={14} className="text-purple-600 shrink-0" /> <strong>Unlimited Job Postings</strong></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-purple-600 shrink-0" /> <strong>Unlimited Contact Unlocks</strong></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-purple-600 shrink-0" /> Priority Job Listing Boost</li>
                </ul>
              </div>

              <button
                onClick={() => handleCheckout('Pro Plan', 1499)}
                disabled={loadingPlan === 'Pro Plan'}
                className="w-full py-3 text-center text-xs font-black rounded-2xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {loadingPlan === 'Pro Plan' ? 'Processing...' : 'Get Pro Plan'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 font-semibold">
        Sevikaa Platform &bull; Powered by YugaYatra Retail (OPC) Private Limited
      </footer>
    </div>
  );
}
