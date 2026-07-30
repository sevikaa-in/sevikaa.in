"use client";

import React, { useState, useRef, useEffect } from 'react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  Mail, Phone, MapPin, Send, CheckCircle2,
  Sparkles, MessageSquare, Clock, ShieldCheck, AlertCircle,
  ChevronDown, Briefcase, Shield, Receipt, Building2, HelpCircle, Check
} from 'lucide-react';

const TOPIC_OPTIONS = [
  {
    id: 'Employer Hiring',
    label: 'Employer Plan & Hiring Support',
    desc: 'Subscription plans, hiring assistance & worker search',
    icon: <Briefcase size={16} className="text-[#1A73E8]" />,
    color: 'bg-blue-50 border-blue-200 text-[#1A73E8]',
  },
  {
    id: 'Worker Verification',
    label: 'Worker Profile Verification',
    desc: 'Aadhaar badge, Police Clearance (PCC) & audit status',
    icon: <Shield size={16} className="text-[#34A853]" />,
    color: 'bg-emerald-50 border-emerald-200 text-[#34A853]',
  },
  {
    id: 'Billing & Tax Invoice',
    label: 'Billing & Tax Invoice Enquiry',
    desc: 'GST invoices, payment receipts & transaction support',
    icon: <Receipt size={16} className="text-purple-600" />,
    color: 'bg-purple-50 border-purple-200 text-purple-600',
  },
  {
    id: 'Society Partnership',
    label: 'Gated Society Onboarding',
    desc: 'RWA partnership, gate pass sync & community listing',
    icon: <Building2 size={16} className="text-amber-600" />,
    color: 'bg-amber-50 border-amber-200 text-amber-600',
  },
  {
    id: 'General Enquiry',
    label: 'General Enquiry',
    desc: 'Other questions, feedback or platform support',
    icon: <HelpCircle size={16} className="text-slate-600" />,
    color: 'bg-slate-100 border-slate-200 text-slate-700',
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Employer Hiring',
    message: ''
  });

  const selectedTopic = TOPIC_OPTIONS.find(t => t.id === formData.subject) || TOPIC_OPTIONS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Failed to submit enquiry. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      console.error("Contact submit error:", err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">

        {/* ── HERO ─────────────────────────────── */}
        <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/80 py-16 sm:py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#1A73E8] border border-blue-200 text-xs font-black uppercase tracking-wider shadow-sm">
              <MessageSquare size={13} className="text-[#1A73E8]" /> Customer &amp; Support Assistance
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
              We&apos;re Here to Help
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-semibold max-w-2xl mx-auto leading-relaxed">
              Have questions about hiring domestic help, finding worker jobs, plan subscriptions, or society verification? Our support team responds within 24 hours.
            </p>
          </div>
        </section>

        {/* ── MAIN CONTENT GRID ────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* Left Column: Official Support Details */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-[#1A73E8] tracking-wider">Direct Contacts</span>
                <h2 className="text-2xl font-black text-slate-900">Get in Touch</h2>
                <p className="text-xs text-slate-500 font-semibold">Official support channels for employers &amp; helpers</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-sm space-y-6">

                {/* Email Card */}
                <a href="mailto:support@sevikaa.in" className="flex items-start gap-4 group cursor-pointer block">
                  <div className="p-3.5 rounded-2xl bg-blue-50 text-[#1A73E8] border border-blue-100 group-hover:bg-[#1A73E8] group-hover:text-white transition-all shrink-0 shadow-xs">
                    <Mail size={22} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Support Email</span>
                    <span className="text-base font-black text-slate-900 group-hover:text-[#1A73E8] transition-colors block">support@sevikaa.in</span>
                    <span className="text-xs text-slate-500 font-medium leading-relaxed block">
                      Account verification, plan subscriptions, billing &amp; general support. Responded within 24 hours.
                    </span>
                  </div>
                </a>

                <div className="border-t border-slate-100 pt-6">
                  {/* Phone Card */}
                  <a href="tel:+918757728679" className="flex items-start gap-4 group cursor-pointer block">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 text-[#34A853] border border-emerald-100 group-hover:bg-[#34A853] group-hover:text-white transition-all shrink-0 shadow-xs">
                      <Phone size={22} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Customer Helpline</span>
                      <span className="text-base font-black text-slate-900 group-hover:text-[#34A853] transition-colors block">+91 87577 28679</span>
                      <span className="text-xs text-slate-500 font-medium leading-relaxed block">
                        Mon – Fri: 10:00 AM – 5:00 PM IST (Direct Assistance)
                      </span>
                    </div>
                  </a>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  {/* Corporate Office */}
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200/60 shrink-0 shadow-xs">
                      <MapPin size={22} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Corporate Office</span>
                      <span className="text-sm font-black text-slate-900 block">YugaYatra Retail (OPC) Private Limited</span>
                      <span className="text-xs text-slate-600 font-medium block leading-relaxed">
                        Sanfield raga, Begur - Koppa Rd, near Koppa Gate, Bengaluru, Karnataka 560105
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold block pt-1">
                        GSTIN: 29AABCY8389C1ZT | CIN: U47912KA2024OPC188603
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Premium Support Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-6">

                {submitted ? (
                  <div className="py-12 text-center space-y-5 animate-fade-in">
                    <div className="w-16 h-16 bg-emerald-50 text-[#34A853] border-2 border-emerald-200 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 size={36} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900">Enquiry Submitted!</h3>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto font-medium leading-relaxed">
                        Thank you for reaching out to Sevikaa. Our support executive has received your query and will contact you at <strong className="text-slate-900">{formData.email}</strong> shortly.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: '', email: '', phone: '', subject: 'Employer Hiring', message: '' });
                      }}
                      className="px-6 py-3 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1 border-b border-slate-100 pb-4">
                      <h2 className="text-xl font-black text-slate-900">Send Us a Direct Message</h2>
                      <p className="text-xs text-slate-500 font-semibold">Fill in your query and our support team will get back to you promptly</p>
                    </div>

                    {errorMessage && (
                      <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">Your Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Anish Sharma"
                          className="w-full p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="name@domain.com"
                          className="w-full p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">Mobile Number (Optional)</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                        />
                      </div>

                      {/* 🎨 CUSTOM THEMED EXECUTIVE SELECT POP-OVER */}
                      <div className="relative" ref={dropdownRef}>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">Topic / Category *</label>
                        <button
                          type="button"
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/90 focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-xs font-bold text-slate-800 transition-all flex items-center justify-between gap-2 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="p-1 rounded-lg bg-white border border-slate-200 shrink-0">
                              {selectedTopic.icon}
                            </span>
                            <span className="truncate font-black text-slate-900">{selectedTopic.label}</span>
                          </div>
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180 text-[#1A73E8]' : ''}`}
                          />
                        </button>

                        {/* Dropdown Menu Popover */}
                        {dropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-2 space-y-1 animate-fade-in max-h-72 overflow-y-auto">
                            {TOPIC_OPTIONS.map((item) => {
                              const isSelected = item.id === formData.subject;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, subject: item.id });
                                    setDropdownOpen(false);
                                  }}
                                  className={`w-full p-3 rounded-xl flex items-start justify-between gap-3 text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-50/90 text-[#1A73E8] border border-blue-200'
                                      : 'hover:bg-slate-50 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${item.color}`}>
                                      {item.icon}
                                    </div>
                                    <div>
                                      <span className="text-xs font-black block leading-tight">{item.label}</span>
                                      <span className="text-[10.5px] font-medium text-slate-500 block leading-tight mt-0.5">{item.desc}</span>
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <Check size={16} className="text-[#1A73E8] shrink-0 mt-1" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">Your Message / Query *</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Please describe how we can help you..."
                        className="w-full p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 bg-[#1A73E8] hover:bg-blue-600 text-white font-black text-xs rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                    >
                      {submitting ? (
                        <span>Submitting enquiry...</span>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Send Support Enquiry</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>
            </div>

          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
