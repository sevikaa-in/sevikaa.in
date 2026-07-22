import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto w-full border-x border-gray-200">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <img src="/logo.png" alt="Sevikaa Logo" className="h-10 w-auto object-contain" />
        </div>
        <span className="font-extrabold text-sm tracking-tight text-gray-500 uppercase">Terms</span>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#202124]">Terms & Conditions</h1>
          <p className="text-xs text-gray-500 font-bold">Terms of Service</p>
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-gray-400 hover:shadow-lg hover:shadow-gray-200/50 cursor-pointer">
          <p>
            Welcome to Sevikaa, a platform owned and operated by YugaYatra Retail (OPC) Private Limited. By accessing or using Sevikaa, you agree to comply with these Terms & Conditions.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#1A73E8] hover:shadow-lg hover:shadow-blue-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#1A73E8] text-sm">1. Eligibility & Registration</h3>
            <p>Users must provide accurate and up-to-date information during registration.</p>
            <ul className="space-y-2 text-gray-400 font-semibold">
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#1A73E8] shrink-0 mt-0.5" /> Workers must submit genuine identity documents for verification.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#1A73E8] shrink-0" /> Employers must provide authentic hiring requirements.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#1A73E8] shrink-0" /> Any false or misleading information may result in account suspension or permanent removal.</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#34A853] hover:shadow-lg hover:shadow-green-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#34A853] text-sm">2. Verification & Platform Use</h3>
            <p>Sevikaa verifies user profiles to promote trust and safety.</p>
            <ul className="space-y-2 text-gray-400 font-semibold">
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#34A853] shrink-0" /> Verification improves profile credibility but does not guarantee employment or hiring.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#34A853] shrink-0" /> Users are responsible for the information they provide.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#34A853] shrink-0" /> All interactions should remain respectful, lawful, and professional.</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#FBBC05] hover:shadow-lg hover:shadow-yellow-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#FBBC05] text-sm">3. Premium Services</h3>
            <ul className="space-y-2 text-gray-400 font-semibold">
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#FBBC05] shrink-0" /> Worker registration and job applications are free.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#FBBC05] shrink-0" /> Employers may purchase a Premium Pass to unlock contact details and premium hiring features.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#FBBC05] shrink-0" /> All payments are processed securely through our authorized payment partners.</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#EA4335] hover:shadow-lg hover:shadow-red-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#EA4335] text-sm">4. Privacy & Safety</h3>
            <p>Your privacy is important to us.</p>
            <ul className="space-y-2 text-gray-400 font-semibold">
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#EA4335] shrink-0" /> Personal information is handled in accordance with our Privacy Policy.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#EA4335] shrink-0" /> Exact residential addresses and sensitive information are never publicly displayed.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#EA4335] shrink-0" /> Users must not misuse or share another user's personal information without consent.</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-100/50 cursor-pointer">
            <h3 className="font-extrabold text-purple-500 text-sm">5. User Responsibilities</h3>
            <p>By using Sevikaa, you agree to:</p>
            <ul className="space-y-2 text-gray-400 font-semibold">
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-purple-500 shrink-0" /> Provide accurate information.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-purple-500 shrink-0" /> Respect other users.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-purple-500 shrink-0" /> Comply with all applicable laws and avoid illegal activities.</li>
            </ul>
          </div>

          <div className="bg-amber-50 text-amber-800 border-l-4 border-amber-500 rounded-2xl p-4 text-xs space-y-1 font-semibold leading-relaxed shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
            <span className="block font-bold">Important Notice:</span>
            <p>Violation of these terms may result in immediate account suspension or permanent termination.</p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-100/50 cursor-pointer">
            <h3 className="font-extrabold text-amber-600 text-sm">6. Limitation of Liability</h3>
            <p>
              Sevikaa provides a platform to connect workers and employers. Employment decisions, interviews, negotiations, salaries, and work agreements are made directly between the parties. Sevikaa is not responsible for disputes arising after users choose to engage with one another.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-100/50 cursor-pointer">
            <h3 className="font-extrabold text-indigo-600 text-sm">7. Governing Law</h3>
            <p>
              These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#1A73E8] hover:shadow-lg hover:shadow-blue-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#1A73E8] text-sm">8. Contact Us</h3>
            <p>For questions regarding these Terms & Conditions, please contact:</p>
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
