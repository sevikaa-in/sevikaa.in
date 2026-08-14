"use client";

import React from 'react';
import Link from 'next/link';
import { RefreshCw, CheckCircle2, AlertCircle, Banknote, Clock } from 'lucide-react';

export function RefundsContent() {
  return (
    <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
      
      {/* Intro Box */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-600">
        This policy explains subscription cancellations and refund handling for payments made on Sevikaa (operated by <strong className="text-slate-900">YugaYatra Retail (OPC) Private Limited</strong>).
      </div>

      {/* Section 1 */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs shrink-0">1</span>
          Worker Registration (100% Free)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Domestic worker registration, profile creation, and job applications are completely free. No fees or commissions are ever charged to workers.
        </p>
      </div>

      {/* Section 2 */}
      <div className="space-y-3 border-t border-slate-100 pt-5">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center text-xs shrink-0">2</span>
          Employer Subscriptions &amp; Refund Eligibility
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Refunds are reviewed on a case-by-case basis. You are eligible for a 100% full refund if:
        </p>
        <ul className="space-y-2 text-xs font-semibold text-slate-600 pt-1">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
            <span>A duplicate payment charge occurred due to a bank/gateway network glitch.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
            <span>A technical system issue prevented activation of your purchased hiring plan.</span>
          </li>
        </ul>
      </div>

      {/* Section 3 */}
      <div className="space-y-3 border-t border-slate-100 pt-5">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xs shrink-0">3</span>
          Refund Processing SLA (5–7 Days)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          Approved refunds are credited directly back to the original payment method (Bank Account / UPI / Card) within <strong>5–7 business days</strong>.
        </p>
      </div>

      {/* Support Callout */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
        <span>Have a payment discrepancy?</span>
        <Link href="/contact" className="text-[#1A73E8] hover:underline shrink-0">Contact Billing Desk →</Link>
      </div>

    </div>
  );
}
