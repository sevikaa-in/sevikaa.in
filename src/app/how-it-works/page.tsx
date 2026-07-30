"use client";

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  UserPlus, Search, PhoneCall, ShieldCheck,
  CalendarCheck, ArrowRight, Sparkles, Building2, Lock
} from 'lucide-react';

const employerSteps = [
  {
    step: 'STEP 01',
    title: 'Post Your Requirement',
    desc: 'Specify your domestic help needs — type of role (cook, maid, nanny, driver), working hours, society location, and monthly budget.',
    icon: <UserPlus size={22} />,
    iconBg: 'bg-blue-50 text-[#1A73E8] border-blue-100',
  },
  {
    step: 'STEP 02',
    title: 'Browse Verified Candidates',
    desc: 'Explore profiles from verified helpers working in or near your exact gated society — with Aadhaar badges, PCC checks, and skill ratings.',
    icon: <Search size={22} />,
    iconBg: 'bg-blue-50 text-[#1A73E8] border-blue-100',
  },
  {
    step: 'STEP 03',
    title: 'Connect & Start Hiring',
    desc: 'Unlock verified contact numbers to call or WhatsApp candidates directly. Schedule home or gate interviews with zero middleman fees.',
    icon: <PhoneCall size={22} />,
    iconBg: 'bg-blue-50 text-[#1A73E8] border-blue-100',
  },
];

const workerSteps = [
  {
    step: 'STEP 01',
    title: 'Free Registration',
    desc: 'Create your worker profile for free. Add your photo, preferred society locations, salary expectations, available shift timings, and skills.',
    icon: <UserPlus size={22} />,
    iconBg: 'bg-emerald-50 text-[#34A853] border-emerald-100',
  },
  {
    step: 'STEP 02',
    title: 'Get Verified & Build Trust',
    desc: 'Earn your official Sevikaa Verified Badge after Aadhaar identity check. Verified profiles receive significantly more direct interview requests.',
    icon: <ShieldCheck size={22} />,
    iconBg: 'bg-emerald-50 text-[#34A853] border-emerald-100',
  },
  {
    step: 'STEP 03',
    title: 'Receive Direct Job Calls',
    desc: 'Get interview requests directly from nearby society families. Choose jobs that match your preferred hours, location, and expected salary.',
    icon: <CalendarCheck size={22} />,
    iconBg: 'bg-emerald-50 text-[#34A853] border-emerald-100',
  },
];

const trustPoints = [
  { icon: <Lock size={16} />, text: 'Your contact info is always private until you connect' },
  { icon: <ShieldCheck size={16} />, text: 'All worker profiles are Aadhaar government-verified' },
  { icon: <Building2 size={16} />, text: 'Society-based matching — no strangers, only neighbours' },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">

        {/* ── HERO ─────────────────────────────── */}
        <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/80 py-16 sm:py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider shadow-sm">
              <Sparkles size={13} className="text-[#34A853]" /> Simple 3-Step Process
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
              How Sevikaa Works
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed">
              Whether you are a household employer or a domestic helper — getting started on Sevikaa takes under 2 minutes, entirely online.
            </p>
          </div>
        </section>

        {/* ── DUAL STREAM GRID ─────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">

            {/* ── FOR EMPLOYERS ── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              {/* Card Header */}
              <div className="p-7 border-b border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1A73E8] text-[10px] font-black uppercase border border-blue-100 tracking-wider">
                    🔵 For Household Employers
                  </span>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">Hire Help</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-snug">How Employers Hire Verified Help</h2>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Fast, transparent, direct hiring — zero agency involvement.</p>
              </div>

              {/* Steps */}
              <div className="p-7 space-y-7">
                {employerSteps.map((item, i) => (
                  <div key={i} className="flex items-start gap-5">
                    <div className="shrink-0 flex flex-col items-center">
                      <div className={`p-3 rounded-2xl border ${item.iconBg}`}>
                        {item.icon}
                      </div>
                      {i < employerSteps.length - 1 && (
                        <div className="w-px h-8 bg-blue-100 mt-2" />
                      )}
                    </div>
                    <div className="space-y-1 pt-1">
                      <span className="text-[9.5px] font-black uppercase text-[#1A73E8] tracking-wider">{item.step}</span>
                      <h3 className="text-base font-black text-slate-900 leading-snug">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-7 pb-7">
                <Link
                  href="/?role=employer"
                  className="w-full py-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white font-black text-xs rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Hire Verified Domestic Help <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* ── FOR WORKERS ── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
              {/* Card Header */}
              <div className="p-7 border-b border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase border border-emerald-100 tracking-wider">
                    🟢 For Domestic Helpers
                  </span>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">Find Jobs</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-snug">How Workers Get Direct Job Calls</h2>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">100% free registration. No commissions. Direct employer contact.</p>
              </div>

              {/* Steps */}
              <div className="p-7 space-y-7">
                {workerSteps.map((item, i) => (
                  <div key={i} className="flex items-start gap-5">
                    <div className="shrink-0 flex flex-col items-center">
                      <div className={`p-3 rounded-2xl border ${item.iconBg}`}>
                        {item.icon}
                      </div>
                      {i < workerSteps.length - 1 && (
                        <div className="w-px h-8 bg-emerald-100 mt-2" />
                      )}
                    </div>
                    <div className="space-y-1 pt-1">
                      <span className="text-[9.5px] font-black uppercase text-[#34A853] tracking-wider">{item.step}</span>
                      <h3 className="text-base font-black text-slate-900 leading-snug">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-7 pb-7">
                <Link
                  href="/?role=worker"
                  className="w-full py-3.5 bg-[#34A853] hover:bg-emerald-600 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Register as a Helper (Free) <ArrowRight size={15} />
                </Link>
              </div>
            </div>

          </div>

          {/* ── TRUST STRIP ─────────────────────── */}
          <div className="bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/80 border-2 border-slate-200/80 rounded-3xl p-7 sm:p-9 space-y-5 shadow-sm text-center">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Built on Privacy, Verification &amp; Trust</h2>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 pt-1">
              {trustPoints.map((tp, i) => (
                <div key={i} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                  <span className="p-2 rounded-xl bg-white border border-slate-200 text-[#1A73E8] shadow-sm">
                    {tp.icon}
                  </span>
                  {tp.text}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/safety"
                className="py-2.5 px-5 bg-white text-slate-800 border border-slate-200 hover:border-[#1A73E8] hover:text-[#1A73E8] rounded-2xl text-xs font-black shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              >
                View Safety Standards <ArrowRight size={13} />
              </Link>
              <Link
                href="/about"
                className="py-2.5 px-5 bg-white text-slate-800 border border-slate-200 hover:border-[#34A853] hover:text-[#34A853] rounded-2xl text-xs font-black shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              >
                Learn About Sevikaa <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
