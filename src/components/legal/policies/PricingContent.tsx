"use client";

import React from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle2, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

export function PricingContent() {
  const plans = [
    {
      name: 'Single Match',
      price: '₹299',
      duration: '7 Days Access',
      desc: 'Perfect for families seeking 1 specific domestic helper.',
      features: ['Unlock 3 Verified Candidate Contacts', 'Aadhaar & PCC Verification Badges', 'Direct Phone & WhatsApp Access', 'Zero Agency Commission'],
      badge: 'Popular'
    },
    {
      name: 'Quarterly Unlimited',
      price: '₹799',
      duration: '90 Days Access',
      desc: 'Ideal for busy households managing multiple domestic requirements.',
      features: ['Unlimited Candidate Contacts', 'Priority Society Matchmaking', 'Full Aadhaar & Police Clearance Badges', 'Tax Invoice PDF Included'],
      badge: 'Best Value'
    },
    {
      name: 'Annual Pro',
      price: '₹1,999',
      duration: '365 Days Access',
      desc: 'Complete 1-year peace of mind for luxury apartments & villas.',
      features: ['Unlimited Hiring & Replacements', 'Dedicated Relationship Manager', 'Priority Customer Helpline Support', 'GST 18% Invoice Tax Benefit'],
      badge: 'Enterprise'
    }
  ];

  return (
    <div className="space-y-5 text-slate-700 leading-relaxed text-sm">
      
      {/* Intro Box */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs font-medium text-slate-700 space-y-1">
        <p className="font-bold text-[#1A73E8] flex items-center gap-1.5">
          <Zap size={14} /> Transparent Employer Pricing
        </p>
        <p className="text-[11px] text-slate-600">
          Sevikaa charges <strong>zero commissions</strong> from worker salaries. Employers purchase hiring subscription plans to unlock verified contact details directly.
        </p>
      </div>

      {/* Subscription Plans Cards */}
      <div className="space-y-3">
        {plans.map((p, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900">{p.name}</h3>
                <span className="text-[10px] text-slate-400 font-semibold">{p.duration}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-[#1A73E8]">{p.price}</span>
                <span className="text-[9px] text-slate-400 block font-medium">+18% GST</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 font-medium">{p.desc}</p>

            <ul className="space-y-1 pt-1 border-t border-slate-100">
              {p.features.map((feat, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-700">
                  <CheckCircle2 size={12} className="text-[#34A853] shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div className="pt-1">
        <Link
          href="/pricing"
          className="w-full py-2.5 bg-[#1A73E8] hover:bg-blue-600 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
        >
          <span>Subscribe or Activate Plan</span>
          <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
}
