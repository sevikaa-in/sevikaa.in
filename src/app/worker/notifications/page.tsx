"use client";

import React, { useState, useEffect } from 'react';
import { useWorkerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  Bell, CheckCircle2, AlertTriangle, Briefcase, Calendar, 
  Clock, ArrowRight, ShieldCheck, Check, Trash2, Phone, 
  Sparkles, Filter, Eye, User
} from 'lucide-react';
import Link from 'next/link';

export interface WorkerNotificationItem {
  id: string;
  type: 'interview_scheduled' | 'profile_approved' | 'job_match' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export default function WorkerNotificationsPage() {
  const { user, workerProfile, applications, availableJobs, showToast } = useWorkerDashboard();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<WorkerNotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'interviews' | 'jobs'>('all');

  useEffect(() => {
    fetchWorkerNotifications();
  }, [user, workerProfile, applications, availableJobs]);

  const fetchWorkerNotifications = async () => {
    setLoadingNotifs(true);
    const notifList: WorkerNotificationItem[] = [];
    const isLive = workerProfile.status === 'live' || workerProfile.status === 'approved';
    const activeUserId = user?.id || workerProfile.user_id || workerProfile.id;

    try {
      // 1. Query persistent notifications from PostgreSQL Supabase
      if (activeUserId) {
        const { data: dbNotifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', activeUserId)
          .order('created_at', { ascending: false });

        if (dbNotifs && dbNotifs.length > 0) {
          dbNotifs.forEach((n: any) => {
            notifList.push({
              id: n.id,
              type: n.type || 'system',
              title: n.title || 'Platform Notification',
              message: n.message || n.body || '',
              time: n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
              read: n.read ?? false,
              actionUrl: n.action_url || '/worker/profile',
              actionLabel: n.action_label || 'View Details'
            });
          });
        }
      }

      // 2. Profile Verification Status Alert (Always ensure real-time status alert)
      if (!notifList.some(n => n.id === 'notif_w_profile')) {
        notifList.unshift({
          id: 'notif_w_profile',
          type: 'profile_approved',
          title: isLive ? 'Worker Passport Verified & Live 🟢' : 'Verification Documents Under Admin Audit ⏳',
          message: isLive 
            ? 'Your candidate passport passed Aadhaar & background verification. Employers in your preferred society can now view and contact you.'
            : 'Sevikaa verification officers are checking your Aadhaar card & profile details. Approval completes within 24 hours.',
          time: 'Status Update',
          read: isLive,
          actionUrl: '/worker/profile',
          actionLabel: 'View Worker Passport'
        });
      }

      // 3. Scheduled Interview Invites from applications
      if (applications && applications.length > 0) {
        applications.forEach((app: any) => {
          if (app.status === 'interview_scheduled' && !notifList.some(n => n.id === `notif_w_app_${app.id}`)) {
            notifList.push({
              id: `notif_w_app_${app.id}`,
              type: 'interview_scheduled',
              title: `Interview Invite: ${app.jobTitle || 'Housekeeping Requisition'}`,
              message: `Employer ${app.employerName || 'Verified Household'} scheduled an interview for ${app.interviewTime || 'Scheduled Slot'}. Tap to view contact & gate pass details.`,
              time: app.date || 'Recent',
              read: false,
              actionUrl: '/worker/interviews',
              actionLabel: 'View Interview Schedule'
            });
          }
        });
      }

      // 4. New Job Requisitions Nearby (only if real jobs exist)
      if (availableJobs && availableJobs.length > 0 && !notifList.some(n => n.id === 'notif_w_jobs_match')) {
        notifList.push({
          id: 'notif_w_jobs_match',
          type: 'job_match',
          title: `${availableJobs.length} Job Requisitions Available Nearby`,
          message: `${availableJobs.length} active household requisitions are open in ${workerProfile.society || 'your preferred society'}.`,
          time: 'Live Feed',
          read: true,
          actionUrl: '/worker/jobs',
          actionLabel: 'Explore Jobs & Apply'
        });
      }
    } catch (err) {
      console.error("Error building worker notifications:", err);
    } finally {
      setNotifications(notifList);
      setLoadingNotifs(false);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const activeUserId = user?.id || workerProfile.user_id || workerProfile.id;
    if (activeUserId) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('user_id', activeUserId);
      } catch (e) {}
    }
    showToast('All notifications marked as read', 'success');
  };

  const handleClearAll = async () => {
    setNotifications([]);
    const activeUserId = user?.id || workerProfile.user_id || workerProfile.id;
    if (activeUserId) {
      try {
        await supabase.from('notifications').delete().eq('user_id', activeUserId);
      } catch (e) {}
    }
    showToast('Notifications cleared', 'info');
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'interviews') return n.type === 'interview_scheduled';
    if (activeTab === 'jobs') return n.type === 'job_match';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
      
      {/* 🌟 CLEAN SLEEK HEADER */}
      <div className="flex flex-col gap-3 pb-2 border-b border-slate-100">
        {/* Title Row */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <span>{t('notificationsCenterTitle') || 'Notifications & Alerts'}</span>
            {unreadCount > 0 && (
              <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {unreadCount} UNREAD
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track interview invitations, gate passes &amp; job match alerts.
          </p>
        </div>

        {/* Quick Action Buttons — below title */}
        {(unreadCount > 0 || notifications.length > 0) && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black transition-all border border-emerald-200/60 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Check size={13} strokeWidth={3} />
                <span>{t('markAllReadBtn') || 'Mark All Read'}</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 size={13} />
                <span>{t('clearNotifsBtn') || 'Clear All'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 🔍 FILTER TABS TOOLBAR */}
      <div className="bg-slate-100/80 backdrop-blur-md p-1.5 rounded-2xl text-xs font-bold text-slate-600 flex items-center gap-1.5 border border-slate-200/80 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white font-black shadow-md shadow-slate-900/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Bell size={13} className={activeTab === 'all' ? 'text-white' : 'text-slate-400'} />
          <span>{t('allFilter') || 'All Alerts'} ({notifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'unread'
              ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{t('unreadFilterTab') || 'Unread'} ({unreadCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('interviews')}
          className={`py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'interviews'
              ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Calendar size={13} className={activeTab === 'interviews' ? 'text-white' : 'text-indigo-500'} />
          <span>{t('navInterviews') || 'Interviews'} ({notifications.filter(n => n.type === 'interview_scheduled').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'jobs'
              ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Briefcase size={13} className={activeTab === 'jobs' ? 'text-white' : 'text-blue-500'} />
          <span>Job Alerts ({notifications.filter(n => n.type === 'job_match').length})</span>
        </button>
      </div>

      {/* 🔔 SLEEK NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {loadingNotifs ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-xs">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading worker alerts...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-xs">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <Bell size={28} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">No Notifications Available</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                You have zero unread alerts matching this filter category.
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isInterview = notif.type === 'interview_scheduled';
            const isProfile = notif.type === 'profile_approved';

            return (
              <div
                key={notif.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-150 ${
                  !notif.read
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Small Icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isInterview
                    ? 'bg-emerald-100 text-emerald-700'
                    : isProfile
                    ? 'bg-blue-100 text-[#1A73E8]'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {isInterview ? <Calendar size={15} /> : isProfile ? <ShieldCheck size={15} /> : <Briefcase size={15} />}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                    <p className="text-xs font-black text-slate-900 truncate">{notif.title}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{notif.message}</p>
                </div>

                {/* Time + Action inline */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{notif.time}</span>
                  {notif.actionUrl && (
                    <Link
                      href={notif.actionUrl}
                      className="text-[10px] font-black text-[#1A73E8] hover:underline flex items-center gap-0.5 whitespace-nowrap"
                    >
                      <span>{notif.actionLabel || 'View'}</span>
                      <ArrowRight size={10} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
