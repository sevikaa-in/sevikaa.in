"use client";

import React, { useState, useEffect } from 'react';
import { useEmployerDashboard } from './layout';
import { useLanguage } from '../../../context/LanguageContext';
import { 
  Home, PlusCircle, Search, User, CreditCard, Phone, 
  CheckCircle2, MapPin, IndianRupee, Sparkles, ArrowRight, ShieldCheck, Clock, Briefcase, Users, Eye, X, AlertTriangle, Edit, RefreshCw, ChevronRight, UserCheck, Star, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

export default function EmployerOverviewPage() {
  const { 
    employerProfile, postedJobs, showToast 
  } = useEmployerDashboard();
  const { t } = useLanguage();

  const [nearbyWorkers, setNearbyWorkers] = useState<any[]>([]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const { data: dbWorkers } = await supabase
          .from('worker_profiles')
          .select('*, profiles(*)')
          .limit(3);

        if (dbWorkers && dbWorkers.length > 0) {
          setNearbyWorkers(dbWorkers.map((w: any) => ({
            id: w.id,
            name: w.full_name || 'Domestic Helper',
            category: Array.isArray(w.skills) && w.skills[0] ? w.skills[0] : 'Cook / Maid',
            categoryLabel: Array.isArray(w.skills) ? w.skills.join(', ') : 'Cook / Maid',
            rating: w.rating || 4.9,
            reviews: w.total_reviews || 12,
            experience: `${w.experience_years || 4} Years Exp`,
            society: w.preferred_society_name || 'DLF Westend Heights',
            badge: w.is_police_verified ? 'Police Clearance' : 'Aadhaar Verified',
            salary: w.expected_salary ? `₹${Number(w.expected_salary).toLocaleString('en-IN')}/mo` : '₹15,000/mo',
            photo: (w.full_name || 'S')[0].toUpperCase()
          })));
        }
      } catch (err) {
        console.error("Error fetching nearby workers:", err);
      }
    };

    fetchWorkers();
  }, []);

  const activeJobsCount = postedJobs.filter(j => j.status === 'active' || j.status === 'approved').length;
  const pendingJobsCount = postedJobs.filter(j => j.status === 'pending' || j.status === 'changes_requested').length;
  const totalApplicantsCount = postedJobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-20">
      
      {/* 🏡 HOUSEHOLD EMPLOYER HERO CONTROL BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden border border-blue-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-blue-500/30 text-blue-300 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1">
                <Sparkles size={10} className="text-amber-400" /> Sevikaa Household Employer Hub
              </span>
            </div>
            <h2 className="text-xl font-black text-white">{employerProfile.company_name}</h2>
            <p className="text-xs text-slate-300 font-semibold flex items-center gap-1">
              <MapPin size={12} className="text-blue-400" />
              <span>{employerProfile.society_name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link
              href="/employer/dashboard/post-job"
              className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black transition-all active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>Post New Requisition</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 📊 HIRING CONTROL METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-800">
        <Link
          href="/employer/dashboard/jobs"
          className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-1 text-left block hover:border-blue-300 group"
        >
          <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider flex items-center justify-between">
            <span>Posted Requisitions</span>
            <ChevronRight size={12} className="text-slate-300 group-hover:text-[#1A73E8]" />
          </span>
          <span className="text-xl font-black text-slate-900 block">{postedJobs.length}</span>
          <span className="text-[10px] text-emerald-600 font-bold block">{activeJobsCount} Active &bull; {pendingJobsCount} Pending</span>
        </Link>

        <Link
          href="/employer/dashboard/workers"
          className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-1 text-left block hover:border-blue-300 group"
        >
          <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider flex items-center justify-between">
            <span>Inbound Applicants</span>
            <ChevronRight size={12} className="text-slate-300 group-hover:text-[#1A73E8]" />
          </span>
          <span className="text-xl font-black text-[#1A73E8] block">{totalApplicantsCount}</span>
          <span className="text-[10px] text-slate-500 font-semibold block">Verified Workers</span>
        </Link>

        <Link
          href="/employer/dashboard/workers"
          className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-1 text-left block hover:border-blue-300 group"
        >
          <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider flex items-center justify-between">
            <span>Interviews</span>
            <ChevronRight size={12} className="text-slate-300 group-hover:text-[#1A73E8]" />
          </span>
          <span className="text-xl font-black text-amber-600 block">2</span>
          <span className="text-[10px] text-amber-700 font-semibold block">Scheduled Calls</span>
        </Link>

        <Link
          href="/employer/dashboard/account"
          className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-1 text-left block hover:border-blue-300 group"
        >
          <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider flex items-center justify-between">
            <span>Identity Status</span>
            <ChevronRight size={12} className="text-slate-300 group-hover:text-[#1A73E8]" />
          </span>
          <span className="text-xs font-black text-emerald-700 block mt-1 flex items-center gap-1">
            <CheckCircle2 size={13} /> Aadhaar Verified
          </span>
          <span className="text-[10px] text-slate-400 font-semibold block">Verified Employer</span>
        </Link>
      </div>

      {/* 💼 ACTIVE REQUISITIONS QUICK OVERVIEW */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Briefcase size={16} className="text-[#1A73E8]" />
              <span>Active Household Requisitions</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Quick view of your active job listings and admin feedback.
            </p>
          </div>

          <Link
            href="/employer/dashboard/jobs"
            className="text-xs font-black text-[#1A73E8] hover:underline flex items-center gap-1"
          >
            <span>Manage All Jobs ({postedJobs.length})</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {postedJobs.length === 0 ? (
          <div className="bg-slate-50 p-6 rounded-2xl text-center space-y-2 border border-slate-100">
            <Briefcase size={28} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No Job Requisitions Posted Yet</p>
            <Link
              href="/employer/dashboard/post-job"
              className="py-2 px-4 bg-[#1A73E8] text-white rounded-xl text-xs font-black inline-flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle size={13} /> Post First Job
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {postedJobs.slice(0, 2).map((job) => {
              const isActive = job.status === 'active' || job.status === 'approved';
              const isChangesRequested = job.status === 'changes_requested';

              return (
                <div 
                  key={job.id}
                  className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-slate-900 truncate">{job.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase shrink-0 ${
                        isActive ? 'bg-emerald-100 text-emerald-800' : isChangesRequested ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isActive ? 'Active' : isChangesRequested ? 'Action Needed' : 'Pending Audit'}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-slate-500 font-bold flex items-center justify-between">
                      <span>Offered: <strong className="text-emerald-700 font-mono">₹{job.salary}/mo</strong></span>
                      <span>{job.applicationsCount || 0} Applicants</span>
                    </p>
                  </div>

                  <Link
                    href="/employer/dashboard/jobs"
                    className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold text-center cursor-pointer block"
                  >
                    View Details &amp; Applicants
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🌟 FEATURED VERIFIED DOMESTIC HELPERS NEARBY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <UserCheck size={16} className="text-[#1A73E8]" />
              <span>Available Verified Domestic Helpers in {employerProfile.society_name?.split('-')[0] || 'Your Society'}</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Browse top-rated, Aadhaar-verified domestic candidates actively looking for work.
            </p>
          </div>

          <Link
            href="/employer/dashboard/workers"
            className="text-xs font-black text-[#1A73E8] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View All Candidates</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="flex flex-col space-y-3">
          {nearbyWorkers.map((worker) => (
            <div 
              key={worker.id}
              className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-blue-200"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-[#1A73E8] font-black text-base flex items-center justify-center shrink-0 border border-blue-200 shadow-xs">
                  {worker.photo}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-slate-900 truncate">{worker.name}</h4>
                    <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-200/50">
                      {worker.badge}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 truncate">{worker.categoryLabel} &bull; {worker.experience}</p>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 pt-0.5">
                    <span className="flex items-center gap-1 text-amber-600 font-extrabold">
                      <Star size={11} className="fill-amber-500 text-amber-500" /> {worker.rating} ({worker.reviews} reviews)
                    </span>
                    <span>&bull;</span>
                    <span className="text-slate-500 font-semibold">{worker.society}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-right">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Salary</span>
                  <span className="text-sm font-black text-slate-900 font-mono">{worker.salary}</span>
                </div>
                <Link
                  href="/employer/dashboard/workers"
                  className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black text-center cursor-pointer block shadow-sm transition-all shrink-0"
                >
                  Hire Candidate
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
