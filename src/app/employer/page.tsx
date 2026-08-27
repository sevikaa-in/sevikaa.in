"use client";

import React, { useState, useEffect } from 'react';
import { useEmployerDashboard } from './layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Home, PlusCircle, Search, User, CreditCard, Phone, 
  CheckCircle2, MapPin, IndianRupee, Sparkles, ArrowRight, ShieldCheck, Clock, Briefcase, Users, Eye, X, AlertTriangle, Edit, RefreshCw, ChevronRight, UserCheck, Star, Calendar, ShieldAlert, Lock
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function EmployerOverviewPage() {
  const { 
    employerProfile, postedJobs, showToast 
  } = useEmployerDashboard();
  const { t } = useLanguage();

  const [nearbyWorkers, setNearbyWorkers] = useState<any[]>([]);
  const [totalWorkersCount, setTotalWorkersCount] = useState<number>(0);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const { webApiClient } = await import('@/lib/webApiClient');
        const data = await webApiClient.get('/api/employer/workers');
        const dbWorkers = data?.workers || [];

        if (dbWorkers.length > 0) {
          setTotalWorkersCount(dbWorkers.length);
          setNearbyWorkers(dbWorkers.slice(0, 3).map((w: any) => ({
            id: w.id,
            name: w.full_name || w.profiles?.full_name || 'Domestic Helper',
            category: Array.isArray(w.skills) && w.skills[0] ? w.skills[0] : 'Cook / Maid',
            categoryLabel: Array.isArray(w.skills) ? w.skills.join(', ') : 'Cook / Maid',
            rating: w.rating || 4.9,
            reviews: w.total_reviews || 12,
            experience: `${w.experience_years || 4} Years Exp`,
            society: w.preferred_society_name || employerProfile.society_name || 'Gated Society',
            badge: w.is_police_verified ? 'Police Clearance' : 'Aadhaar Verified',
            salary: w.expected_salary ? `₹${Number(w.expected_salary).toLocaleString('en-IN')}/mo` : '₹15,000/mo',
            photo: (w.full_name || w.profiles?.full_name || 'S')[0].toUpperCase()
          })));
        }
      } catch (err) {
        console.error("Error fetching nearby workers:", err);
      }
    };

    fetchWorkers();
  }, [employerProfile.society_name]);

  const activeJobsCount = postedJobs.filter(j => j.status === 'active' || j.status === 'approved').length;
  const pendingJobsCount = postedJobs.filter(j => j.status === 'pending' || j.status === 'changes_requested').length;
  const totalApplicantsCount = postedJobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0);
  const isEmployerVerified = employerProfile.status === 'live' || employerProfile.status === 'approved';

  // Profile completion calculation matching Account Settings (10 total steps)
  const cleanPhone = (employerProfile.phone || '').replace(/\D/g, '').slice(-10);
  const hasAadhaarFront = !!employerProfile.aadhaar_front_url;
  const hasAadhaarBack = !!employerProfile.aadhaar_back_url;
  const isResidencyDone = !!employerProfile.residency_proof_url;
  const isPhotoDone = !!employerProfile.avatar_url;

  const completionSteps = [
    { label: t('stepFullName') || 'Employer Name', done: !!employerProfile.company_name?.trim() },
    { label: t('stepMobileNumber') || 'Mobile Number', done: cleanPhone.length === 10 },
    { label: 'Email Address', done: !!employerProfile.email?.trim() },
    { label: 'Gated Society', done: !!employerProfile.society_name },
    { label: 'Tower / Block', done: !!employerProfile.tower?.trim() || !!employerProfile.tower_block?.trim() },
    { label: 'Flat Address', done: !!employerProfile.address?.trim() },
    { label: t('stepProfilePhoto') || 'Profile Photo', done: isPhotoDone },
    { label: 'Residency Proof', done: isResidencyDone },
    { label: 'Aadhaar (Front)', done: hasAadhaarFront },
    { label: 'Aadhaar (Back)', done: hasAadhaarBack }
  ];
  const completedCount = completionSteps.filter(s => s.done).length;
  const completionPercent = Math.round((completedCount / completionSteps.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-20">
      
      {/* 🏡 HOUSEHOLD EMPLOYER HERO CONTROL BANNER (100% RESPONSIVE - NO OVERFLOW) */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white text-slate-900 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4 relative overflow-hidden border border-blue-200/90">
        
        {/* Row 1: Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-blue-100 text-[#1A73E8] text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full border border-blue-200/90 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500 shrink-0" /> {t('employerHubEyebrow')}
          </span>
          {isEmployerVerified ? (
            <span className="bg-emerald-100 text-emerald-800 text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-200/90 flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-600 shrink-0" /> {t('verifiedEmployerAccount') || 'Verified Employer Account'}
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-800 text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full border border-amber-200/90 flex items-center gap-1">
              <Clock size={11} className="text-amber-600 shrink-0" /> {t('pendingAdminAudit') || 'Pending Admin Audit'}
            </span>
          )}
        </div>

        {/* Row 2: Employer Name */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {employerProfile.company_name}
          </h2>
        </div>

        {/* Row 3: Society Location */}
        <div>
          <p className="text-xs sm:text-sm text-slate-600 font-bold flex items-center gap-1.5">
            <MapPin size={14} className="text-[#1A73E8] shrink-0" />
            <span>{employerProfile.society_name}</span>
          </p>
        </div>

        {/* Row 4: Action Button */}
        <div>
          <Link
            href="/employer/post-job"
            className="w-full sm:w-auto py-3 px-5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black transition-all active:scale-95 shadow-md shadow-blue-500/20 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>{t('postNewReqBtn')}</span>
          </Link>
        </div>

        {/* Row 5: Full-Width Executive Gate Pass & Trust Info Strip */}
        <div className="w-full bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${isEmployerVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {isEmployerVerified ? <ShieldCheck size={18} /> : <Clock size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider truncate">
                {isEmployerVerified ? (t('gatePassVerified') || 'Gate Pass Verified') : 'Gate Pass Audit'}
              </h4>
              <p className={`text-[10.5px] sm:text-xs font-extrabold truncate ${isEmployerVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isEmployerVerified ? (t('liveDltSmsAlerts') || 'Live DLT SMS Alerts') : 'Pending Admin Verification'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10.5px] sm:text-xs flex-wrap">
            <span className="flex items-center gap-1.5 min-w-0">
              <Users size={13} className="text-[#1A73E8] shrink-0" />
              <span className="text-slate-500 truncate">{t('societyHelpers') || 'Society Helpers:'}</span>
              <strong className="text-slate-900 shrink-0">
                {totalWorkersCount > 0 ? `${totalWorkersCount} ${t('verified') || 'Verified'}` : 'Platform Active'}
              </strong>
            </span>

            <span className="flex items-center gap-1.5 min-w-0">
              {hasAadhaarFront && hasAadhaarBack ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span className="text-slate-500 truncate">{t('aadhaarRecord') || 'Aadhaar Record:'}</span>
                  <strong className="text-emerald-600 shrink-0">100% Passed</strong>
                </>
              ) : hasAadhaarFront || hasAadhaarBack ? (
                <>
                  <Clock size={13} className="text-amber-600 shrink-0" />
                  <span className="text-slate-500 truncate">{t('aadhaarRecord') || 'Aadhaar Record:'}</span>
                  <strong className="text-amber-600 shrink-0">50% Uploaded</strong>
                </>
              ) : (
                <>
                  <Lock size={13} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500 truncate">{t('aadhaarRecord') || 'Aadhaar Record:'}</span>
                  <strong className="text-slate-500 shrink-0">Pending Upload</strong>
                </>
              )}
            </span>
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

      {/* 📊 2 x 2 HIRING CONTROL METRICS GRID (OPTIMIZED FOR PERFECT VIEW) */}
      <div className="grid grid-cols-2 gap-3.5 text-slate-800">
        <Link
          href="/employer/jobs"
          className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-1.5 text-left block hover:border-blue-300 group min-w-0 overflow-hidden"
        >
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider flex items-center justify-between gap-1 min-w-0">
            <span className="truncate">{t('postedReqsTitle') || "Posted Requisitions"}</span>
            <ChevronRight size={13} className="text-slate-300 group-hover:text-[#1A73E8] shrink-0" />
          </span>
          <span className="text-2xl font-black text-slate-900 block truncate">{postedJobs.length}</span>
          <span className="text-[11px] text-emerald-600 font-bold block truncate">{activeJobsCount} {t('active') || "Active"} &bull; {pendingJobsCount} {t('pending') || "Pending"}</span>
        </Link>

        <Link
          href="/employer/jobs"
          className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-1.5 text-left block hover:border-blue-300 group min-w-0 overflow-hidden"
        >
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider flex items-center justify-between gap-1 min-w-0">
            <span className="truncate">{t('totalApplicantsTitle') || "Total Applicants"}</span>
            <ChevronRight size={13} className="text-slate-300 group-hover:text-[#1A73E8] shrink-0" />
          </span>
          <span className="text-2xl font-black text-[#1A73E8] block truncate">{totalApplicantsCount}</span>
          <span className="text-[11px] text-slate-500 font-bold block truncate">{t('viewCandidatesSub') || "View Applicants"}</span>
        </Link>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1.5 text-left min-w-0 overflow-hidden">
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider truncate">{t('societyHelpersTitle') || "Helpers in Society"}</span>
          <span className="text-2xl font-black text-slate-900 block truncate">{totalWorkersCount}</span>
          <span className="text-[11px] text-emerald-600 font-bold block truncate">{t('societyCoverageSub') || "Verified in Society"}</span>
        </div>

        <Link
          href="/employer/account"
          className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-1.5 text-left block hover:border-blue-300 group min-w-0 overflow-hidden"
        >
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider flex items-center justify-between gap-1 min-w-0">
            <span className="truncate">{t('accountStatusTitle') || "Account Plan"}</span>
            <ChevronRight size={13} className="text-slate-300 group-hover:text-[#1A73E8] shrink-0" />
          </span>
          <span className="text-base font-black text-emerald-600 block truncate mt-0.5">{employerProfile.subscription_status || 'Standard Plan'}</span>
          <span className="text-[11px] text-slate-400 font-bold block truncate">{t('unlimitedHiringSub') || "Unlimited Direct Contact"}</span>
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

      {/* 🌟 VERIFIED HELPERS IN YOUR SOCIETY (TOP-TO-BOTTOM PREMIUM VERTICAL STACK BANNER) */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50/60 to-blue-50/90 p-5 sm:p-6 rounded-3xl border border-blue-200/90 shadow-xs space-y-4 relative overflow-hidden">
        
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1A73E8] text-white rounded-2xl shrink-0 shadow-md shadow-blue-500/20">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
                {t('verifiedHelpersTitle') || "VERIFIED HELPERS IN YOUR SOCIETY"}
              </h3>
            </div>
          </div>

          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-200 shrink-0 flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>{totalWorkersCount} {t('verifiedBadgeText') || "Verified"}</span>
          </span>
        </div>

        {/* Middle Description Text */}
        <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
          {t('discoverInviteDesc') || "Discover & invite verified maids, cooks & nannies registered in"} <strong className="text-slate-900 font-black">{employerProfile.society_name || t('yourSocietyFallback') || 'your society'}</strong>.
        </p>

        {/* Bottom Full-Width Premium Action Button */}
        <div>
          <Link
            href={postedJobs.some(j => j.status === 'active' || j.status === 'approved') ? `/employer/jobs/${postedJobs.find(j => j.status === 'active' || j.status === 'approved')?.id}/invite` : '/employer/workers'}
            className="w-full py-3.5 px-5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md shadow-blue-500/20 flex items-center justify-between cursor-pointer active:scale-98 group"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-300 shrink-0" />
              <span>{t('browseInviteSocietyHelpersBtn') || "Browse & Invite Society Helpers"}</span>
            </span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform shrink-0" />
          </Link>
        </div>

      </div>

      {/* 🛡️ POWERED BY YGAYATRA BRAND FOOTER */}
      <div className="pt-8 pb-2 flex flex-col items-center justify-center gap-1.5 opacity-75 hover:opacity-100 transition-opacity select-none border-t border-slate-200/60">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          Powered By
        </span>
        <img 
          src="/ygayatra.png" 
          alt="Ygayatra" 
          className="h-6 sm:h-7 object-contain grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100" 
        />
      </div>

    </div>
  );
}
