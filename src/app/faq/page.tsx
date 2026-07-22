'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, ChevronDown, User, MapPin, Shield, CreditCard, Lock } from 'lucide-react';

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { 
      q: "Is Sevikaa free for domestic workers?", 
      a: "Yes. Registration is completely free for maids, cooks, and nannies. Workers can create a verified profile, apply for jobs, update their availability, and receive interview requests without any registration fee.",
      tag: "Worker",
      colorClass: 'hover:border-[#34A853] hover:shadow-lg hover:shadow-green-100/50',
      activeBorderClass: 'border-[#34A853] shadow-md shadow-green-50/50',
      textAccent: 'group-hover:text-[#34A853]',
      tagClass: 'bg-[#34A853]/10 text-[#34A853] border-[#34A853]/20',
      tagIcon: <User size={8} />
    },
    { 
      q: "How does Sevikaa match workers and employers?", 
      a: "Sevikaa uses smart society-based matching to connect employers with verified workers from the same apartment or nearby neighbourhoods based on skills, availability, and location preferences.",
      tag: "Matching",
      colorClass: 'hover:border-[#FBBC05] hover:shadow-lg hover:shadow-yellow-100/50',
      activeBorderClass: 'border-[#FBBC05] shadow-md shadow-yellow-50/50',
      textAccent: 'group-hover:text-yellow-600',
      tagClass: 'bg-[#FBBC05]/10 text-yellow-600 border-[#FBBC05]/20',
      tagIcon: <MapPin size={8} />
    },
    { 
      q: "Are all worker profiles verified?", 
      a: "Workers go through an identity verification process before receiving a Verified badge. Additional verification, such as Police Clearance Certificates (PCC), may also be displayed when available.",
      tag: "Safety",
      colorClass: 'hover:border-[#EA4335] hover:shadow-lg hover:shadow-red-100/50',
      activeBorderClass: 'border-[#EA4335] shadow-md shadow-red-50/50',
      textAccent: 'group-hover:text-[#EA4335]',
      tagClass: 'bg-[#EA4335]/10 text-[#EA4335] border-[#EA4335]/20',
      tagIcon: <Shield size={8} />
    },
    { 
      q: "When do employers get workers' contact details?", 
      a: "Employers can securely unlock verified contact details after purchasing a Premium Pass, allowing them to connect through Call or WhatsApp.",
      tag: "Subscription",
      colorClass: 'hover:border-[#1A73E8] hover:shadow-lg hover:shadow-blue-100/50',
      activeBorderClass: 'border-[#1A73E8] shadow-md shadow-blue-50/50',
      textAccent: 'group-hover:text-[#1A73E8]',
      tagClass: 'bg-[#1A73E8]/10 text-[#1A73E8] border-[#1A73E8]/20',
      tagIcon: <CreditCard size={8} />
    },
    { 
      q: "Is my personal information safe?", 
      a: "Yes. Sensitive information such as identity documents and exact addresses is kept secure. Personal details are protected, and only necessary information is shared through the platform.",
      tag: "Privacy",
      colorClass: 'hover:border-purple-500 hover:shadow-lg hover:shadow-purple-100/50',
      activeBorderClass: 'border-purple-500 shadow-md shadow-purple-50/50',
      textAccent: 'group-hover:text-purple-600',
      tagClass: 'bg-purple-50 text-purple-600 border-purple-100',
      tagIcon: <Lock size={8} />
    },
    { 
      q: "Can I update my profile after registration?", 
      a: "Yes. Workers can update their skills, experience, preferred work areas, salary expectations, and availability. Employers can edit job requirements and account information anytime.",
      tag: "Worker",
      colorClass: 'hover:border-[#34A853] hover:shadow-lg hover:shadow-green-100/50',
      activeBorderClass: 'border-[#34A853] shadow-md shadow-green-50/50',
      textAccent: 'group-hover:text-[#34A853]',
      tagClass: 'bg-[#34A853]/10 text-[#34A853] border-[#34A853]/20',
      tagIcon: <User size={8} />
    },
    { 
      q: "Can employers hire multiple workers?", 
      a: "Yes. Employers can post multiple hiring requirements and connect with as many verified workers as needed during their active Premium Pass.",
      tag: "Subscription",
      colorClass: 'hover:border-[#1A73E8] hover:shadow-lg hover:shadow-blue-100/50',
      activeBorderClass: 'border-[#1A73E8] shadow-md shadow-blue-50/50',
      textAccent: 'group-hover:text-[#1A73E8]',
      tagClass: 'bg-[#1A73E8]/10 text-[#1A73E8] border-[#1A73E8]/20',
      tagIcon: <CreditCard size={8} />
    },
    { 
      q: "What happens after I find a suitable match?", 
      a: "Workers and employers can connect through the platform, discuss job requirements, schedule interviews, and finalize employment directly with each other.",
      tag: "Matching",
      colorClass: 'hover:border-[#FBBC05] hover:shadow-lg hover:shadow-yellow-100/50',
      activeBorderClass: 'border-[#FBBC05] shadow-md shadow-yellow-50/50',
      textAccent: 'group-hover:text-yellow-600',
      tagClass: 'bg-[#FBBC05]/10 text-yellow-600 border-[#FBBC05]/20',
      tagIcon: <MapPin size={8} />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto w-full border-x border-gray-200">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <img src="/logo.png" alt="Sevikaa Logo" className="h-10 w-auto object-contain" />
        </div>
        <span className="font-extrabold text-sm tracking-tight text-gray-500 uppercase">FAQ Panel</span>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#202124]">Frequently Asked Questions</h1>
          <p className="text-xs text-gray-500 font-bold">Everything you need to know about Sevikaa.</p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div 
                key={i} 
                className={`bg-white border-2 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group ${
                  isOpen ? item.activeBorderClass : `border-gray-200 ${item.colorClass}`
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-gray-700 hover:bg-gray-50/50"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle size={16} className={`shrink-0 transition-colors ${isOpen ? 'text-gray-400' : 'text-[#1A73E8]'}`} />
                    <span className={`leading-snug transition-colors ${item.textAccent}`}>{item.q}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase shrink-0 flex items-center gap-1 ${item.tagClass}`}>
                      {item.tagIcon}
                      {item.tag}
                    </span>
                  </span>
                  <ChevronDown size={14} className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-gray-400' : 'text-gray-400'}`} />
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-48 border-t border-gray-100/50 bg-white' : 'max-h-0'
                  }`}
                >
                  <div className="px-5 py-4 text-xs text-gray-400 font-semibold leading-relaxed">
                    {item.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-center text-[10px] text-gray-400">
        Powered by YugaYatra Retail (OPC) Private Limited
      </footer>
    </div>
  );
}
