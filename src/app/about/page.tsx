"use client";

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  Shield, ShieldCheck, MapPin, Lock, Globe, Heart,
  Award, Users, CheckCircle2, Building2, Sparkles, ArrowRight, Star
} from 'lucide-react';

const pillars = [
  {
    title: '100% Verified Profiles',
    desc: 'Real photos, verified Aadhaar, confirmed contact details, and government-backed background audit badges on every profile.',
    icon: <ShieldCheck size={22} />,
    iconBg: 'bg-blue-50 text-[#1A73E8] border-blue-100',
    hoverBorder: 'hover:border-[#1A73E8] hover:shadow-blue-500/10',
    badge: 'Identity Assurance',
  },
  {
    title: 'Gated Society Matching',
    desc: 'Smart location engine pairs workers and employers from the exact same apartment complex or nearby societies — no strangers.',
    icon: <MapPin size={22} />,
    iconBg: 'bg-red-50 text-[#EA4335] border-red-100',
    hoverBorder: 'hover:border-[#EA4335] hover:shadow-red-500/10',
    badge: 'Smart Location',
  },
  {
    title: 'Privacy-First Architecture',
    desc: 'Exact home addresses, phone numbers, and GPS coordinates remain strictly protected until a verified hiring connection is confirmed.',
    icon: <Lock size={22} />,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    hoverBorder: 'hover:border-amber-400 hover:shadow-amber-500/10',
    badge: 'Data Protection',
  },
  {
    title: 'Multilingual Platform',
    desc: 'Full support for English, Hindi, Kannada, Telugu, Bengali, and Tamil — built for every Indian household and domestic worker.',
    icon: <Globe size={22} />,
    iconBg: 'bg-emerald-50 text-[#34A853] border-emerald-100',
    hoverBorder: 'hover:border-[#34A853] hover:shadow-emerald-500/10',
    badge: '6 Languages',
  },
  {
    title: 'Fair Wages & Dignity',
    desc: 'Transparent salary benchmarks ensure workers receive fair compensation. No hidden cuts, no exploitation — just dignified employment.',
    icon: <Heart size={22} />,
    iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    hoverBorder: 'hover:border-purple-400 hover:shadow-purple-500/10',
    badge: 'Ethical Standards',
  },
  {
    title: 'Zero Commission Model',
    desc: 'Direct connections between families and workers with absolutely zero middleman fees or agency commissions deducted from salaries.',
    icon: <Users size={22} />,
    iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    hoverBorder: 'hover:border-cyan-400 hover:shadow-cyan-500/10',
    badge: '0% Commission',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">

        {/* ── HERO ─────────────────────────────── */}
        <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/80 py-16 sm:py-24 px-4 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider shadow-sm">
              <Award size={14} className="text-[#34A853]" /> DPIIT Recognized Startup
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
              Empowering India's{' '}
              <span className="bg-gradient-to-r from-[#1A73E8] via-indigo-600 to-[#34A853] bg-clip-text text-transparent">
                Domestic Workforce
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed">
              Sevikaa bridges the gap between gated society families and verified domestic workers — cooks, maids, nannies, and drivers — with trust, security, and fair employment.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/?role=employer"
                className="py-3 px-6 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-1.5"
              >
                Hire Verified Help <ArrowRight size={14} />
              </Link>
              <Link
                href="/?role=worker"
                className="py-3 px-6 bg-white text-slate-900 border-2 border-slate-200 hover:border-[#34A853] hover:text-[#34A853] rounded-2xl text-xs font-black shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              >
                Join as Worker <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── MISSION + SAFETY GRID ────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Who is Sevikaa */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-5 hover:border-[#1A73E8] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-50 text-[#1A73E8] border border-blue-100">
                  <Sparkles size={22} />
                </div>
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-blue-50 text-[#1A73E8] border border-blue-100 tracking-wider">Our Mission</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">Who is Sevikaa?</h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Sevikaa is a trusted digital platform designed specifically for Indian residential societies. By combining strict identity verification with smart location-based matching, we make hiring safer, faster, and more dignified for both domestic workers and employers.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Whether you&apos;re searching for dependable household help or looking for nearby employment opportunities in gated societies, Sevikaa connects families and workers with total confidence.
              </p>
              <div className="pt-1">
                <Link href="/how-it-works" className="inline-flex items-center gap-1.5 text-xs font-black text-[#1A73E8] hover:underline">
                  See how it works <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Commitment to Safety */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-5 hover:border-[#34A853] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 text-[#34A853] border border-emerald-100">
                  <Shield size={22} />
                </div>
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 tracking-wider">Trust & Safety</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">Commitment to Safety</h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Every domestic worker profile undergoes rigorous multi-step verification before receiving the official{' '}
                <strong className="text-[#34A853] font-black">Sevikaa Verified Badge</strong>.
              </p>
              <ul className="space-y-3 pt-1">
                {[
                  'Government Aadhaar Identity Verification',
                  'Police Clearance Certificate (PCC) Audit',
                  'In-person Interview & Skill Assessment',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                    <CheckCircle2 size={17} className="text-[#34A853] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-1">
                <Link href="/safety" className="inline-flex items-center gap-1.5 text-xs font-black text-[#34A853] hover:underline">
                  View safety standards <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* ── WHY CHOOSE SEVIKAA ─────────────── */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider shadow-sm mb-2">
                <Star size={12} className="text-amber-500" /> Platform Advantages
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Why Choose Sevikaa?</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-lg mx-auto">Designed to elevate domestic help standards across India's gated communities</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillars.map((item, i) => (
                <div
                  key={i}
                  className={`bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl space-y-4 cursor-default ${item.hoverBorder}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl border ${item.iconBg}`}>
                      {item.icon}
                    </div>
                    <span className="text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                      {item.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-snug">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-2">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA STRIP ──────────────────────── */}
          <div className="bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/80 rounded-3xl border-2 border-slate-200/80 p-8 sm:p-10 text-center space-y-5 shadow-sm">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-slate-700 border border-slate-200 text-xs font-black shadow-sm">
              <Building2 size={14} className="text-[#1A73E8]" />
              500+ Partner Gated Communities Across India
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Ready to Experience the Sevikaa Difference?
            </h2>
            <p className="text-sm text-slate-600 font-semibold max-w-xl mx-auto leading-relaxed">
              Whether you need trusted household help or a verified job nearby — join thousands of families and workers already connected through Sevikaa.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/?role=employer"
                className="py-3.5 px-7 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-sm font-black shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
              >
                Start Hiring Today <ArrowRight size={15} />
              </Link>
              <Link
                href="/?role=worker"
                className="py-3.5 px-7 bg-white text-[#34A853] border-2 border-emerald-300 hover:border-[#34A853] rounded-2xl text-sm font-black shadow-sm transition-all active:scale-95 flex items-center gap-2"
              >
                Register as Worker <ArrowRight size={15} />
              </Link>
            </div>
          </div>

        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
