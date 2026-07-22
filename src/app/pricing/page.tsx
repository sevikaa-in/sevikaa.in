import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto w-full border-x border-gray-200">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <img src="/logo.png" alt="Sevikaa Logo" className="h-10 w-auto object-contain" />
        </div>
        <span className="font-extrabold text-sm tracking-tight text-gray-500 uppercase">Pricing</span>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#202124]">Simple, Transparent Pricing</h1>
          <p className="text-xs text-gray-500 font-semibold leading-normal">
            Free for domestic workers. Affordable premium features for employers.
          </p>
        </div>

        {/* Workers Plan (Free) */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:border-[#34A853] hover:shadow-lg hover:shadow-green-100/50 cursor-pointer shadow-sm">
          <div className="space-y-4">
            <div>
              <span className="bg-[#34A853]/10 text-[#34A853] text-[9px] font-bold px-2.5 py-0.5 rounded-full">🟢 For Domestic Workers</span>
              <h3 className="text-base font-extrabold text-gray-700 mt-3">Always Free</h3>
              <div className="text-3xl font-black text-gray-800 mt-1">
                <sup className="text-lg font-bold">₹</sup>0
              </div>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal font-semibold">
                Everything you need to find your next job—at no cost.
              </p>
            </div>
            <ul className="text-xs text-gray-500 space-y-2 border-t border-gray-100 pt-4 font-semibold">
              <li className="flex items-center gap-1.5"><Check size={14} className="text-[#34A853] shrink-0" /> Create your verified profile</li>
              <li className="flex items-center gap-1.5"><Check size={14} className="text-[#34A853] shrink-0" /> Apply for unlimited job opportunities</li>
              <li className="flex items-center gap-1.5"><Check size={14} className="text-[#34A853] shrink-0" /> Update your skills & availability anytime</li>
              <li className="flex items-center gap-1.5"><Check size={14} className="text-[#34A853] shrink-0" /> Receive interview requests from employers</li>
              <li className="flex items-center gap-1.5"><Check size={14} className="text-[#34A853] shrink-0" /> Multilingual profile support</li>
            </ul>
          </div>
          <Link
            href="/?role=worker"
            className="w-full py-3 mt-6 text-center text-xs font-bold rounded-2xl border-2 border-[#34A853] text-[#34A853] hover:bg-[#34A853] hover:text-white transition-all active:scale-[0.98] block"
          >
            Register for Free
          </Link>
        </div>

        {/* Employers Plan (Premium) */}
        <div className="bg-white rounded-3xl border-2 border-[#1A73E8] p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-100/50 cursor-pointer relative shadow-md">
          <div className="absolute -top-3 right-6 bg-gradient-to-r from-[#1A73E8] to-[#9b51e0] text-white text-[9px] font-black px-3.5 py-1 rounded-full shadow-sm uppercase tracking-wide">
            Popular
          </div>
          <div className="space-y-4">
            <div>
              <span className="bg-[#1A73E8]/10 text-[#1A73E8] text-[9px] font-bold px-2.5 py-0.5 rounded-full">🔵 For Employers</span>
              <h3 className="text-base font-extrabold text-gray-700 mt-3">Premium Pass</h3>
              <div className="text-3xl font-black text-gray-800 mt-1">
                <sup className="text-lg font-bold">₹</sup>999<span className="text-xs text-gray-400 font-medium">/30 Days</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal font-semibold">
                Everything you need to hire trusted domestic workers with confidence.
              </p>
            </div>
            <ul className="text-xs text-gray-500 space-y-2 border-t border-gray-100 pt-4 font-semibold">
              <li className="flex items-center gap-1.5"><Check size={14} className="text-[#1A73E8] shrink-0" /> View unlimited verified worker profiles</li>
              <li className="flex items-center gap-1.5"><Check size={14} className="text-[#1A73E8] shrink-0" /> Unlock Call & WhatsApp contact details</li>
              <li className="flex items-center gap-1.5"><Check size={14} className="text-[#1A73E8] shrink-0" /> Smart society-based worker matching</li>
              <li className="flex items-center gap-1.5"><Check size={14} className="text-[#1A73E8] shrink-0" /> Post unlimited job requirements</li>
              <li className="flex items-center gap-1.5"><Check size={14} className="text-[#1A73E8] shrink-0" /> Priority support during your subscription</li>
            </ul>
          </div>
          <Link
            href="/?role=employer"
            className="w-full py-3 mt-6 text-center text-xs font-bold rounded-2xl bg-[#1A73E8] text-white hover:bg-[#155cb4] transition-all shadow-md shadow-blue-200/50 active:scale-[0.98] block"
          >
            Get Premium Pass
          </Link>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-center text-[10px] text-gray-400">
        Powered by YugaYatra Retail (OPC) Private Limited
      </footer>
    </div>
  );
}
