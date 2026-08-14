"use client";

import React from 'react';
import Link from 'next/link';
import { FileText, CheckCircle2, ShieldAlert, Scale, Building2 } from 'lucide-react';

export function TermsContent() {
  return (
    <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
      
      {/* Intro Box */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600">
        Welcome to Sevikaa, a digital platform owned and operated by <strong className="text-slate-900">YugaYatra Retail (OPC) Private Limited</strong>. By registering, accessing, or using Sevikaa, you agree to comply with these Terms &amp; Conditions.
      </div>

      {/* Section 1 */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center text-xs shrink-0">1</span>
          Eligibility &amp; Account Registration
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Users must provide accurate, current, and truthful information during registration.
        </p>
        <ul className="space-y-2 text-xs font-semibold text-slate-600 pt-1">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
            <span>Domestic helpers must upload authentic government Aadhaar identity documents for profile verification.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
            <span>Employers must state genuine household requirements and residential society details.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
            <span>Any misrepresentation or impersonation will result in immediate account termination.</span>
          </li>
        </ul>
      </div>

      {/* Section 2 */}
      <div className="space-y-3 border-t border-slate-100 pt-5">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs shrink-0">2</span>
          Profile Verification &amp; Badge Standard
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Sevikaa verifies profile identity to build trust across gated residential communities.
        </p>
        <ul className="space-y-2 text-xs font-semibold text-slate-600 pt-1">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>Verification badges signify document authenticity but do not constitute employment guarantees.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>Employers remain responsible for interviewing and assessing candidates prior to hiring.</span>
          </li>
        </ul>
      </div>

      {/* Section 3 */}
      <div className="space-y-3 border-t border-slate-100 pt-5">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xs shrink-0">3</span>
          Subscription Fees &amp; Payments
        </h2>
        <ul className="space-y-2 text-xs font-semibold text-slate-600">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>Helper registration and job applications are 100% free with zero salary commissions.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>Employers purchase hiring subscription plans to unlock candidate contact details.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>All payments include 18% GST and are processed securely via authorized gateways.</span>
          </li>
        </ul>
      </div>

      {/* Section 4 */}
      <div className="space-y-3 border-t border-slate-100 pt-5">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xs shrink-0">4</span>
          Limitation of Liability &amp; Governing Law
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          Sevikaa provides a digital matchmaking platform. Employment contracts, salary negotiations, and work terms are established directly between the employer and the worker. Sevikaa is not liable for disputes arising after parties connect.
        </p>
        <p className="text-xs text-slate-500 font-semibold pt-1">
          These terms are governed by the laws of India. Courts in Bengaluru, Karnataka have exclusive jurisdiction.
        </p>
      </div>

      {/* Support Callout */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
        <span>Have questions about our Terms of Service?</span>
        <Link href="/contact" className="text-[#1A73E8] hover:underline shrink-0">Contact Support →</Link>
      </div>

    </div>
  );
}
