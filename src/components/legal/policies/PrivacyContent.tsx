"use client";

import React from 'react';
import Link from 'next/link';
import { Lock, ShieldCheck, CheckCircle2, EyeOff, KeyRound } from 'lucide-react';

export function PrivacyContent() {
  return (
    <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
      
      {/* Intro Box */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600">
        At Sevikaa (operated by <strong className="text-slate-900">YugaYatra Retail (OPC) Private Limited</strong>), we respect your privacy. This policy details our data protection practices for domestic helpers and household employers.
      </div>

      {/* Section 1 */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center text-xs shrink-0">1</span>
          Information We Collect
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          To provide safe matchmaking between workers and employers, we collect:
        </p>
        <ul className="space-y-2 text-xs font-semibold text-slate-600 pt-1">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
            <span><strong>Account Profile Info:</strong> Full Name, Mobile Number, Email Address.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
            <span><strong>Verification Documents:</strong> Aadhaar card images (stored securely in private encrypted storage).</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
            <span><strong>Work Preferences:</strong> Skills, salary expectations, preferred gated societies.</span>
          </li>
        </ul>
      </div>

      {/* Section 2 */}
      <div className="space-y-3 border-t border-slate-100 pt-5">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs shrink-0">2</span>
          How We Protect &amp; Mask Your Data
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          We enforce strict privacy controls on our platform:
        </p>
        <ul className="space-y-2 text-xs font-semibold text-slate-600 pt-1">
          <li className="flex items-start gap-2">
            <EyeOff size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>Exact residential flat addresses and GPS coordinates are NEVER publicly displayed.</span>
          </li>
          <li className="flex items-start gap-2">
            <KeyRound size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>Phone numbers remain masked until an employer unlocks verified access via an active subscription plan.</span>
          </li>
        </ul>
      </div>

      {/* Section 3 */}
      <div className="space-y-3 border-t border-slate-100 pt-5">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xs shrink-0">3</span>
          Your Data Rights
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          You maintain complete control over your account details. You can request profile updates or account deletion anytime by contacting <strong>support@sevikaa.in</strong>.
        </p>
      </div>

      {/* Support Callout */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
        <span>Questions regarding data privacy?</span>
        <Link href="/contact" className="text-[#1A73E8] hover:underline shrink-0">Contact Privacy Officer →</Link>
      </div>

    </div>
  );
}
