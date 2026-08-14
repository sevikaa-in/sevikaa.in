"use client";

import React from 'react';
import Link from 'next/link';
import { Zap, CheckCircle2, Server, Clock } from 'lucide-react';

export function ShippingContent() {
  return (
    <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
      
      {/* Intro Box */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600">
        Sevikaa (operated by <strong className="text-slate-900">YugaYatra Retail (OPC) Private Limited</strong>) delivers services digitally. No physical goods or packages are shipped.
      </div>

      {/* Section 1 */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center text-xs shrink-0">1</span>
          Instant Digital Fulfillment
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Upon successful payment via Razorpay, your employer hiring subscription is activated instantly.
        </p>
        <ul className="space-y-2 text-xs font-semibold text-slate-600 pt-1">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
            <span>Instant contact unlocking for verified candidates in your society.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
            <span>Automated PDF Tax Invoice generation sent via email and available in account settings.</span>
          </li>
        </ul>
      </div>

      {/* Section 2 */}
      <div className="space-y-3 border-t border-slate-100 pt-5">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xs shrink-0">2</span>
          Service Fulfillment SLA (1–2 Seconds)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          99% of subscription activations occur within <strong>1–2 seconds</strong> of payment completion. In rare cases of bank network latency, activation completes within 1–2 hours.
        </p>
      </div>

      {/* Support Callout */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
        <span>Need help with digital service access?</span>
        <Link href="/contact" className="text-[#1A73E8] hover:underline shrink-0">Contact Customer Care →</Link>
      </div>

    </div>
  );
}
