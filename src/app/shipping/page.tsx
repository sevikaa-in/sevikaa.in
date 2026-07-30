"use client";

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Zap, CheckCircle2, Server, Clock } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">
        
        {/* Shipping Hero */}
        <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/80 py-16 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#1A73E8] border border-blue-200 text-xs font-black uppercase shadow-sm">
              <Zap size={14} className="text-[#1A73E8]" /> Instant Digital Fulfilment
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">Shipping &amp; Service Delivery Policy</h1>
            <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed">
              Sevikaa is an online platform. All services and subscription benefits are delivered instantly electronically.
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 text-slate-700 leading-relaxed text-sm">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
              Sevikaa (operated by <strong className="text-slate-900">YugaYatra Retail (OPC) Private Limited</strong>) delivers services digitally. No physical goods or packages are shipped.
            </div>

            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center text-xs">1</span>
                Instant Digital Delivery
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Upon successful payment via Razorpay, your employer hiring subscription is activated instantly.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-600 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
                  Instant contact unlocking for verified candidates in your society.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 mt-0.5" />
                  Automated PDF Tax Invoice generation sent via email and available in account settings.
                </li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xs">2</span>
                Service Fulfilment Timeline
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                99% of subscription activations occur within <strong>1–2 seconds</strong> of payment completion. In rare cases of bank network latency, activation completes within 1–2 hours.
              </p>
            </div>

            {/* Support footer */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Need help with digital service access?</span>
              <Link href="/contact" className="text-[#1A73E8] hover:underline">Contact Customer Care →</Link>
            </div>

          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
