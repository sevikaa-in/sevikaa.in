"use client";

import React from 'react';
import { useWorkerDashboard } from '../layout';
import { Calendar, MapPin, PhoneCall, Clock, CheckCircle2 } from 'lucide-react';

export default function WorkerInterviewsPage() {
  const { showToast } = useWorkerDashboard();

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl pb-12">
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Calendar size={18} className="text-[#1A73E8]" />
          <span>Scheduled Interviews</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Upcoming phone interviews and in-person society gate desk meetings.
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <div>
            <h4 className="text-xs font-black text-slate-900">Full Time Nanny &amp; Child Caregiver</h4>
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
              <MapPin size={10} /> Employer: Ria Bhagat • DLF Westend Heights
            </span>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-[#34A853] text-[9px] font-black uppercase rounded-full">
            Confirmed
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#1A73E8]" />
            <span>Today at 4:30 PM (Phone Call)</span>
          </div>

          <a 
            href="tel:+919876543210"
            className="py-2 px-3 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PhoneCall size={14} />
            <span>Call Employer (+91 98765 43210)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
