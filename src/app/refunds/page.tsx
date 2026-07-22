import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto w-full border-x border-gray-200">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <img src="/logo.png" alt="Sevikaa Logo" className="h-10 w-auto object-contain" />
        </div>
        <span className="font-extrabold text-sm tracking-tight text-gray-500 uppercase">Refunds</span>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#202124]">Refund Policy</h1>
          <p className="text-xs text-gray-500 font-bold">Fair, Transparent & Hassle-Free</p>
        </div>

        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-gray-400 hover:shadow-lg hover:shadow-gray-200/50 cursor-pointer">
          <p>
            At Sevikaa, we strive to provide a reliable experience for both workers and employers. This policy explains how subscription cancellations and refund requests are handled.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#34A853] hover:shadow-lg hover:shadow-green-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#34A853] text-sm">1. Worker Registration</h3>
            <p>
              Registration for domestic workers is completely free. Since no payment is required, this policy applies only to employer subscription plans.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#1A73E8] hover:shadow-lg hover:shadow-blue-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#1A73E8] text-sm">2. Employer Subscription</h3>
            <p>
              Employers can purchase a Premium Pass to access premium hiring features, including unlocking verified worker contact details. Once a subscription is activated, the selected plan remains valid until its expiry date.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#FBBC05] hover:shadow-lg hover:shadow-yellow-100/50 cursor-pointer">
            <h3 className="font-extrabold text-yellow-600 text-sm">3. Refund Eligibility</h3>
            <p>Refund requests are reviewed on a case-by-case basis. A refund may be considered if:</p>
            <ul className="space-y-2 text-gray-400 font-semibold">
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#FBBC05] shrink-0 mt-0.5" /> A payment was charged more than once for the same transaction.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#FBBC05] shrink-0" /> A technical issue prevented activation of the purchased subscription.</li>
              <li className="flex items-start gap-1.5"><CheckCircle size={14} className="text-[#FBBC05] shrink-0" /> The payment was successful, but the Premium Pass was not delivered.</li>
            </ul>
            <p className="mt-2 font-semibold">
              Refunds are generally not applicable once premium features, including unlocking worker contact details, have been used. Refund requests are reviewed based on the circumstances and this policy.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-100/50 cursor-pointer">
            <h3 className="font-extrabold text-purple-600 text-sm">4. Cancellation</h3>
            <p>
              You may choose not to renew your Premium Pass at any time. Cancelling a subscription stops future renewals (if applicable) but does not affect the remaining validity of your current subscription period.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#EA4335] hover:shadow-lg hover:shadow-red-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#EA4335] text-sm">5. Refund Processing</h3>
            <p>
              Approved refunds will be processed to the original payment method. Processing times generally range from 5–7 business days, depending on your bank or payment provider.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-3 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#1A73E8] hover:shadow-lg hover:shadow-blue-100/50 cursor-pointer">
            <h3 className="font-extrabold text-[#1A73E8] text-sm">6. Need Help?</h3>
            <p>If you experience payment issues or believe you were charged incorrectly, please contact us:</p>
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
