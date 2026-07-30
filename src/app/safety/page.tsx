"use client";

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  ShieldCheck, Lock, FileCheck2, Building2,
  CheckCircle2, AlertTriangle, ArrowRight, UserCheck, Sparkles
} from 'lucide-react';

const safetyPillars = [
  {
    title: 'Aadhaar Identity Verification',
    badge: 'Government ID Audit',
    desc: 'Every verified domestic worker must submit valid front & back photos of their Aadhaar card, cross-checked with profile details before receiving the official Sevikaa Verified Badge.',
    icon: <ShieldCheck size={22} />,
    iconBg: 'bg-emerald-50 text-[#34A853] border-emerald-100',
    hoverBorder: 'hover:border-[#34A853] hover:shadow-emerald-500/10',
    checks: [
      'Aadhaar card front & back photo upload',
      'Profile name cross-matched with Aadhaar',
      'Verified Badge issued after manual review',
    ],
  },
  {
    title: 'Police Clearance Certificate',
    badge: 'Background Check',
    desc: 'Workers can voluntarily submit a valid Police Clearance Certificate (PCC) issued by their local police station to earn an additional Police Clearance Verified badge on their profile.',
    icon: <FileCheck2 size={22} />,
    iconBg: 'bg-blue-50 text-[#1A73E8] border-blue-100',
    hoverBorder: 'hover:border-[#1A73E8] hover:shadow-blue-500/10',
    checks: [
      'PCC document uploaded by worker',
      'Document reviewed before badge is shown',
      'Separate badge displayed on profile',
    ],
  },
  {
    title: 'Privacy-First Architecture',
    badge: 'Data Protection',
    desc: 'Exact home addresses, phone numbers, and GPS locations are never exposed publicly. Employer contact is only unlocked after a verified subscription plan is activated.',
    icon: <Lock size={22} />,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    hoverBorder: 'hover:border-amber-400 hover:shadow-amber-500/10',
    checks: [
      'Phone numbers hidden until employer subscribes',
      'Exact GPS location never publicly shown',
      'No data sold or shared with third parties',
    ],
  },
  {
    title: 'Society Gate Pass Mapping',
    badge: 'Location Verification',
    desc: 'Workers are mapped to specific gated societies where they already hold active entry permissions or gate passes — making neighbourhood hiring trustworthy and instant.',
    icon: <Building2 size={22} />,
    iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    hoverBorder: 'hover:border-purple-400 hover:shadow-purple-500/10',
    checks: [
      'Society gate pass or entry slip uploaded',
      'Worker mapped to verified society zone',
      'Employers see proximity match instantly',
    ],
  },
];

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">

        {/* ── HERO ─────────────────────────────── */}
        <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/80 py-16 sm:py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider shadow-sm">
              <ShieldCheck size={13} className="text-[#34A853]" /> Trust &amp; Safety Standards
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
              Safety &amp;{' '}
              <span className="bg-gradient-to-r from-[#34A853] via-emerald-600 to-[#1A73E8] bg-clip-text text-transparent">
                Identity Verification
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed">
              Sevikaa uses multi-tier verification, strict privacy controls, and society-level audits to ensure every connection is safe, trusted, and dignified.
            </p>
          </div>
        </section>

        {/* ── 4-PILLAR GRID ────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {safetyPillars.map((item, i) => (
              <div
                key={i}
                className={`bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl space-y-5 ${item.hoverBorder}`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl border ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <span className="text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                    {item.badge}
                  </span>
                </div>

                {/* Title & desc */}
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                </div>

                {/* Checklist */}
                <ul className="space-y-2">
                  {item.checks.map((c, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                      <CheckCircle2 size={15} className="text-[#34A853] shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── SAFETY NOTICE ────────────────────── */}
          <div className="bg-amber-50 border-2 border-amber-200/80 rounded-3xl p-7 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="p-3.5 rounded-2xl bg-amber-100 text-amber-700 shrink-0 border border-amber-200">
              <AlertTriangle size={22} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-amber-950">Important Safety Reminder for Employers</h4>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 border border-amber-300">Advisory</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-amber-900 leading-relaxed">
                While Sevikaa verifies government IDs and performs profile audits, we strongly advise employers to conduct standard face-to-face interviews, verify original physical documents, and check previous employer references — especially before offering full-time, live-in, or child care employment.
              </p>
            </div>
          </div>

          {/* ── CTA STRIP ────────────────────────── */}
          <div className="bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/80 border-2 border-slate-200/80 rounded-3xl p-7 sm:p-9 text-center space-y-5 shadow-sm">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-black text-slate-700 shadow-sm">
              <Sparkles size={13} className="text-[#1A73E8]" /> Verified by Sevikaa
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Hire or Work with Total Confidence
            </h2>
            <p className="text-sm text-slate-600 font-semibold max-w-xl mx-auto leading-relaxed">
              Every profile on Sevikaa has passed identity verification. Start your verified connection today.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <Link
                href="/?role=employer"
                className="py-3 px-6 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-1.5"
              >
                Hire Verified Help <ArrowRight size={13} />
              </Link>
              <Link
                href="/?role=worker"
                className="py-3 px-6 bg-white text-[#34A853] border-2 border-emerald-300 hover:border-[#34A853] rounded-2xl text-xs font-black shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              >
                Get Verified as Worker <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
