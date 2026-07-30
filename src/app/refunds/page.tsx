"use client";

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { RefreshCw, CheckCircle2, AlertCircle, Banknote, Clock } from 'lucide-react';

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">
        
        {/* Refunds Hero */}
        <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/80 py-16 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase shadow-sm">
              <RefreshCw size={14} className="text-[#34A853]" /> Billing Policy
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">Refund &amp; Cancellation Policy</h1>
            <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed">
              Transparent, fair rules regarding employer hiring subscriptions and Razorpay payment transactions.
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 text-slate-700 leading-relaxed text-sm">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
              This policy explains subscription cancellations and refund handling for payments made on Sevikaa (operated by <strong className="text-slate-900">YugaYatra Retail (OPC) Private Limited</strong>).
            </div>

            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">1</span>
                Worker Registration (100% Free)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Domestic worker registration, profile creation, and job applications are completely free. No fees or commissions are ever charged to workers.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center text-xs">2</span>
                Employer Subscriptions &amp; Refund Eligibility
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Refunds are reviewed on a case-by-case basis. You are eligible for a 100% full refund if:
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
                  A duplicate payment charge occurred due to a bank/gateway network glitch.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
                  A technical system issue prevented activation of your purchased hiring plan.
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xs">3</span>
                Refund Timeline &amp; Processing
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Approved refunds are credited directly back to the original payment method (Bank / UPI / Card) within <strong>5–7 business days</strong>.
              </p>
            </div>

            {/* Support footer */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Have a payment discrepancy?</span>
              <Link href="/contact" className="text-[#1A73E8] hover:underline">Contact Billing Desk →</Link>
            </div>

          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
