"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, FileText, Lock, RefreshCw, Truck, ArrowLeft, 
  ChevronRight, Building, Mail, Phone, Trash2, AlertTriangle, HelpCircle
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
import { Sparkles, CreditCard } from 'lucide-react';

export default function LegalHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Active sub-view: 'directory' | 'privacy' | 'terms' | 'refunds' | 'shipping' | 'safety' | 'faq' | 'how-it-works' | 'pricing' | 'contact'
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
      id: 'contact',
      title: 'Contact Customer Support & Helpline',
      subtitle: 'Official support desk for verification, billing invoices, and general help.',
      icon: Mail,
      badge: 'Support Desk',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'pricing',
      title: 'Employer Subscription Plans & Pricing',
      subtitle: 'Transparent hiring subscription plans with 18% GST and zero worker commissions.',
      icon: CreditCard,
      badge: 'Employer Pricing',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
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
      id: 'refunds',
      title: 'Refund & Cancellation Policy',
      subtitle: 'Razorpay billing, subscription refunds, and payment cancellation timelines.',
      icon: RefreshCw,
      badge: 'Billing Terms',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      id: 'shipping',
      title: 'Shipping & Service Delivery',
      subtitle: 'Digital service fulfillment, instant plan activation & store compliance.',
      icon: Truck,
      badge: 'Service Delivery',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
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
    <div className="min-h-screen bg-slate-100/90 sm:py-6 flex flex-col items-center justify-center font-sans antialiased">
      
      {/* MOBILE APP SCREEN CONTAINER (EXACT MATCH TO WORKER & EMPLOYER MOBILE SCREEN SHELL) */}
      <div className="max-w-md w-full min-h-screen sm:min-h-[820px] bg-slate-50 sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-slate-200/90 flex flex-col overflow-hidden relative">
        
        {/* TOP MOBILE APP HEADER */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-2xs">
          <button
            type="button"
            onClick={handleHeaderBack}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1.5 min-w-0 px-2">
            <ShieldCheck size={18} className="text-[#1A73E8] shrink-0" />
            <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate">
              {activeTab === 'directory' ? 'Legal & Privacy Hub' : legalItems.find(i => i.id === activeTab)?.title || 'Platform Policy'}
            </span>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8.5px] font-black uppercase shrink-0">
            ✓ Verified
          </span>
        </header>

        {/* MOBILE SCREEN BODY CONTAINER */}
        <main className="flex-1 p-4 space-y-4 overflow-y-auto">
          
          {/* ============================================================ */}
          {/* VIEW 1: DIRECTORY MAIN HUB                                    */}
          {/* ============================================================ */}
          {activeTab === 'directory' && (
            <>
              {/* HEADER CARD */}
              <div className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-xs space-y-1.5">
                <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#1A73E8]" />
                  <span>Platform Policies &amp; Compliance</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Official platform policies, data protection guidelines &amp; corporate disclosures.
                </p>
              </div>

              {/* INTERACTIVE POLICY LIST */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden divide-y divide-slate-100">
                <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Official Platform Policies</span>
                  <span className="text-[10px] text-slate-400 font-bold">{legalItems.length} Policies</span>
                </div>

                {legalItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className="w-full text-left p-3.5 flex items-center justify-between hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-2xl bg-blue-50 text-[#1A73E8] group-hover:bg-[#1A73E8] group-hover:text-white transition-colors shrink-0">
                          <IconComponent size={16} />
                        </div>
                        <div className="min-w-0 flex-1 pr-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs font-black text-slate-900 group-hover:text-[#1A73E8] transition-colors">
                              {item.title}
                            </h3>
                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#1A73E8] transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>

              {/* CORPORATE ENTITY DISCLOSURE CARD */}
              <div className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                  <div className="p-2 rounded-2xl bg-slate-100 text-slate-700 shrink-0">
                    <Building size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Merchant Ownership</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Registered Operating Entity Details</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-medium text-slate-700">
                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Legal Entity Name</span>
                    <p className="text-slate-900 font-black text-xs">YugaYatra Retail (OPC) Pvt Ltd</p>
                    <p className="text-[9px] text-emerald-700 font-bold">✓ DPIIT-Recognized Startup</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">GSTIN Number</span>
                    <p className="text-slate-900 font-black font-mono text-xs">29AABCY8389C1ZT</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Email</span>
                      <p className="text-[#1A73E8] font-bold text-[11px] truncate flex items-center gap-1">
                        <Mail size={11} /> support@sevikaa.in
                      </p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Helpline</span>
                      <p className="text-slate-900 font-bold text-[11px] truncate flex items-center gap-1">
                        <Phone size={11} className="text-emerald-600" /> +91 87577 28679
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DATA PRIVACY & ERASURE CARD */}
              <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-3xl space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-2xl bg-amber-100 text-amber-800 shrink-0">
                    <Trash2 size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-black text-amber-950">Account Deletion &amp; Data Erasure</h3>
                    <p className="text-[10.5px] text-amber-900 font-medium leading-relaxed">
                      Request permanent erasure of your profile and Aadhaar documents at any time.
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

          {/* ============================================================ */}
          {/* VIEW 2: PRIVACY POLICY                                       */}
          {/* ============================================================ */}
          {activeTab === 'privacy' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-4.5 shadow-xs space-y-4 animate-fade-in">
              <PrivacyContent />
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 3: TERMS & CONDITIONS                                   */}
          {/* ============================================================ */}
          {activeTab === 'terms' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-4.5 shadow-xs space-y-4 animate-fade-in">
              <TermsContent />
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 3.5: HOW IT WORKS                                       */}
          {/* ============================================================ */}
          {activeTab === 'how-it-works' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-4.5 shadow-xs space-y-4 animate-fade-in">
              <HowItWorksContent />
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 3.6: PRICING                                            */}
          {/* ============================================================ */}
          {activeTab === 'pricing' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-4.5 shadow-xs space-y-4 animate-fade-in">
              <PricingContent />
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 3.7: CONTACT SUPPORT                                    */}
          {/* ============================================================ */}
          {activeTab === 'contact' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-4.5 shadow-xs space-y-4 animate-fade-in">
              <ContactSupportContent />
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 4: REFUNDS & CANCELLATIONS                              */}
          {/* ============================================================ */}
          {activeTab === 'refunds' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-4.5 shadow-xs space-y-4 animate-fade-in">
              <RefundsContent />
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 5: SHIPPING & DELIVERY                                  */}
          {/* ============================================================ */}
          {activeTab === 'shipping' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-4.5 shadow-xs space-y-4 animate-fade-in">
              <ShippingContent />
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 6: SAFETY & ID AUDIT                                    */}
          {/* ============================================================ */}
          {activeTab === 'safety' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-4.5 shadow-xs space-y-4 animate-fade-in">
              <SafetyContent />
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 7: FAQ                                                  */}
          {/* ============================================================ */}
          {activeTab === 'faq' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-4.5 shadow-xs space-y-4 animate-fade-in">
              <FaqContent />
            </div>
          )}

          {/* BRANDING FOOTER */}
          <div className="pt-4 pb-2 flex flex-col items-center justify-center gap-1 opacity-75 hover:opacity-100 transition-opacity select-none">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
              Powered By
            </span>
            <img 
              src="/ygayatra.png" 
              alt="Ygayatra" 
              className="h-5 object-contain grayscale hover:grayscale-0 transition-all opacity-80" 
            />
          </div>

        </main>
      </div>

      {/* ACCOUNT DELETION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-600" /> Data Erasure Instructions
              </span>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
              <p>To request permanent profile and document deletion:</p>
              <ol className="list-decimal list-inside space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 font-semibold text-slate-800 text-[10.5px]">
                <li>Option 1: Profile → Danger Zone → Delete Account.</li>
                <li>Option 2: Email <strong>support@sevikaa.in</strong>.</li>
              </ol>
              <p className="text-[10px] text-slate-400">
                All uploaded documents will be purged within 7 business days.
              </p>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
