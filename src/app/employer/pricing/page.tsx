"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEmployerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  CreditCard, CheckCircle2, Sparkles, ShieldCheck, Zap, 
  HelpCircle, ArrowRight, Lock, Check, UserCheck, Star, Clock, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function EmployerPricingPage() {
  const router = useRouter();
  const { employerProfile } = useEmployerDashboard();
  const { t } = useLanguage();

  const plans = [
    {
      id: 'free',
      name: t('planFree') || 'Free Trial',
      price: '0',
      period: 'Trial',
      validity: '7 Days',
      jobPosts: '1 Job Post',
      contactUnlocks: '0 Unlocks (View Bios Only)',
      popular: false,
      badge: 'Trial',
      features: [
        '1 Active Job Requisition',
        'Browse Worker Bios & Ratings',
        'Basic Applicant Notifications',
        'Community Support'
      ]
    },
    {
      id: 'basic',
      name: t('planBasic') || 'Basic Plan',
      price: '299',
      period: 'Monthly',
      validity: '30 Days',
      jobPosts: '3 Job Posts',
      contactUnlocks: '10 Candidate Phone Unlocks',
      popular: false,
      badge: 'Popular for Single Hire',
      features: [
        '3 Active Job Requisitions',
        'Direct Candidate Calling (10 Unlocks)',
        'Watch 60-Second Worker Intro Videos',
        'Society Gate Security Badges',
        'Jio DLT Instant SMS Alerts'
      ]
    },
    {
      id: 'standard',
      name: t('planStandard') || 'Standard Plan',
      price: '699',
      period: '60 Days',
      validity: '60 Days',
      jobPosts: '10 Job Posts',
      contactUnlocks: '50 Candidate Phone Unlocks',
      popular: true,
      badge: 'Most Popular ⭐',
      features: [
        '10 Active Job Requisitions',
        '50 Candidate Contact Phone Unlocks',
        'Full Worker Intro Video Access',
        'Aadhaar ID & Police Clearance Badges',
        'Priority Applicant Matching in Society',
        'Dedicated WhatsApp Support'
      ]
    },
    {
      id: 'pro',
      name: t('planPro') || 'Pro Family Plan',
      price: '1,499',
      period: '90 Days',
      validity: '90 Days',
      jobPosts: 'Unlimited Job Posts',
      contactUnlocks: 'Unlimited Unlocks',
      popular: false,
      badge: 'Best Value for Societies',
      features: [
        'Unlimited Job Requisitions',
        'Unlimited Candidate Phone Unlocks',
        'Watch All Intro Videos & Audio Bios',
        'Verified Aadhaar + Police Background Audit',
        '1-on-1 Dedicated Sevikaa Hiring Manager',
        'Replacement Guarantee within 30 Days'
      ]
    }
  ];

  const currentStatus = employerProfile.subscription_status || 'Standard Plan';

  const handleSubscribeClick = (planId: string) => {
    router.push(`/employer/checkout?plan=${planId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl pb-20">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-blue-50 text-[#1A73E8] text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200/60 inline-flex items-center gap-1">
            <CreditCard size={11} />
            <span>{t('employerPricingEyebrow') || "Household Employer Subscription"}</span>
          </span>
        </div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles size={18} className="text-[#1A73E8]" />
          <span>{t('employerPricingTitle') || "Employer Subscription Plans"}</span>
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-relaxed">
          {t('employerPricingSub') || "One flat subscription for your household — no per-candidate unlock fees, no commission, and zero hidden charges."}
        </p>
      </div>

      {/* 🌟 CURRENT PLAN STATUS CARD */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-xl flex items-center justify-between gap-4 border border-blue-500/20">
        <div className="space-y-1">
          <span className="text-[9.5px] text-slate-400 font-bold uppercase block tracking-wider">{t('currentPlanTitle') || "Your Current Active Plan"}</span>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <span>{currentStatus}</span>
            <span className="bg-emerald-500/30 text-emerald-300 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-400/30">
              {t('statusActiveText') || "Active ✓"}
            </span>
          </h3>
          <p className="text-[11px] text-slate-300 font-medium">
            {t('currentPlanSub') || "Full direct calling and verified candidate access active in your society."}
          </p>
        </div>
        <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shrink-0 text-center">
          <ShieldCheck size={24} className="text-emerald-400 mx-auto" />
          <span className="text-[9px] font-black text-slate-200 block uppercase mt-1">{t('verifiedEmployerBadge') || "Verified Employer"}</span>
        </div>
      </div>

      {/* 💳 PRICING CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const isCurrent = currentStatus.toLowerCase().includes(plan.id) || 
                            (plan.id === 'standard' && currentStatus.includes('Standard'));

          return (
            <div
              key={plan.id}
              className={`p-5 rounded-3xl border transition-all space-y-4 relative flex flex-col justify-between ${
                plan.popular 
                  ? 'bg-gradient-to-b from-blue-50/90 via-white to-indigo-50/30 border-[#1A73E8] ring-2 ring-[#1A73E8]/20 shadow-md' 
                  : isCurrent
                  ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                  : 'bg-white border-slate-200/80 hover:border-blue-300 shadow-xs'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 right-4">
                  <span className={`text-[8.5px] font-black uppercase px-3 py-1 rounded-full shadow-xs ${
                    plan.popular ? 'bg-[#1A73E8] text-white' : 'bg-slate-900 text-white'
                  }`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-slate-900 font-mono">₹{plan.price}</span>
                    <span className="text-xs font-bold text-slate-400">/ {plan.period}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1 text-[11px] font-bold text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">{t('jobPostingsLabel') || "Job Postings:"}</span>
                    <span className="text-[#1A73E8]">{plan.jobPosts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">{t('contactUnlocksLabel') || "Candidate Unlocks:"}</span>
                    <span className="text-slate-900">{plan.contactUnlocks}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-100">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] font-semibold text-slate-700">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-black cursor-default flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> {t('currentActivePlanBtn') || "Current Active Plan"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribeClick(plan.id)}
                    className={`w-full py-2.5 px-4 rounded-2xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                      plan.popular
                        ? 'bg-[#1A73E8] hover:bg-blue-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <Zap size={14} /> {t('subscribeNowBtn') || "Subscribe Now"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ❓ FREQUENTLY ASKED QUESTIONS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <HelpCircle size={16} className="text-[#1A73E8]" />
          <span>{t('employerFaqTitle') || "Employer Subscription FAQ"}</span>
        </h3>

        <div className="space-y-3 text-xs font-medium text-slate-700">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <h4 className="font-black text-slate-900">{t('faqQ1') || "Are there any additional per-hire commission fees?"}</h4>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              {t('faqA1') || "No. Sevikaa does not charge any placement commission from domestic workers or employers. You pay a single flat subscription for candidate access."}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <h4 className="font-black text-slate-900">{t('faqQ2') || "Are workers verified before being listed?"}</h4>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              {t('faqA2') || "Yes. All candidates listed on Sevikaa have passed Aadhaar ID verification. Premium tiers also feature Police Background Clearance badges."}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <h4 className="font-black text-slate-900">{t('faqQ3') || "Can I upgrade or extend my plan anytime?"}</h4>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              {t('faqA3') || "Yes, you can upgrade your plan at any time. Unused validity days from your current plan will be rolled over automatically."}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
