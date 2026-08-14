"use client";

import React from 'react';
import Link from 'next/link';
import { UserPlus, Search, PhoneCall, ShieldCheck, CalendarCheck, ArrowRight, Lock, Building2 } from 'lucide-react';

export function HowItWorksContent() {
  const employerSteps = [
    {
      step: 'STEP 01',
      title: 'Post Requirement',
      desc: 'Specify your domestic help needs — cook, maid, nanny, driver, shift hours, society location & budget.',
      icon: <UserPlus size={18} className="text-[#1A73E8]" />,
    },
    {
      step: 'STEP 02',
      title: 'Browse Candidates',
      desc: 'Explore verified helper profiles in or near your gated society with Aadhaar badges & skill ratings.',
      icon: <Search size={18} className="text-[#1A73E8]" />,
    },
    {
      step: 'STEP 03',
      title: 'Direct Connection',
      desc: 'Unlock verified contact numbers to call or WhatsApp candidates directly with zero middleman fees.',
      icon: <PhoneCall size={18} className="text-[#1A73E8]" />,
    },
  ];

  const workerSteps = [
    {
      step: 'STEP 01',
      title: 'Free Registration',
      desc: 'Create your worker profile for free. Add preferred society locations, salary expectations & skills.',
      icon: <UserPlus size={18} className="text-[#34A853]" />,
    },
    {
      step: 'STEP 02',
      title: 'Aadhaar Audit',
      desc: 'Earn your official Sevikaa Verified Badge after identity review to receive direct interview calls.',
      icon: <ShieldCheck size={18} className="text-[#34A853]" />,
    },
    {
      step: 'STEP 03',
      title: 'Direct Job Calls',
      desc: 'Get interview requests directly from nearby society families matching your preferred hours & salary.',
      icon: <CalendarCheck size={18} className="text-[#34A853]" />,
    },
  ];

  return (
    <div className="space-y-5 text-slate-700 leading-relaxed text-sm">
      
      {/* Intro Box */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600">
        Sevikaa connects household employers with verified domestic workers directly. Getting started takes under 2 minutes.
      </div>

      {/* For Employers */}
      <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#1A73E8] text-[9px] font-black uppercase tracking-wider">
          🔵 For Employers
        </span>
        <div className="space-y-2.5">
          {employerSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs">
              <div className="p-1.5 rounded-xl bg-white border border-blue-100 shrink-0 mt-0.5">{step.icon}</div>
              <div className="space-y-0.5">
                <p className="font-black text-slate-900">{step.step}: {step.title}</p>
                <p className="text-[11px] text-slate-600 font-medium">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* For Workers */}
      <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#34A853] text-[9px] font-black uppercase tracking-wider">
          🟢 For Domestic Workers (100% Free)
        </span>
        <div className="space-y-2.5">
          {workerSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs">
              <div className="p-1.5 rounded-xl bg-white border border-emerald-100 shrink-0 mt-0.5">{step.icon}</div>
              <div className="space-y-0.5">
                <p className="font-black text-slate-900">{step.step}: {step.title}</p>
                <p className="text-[11px] text-slate-600 font-medium">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support Callout */}
      <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
        <span>Want to learn more about Sevikaa?</span>
        <Link href="/about" className="text-[#1A73E8] hover:underline shrink-0">About Sevikaa →</Link>
      </div>

    </div>
  );
}
