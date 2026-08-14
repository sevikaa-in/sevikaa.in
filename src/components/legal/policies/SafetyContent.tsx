"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, FileCheck2, Building2, CheckCircle2 } from 'lucide-react';

export function SafetyContent() {
  const pillars = [
    {
      title: 'Aadhaar Identity Verification',
      badge: 'Government ID Audit',
      desc: 'Every verified domestic worker must submit valid front & back photos of their Aadhaar card, cross-checked with profile details before receiving the official Sevikaa Verified Badge.',
      icon: <ShieldCheck size={20} className="text-[#34A853]" />,
      badgeBg: 'bg-emerald-50 text-[#34A853] border-emerald-100',
    },
    {
      title: 'Police Clearance Certificate',
      badge: 'Background Check',
      desc: 'Workers can voluntarily submit a valid Police Clearance Certificate (PCC) issued by their local police station to earn an additional Police Clearance Verified badge.',
      icon: <FileCheck2 size={20} className="text-[#1A73E8]" />,
      badgeBg: 'bg-blue-50 text-[#1A73E8] border-blue-100',
    },
    {
      title: 'Privacy-First Architecture',
      badge: 'Data Protection',
      desc: 'Exact home addresses, phone numbers, and GPS locations are never exposed publicly. Employer contact is only unlocked after a verified subscription plan is activated.',
      icon: <Lock size={20} className="text-amber-600" />,
      badgeBg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: 'Society Gate Pass Mapping',
      badge: 'Location Verification',
      desc: 'Workers are mapped to specific gated societies where they already hold active entry permissions or gate passes — making neighbourhood hiring trustworthy and instant.',
      icon: <Building2 size={20} className="text-purple-600" />,
      badgeBg: 'bg-purple-50 text-purple-600 border-purple-100',
    },
  ];

  return (
    <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
      
      {/* Intro Box */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600">
        Sevikaa uses multi-tier verification, strict privacy controls, and society-level audits to ensure every connection is safe, trusted, and dignified.
      </div>

      {/* 4 Pillars */}
      <div className="grid grid-cols-1 gap-4">
        {pillars.map((p, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100">{p.icon}</div>
                <h3 className="text-xs font-black text-slate-900">{p.title}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase border ${p.badgeBg}`}>
                {p.badge}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {p.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Support Callout */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
        <span>Questions on safety audits?</span>
        <Link href="/contact" className="text-[#1A73E8] hover:underline shrink-0">Contact Safety Team →</Link>
      </div>

    </div>
  );
}
