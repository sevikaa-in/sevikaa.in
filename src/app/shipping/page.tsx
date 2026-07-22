import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto w-full border-x border-gray-200">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <img src="/logo.png" alt="Sevikaa Logo" className="h-10 w-auto object-contain" />
        </div>
        <span className="font-extrabold text-sm tracking-tight text-gray-500 uppercase">Shipping</span>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#202124]">Shipping Policy</h1>
          <p className="text-xs text-gray-500 font-bold">Digital Services Only</p>
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-gray-400 hover:shadow-lg hover:shadow-gray-200/50 cursor-pointer">
          <p>
            Sevikaa is a digital platform that connects verified domestic workers with employers. We do not sell or deliver any physical products. All services, including Premium Pass activation and access to platform features, are delivered electronically.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#1A73E8] hover:shadow-lg hover:shadow-blue-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#1A73E8] text-sm">1. Digital Service Delivery</h3>
            <p>Upon successful payment confirmation, eligible premium features are activated on your Sevikaa account.</p>
            <p className="text-gray-400 font-semibold mt-2 mb-1">Services may include:</p>
            <ul className="space-y-2 text-gray-400 font-semibold">
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#1A73E8] shrink-0 mt-0.5" /> Access to Premium Pass features</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#1A73E8] shrink-0" /> Unlocking verified worker contact details</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#1A73E8] shrink-0" /> Premium hiring tools and platform benefits</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#FBBC05] hover:shadow-lg hover:shadow-yellow-100/50 cursor-pointer">
            <h3 className="font-extrabold text-yellow-600 text-sm">2. Delivery Timeline</h3>
            <p>Most digital services are activated immediately after successful payment.</p>
            <p className="text-gray-400 mt-1">
              In rare cases, activation may take up to 24 hours due to payment verification, banking delays, or technical maintenance.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#34A853] hover:shadow-lg hover:shadow-green-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#34A853] text-sm">3. Service Availability</h3>
            <p>
              Premium features remain available for the duration of your active subscription plan. If you experience any issues accessing your purchased services, please contact our support team for assistance.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#EA4335] hover:shadow-lg hover:shadow-red-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#EA4335] text-sm">4. Support</h3>
            <p>If your Premium Pass is not activated after a successful payment, please contact us with your payment details:</p>
            <p className="mt-1 text-gray-400 font-semibold">
              Email: support@sevikaa.in<br />
              Business Hours: Monday – Friday, 10:00 AM – 5:00 PM (IST), Saturday & Sunday: Closed
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
