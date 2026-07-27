"use client";

import React, { useState } from 'react';
import { useWorkerDashboard } from './layout';
import { 
  User, CheckCircle2, Briefcase, MapPin, IndianRupee, 
  Calendar, ShieldCheck, ArrowRight, HeartHandshake, PhoneCall, Check, X, Clock, Bell, BellRing
} from 'lucide-react';
import Link from 'next/link';

export default function WorkerOverviewPage() {
  const { 
    workerProfile, badges, availableJobs, applications, showToast 
  } = useWorkerDashboard();

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
      subtitle: isLive ? 'Local society employers can now contact you.' : 'Audit complete within 24 hours.',
      href: '/worker/dashboard/profile',
      time: 'Just now'
    },
    {
      id: 'notif_2',
      icon: '💼',
      title: `${availableJobs.length} new jobs available near your preferred societies.`,
      subtitle: 'Apply now with 1-click free application.',
      href: '/worker/dashboard/jobs',
      time: '10 mins ago'
    },
    {
      id: 'notif_3',
      icon: '📅',
      title: 'Upcoming interview scheduled.',
      subtitle: 'Check your interview time slots & contact instructions.',
      href: '/worker/dashboard/interviews',
      time: '2 hours ago'
    }
  ];

  const handleApply = (jobTitle: string) => {
    showToast(`Application submitted for ${jobTitle}!`, 'success');
  };

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      
      {/* Candidate Profile Summary Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">{workerProfile.name}</h2>
            <span className={`text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              isLive ? 'bg-emerald-500' : 'bg-amber-500'
            }`}>
              {isLive ? <CheckCircle2 size={10} /> : <Clock size={10} />}
              {isLive ? 'LIVE VERIFIED' : 'PENDING ADMIN AUDIT'}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            {Array.isArray(workerProfile.category) ? workerProfile.category.join(' • ') : workerProfile.category}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-bold pt-1">
            <span className="flex items-center gap-1"><MapPin size={12} className="text-[#1A73E8]" /> {workerProfile.society}</span>
            <span className="flex items-center gap-1"><IndianRupee size={12} className="text-emerald-400" /> ₹{workerProfile.expectedSalary} / Month</span>
          </div>
        </div>

        <Link
          href="/worker/dashboard/profile"
          className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer relative z-10"
        >
          <span>Edit Profile &amp; Skills</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* PENDING ADMIN AUDIT NOTICE BANNER */}
      {!isLive && (
        <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl space-y-1.5 text-amber-900 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black text-amber-800">
            <Clock size={16} className="text-amber-600 shrink-0" />
            <span>Onboarding Documents Submitted – Admin Audit Pending</span>
          </div>
          <p className="text-[11px] text-amber-800/90 font-medium leading-relaxed">
            Your selfie, Aadhaar card, and video intro have been submitted successfully. A Sevikaa Admin is currently auditing your documents. Once verified, your status will change to <strong>LIVE</strong> and society employers will be able to contact you.
          </p>
        </div>
      )}

      {/* INTERACTIVE LATEST UPDATES & PUSH NOTIFICATION CARD */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing size={18} className="text-[#1A73E8]" />
            <div>
              <h3 className="text-sm font-black text-slate-900">Latest Updates &amp; Notifications</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time alerts for job interviews &amp; status</p>
            </div>
          </div>

          <button
            onClick={handleEnablePushNotifications}
            className={`py-1.5 px-3 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              pushEnabled 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-blue-50 hover:bg-blue-100 text-[#1A73E8] border border-blue-200'
            }`}
          >
            <Bell size={12} />
            <span>{pushEnabled ? '✓ Push Active' : 'Enable Push Alerts'}</span>
          </button>
        </div>

        {/* Clickable Notification Feed */}
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <Link 
              key={notif.id}
              href={notif.href}
              className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl p-2 bg-white rounded-xl shadow-xs shrink-0">{notif.icon}</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1A73E8] transition-colors">{notif.title}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{notif.subtitle}</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-300 group-hover:text-[#1A73E8] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recommended Jobs Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Briefcase size={16} className="text-[#1A73E8]" />
            <span>Recommended Jobs Near Your Societies</span>
          </h3>
          <Link href="/worker/dashboard/jobs" className="text-xs font-bold text-[#1A73E8] hover:underline">
            View All ({availableJobs.length})
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableJobs.map((job) => (
            <div key={job.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">{job.title}</h4>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {job.society_name}
                  </span>
                </div>
                <span className="text-sm font-black text-[#34A853]">₹{job.salary_offered}/mo</span>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {job.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <span className="text-[9.5px] font-mono text-slate-400">{job.created_at}</span>
                <button
                  onClick={() => handleApply(job.title)}
                  className="py-1.5 px-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
