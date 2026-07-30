"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  HelpCircle, ChevronDown, User, MapPin, Shield,
  CreditCard, Lock, ArrowRight, MessageSquare, Sparkles
} from 'lucide-react';

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const faqs = [
    {
      q: "Is Sevikaa free for domestic workers?",
      a: "Yes. Registration is completely free for maids, cooks, nannies, and drivers. Workers can create a verified profile, showcase skills & shifts, update availability, and receive direct job calls from families without any registration fee.",
      tag: "Worker",
      tagIcon: <User size={12} className="text-[#34A853]" />
    },
    {
      q: "How does Sevikaa match workers and employers?",
      a: "Sevikaa uses intelligent society-based matching to pair household employers with verified workers residing in or already working at the exact same apartment complex or nearby gated societies based on skills, shifts, and salary expectations.",
      tag: "Matching",
      tagIcon: <MapPin size={12} className="text-[#1A73E8]" />
    },
    {
      q: "Are all worker profiles verified?",
      a: "Yes. Workers undergo an identity check with government-issued Aadhaar ID before receiving the official Sevikaa Verified Badge. Additional badges, such as Police Clearance Certificates (PCC), are displayed on verified profiles.",
      tag: "Safety",
      tagIcon: <Shield size={12} className="text-purple-600" />
    },
    {
      q: "When do employers get workers' contact details?",
      a: "Employers can securely unlock verified contact numbers immediately after activating a Hiring Plan subscription, allowing direct phone calls or WhatsApp messages with zero agency fees.",
      tag: "Subscription",
      tagIcon: <CreditCard size={12} className="text-amber-600" />
    },
    {
      q: "Is my personal information safe?",
      a: "Yes. Sensitive details such as exact flat numbers, full home addresses, and identity document images are strictly protected and never publicly exposed.",
      tag: "Privacy",
      tagIcon: <Lock size={12} className="text-red-500" />
    },
    {
      q: "Can I update my profile after registration?",
      a: "Yes. Workers can update their skills, experience, preferred society locations, salary expectations, and shift timings anytime. Employers can edit hiring postings and account settings in real time.",
      tag: "Worker",
      tagIcon: <User size={12} className="text-[#34A853]" />
    },
    {
      q: "Can employers hire multiple workers on one plan?",
      a: "Yes. Employers can post multiple job listings and connect with as many verified workers as needed during their active hiring subscription period.",
      tag: "Subscription",
      tagIcon: <CreditCard size={12} className="text-amber-600" />
    },
    {
      q: "What happens after I find a suitable candidate?",
      a: "Workers and employers connect directly to discuss specific job duties, conduct interviews, and finalize employment agreements with zero agency commissions.",
      tag: "Matching",
      tagIcon: <MapPin size={12} className="text-[#1A73E8]" />
    }
  ];

  const tags = ['All', 'Worker', 'Subscription', 'Safety', 'Matching', 'Privacy'];

  const filteredFaqs = selectedTag === 'All'
    ? faqs
    : faqs.filter(f => f.tag.toLowerCase() === selectedTag.toLowerCase());

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">

        {/* ── HERO ─────────────────────────────── */}
        <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/80 py-16 sm:py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#1A73E8] border border-blue-200 text-xs font-black uppercase tracking-wider shadow-sm">
              <HelpCircle size={13} className="text-[#1A73E8]" /> Help Center &amp; FAQ
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
              Frequently Asked Questions
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed">
              Find clear, instant answers regarding worker verification, employer hiring plans, society matching, and privacy standards.
            </p>
          </div>
        </section>

        {/* ── MAIN FAQ ACCORDION SECTION ───────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-[#1A73E8] text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:border-[#1A73E8] hover:text-[#1A73E8]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Accordion List */}
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? 'border-2 border-[#1A73E8] shadow-lg shadow-blue-500/10'
                      : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-black uppercase flex items-center gap-1 shrink-0 border border-slate-200/60">
                        {faq.tagIcon} {faq.tag}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">{faq.q}</h3>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-[#1A73E8]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100">
                      <p className="pt-3">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Still Have Questions Banner */}
          <div className="bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/80 border-2 border-slate-200/80 rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-sm">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-black text-slate-700 shadow-sm">
              <MessageSquare size={13} className="text-[#1A73E8]" /> 24/7 Support Team
            </div>
            <h3 className="text-2xl font-black text-slate-900">Still Have Questions?</h3>
            <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-lg mx-auto leading-relaxed">
              If you couldn&apos;t find an answer to your question, feel free to send a direct message to our support team.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 py-3.5 px-7 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <span>Contact Support Team</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
