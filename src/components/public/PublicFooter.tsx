"use client";

import React from 'react';
import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="bg-[#1E293B] text-white py-12 px-4 border-t border-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800/80">
          
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Sevikaa" className="h-8 w-auto bg-white p-1 rounded-lg" onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLElement).style.display = 'none'; }} />
              <span className="text-xl font-black tracking-tight text-white">Sevikaa</span>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              India's trusted platform connecting verified household helpers (cooks, maids, nannies, drivers) with gated society families.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">Platform Links</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-300">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Employer Pricing</Link></li>
              <li><Link href="/societies" className="hover:text-white transition-colors">Gated Societies</Link></li>
              <li><Link href="/safety" className="hover:text-white transition-colors">Safety &amp; Aadhaar Verification</Link></li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">Support &amp; Contact</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-300">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">Frequently Asked Questions</Link></li>
              <li className="pt-1 text-slate-400 font-normal">✉ support@sevikaa.in</li>
              <li className="text-slate-400 font-normal">📞 +91 87577 28679</li>
            </ul>
          </div>

          {/* Legal Compliance */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">Legal Policies</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-300">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refunds" className="hover:text-white transition-colors">Refund &amp; Cancellation Policy</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping &amp; Service Delivery</Link></li>
              <li><Link href="/sitemap.xml" className="hover:text-white transition-colors">XML Sitemap</Link></li>
            </ul>
          </div>

        </div>

        {/* Corporate Legal Footer */}
        <div className="space-y-2 text-center pt-2">
          <p className="text-[11px] text-slate-400 font-semibold max-w-2xl mx-auto leading-relaxed">
            Sevikaa is proudly owned and operated by <strong className="text-slate-200">YugaYatra Retail (OPC) Private Limited</strong> (GSTIN: 29AABCY8389C1ZT), a DPIIT-Recognized Startup dedicated to empowering domestic helpers and household employers.
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            © {new Date().getFullYear()} Sevikaa. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
