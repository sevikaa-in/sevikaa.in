import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock } from 'lucide-react';

export default function SafetyPage() {
  const safetyItems = [
    { 
      title: 'Aadhaar Verified', 
      subtitle: 'Verified Identity',
      desc: 'Every verified worker completes Aadhaar identity verification to help build a trusted community.', 
      icon: <Shield size={18} />,
      colorClass: 'hover:border-[#EA4335] hover:shadow-lg hover:shadow-red-100/50',
      textAccent: 'text-[#EA4335]',
      iconClass: 'bg-[#EA4335]/10 text-[#EA4335] group-hover:bg-[#EA4335] group-hover:text-white'
    },
    { 
      title: 'Privacy Protected', 
      subtitle: 'Your Privacy Comes First',
      desc: 'Your personal information and exact location remain secure. Sensitive details are shared only when appropriate.', 
      icon: <Lock size={18} />,
      colorClass: 'hover:border-[#1A73E8] hover:shadow-lg hover:shadow-blue-100/50',
      textAccent: 'text-[#1A73E8]',
      iconClass: 'bg-[#1A73E8]/10 text-[#1A73E8] group-hover:bg-[#1A73E8] group-hover:text-white'
    },
    { 
      title: 'Police Verified', 
      subtitle: 'Additional Peace of Mind',
      desc: 'Workers can earn a Police Verified badge by submitting a valid Police Clearance Certificate (PCC), providing additional confidence to employers.', 
      icon: <Shield size={18} />,
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
        <span className="font-extrabold text-sm tracking-tight text-gray-500 uppercase">Safety</span>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#202124]">Safety & Trust</h1>
          <p className="text-xs text-gray-500 font-bold">Your Trust is Our Priority</p>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed mt-2 max-w-xs mx-auto">
            Creating safer connections for workers and employers. Sevikaa combines identity verification, privacy protection, and secure connections to help workers and employers connect with confidence.
          </p>
        </div>

        <div className="space-y-4.5">
          {safetyItems.map((item, i) => (
            <div 
              key={i} 
              className={`bg-white rounded-3xl border-2 border-gray-200 p-5 flex items-start gap-4 shadow-sm text-left transition-all duration-300 hover:-translate-y-1 cursor-pointer group ${item.colorClass}`}
            >
              <div className={`p-3 rounded-2xl shrink-0 transition-all duration-300 ${item.iconClass}`}>
                {item.icon}
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                <h3 className="font-extrabold text-gray-700 text-sm group-hover:text-gray-900 transition-colors">
                  {item.title}
                </h3>
                <span className={`block text-[9px] uppercase font-bold ${item.textAccent} mt-0.5`}>
                  {item.subtitle}
                </span>
                <p className="mt-1.5 text-gray-400 font-medium leading-relaxed">{item.desc}</p>
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
