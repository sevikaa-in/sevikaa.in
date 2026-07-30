"use client";

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Lock, ShieldCheck, CheckCircle2, EyeOff, KeyRound } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">
        
        {/* Privacy Hero */}
        <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/80 py-16 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase shadow-sm">
              <Lock size={14} className="text-[#34A853]" /> Data Protection Policy
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">Privacy Policy</h1>
            <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed">
              Your privacy matters. Learn how Sevikaa collects, protects, and handles your personal information.
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 text-slate-700 leading-relaxed text-sm">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
              At Sevikaa (operated by <strong className="text-slate-900">YugaYatra Retail (OPC) Private Limited</strong>), we respect your privacy. This policy details our data protection practices for domestic helpers and household employers.
            </div>

            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center text-xs">1</span>
                Information We Collect
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                To provide safe matchmaking between workers and employers, we collect:
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
                  Account Profile Info: Full Name, Mobile Number, Email Address.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
                  Verification Documents: Aadhaar card images (stored securely in private encrypted storage).
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
                  Work Preferences: Skills, salary expectations, preferred gated societies.
                </li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">2</span>
                How We Protect &amp; Mask Your Data
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                We enforce strict privacy controls on our platform:
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 pt-1">
                <li className="flex items-start gap-2">
                  <EyeOff size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  Exact residential flat addresses and GPS coordinates are NEVER publicly displayed.
                </li>
                <li className="flex items-start gap-2">
                  <KeyRound size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  Phone numbers remain masked until an employer unlocks verified access via an active subscription plan.
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xs">3</span>
                Your Data Rights
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                You maintain complete control over your account details. You can request profile updates or account deletion anytime by contacting <strong>support@sevikaa.in</strong>.
              </p>
            </div>

            {/* Support footer */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Questions regarding data privacy?</span>
              <Link href="/contact" className="text-[#1A73E8] hover:underline">Contact Privacy Officer →</Link>
            </div>

          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
