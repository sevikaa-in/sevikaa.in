"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ChevronRight } from 'lucide-react';

interface LegalComplianceHubCardProps {
  className?: string;
  href?: string;
}

export function LegalComplianceHubCard({ className = "", href = "/legal" }: LegalComplianceHubCardProps) {
  return (
    <div className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3 ${className}`}>
      <Link 
        href={href}
        className="flex items-center justify-between group p-1 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-50 text-[#1A73E8] group-hover:bg-[#1A73E8] group-hover:text-white transition-colors">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 group-hover:text-[#1A73E8] transition-colors flex items-center gap-1.5">
              <span>Legal, Privacy &amp; Terms Center</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase">Verified</span>
            </h3>
            <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
              Privacy Policy, Terms of Service, Refund Policy &amp; Disclosures
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 group-hover:text-[#1A73E8] transition-all" />
      </Link>
    </div>
  );
}
