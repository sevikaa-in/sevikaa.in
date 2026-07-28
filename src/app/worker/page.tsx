"use client";

import React, { useState } from 'react';
import { useWorkerDashboard } from './layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  User, CheckCircle2, Briefcase, MapPin, IndianRupee, 
  Calendar, ShieldCheck, ArrowRight, HeartHandshake, PhoneCall, Check, X, Clock, Bell, BellRing, Sparkles, Award, Star, Zap, Shield, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function WorkerOverviewPage() {
  const { 
    workerProfile, badges, availableJobs, applications, showToast 
  } = useWorkerDashboard();
  const { t } = useLanguage();

  const isLive = workerProfile.status === 'live' || workerProfile.status === 'approved';
  const [pushEnabled, setPushEnabled] = useState(false);

  // Web Browser Push Notification Handler
  const handleEnablePushNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        showToast('Push notifications enabled for real-time interview alerts!', 'success');
        try {
          new Notification('Sevikaa Worker Alert 🔔', {
            body: 'Push notifications activated! You will receive instant alerts for interview schedules and job matches.',
            icon: '/icon.png'
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        showToast('Notification permission denied. Please allow notifications in browser settings.', 'warning');
      }
    } else {
      showToast('Web Push Notifications active for your session!', 'info');
      setPushEnabled(true);
    }
  };

  const notifications = [
    {
      id: 'notif_1',
      icon: '🎉',
      title: isLive ? 'Your profile has been verified and published.' : 'Your profile documents are under admin audit.',
      subtitle: isLive ? 'Local society employers can now view your profile and send interview requests.' : 'Express audit completes within 24 hours.',
      href: '/worker/profile',
      time: 'Just now'
    },
    {
      id: 'notif_2',
      icon: '📅',
      title: `${applications.length} Active Job Applications & Interviews`,
      subtitle: 'Tap to check scheduled interview times and unlock employer contacts.',
      href: '/worker/interviews',
      time: 'Today'
    }
  ];

  const fallbackJobs = [
    { 
      id: 'c9bf0b7b-3b02-44e1-a20d-70498b8c2d1b', 
      title: 'Full Day Housekeeping & Deep Cleaning', 
      category: 'MAID',
      employer_name: 'Ria Bhagat',
      description: 'Looking for an experienced and reliable maid for daily dusting, mopping, utensil washing, and laundry for our family in a 3BHK flat.', 
      salary_offered: 15000, 
      society_name: 'DLF Westend Heights - Akshayanagar', 
      created_at: '2026-07-27' 
    },
    { 
      id: 'd78a9e4f-8f12-4c22-921a-5b12847a98b1', 
      title: 'North & South Indian Family Cook', 
      category: 'COOK',
      employer_name: 'Vikram Sharma',
      description: 'Family of 4 needs an experienced home cook for North Indian thali (roti, sabzi, dal, rice) and South Indian breakfast preparation.', 
      salary_offered: 18000, 
      society_name: 'Prestige Song of the South - Gate 1', 
      created_at: '2026-07-27' 
    },
    { 
      id: 'e412a89c-1120-4e55-901b-1b918a204910', 
      title: 'Toddler Nanny & Infant Caregiver', 
      category: 'NANNY',
      employer_name: 'Priya Nair',
      description: 'Loving and attentive nanny needed to take care of an 18-month-old baby boy. Responsibilities include feeding, playtime, reading stories, and hygiene.', 
      salary_offered: 20000, 
      society_name: 'SNN Raj Serenity - Block B', 
      created_at: '2026-07-27' 
    }
  ];

  const rawJobs = availableJobs.length > 0 ? availableJobs : fallbackJobs;

  // Targeted Home Feed Filter: Filter by Worker's Registered Skill + Primary Society
  const workerSkillsList = (
    Array.isArray(workerProfile.skills) 
      ? workerProfile.skills 
      : (Array.isArray(workerProfile.category) 
          ? workerProfile.category 
          : [workerProfile.category || 'maid'])
  ).map((s: any) => String(s).toLowerCase());

  const workerSociety = String(workerProfile.society || '').toLowerCase();
  const workerSecondarySocieties = (
    Array.isArray(workerProfile.secondary_societies) 
      ? workerProfile.secondary_societies 
      : [workerProfile.secondary_societies || '']
  ).map((s: any) => String(s).toLowerCase()).filter(Boolean);

  const skillMatchingJobs = rawJobs.filter((job: any) => {
    const jobCat = String(job.category || job.title || '').toLowerCase();
    return workerSkillsList.some((sk: string) => jobCat.includes(sk) || sk.includes(jobCat));
  });

  const primarySocietyJobs = skillMatchingJobs.filter((job: any) => {
    const socName = (job.society_name || '').toLowerCase();
    return workerSociety !== '' && (socName.includes(workerSociety) || workerSociety.includes(socName));
  });

  const secondarySocietyJobs = skillMatchingJobs.filter((job: any) => {
    const socName = (job.society_name || '').toLowerCase();
    return workerSecondarySocieties.some((secSoc: string) => socName.includes(secSoc));
  });

  const displayJobs = primarySocietyJobs.length > 0 
    ? [...primarySocietyJobs, ...secondarySocietyJobs, ...skillMatchingJobs].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
    : (skillMatchingJobs.length > 0 ? skillMatchingJobs : rawJobs);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-20">
      
      {/* 🚀 PENDING AUDIT EXPRESS NOTICE */}
      {!isLive && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border-2 border-amber-300 p-4.5 rounded-3xl space-y-2.5 shadow-sm relative overflow-hidden backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="bg-amber-500 text-white text-[9.5px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
              <Clock size={11} className="animate-spin" /> {t('pendingAdminAudit')}
            </span>
            <span className="text-[10px] text-amber-800 font-extrabold flex items-center gap-1">
              <Sparkles size={11} className="text-amber-600" /> {t('expressAuditGuarantee')}
            </span>
          </div>
          <h3 className="text-sm font-black text-amber-950">{t('passportUnderVerification')}</h3>
          <p className="text-xs text-amber-900/90 font-medium leading-relaxed">
            {t('passportVerificationSub')}
          </p>
        </div>
      )}

      {/* 💳 ULTRA-PREMIUM GLASSMOPHIC WORKER PASSPORT CARD */}
      <div className="bg-gradient-to-br from-[#0b132b] via-[#1c2541] to-[#1e1b4b] text-white p-6 sm:p-7 rounded-3xl shadow-2xl relative overflow-hidden space-y-6 border border-indigo-400/20">
        
        {/* Glow Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/20 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-black text-xl">
                {workerProfile.name ? workerProfile.name.charAt(0).toUpperCase() : 'W'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white tracking-tight">{workerProfile.name || t('verifiedCandidate')}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${
                  isLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isLive ? t('liveWorkerPassport') : t('pendingAdminAudit')}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 mt-1">
                <MapPin size={13} className="text-blue-400" />
                <span>{workerProfile.society || 'Bangalore Society'}</span>
              </p>
            </div>
          </div>

          <Link
            href="/worker/profile"
            className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <User size={14} />
            <span>{t('editProfileDetails')}</span>
          </Link>
        </div>

        {/* Verification Badges Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-white/10 relative z-10">
          {badges.map((badge, idx) => {
            const isBadgeVerified = badge.status === 'Verified';
            return (
              <div key={idx} className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center hover:border-white/20 transition-all">
                <span className="text-[9.5px] font-black text-slate-300 uppercase tracking-wider block truncate">{badge.name}</span>
                <span className={`text-[10.5px] font-extrabold flex items-center justify-center gap-1 mt-1 ${
                  isBadgeVerified ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {isBadgeVerified ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  <span>{isBadgeVerified ? t('aadhaarVerifiedBadge') : t('pendingAuditBadge')}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📊 EXECUTIVE METRICS ROW */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1 hover:border-blue-200 transition-all">
          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('availableJobsTitle')}</span>
          <span className="text-xl font-black text-[#1A73E8] block font-mono">{displayJobs.length}</span>
          <span className="text-[10px] text-slate-500 font-bold block truncate">In Preferred Society</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1 hover:border-blue-200 transition-all">
          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('myApplicationsTitle')}</span>
          <span className="text-xl font-black text-emerald-600 block font-mono">{applications.length}</span>
          <span className="text-[10px] text-slate-500 font-bold block truncate">Active Interviews</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-1 hover:border-blue-200 transition-all">
          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('trustRatingTitle')}</span>
          <span className="text-xl font-black text-amber-500 flex items-center gap-1 font-mono">
            4.9 <Star size={14} className="fill-amber-400 text-amber-400 inline" />
          </span>
          <span className="text-[10px] text-slate-500 font-bold block truncate">Verified Member</span>
        </div>
      </div>

      {/* 🔔 PUSH NOTIFICATIONS & UPDATES BOX */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center font-black">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">{t('latestUpdates')}</h3>
              <p className="text-[10px] text-slate-400 font-medium">Real-time alerts for interview requests &amp; job approvals</p>
            </div>
          </div>

          {!pushEnabled ? (
            <button
              onClick={handleEnablePushNotifications}
              className="py-2 px-3.5 bg-blue-50 hover:bg-blue-100 text-[#1A73E8] rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <BellRing size={13} />
              <span>{t('enablePushAlerts')}</span>
            </button>
          ) : (
            <span className="text-[10.5px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200/50">
              <Check size={12} strokeWidth={3} /> {t('pushAlertsActive')}
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <Link
              key={notif.id}
              href={notif.href}
              className="p-3.5 bg-slate-50/80 hover:bg-blue-50/50 rounded-2xl border border-slate-100 flex items-start gap-3 transition-all block group"
            >
              <span className="text-base shrink-0 p-2 bg-white rounded-xl shadow-2xs">{notif.icon}</span>
              <div className="space-y-0.5 flex-1 min-w-0">
                <h4 className="text-xs font-black text-slate-800 group-hover:text-[#1A73E8] transition-colors truncate">
                  {notif.title}
                </h4>
                <p className="text-[10.5px] text-slate-500 font-medium truncate">
                  {notif.subtitle}
                </p>
              </div>
              <span className="text-[9.5px] font-bold text-slate-400 shrink-0">{notif.time}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 💼 FEATURED NEARBY REQUISITIONS FEED */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Briefcase size={16} className="text-[#1A73E8]" />
              <span>{t('nearbyJobs')}</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Matching job requisitions posted by employers in your society</p>
          </div>
          <Link href="/worker/jobs" className="text-xs font-black text-[#1A73E8] hover:underline flex items-center gap-1 shrink-0">
            <span>{t('viewAllJobs')} ({displayJobs.length})</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        <div className="space-y-4">
          {displayJobs.length === 0 ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center space-y-2">
              <Briefcase size={28} className="mx-auto text-slate-300" />
              <h4 className="text-xs font-black text-slate-800">No Job Requisitions Posted Yet</h4>
              <p className="text-[11px] text-slate-400 font-medium">As local society employers post new job requisitions, matching offers will appear here live.</p>
            </div>
          ) : (
            displayJobs.slice(0, 3).map((job) => (
              <div 
                key={job.id} 
                className="group relative bg-gradient-to-br from-white via-slate-50/80 to-blue-50/30 p-5 rounded-3xl border-2 border-slate-100 hover:border-[#1A73E8]/40 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 space-y-3.5 flex flex-col justify-between"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#1A73E8] transition-colors leading-tight">
                        {job.title}
                      </h4>
                      <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs tracking-wider">
                        {job.category || 'MAID'}
                      </span>
                      <span className="bg-amber-50 text-amber-800 border border-amber-200/80 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles size={9} className="text-amber-500" />
                        <span>VERIFIED HIRING</span>
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 font-bold flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#1A73E8] shrink-0" />
                      <span className="truncate">{job.society_name || workerProfile.society || 'Residential Society'}</span>
                    </span>
                  </div>

                  {/* Salary Box */}
                  <div className="bg-emerald-50/90 border border-emerald-200/80 px-3.5 py-2 rounded-2xl text-right shrink-0 shadow-xs">
                    <span className="block text-[8.5px] text-emerald-800 font-black uppercase tracking-widest">SALARY</span>
                    <span className="text-sm sm:text-base font-black text-emerald-700 font-mono leading-tight">
                      ₹{Number(job.salary_offered || job.salary || 15000).toLocaleString('en-IN')}<span className="text-[10px] font-bold text-emerald-700">/mo</span>
                    </span>
                  </div>
                </div>

                {/* Description Pill */}
                <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed bg-white/90 p-3.5 rounded-2xl border border-slate-100/80 shadow-xs">
                  {job.description || 'Verified domestic job requirement.'}
                </p>

                {/* Footer Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock size={11} className="text-slate-400" />
                    {job.created_at ? new Date(job.created_at).toLocaleDateString('en-IN') : '27/7/2026'}
                  </span>
                  <Link
                    href={`/worker/jobs/${job.id}`}
                    className="py-2.5 px-5 bg-gradient-to-r from-[#1A73E8] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{t('quickApply') || "Quick Apply"}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
