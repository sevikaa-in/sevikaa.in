"use client";

import React from 'react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { FaqContent } from '@/components/legal/policies/FaqContent';
import { HelpCircle } from 'lucide-react';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">

        {/* Hero */}
        <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/80 py-12 sm:py-16 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#1A73E8] border border-blue-200 text-xs font-black uppercase shadow-sm">
              <HelpCircle size={14} className="text-[#1A73E8]" /> Help Center
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">Frequently Asked Questions</h1>
            <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed">
              Common questions on subscriptions, worker hiring, and profile verification.
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
            <FaqContent />
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
