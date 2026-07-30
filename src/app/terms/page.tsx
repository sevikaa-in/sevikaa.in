"use client";

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { FileText, CheckCircle2, ShieldAlert, Scale, Building2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">
        
        {/* Header Hero */}
        <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/80 py-16 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#1A73E8] border border-blue-200 text-xs font-black uppercase shadow-sm">
              <FileText size={14} className="text-[#1A73E8]" /> Legal Agreement
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">Terms &amp; Conditions</h1>
            <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed">
              Last Updated: January 2026 | Platform Terms of Service governing Sevikaa platform usage.
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 text-slate-700 leading-relaxed text-sm">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
              Welcome to Sevikaa, a digital platform owned and operated by <strong className="text-slate-900">YugaYatra Retail (OPC) Private Limited</strong>. By registering, accessing, or using Sevikaa, you agree to comply with these Terms &amp; Conditions.
            </div>

            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center text-xs">1</span>
                Eligibility &amp; Account Registration
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Users must provide accurate, current, and truthful information during registration.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
                  Domestic helpers must upload authentic government Aadhaar identity documents for profile verification.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
                  Employers must state genuine household requirements and residential society details.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
                  Any misrepresentation or impersonation will result in immediate account termination.
                </li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">2</span>
                Profile Verification &amp; Badge Standard
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Sevikaa verifies profile identity to build trust across gated residential communities.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  Verification badges signify document authenticity but do not constitute employment guarantees.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  Employers remain responsible for interviewing and assessing candidates prior to hiring.
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xs">3</span>
                Subscription Fees &amp; Payments
              </h2>
              <ul className="space-y-2 text-xs font-semibold text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  Helper registration and job applications are 100% free with zero salary commissions.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  Employers purchase hiring subscription plans to unlock candidate contact details.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  All payments include 18% GST and are processed securely via authorized gateways.
                </li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xs">4</span>
                Limitation of Liability &amp; Governing Law
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Sevikaa provides a digital matchmaking platform. Employment contracts, salary negotiations, and work terms are established directly between the employer and the worker. Sevikaa is not liable for disputes arising after parties connect.
              </p>
              <p className="text-xs text-slate-500 font-semibold pt-1">
                These terms are governed by the laws of India. Courts in Bengaluru, Karnataka have exclusive jurisdiction.
              </p>
            </div>

            {/* Support footer */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Have questions about our Terms of Service?</span>
              <Link href="/contact" className="text-[#1A73E8] hover:underline">Contact Support →</Link>
            </div>

          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
