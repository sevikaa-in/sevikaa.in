"use client";

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Building2, HelpCircle } from 'lucide-react';

export function ContactSupportContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Employer Plan & Hiring Support',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setErrorMsg('Please fill in your name, email, and message.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit enquiry');

      setSuccessMsg(data.message || 'Your enquiry has been received!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'Employer Plan & Hiring Support',
        message: ''
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-slate-700 leading-relaxed text-sm">
      
      {/* Intro Box */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs font-medium text-slate-700 space-y-1">
        <p className="font-bold text-[#1A73E8] flex items-center gap-1.5">
          <Mail size={14} /> Official Customer Support &amp; Helpline
        </p>
        <p className="text-[11px] text-slate-600">
          Have a question about worker verification, subscription plans, or GST tax invoices? Our team responds within 2 business hours.
        </p>
      </div>

      {/* Corporate Contact Info Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-[9px] uppercase font-black text-slate-400">Email Desk</span>
          <p className="text-[#1A73E8] font-bold text-xs flex items-center gap-1.5 truncate">
            <Mail size={13} /> support@sevikaa.in
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-[9px] uppercase font-black text-slate-400">Helpline</span>
          <p className="text-emerald-700 font-bold text-xs flex items-center gap-1.5 truncate">
            <Phone size={13} /> +91 87577 28679
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Your Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ananya Sharma"
              value={formData.name}
              onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#1A73E8] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="ananya@example.com"
              value={formData.email}
              onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#1A73E8] focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#1A73E8] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Topic</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData(f => ({ ...f, subject: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#1A73E8] focus:bg-white transition-all"
            >
              <option value="Employer Plan & Hiring Support">Employer Plan &amp; Hiring Support</option>
              <option value="Worker Verification">Worker Verification &amp; Aadhaar Audit</option>
              <option value="Billing & Tax Invoice">Billing &amp; Tax Invoice Enquiry</option>
              <option value="Society Partnership">Gated Society Onboarding</option>
              <option value="General Enquiry">General Enquiry</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Message *</label>
          <textarea
            required
            rows={3}
            placeholder="Describe your inquiry or question in detail..."
            value={formData.message}
            onChange={(e) => setFormData(f => ({ ...f, message: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#1A73E8] focus:bg-white transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Send size={13} />
          <span>{loading ? 'Submitting Enquiry...' : 'Submit Support Enquiry'}</span>
        </button>
      </form>

    </div>
  );
}
