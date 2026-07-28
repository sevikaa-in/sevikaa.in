"use client";

import React, { useState, useEffect } from 'react';
import { useEmployerDashboard } from './layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Home, PlusCircle, Search, User, CreditCard, Phone, 
  CheckCircle2, MapPin, IndianRupee, Sparkles, ArrowRight, ShieldCheck, Clock, Briefcase, Users, Eye, X, AlertTriangle, Edit, RefreshCw, ChevronRight, UserCheck, Star, Calendar, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

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

  // Profile completion calculation for widget
  const cleanPhone = (employerProfile.phone || '').replace(/\D/g, '').slice(-10);
  const completionSteps = [
    { label: t('stepFullName') || 'Employer Name', done: !!employerProfile.company_name?.trim() },
    { label: t('stepMobileNumber') || 'Mobile Number', done: cleanPhone.length === 10 },
    { label: 'Email Address', done: !!employerProfile.email?.trim() },
    { label: 'Gated Society', done: !!employerProfile.society_name },
    { label: 'Tower / Block', done: !!employerProfile.tower?.trim() },
    { label: 'Flat Address', done: !!employerProfile.address?.trim() },
    { label: t('stepProfilePhoto') || 'Profile Photo', done: !!employerProfile.avatar_url },
    { label: t('stepAadhaarUploaded') || 'Aadhaar Uploaded', done: employerProfile.status === 'live' || employerProfile.status === 'approved' }
  ];
  const completedCount = completionSteps.filter(s => s.done).length;
  const completionPercent = Math.round((completedCount / completionSteps.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-20">
      
      {/* 🏡 HOUSEHOLD EMPLOYER HERO CONTROL BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden border border-blue-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-blue-500/30 text-blue-300 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1">
                <Sparkles size={10} className="text-amber-400" /> {t('employerHubEyebrow')}
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
              href="/employer/post-job"
              className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black transition-all active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>{t('postNewReqBtn')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 📊 EMPLOYER PROFILE COMPLETENESS DASHBOARD WIDGET */}
      {completionPercent < 100 && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white p-4 rounded-3xl border border-blue-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-[#1A73E8] text-white rounded-xl shrink-0">
                <UserCheck size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 leading-tight flex items-center gap-2">
                  <span>{t('profileCompletenessTitle') || "Employer Profile Completeness"}</span>
                  <span className="text-xs font-black text-[#1A73E8] font-mono">({completionPercent}%)</span>
                </h4>
                <p className="text-[10.5px] text-slate-500 font-semibold truncate mt-0.5">
                  {completionSteps.length - completedCount} {t('stepsRemainingSub') || "steps remaining to unlock 1-click job postings"}
                </p>
              </div>
            </div>

            <Link
              href="/employer/account"
              className="py-1.5 px-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white text-[11px] font-black rounded-xl shadow-xs shrink-0 whitespace-nowrap cursor-pointer transition-all flex items-center gap-1"
            >
              <span>Complete Profile</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#1A73E8] rounded-full transition-all duration-700" 
              style={{ width: `${completionPercent}%` }} 
            />
          </div>
        </div>
      )}

      {/* 📊 HIRING CONTROL METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-800">
        <Link
          href="/employer/jobs"
          className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-1 text-left block hover:border-blue-300 group min-w-0 overflow-hidden"
        >
          <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider flex items-center justify-between gap-1 min-w-0">
            <span className="truncate">{t('postedReqsTitle') || "Posted Requisitions"}</span>
            <ChevronRight size={12} className="text-slate-300 group-hover:text-[#1A73E8] shrink-0" />
          </span>
          <span className="text-xl font-black text-slate-900 block truncate">{postedJobs.length}</span>
          <span className="text-[10px] text-emerald-600 font-bold block truncate">{activeJobsCount} {t('active') || "Active"} &bull; {pendingJobsCount} {t('pending') || "Pending"}</span>
        </Link>

        <Link
          href="/employer/jobs"
          className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-1 text-left block hover:border-blue-300 group min-w-0 overflow-hidden"
        >
          <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider flex items-center justify-between gap-1 min-w-0">
            <span className="truncate">{t('totalApplicantsTitle') || "Total Applicants"}</span>
            <ChevronRight size={12} className="text-slate-300 group-hover:text-[#1A73E8] shrink-0" />
          </span>
          <span className="text-xl font-black text-[#1A73E8] block truncate">{totalApplicantsCount}</span>
          <span className="text-[10px] text-slate-500 font-bold block truncate">{t('viewCandidatesSub') || "View Applicants"}</span>
        </Link>

        <div className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-xs space-y-1 text-left min-w-0 overflow-hidden">
          <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider truncate">{t('societyHelpersTitle') || "Helpers in Society"}</span>
          <span className="text-xl font-black text-slate-900 block truncate">52</span>
          <span className="text-[10px] text-emerald-600 font-bold block truncate">{t('societyCoverageSub') || "Verified in Society"}</span>
        </div>

        <Link
          href="/employer/account"
          className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-1 text-left block hover:border-blue-300 group min-w-0 overflow-hidden"
        >
          <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider flex items-center justify-between gap-1 min-w-0">
            <span className="truncate">{t('accountStatusTitle') || "Account Plan"}</span>
            <ChevronRight size={12} className="text-slate-300 group-hover:text-[#1A73E8] shrink-0" />
          </span>
          <span className="text-sm font-black text-emerald-600 block mt-1 truncate">{employerProfile.subscription_status || 'Standard Plan'}</span>
          <span className="text-[10px] text-slate-400 font-bold block truncate">{t('unlimitedHiringSub') || "Unlimited Direct Contact"}</span>
        </Link>
      </div>

      {/* 🚀 QUICK ACTIONS BANNER */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200/80 p-4 rounded-3xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#1A73E8] text-white rounded-2xl shrink-0 shadow-md">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">{t('hireFastTitle') || "Need Domestic Help Fast?"}</h4>
            <p className="text-[11px] text-slate-500 font-medium">{t('hireFastSub') || "Browse 100+ verified maids, cooks & nannies near you"}</p>
          </div>
        </div>

        <Link
          href="/employer/workers"
          className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shrink-0 whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 shadow-xs"
        >
          <span>{t('browseHelpersBtn') || "Browse Helpers"}</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* 📋 RECENT POSTED REQUISITIONS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase size={15} className="text-[#1A73E8]" />
            <span>{t('yourActiveRequisitionsTitle') || "Your Active Requisitions"}</span>
          </h3>
          <Link href="/employer/jobs" className="text-[11px] font-black text-[#1A73E8] hover:underline flex items-center gap-1">
            <span>{t('viewAllBtn') || "View All"}</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        {postedJobs.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Briefcase size={32} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">{t('noJobsPostedYet') || "No Job Requisitions Posted Yet"}</p>
            <Link
              href="/employer/post-job"
              className="py-2 px-4 bg-[#1A73E8] text-white rounded-xl text-xs font-black shadow-md inline-flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle size={13} />
              <span>{t('postFirstJobBtn') || "Post First Job"}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {postedJobs.slice(0, 3).map((job) => (
              <div key={job.id} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-slate-50 transition-all">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-black text-slate-900">{job.title}</h4>
                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                      job.status === 'active' || job.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {job.status === 'active' || job.status === 'approved' ? (t('activeBadge') || 'Active') : (t('pendingBadge') || 'Pending Audit')}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-semibold flex items-center gap-2">
                    <span>₹{Number(job.salary || 15000).toLocaleString('en-IN')}/mo</span>
                    <span>&bull;</span>
                    <span>{job.workType || 'Full Day'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-blue-50 text-[#1A73E8] text-[10px] font-black px-2.5 py-1 rounded-xl border border-blue-200">
                    {job.applicationsCount || 0} {t('applicantsUnit') || "Applicants"}
                  </span>
                  <Link
                    href={`/employer/jobs?id=${job.id}`}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🌟 FEATURED VERIFIED WORKERS IN YOUR SOCIETY */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={15} className="text-[#1A73E8]" />
            <span>{t('nearbySocietyHelpersTitle') || "Verified Helpers in Your Society"}</span>
          </h3>
          <Link href="/employer/workers" className="text-[11px] font-black text-[#1A73E8] hover:underline flex items-center gap-1">
            <span>{t('viewAllBtn') || "View All"}</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {nearbyWorkers.map((w) => (
            <div key={w.id} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 space-y-2.5 hover:bg-white hover:shadow-xs transition-all">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#1A73E8] text-white font-black rounded-xl flex items-center justify-center text-xs shadow-xs shrink-0">
                  {w.photo}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate">{w.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold truncate">{w.categoryLabel}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border-t border-slate-200/50 pt-2">
                <span className="flex items-center gap-1 text-amber-600 font-black">
                  <Star size={11} fill="currentColor" /> {w.rating} ({w.reviews})
                </span>
                <span className="text-emerald-700 font-black">{w.salary}</span>
              </div>

              <Link
                href={`/employer/workers?id=${w.id}`}
                className="w-full py-1.5 bg-white hover:bg-blue-50 text-[#1A73E8] border border-blue-200 rounded-xl text-[10.5px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer block text-center"
              >
                <span>{t('viewProfileBtn')}</span>
                <ChevronRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
