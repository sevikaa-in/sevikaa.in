"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, User, MapPin, Shield, CreditCard, Lock, Search, Sparkles, Building2 } from 'lucide-react';

export function FaqContent() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const tags = ['All', 'Worker', 'Employer', 'Matching', 'Safety', 'Subscription', 'Privacy'];

  const faqs = [
    {
      q: "Is Sevikaa free for domestic workers?",
      a: "Yes. Registration is completely free for maids, cooks, nannies, and drivers. Workers create a verified profile, showcase skills & shifts, update availability, and receive direct job calls from families without any registration fee or salary commission.",
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
      a: "Yes. Workers can update their skills, experience, preferred society locations, salary expectations, and shift timings anytime inside account settings.",
      tag: "Worker",
      tagIcon: <User size={12} className="text-[#34A853]" />
    },
    {
      q: "Can employers hire multiple workers on one plan?",
      a: "Yes. Employers can post multiple job requisitions and connect with as many verified workers as needed during their active hiring subscription period.",
      tag: "Subscription",
      tagIcon: <CreditCard size={12} className="text-amber-600" />
    },
    {
      q: "What happens after I find a suitable candidate?",
      a: "Once an employer connects with a candidate, they can schedule an in-person interview or trial day directly. Sevikaa provides transparent contract guidelines and salary benchmarks.",
      tag: "Employer",
      tagIcon: <Building2 size={12} className="text-blue-600" />
    },
    {
      q: "How do I verify a worker's Aadhaar badge?",
      a: "Sevikaa verification officers manually review Aadhaar card images against profile registration details. The Verified Badge appears on candidate cards only after audit completion.",
      tag: "Safety",
      tagIcon: <Shield size={12} className="text-purple-600" />
    },
    {
      q: "Can workers apply for multiple jobs simultaneously?",
      a: "Yes. Workers can apply to multiple active job requisitions posted by families in their preferred gated societies without any limits.",
      tag: "Worker",
      tagIcon: <User size={12} className="text-[#34A853]" />
    },
    {
      q: "Are there any hidden agency fees?",
      a: "No. Sevikaa operates on a transparent model with zero commissions deducted from worker salaries and clear upfront subscription pricing for employers.",
      tag: "Subscription",
      tagIcon: <CreditCard size={12} className="text-amber-600" />
    },
    {
      q: "How do I report an issue or request data deletion?",
      a: "Users can request profile updates or permanent account/Aadhaar document deletion anytime by emailing support@sevikaa.in or using the self-service Data Erasure Request in Profile settings.",
      tag: "Privacy",
      tagIcon: <Lock size={12} className="text-red-500" />
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesTag = selectedTag === 'All' || faq.tag === selectedTag;
    const matchesSearch = searchQuery === '' || 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
      
      {/* Search Input */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search questions (e.g. Aadhaar, refund, salary)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold placeholder:text-slate-400 focus:outline-hidden focus:border-[#1A73E8] focus:bg-white transition-all"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer border ${
              selectedTag === tag
                ? 'bg-[#1A73E8] text-white border-[#1A73E8] shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 shadow-2xs">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="p-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full text-left flex items-center justify-between gap-2 font-black text-xs sm:text-sm text-slate-900 hover:text-[#1A73E8] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1 pr-2">
                    <span className="p-1 rounded-lg bg-slate-100 text-slate-600 shrink-0">{faq.tagIcon}</span>
                    <span>{faq.q}</span>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#1A73E8]' : ''}`} />
                </button>
                {isOpen && (
                  <p className="text-xs text-slate-600 font-medium leading-relaxed pt-1.5 border-t border-slate-100/80 pl-7">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 font-medium">
            No matching questions found for "{searchQuery}".
          </div>
        )}
      </div>

      {/* Support Callout */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
        <span>Still have questions?</span>
        <Link href="/contact" className="text-[#1A73E8] hover:underline shrink-0">Contact Support Team →</Link>
      </div>

    </div>
  );
}
