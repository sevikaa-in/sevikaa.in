import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, ShieldCheck, MapPin, Lock, Globe, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto w-full border-x border-gray-200">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <img src="/logo.png" alt="Sevikaa Logo" className="h-10 w-auto object-contain" />
        </div>
        <span className="font-extrabold text-sm tracking-tight text-gray-500 uppercase">About</span>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#202124]">Who is Sevikaa?</h1>
          <p className="text-xs text-gray-400 font-bold leading-normal">
            Connecting Trusted Homes with Trusted Domestic Workers Across India
          </p>
        </div>

        {/* Card 1: Introduction */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm space-y-4 text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#1A73E8] hover:shadow-lg hover:shadow-blue-100/50 cursor-pointer">
          <p>
            Sevikaa is a trusted platform that helps maids, cooks, and nannies connect with families looking for reliable domestic help. By combining identity verification with smart society-based matching, we make hiring safer, faster, and more convenient for both workers and employers.
          </p>
          <p>
            Whether you're searching for your next job opportunity or looking to hire dependable domestic assistance, Sevikaa helps you connect with confidence.
          </p>
        </div>

        {/* Card 2: Commitment Callout */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#EA4335] hover:shadow-lg hover:shadow-red-100/50 cursor-pointer">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#EA4335]/10 text-[#EA4335] shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <span className="block font-extrabold text-gray-700 text-sm">Our Commitment to Trust & Safety</span>
              <span className="block text-[10px] text-gray-400 mt-1.5 leading-relaxed font-semibold">
                Every worker profile goes through a verification process before receiving a Verified Badge. Identity verification, profile review, and optional Police Clearance Certificate (PCC) checks help create a safer and more reliable experience for everyone on the platform.
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Why Choose US Highlights */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-sm text-xs text-gray-500 leading-relaxed text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#34A853] hover:shadow-lg hover:shadow-green-100/50 cursor-pointer space-y-4">
          <span className="block font-black text-gray-800 text-sm">Why Choose Sevikaa?</span>
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#34A853]/10 text-[#34A853] shrink-0">
                <ShieldCheck size={14} />
              </div>
              <span className="font-extrabold text-gray-700">Verified worker profiles</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#EA4335]/10 text-[#EA4335] shrink-0">
                <MapPin size={14} />
              </div>
              <span className="font-extrabold text-gray-700">Smart society & nearby matching</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#FBBC05]/10 text-[#FBBC05] shrink-0">
                <Lock size={14} />
              </div>
              <span className="font-extrabold text-gray-700">Privacy-first platform</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1A73E8]/10 text-[#1A73E8] shrink-0">
                <Globe size={14} />
              </div>
              <span className="font-extrabold text-gray-700">Multilingual experience</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-500 shrink-0">
                <Heart size={14} />
              </div>
              <span className="font-extrabold text-gray-700">Trusted connections between families & workers</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 px-6 text-center text-[10px] text-gray-400 leading-normal">
        Sevikaa is proudly owned and operated by YugaYatra Retail (OPC) Private Limited, a Government-Registered and DPIIT-Recognized Startup committed to building trusted digital platforms for India.
      </footer>
    </div>
  );
}
