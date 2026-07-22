import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowLeft, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto w-full border-x border-gray-200">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <img src="/logo.png" alt="Sevikaa Logo" className="h-10 w-auto object-contain" />
        </div>
        <span className="font-extrabold text-sm tracking-tight text-gray-500 uppercase">Contact</span>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#202124]">We're Here to Help</h1>
          <p className="text-xs text-gray-500 font-bold leading-normal">
            Need assistance? Whether you're looking for work or hiring domestic help, our support team is ready to assist you.
          </p>
          <p className="text-[10px] text-gray-400 mt-2 font-medium leading-relaxed">
            Have questions about hiring, finding jobs, subscriptions, or account verification? Our support team is happy to assist you.
          </p>
        </div>

        {/* Corporate Info Cards */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-6 space-y-0 divide-y divide-gray-100 shadow-sm text-left text-xs font-bold text-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50">
          {/* Row 1: Email */}
          <a 
            href="mailto:support@sevikaa.in" 
            className="flex items-start gap-4 py-4 first:pt-0 transition-all duration-200 hover:bg-[#1A73E8]/5 -mx-6 px-6 rounded-t-3xl cursor-pointer group block"
          >
            <div className="p-2.5 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] shrink-0 group-hover:bg-[#1A73E8] group-hover:text-white transition-all mt-0.5">
              <Mail size={16} />
            </div>
            <div>
              <span className="block text-[9px] text-gray-400 uppercase">Support Email</span>
              <span className="block mt-0.5 text-sm font-extrabold text-gray-700 group-hover:text-[#1A73E8] transition-colors">support@sevikaa.in</span>
              <span className="block text-[9px] text-gray-400 font-medium leading-normal mt-1">For account support, profile verification, partnerships, billing enquiries, and general assistance.</span>
            </div>
          </a>

          {/* Row 2: Phone */}
          <a 
            href="tel:+918757728679" 
            className="flex items-start gap-4 py-4 transition-all duration-200 hover:bg-[#34A853]/5 -mx-6 px-6 cursor-pointer group block"
          >
            <div className="p-2.5 rounded-xl bg-[#34A853]/10 text-[#34A853] shrink-0 group-hover:bg-[#34A853] group-hover:text-white transition-all mt-0.5">
              <Phone size={16} />
            </div>
            <div>
              <span className="block text-[9px] text-gray-400 uppercase">Customer Support</span>
              <span className="block mt-0.5 text-sm font-extrabold text-gray-700 group-hover:text-[#34A853] transition-colors">+91 87577 28679</span>
              <span className="block text-[9px] text-gray-400 font-medium leading-normal mt-1">Speak with our support team during business hours for quick assistance.</span>
            </div>
          </a>

          {/* Row 3: Company Info */}
          <div className="flex items-start gap-4 py-4 transition-all duration-200 hover:bg-[#EA4335]/5 -mx-6 px-6 group">
            <div className="p-2.5 rounded-xl bg-[#EA4335]/10 text-[#EA4335] shrink-0 group-hover:bg-[#EA4335] group-hover:text-white transition-all mt-0.5">
              <MapPin size={16} />
            </div>
            <div>
              <span className="block text-[9px] text-gray-400 uppercase">Owned & Operated By</span>
              <span className="block mt-0.5 text-sm font-extrabold text-gray-700 group-hover:text-[#EA4335] transition-colors">YugaYatra Retail (OPC) Private Limited</span>
              <span className="block text-xs font-semibold text-gray-400 mt-1 leading-normal">
                Electronic City, Phase 1, Bengaluru, Karnataka, India
              </span>
              <span className="block text-[9px] text-gray-400 mt-0.5">CIN: U47912KA2024OPC188603 (Registered with the Ministry of Corporate Affairs, Government of India)</span>
            </div>
          </div>

          {/* Row 4: Business Hours */}
          <div className="flex items-start gap-4 py-4 last:pb-0 transition-all duration-200 hover:bg-[#FBBC05]/5 -mx-6 px-6 rounded-b-3xl group">
            <div className="p-2.5 rounded-xl bg-[#FBBC05]/10 text-[#FBBC05] shrink-0 group-hover:bg-[#FBBC05] group-hover:text-white transition-all mt-0.5">
              <Clock size={16} />
            </div>
            <div>
              <span className="block text-[9px] text-gray-400 uppercase">Business Hours</span>
              <span className="block mt-0.5 text-sm font-extrabold text-gray-700 group-hover:text-[#FBBC05] transition-colors">Monday – Friday: 10:00 AM – 5:00 PM (IST)</span>
              <span className="block text-[9px] text-gray-400 font-medium leading-normal mt-1">Saturday & Sunday: Closed. Email enquiries are responded to within 1–2 business days.</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 px-6 text-center text-[10px] text-gray-400">
        Powered by YugaYatra Retail (OPC) Private Limited
      </footer>
    </div>
  );
}
