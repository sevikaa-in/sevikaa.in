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
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-20 font-sans">
      
      {/* 🚀 HIGH-CONTRAST PENDING AUDIT NOTICE */}
      {!isLive && (
        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-3xl space-y-3 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="bg-amber-500 text-slate-950 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0">
              <Clock size={13} className="animate-spin" /> {t('pendingAdminAudit')}
            </span>
            <span className="text-xs text-amber-950 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0">
              <Sparkles size={13} className="text-amber-600" /> {t('expressAuditGuarantee')}
            </span>
          </div>
          <h3 className="text-base font-semibold text-amber-950">{t('passportUnderVerification')}</h3>
          <p className="text-sm font-normal text-amber-900/90 leading-relaxed">
            {t('passportVerificationSub')}
          </p>
        </div>
      )}

      {/* 💳 LIGHT BRIGHT EXECUTIVE WORKER PASSPORT CARD */}
      <div className="bg-gradient-to-r from-blue-50/90 via-white to-emerald-50/90 p-6 sm:p-7 rounded-3xl shadow-sm space-y-5 border-2 border-slate-200/90">

        <div className="flex flex-col gap-4">
          {/* Row 1: Avatar & Candidate Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-[#1A73E8] p-0.5 shadow-md shadow-blue-500/20 shrink-0">
              <div className="w-full h-full bg-[#1A73E8] rounded-[14px] flex items-center justify-center text-white font-bold text-2xl">
                {workerProfile.name ? workerProfile.name.charAt(0).toUpperCase() : 'W'}
              </div>
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight truncate">{workerProfile.name || t('verifiedCandidate')}</h2>
              <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5 truncate">
                <MapPin size={15} className="text-[#1A73E8] shrink-0" />
                <span className="truncate">{workerProfile.society || 'Bangalore Society'}</span>
              </p>
            </div>
          </div>

          {/* Row 2: Status Badge (On its own distinct line) */}
          <div>
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs ${
              isLive
                ? 'bg-emerald-100 text-[#34A853] border border-emerald-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-[#34A853] animate-pulse' : 'bg-amber-600'}`} />
              {isLive ? t('liveWorkerPassport') : t('pendingAdminAudit')}
            </span>
          </div>

          {/* Row 3: Action Button (On its own distinct line) */}
          <div>
            <Link
              href="/worker/profile"
              className="w-full sm:w-auto py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <User size={15} />
              <span>{t('editProfileDetails')}</span>
            </Link>
          </div>
        </div>

        {/* Verification Badges Grid - Multi-line wrapping so no truncation */}
        <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-200/80">
          {badges.map((badge, idx) => {
            const isBadgeVerified = badge.status === 'Verified';
            return (
              <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-center flex flex-col justify-between items-center min-h-[76px]">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 uppercase tracking-tight block text-center leading-tight">
                  {badge.name}
                </span>
                <span className={`text-[11px] sm:text-xs font-medium flex flex-wrap items-center justify-center gap-1 mt-1 leading-tight ${
                  isBadgeVerified ? 'text-[#34A853]' : 'text-amber-700'
                }`}>
                  {isBadgeVerified ? <CheckCircle2 size={13} className="shrink-0" /> : <Clock size={13} className="shrink-0" />}
                  <span className="text-center">{isBadgeVerified ? t('aadhaarVerifiedBadge') : t('pendingAuditBadge')}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📊 EXECUTIVE METRICS ROW - NO TRUNCATION */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-4.5 rounded-2xl border-2 border-slate-200/90 shadow-xs flex flex-col justify-between items-center text-center hover:border-blue-300 transition-all min-h-[115px]">
          <span className="block text-[10.5px] sm:text-xs font-semibold text-slate-700 uppercase tracking-tight leading-tight">{t('availableJobsTitle')}</span>
          <span className="text-2xl sm:text-3xl font-bold text-[#1A73E8] block font-mono my-0.5">{displayJobs.length}</span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-normal leading-tight block">In Preferred Society</span>
        </div>

        <div className="bg-white p-3 sm:p-4.5 rounded-2xl border-2 border-slate-200/90 shadow-xs flex flex-col justify-between items-center text-center hover:border-blue-300 transition-all min-h-[115px]">
          <span className="block text-[10.5px] sm:text-xs font-semibold text-slate-700 uppercase tracking-tight leading-tight">{t('myApplicationsTitle')}</span>
          <span className="text-2xl sm:text-3xl font-bold text-[#34A853] block font-mono my-0.5">{applications.length}</span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-normal leading-tight block">Active Interviews</span>
        </div>

        <div className="bg-white p-3 sm:p-4.5 rounded-2xl border-2 border-slate-200/90 shadow-xs flex flex-col justify-between items-center text-center hover:border-blue-300 transition-all min-h-[115px]">
          <span className="block text-[10.5px] sm:text-xs font-semibold text-slate-700 uppercase tracking-tight leading-tight">{t('trustRatingTitle')}</span>
          <span className="text-2xl sm:text-3xl font-bold text-amber-600 flex items-center justify-center gap-1 font-mono my-0.5">
            4.9 <Star size={14} className="fill-amber-500 text-amber-500 inline" />
          </span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-normal leading-tight block">Verified Member</span>
        </div>
      </div>

      {/* 🔔 PUSH NOTIFICATIONS & UPDATES BOX */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1A73E8] border border-blue-100 flex items-center justify-center font-semibold shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t('latestUpdates')}</h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">Real-time alerts for interview requests &amp; job approvals</p>
            </div>
          </div>

          {!pushEnabled ? (
            <button
              onClick={handleEnablePushNotifications}
              className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              <BellRing size={15} />
              <span>{t('enablePushAlerts')}</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-[#34A853] bg-emerald-50 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-200 shrink-0">
              <Check size={14} className="text-[#34A853]" /> Push Alerts Active
            </span>
          )}
        </div>

        <div className="space-y-3 pt-2">
          {notifications.map((notif) => (
            <Link
              key={notif.id}
              href={notif.href}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#1A73E8] hover:bg-blue-50/50 transition-all flex items-start justify-between gap-3 block group"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">{notif.icon}</span>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-[#1A73E8] transition-colors">{notif.title}</h4>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed">{notif.subtitle}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-[#1A73E8] shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
