import React from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Search, PhoneCall } from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    { 
      step: '1', 
      title: 'Register & Get Verified', 
      desc: 'Create your profile in just a few minutes. Workers add their skills, experience, and availability, while employers register their home and hiring requirements. Our verification process helps build trust for everyone.', 
      icon: <UserPlus size={18} />,
      colorClass: 'hover:border-[#1A73E8] hover:shadow-lg hover:shadow-blue-100/50',
      textAccent: 'text-[#1A73E8]',
      iconClass: 'bg-[#1A73E8]/10 text-[#1A73E8] group-hover:bg-[#1A73E8] group-hover:text-white'
    },
    { 
      step: '2', 
      title: 'Find the Right Match', 
      desc: 'Our smart society-based matching connects verified workers and employers from the same apartment or nearby neighbourhoods based on skills, availability, and location preferences.', 
      icon: <Search size={18} />,
      colorClass: 'hover:border-[#FBBC05] hover:shadow-lg hover:shadow-yellow-100/50',
      textAccent: 'text-[#FBBC05] group-hover:text-yellow-600',
      iconClass: 'bg-[#FBBC05]/10 text-[#FBBC05] group-hover:bg-[#FBBC05] group-hover:text-white'
    },
    { 
      step: '3', 
      title: 'Connect & Hire with Confidence', 
      desc: 'Employers can securely connect with suitable workers through Call or WhatsApp after unlocking contact details. Workers receive genuine job opportunities and can schedule interviews with confidence.', 
      icon: <PhoneCall size={18} />,
      colorClass: 'hover:border-[#34A853] hover:shadow-lg hover:shadow-green-100/50',
      textAccent: 'text-[#34A853]',
      iconClass: 'bg-[#34A853]/10 text-[#34A853] group-hover:bg-[#34A853] group-hover:text-white'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto w-full border-x border-gray-200">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <img src="/logo.png" alt="Sevikaa Logo" className="h-10 w-auto object-contain" />
        </div>
        <span className="font-extrabold text-sm tracking-tight text-gray-500 uppercase">Process</span>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#202124]">How Sevikaa Works</h1>
          <p className="text-xs font-bold text-gray-400">Getting Started is Easy</p>
        </div>

        <div className="space-y-4.5">
          {steps.map((item) => (
            <div 
              key={item.step} 
              className={`bg-white rounded-3xl border-2 border-gray-200 p-5 flex items-start gap-4 shadow-sm text-left transition-all duration-300 hover:-translate-y-1 cursor-pointer group ${item.colorClass}`}
            >
              <div className={`p-3 rounded-2xl shrink-0 transition-all duration-300 ${item.iconClass}`}>
                {item.icon}
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                <h3 className="font-extrabold text-gray-700 text-sm group-hover:text-gray-900 transition-colors">
                  <span className={`${item.textAccent} transition-colors mr-1`}>{item.step}.</span>
                  {item.title}
                </h3>
                <p className="mt-1 text-gray-400 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 px-6 text-center text-[10px] text-gray-400">
        Powered by YugaYatra Retail (OPC) Private Limited
      </footer>
    </div>
  );
}
