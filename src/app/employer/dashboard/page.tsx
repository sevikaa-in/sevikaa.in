"use client";

import React from 'react';
import { useEmployerDashboard } from './layout';
import { 
  Home, PlusCircle, Search, User, CreditCard, Phone, 
  CheckCircle2, MapPin, IndianRupee, Sparkles, ArrowRight, ShieldCheck, Clock
} from 'lucide-react';
import Link from 'next/link';

export default function EmployerOverviewPage() {
  const { 
    employerProfile, postedJobs, unlockCredits, unlockedContacts, showToast 
  } = useEmployerDashboard();

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* Household Employer Profile Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">{employerProfile.company_name}</h2>
            <span className="bg-[#1A73E8] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={10} /> Verified Employer
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Residential Society: {employerProfile.society_name}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-bold pt-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <CreditCard size={12} /> {employerProfile.subscription_status}
            </span>
            <span>&bull; Contact Unlock Credits: <strong>{unlockCredits} Remaining</strong></span>
          </div>
        </div>

        <Link
          href="/employer/dashboard/post-job"
          className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer relative z-10"
        >
          <PlusCircle size={14} />
          <span>Post New Job Opening</span>
        </Link>
      </div>

      {/* Posted Job Requisitions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Home size={16} className="text-[#1A73E8]" />
            <span>My Active Job Requisitions ({postedJobs.length})</span>
          </h3>
          <Link href="/employer/dashboard/post-job" className="text-xs font-bold text-[#1A73E8] hover:underline">
            + Post New Requirement
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {postedJobs.map((job) => {
            const isPending = job.status === 'pending';
            return (
              <div key={job.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-black text-slate-900">{job.title}</h4>
                        <span className="bg-blue-50 text-[#1A73E8] text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full shrink-0">
                          {job.category || 'Domestic Help'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-1">
                        <MapPin size={10} /> {job.society || employerProfile.society_name}
                      </span>
                    </div>
                    <span className="text-xs font-black text-[#34A853] font-mono shrink-0">₹{job.salary}/mo</span>
                  </div>

                  {job.description && (
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {job.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-xs">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${
                    isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isPending ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                    {isPending ? 'Pending Admin Audit' : 'Active / Published'}
                  </span>

                  <Link
                    href="/employer/dashboard/workers"
                    className="text-xs font-bold text-[#1A73E8] hover:underline flex items-center gap-1"
                  >
                    <span>Browse Candidates</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
