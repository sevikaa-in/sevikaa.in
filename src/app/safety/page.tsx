"use client";

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { SafetyContent } from '@/components/legal/policies/SafetyContent';
import { ShieldCheck, Lock, FileCheck2, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">

        {/* ── HERO ─────────────────────────────── */}
        <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/80 py-12 sm:py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider shadow-sm">
              <ShieldCheck size={13} className="text-[#34A853]" /> Trust &amp; Safety Standards
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
              Safety &amp;{' '}
              <span className="bg-gradient-to-r from-[#34A853] via-emerald-600 to-[#1A73E8] bg-clip-text text-transparent">
                Identity Verification
              </span>
            </h1>
            <p className="text-xs sm:text-base text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed">
              Sevikaa uses multi-tier verification, strict privacy controls, and society-level audits to ensure every connection is safe, trusted, and dignified.
            </p>
          </div>
        </section>

        {/* ── 4-PILLAR CONTENT BODY ─────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
            <SafetyContent />
          </div>

          {/* CTA Banner */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">Ready to hire verified helpers in your society?</h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">Browse Aadhaar-verified candidate profiles today with zero agency commission.</p>
            </div>
            <Link
              href="/pricing"
              className="px-6 py-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-lg hover:shadow-blue-500/25 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Hiring Plans</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
