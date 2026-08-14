"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, FileText, Lock, RefreshCw, Truck, ArrowLeft, 
  ChevronRight, Building, Mail, Phone, Trash2, AlertTriangle, HelpCircle, Sparkles, CreditCard
} from 'lucide-react';
import { PrivacyContent } from '@/components/legal/policies/PrivacyContent';
import { TermsContent } from '@/components/legal/policies/TermsContent';
import { RefundsContent } from '@/components/legal/policies/RefundsContent';
import { ShippingContent } from '@/components/legal/policies/ShippingContent';
import { SafetyContent } from '@/components/legal/policies/SafetyContent';
import { FaqContent } from '@/components/legal/policies/FaqContent';
import { HowItWorksContent } from '@/components/legal/policies/HowItWorksContent';
import { PricingContent } from '@/components/legal/policies/PricingContent';
import { ContactSupportContent } from '@/components/legal/policies/ContactSupportContent';

export default function WorkerLegalHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<string>('directory');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && ['privacy', 'terms', 'refunds', 'shipping', 'safety', 'faq', 'how-it-works', 'pricing', 'contact'].includes(viewParam)) {
      setActiveTab(viewParam);
    }
  }, [searchParams]);

  const legalItems = [
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'How we collect, encrypt, and protect your personal data & Aadhaar proofs.',
      icon: Lock,
      badge: 'Data Protection',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      subtitle: 'Platform usage rules, employer subscriptions, and worker verification terms.',
      icon: FileText,
      badge: 'User Agreement',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'how-it-works',
      title: 'How Platform Matchmaking Works',
      subtitle: 'Simple 3-step hiring process for employers & free registration for workers.',
      icon: Sparkles,
      badge: 'Platform Guide',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      id: 'safety',
      title: 'Safety & Aadhaar Verification',
      subtitle: 'Government ID audit process, background verification & safety standards.',
      icon: ShieldCheck,
      badge: 'Trust & Safety',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    {
      id: 'refunds',
      title: 'Refund & Cancellation Policy',
      subtitle: 'Razorpay billing, subscription refunds, and payment cancellation timelines.',
      icon: RefreshCw,
      badge: 'Billing Terms',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions on subscriptions, worker hiring, and verification.',
      icon: HelpCircle,
      badge: 'Help Center',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  ];

  const handleHeaderBack = () => {
    if (activeTab !== 'directory') {
      setActiveTab('directory');
    } else {
      router.back();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 font-sans animate-fade-in">
      
      {/* WORKER DASHBOARD LEGAL HEADER */}
      <div className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleHeaderBack}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#34A853]" />
              <span>{activeTab === 'directory' ? 'Worker Legal & Privacy Hub' : legalItems.find(i => i.id === activeTab)?.title || 'Platform Policy'}</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold">
              Official platform policies, data protection guidelines &amp; disclosures.
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase">
          ✓ Verified Worker
        </span>
      </div>

      {/* VIEW 1: DIRECTORY MAIN HUB */}
      {activeTab === 'directory' && (
        <>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden divide-y divide-slate-100">
            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Worker Policies Directory</span>
              <span className="text-[10px] text-slate-400 font-bold">{legalItems.length} Policies</span>
            </div>

            {legalItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#34A853] group-hover:bg-[#34A853] group-hover:text-white transition-colors shrink-0">
                      <IconComponent size={18} />
                    </div>
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-black text-slate-900 group-hover:text-[#34A853] transition-colors">
                          {item.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 font-semibold truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 group-hover:text-[#34A853] transition-all shrink-0" />
                </button>
              );
            })}
          </div>

          {/* DATA PRIVACY & ERASURE CARD */}
          <div className="bg-amber-50/80 border border-amber-200/80 p-4.5 rounded-3xl space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-100 text-amber-800 shrink-0">
                <Trash2 size={16} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-amber-950">Worker Data Erasure &amp; Aadhaar Purge</h3>
                <p className="text-[10.5px] text-amber-900 font-medium leading-relaxed">
                  Request permanent erasure of your worker profile and Aadhaar card photos at any time.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Trash2 size={12} /> Request Data Deletion
            </button>
          </div>
        </>
      )}

      {/* VIEW RENDERS IN-PLACE */}
      {activeTab === 'privacy' && <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs"><PrivacyContent /></div>}
      {activeTab === 'terms' && <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs"><TermsContent /></div>}
      {activeTab === 'contact' && <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs"><ContactSupportContent /></div>}
      {activeTab === 'how-it-works' && <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs"><HowItWorksContent /></div>}
      {activeTab === 'safety' && <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs"><SafetyContent /></div>}
      {activeTab === 'refunds' && <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs"><RefundsContent /></div>}
      {activeTab === 'faq' && <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs"><FaqContent /></div>}

      {/* ACCOUNT DELETION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-600" /> Data Erasure Instructions
              </span>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">✕</button>
            </div>
            <div className="space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
              <p>To request permanent worker profile and document deletion:</p>
              <ol className="list-decimal list-inside space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 font-semibold text-slate-800 text-[10.5px]">
                <li>Option 1: Worker Profile → Danger Zone → Request Account Deletion.</li>
                <li>Option 2: Email <strong>support@sevikaa.in</strong>.</li>
              </ol>
            </div>
            <div className="pt-1 flex justify-end">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer">Got It</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
