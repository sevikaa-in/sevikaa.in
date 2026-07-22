import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto w-full border-x border-gray-200">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <img src="/logo.png" alt="Sevikaa Logo" className="h-10 w-auto object-contain" />
        </div>
        <span className="font-extrabold text-sm tracking-tight text-gray-500 uppercase">Privacy</span>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#202124]">Privacy Policy</h1>
          <p className="text-xs text-gray-500 font-bold">Your Privacy Matters</p>
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-gray-400 hover:shadow-lg hover:shadow-gray-200/50 cursor-pointer">
          <p>
            At Sevikaa, we are committed to protecting your personal information and respecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#1A73E8] hover:shadow-lg hover:shadow-blue-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#1A73E8] text-sm">1. Information We Collect</h3>
            <p>To provide our services, we may collect:</p>
            <ul className="space-y-2 text-gray-400 font-semibold">
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#1A73E8] shrink-0 mt-0.5" /> Basic profile information (Name, Mobile Number, Email)</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#1A73E8] shrink-0" /> Identity verification documents (such as Aadhaar)</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#1A73E8] shrink-0" /> Work preferences, skills, and availability</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#1A73E8] shrink-0" /> Approximate location for smart matching</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#1A73E8] shrink-0" /> Payment information for employer subscriptions (processed securely through authorized payment partners)</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#34A853] hover:shadow-lg hover:shadow-green-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#34A853] text-sm">2. How We Use Your Information</h3>
            <p>We use your information to:</p>
            <ul className="space-y-2 text-gray-400 font-semibold">
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#34A853] shrink-0" /> Verify user identities</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#34A853] shrink-0" /> Match workers with nearby employers</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#34A853] shrink-0" /> Improve platform safety and security</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#34A853] shrink-0" /> Process subscriptions and provide customer support</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#34A853] shrink-0" /> Comply with applicable legal and regulatory requirements</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#EA4335] hover:shadow-lg hover:shadow-red-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#EA4335] text-sm">3. Privacy & Data Protection</h3>
            <p>Your privacy is important to us.</p>
            <ul className="space-y-2 text-gray-400 font-semibold">
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#EA4335] shrink-0" /> Exact addresses and precise GPS locations are never publicly displayed.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#EA4335] shrink-0" /> Identity documents are securely stored and accessed only by authorized personnel for verification purposes.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#EA4335] shrink-0" /> Personal information is protected using industry-standard security practices.</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#FBBC05] hover:shadow-lg hover:shadow-yellow-100/50 cursor-pointer">
            <h3 className="font-extrabold text-yellow-600 text-sm">4. Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="space-y-2 text-gray-400 font-semibold">
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#FBBC05] shrink-0" /> View and update your profile information.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#FBBC05] shrink-0" /> Request correction of inaccurate information.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#FBBC05] shrink-0" /> Request deletion of your account, subject to legal record retention requirements.</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-100/50 cursor-pointer">
            <h3 className="font-extrabold text-purple-600 text-sm">5. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy or how your information is handled, please contact us:</p>
            <p className="mt-1 text-gray-400 font-semibold">
              Email: support@sevikaa.in<br />
              Company: YugaYatra Retail (OPC) Private Limited<br />
              Business Hours: Monday – Friday, 10:00 AM – 5:00 PM (IST)
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-[10px] text-gray-400">
        Powered by YugaYatra Retail (OPC) Private Limited
      </footer>
    </div>
  );
}
