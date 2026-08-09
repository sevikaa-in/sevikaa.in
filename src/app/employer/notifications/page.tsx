"use client";

import React, { useState, useEffect } from 'react';
import { useEmployerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  Bell, CheckCircle2, AlertTriangle, Briefcase, Calendar, 
  Clock, ArrowRight, ShieldCheck, Check, Trash2, Phone, 
  Sparkles, Filter, Eye, User, Users
} from 'lucide-react';
import Link from 'next/link';

export interface EmployerNotificationItem {
  id: string;
  type: 'changes_requested' | 'job_approved' | 'new_applicant' | 'interview_confirmed' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export default function EmployerNotificationsPage() {
  const { user, employerProfile, postedJobs, showToast } = useEmployerDashboard();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<EmployerNotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'applicants' | 'system'>('all');

  useEffect(() => {
    fetchEmployerNotifications();
  }, [user, postedJobs]);

  const fetchEmployerNotifications = async () => {
    setLoadingNotifs(true);
    const notifList: EmployerNotificationItem[] = [];
    const activeUserId = user?.id || employerProfile?.user_id || employerProfile?.id;

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
              title: n.title || 'Employer Alert',
              message: n.message || n.body || '',
              time: n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
              read: n.read ?? false,
              actionUrl: n.action_url || '/employer/jobs',
              actionLabel: n.action_label || 'View Details'
            });
          });
        }
      }

      // 2. Generate notifications from employer's posted jobs
      if (postedJobs && postedJobs.length > 0) {
        postedJobs.forEach((j: any) => {
          if (j.status === 'changes_requested' && !notifList.some(n => n.id === `notif_job_${j.id}_changes`)) {
            notifList.push({
              id: `notif_job_${j.id}_changes`,
              type: 'changes_requested',
              title: `Action Required: Requisition Updates for "${j.title}"`,
              message: j.adminNote || j.admin_note || 'Admin requested updates to your job details before publishing live.',
              time: j.created_at || 'Recently',
              read: false,
              actionUrl: '/employer/jobs',
              actionLabel: 'Revise Requisition'
            });
          } else if ((j.status === 'approved' || j.status === 'active') && !notifList.some(n => n.id === `notif_job_${j.id}_approved`)) {
            notifList.push({
              id: `notif_job_${j.id}_approved`,
              type: 'job_approved',
              title: `Requisition Live: "${j.title}" 🟢`,
              message: 'Your job requisition passed Sevikaa verification and is now active in your society feed.',
              time: j.created_at || 'Recently',
              read: true,
              actionUrl: '/employer/jobs',
              actionLabel: 'View Requisition'
            });
          }

          if (j.applicationsCount > 0 && !notifList.some(n => n.id === `notif_job_${j.id}_apps`)) {
            notifList.push({
              id: `notif_job_${j.id}_apps`,
              type: 'new_applicant',
              title: `${j.applicationsCount} Candidate Applicants for "${j.title}" 👤`,
              message: `${j.applicationsCount} background-verified domestic candidates applied for this requisition.`,
              time: 'Recent',
              read: false,
              actionUrl: '/employer/workers',
              actionLabel: 'Review Candidates'
            });
          }
        });
      }


    } catch (err) {
      console.error("Error building employer notifications:", err);
    } finally {
      setNotifications(notifList);
      setLoadingNotifs(false);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const activeUserId = user?.id || employerProfile?.user_id || employerProfile?.id;
    if (activeUserId) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('user_id', activeUserId);
      } catch (e) {}
    }
    showToast('All notifications marked as read', 'success');
  };

  const handleClearAll = async () => {
    setNotifications([]);
    const activeUserId = user?.id || employerProfile?.user_id || employerProfile?.id;
    if (activeUserId) {
      try {
        await supabase.from('notifications').delete().eq('user_id', activeUserId);
      } catch (e) {}
    }
    showToast('Notifications cleared', 'info');
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'applicants') return n.type === 'new_applicant' || n.type === 'interview_confirmed';
    if (activeTab === 'system') return n.type === 'changes_requested' || n.type === 'job_approved';
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
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#1A73E8] flex items-center justify-center font-bold relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <span>Notifications &amp; Activity Center</span>
            {unreadCount > 0 && (
              <span className="text-[11px] font-black bg-blue-100 text-[#1A73E8] px-2.5 py-0.5 rounded-full border border-blue-200">
                {unreadCount} UNREAD
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track applicant candidate profiles, gate passes &amp; requisition updates.
          </p>
        </div>

        {/* Quick Action Buttons — below title */}
        {(unreadCount > 0 || notifications.length > 0) && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-[#1A73E8] rounded-xl text-xs font-black transition-all border border-blue-200/60 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Check size={13} strokeWidth={3} />
                <span>Mark All Read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 size={13} />
                <span>Clear All</span>
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
          <span>All Alerts ({notifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'unread'
              ? 'bg-[#1A73E8] text-white font-black shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>Unread ({unreadCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('applicants')}
          className={`py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'applicants'
              ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Users size={13} className={activeTab === 'applicants' ? 'text-white' : 'text-emerald-600'} />
          <span>Applicants ({notifications.filter(n => n.type === 'new_applicant' || n.type === 'interview_confirmed').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTab === 'system'
              ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Briefcase size={13} className={activeTab === 'system' ? 'text-white' : 'text-indigo-500'} />
          <span>Requisition Updates ({notifications.filter(n => n.type === 'changes_requested' || n.type === 'job_approved').length})</span>
        </button>
      </div>

      {/* 🔔 SLEEK NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {loadingNotifs ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-xs">
            <div className="w-10 h-10 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading employer activity logs...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-xs">
            <div className="w-16 h-16 bg-blue-50 text-[#1A73E8] rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <Bell size={28} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">No Notifications Available</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                You have zero unread activity alerts matching this category filter.
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isApplicant = notif.type === 'new_applicant' || notif.type === 'interview_confirmed';
            const isAlert = notif.type === 'changes_requested';

            return (
              <div
                key={notif.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-150 ${
                  !notif.read
                    ? 'bg-blue-50/60 border-blue-200'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Small Icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isApplicant
                    ? 'bg-emerald-100 text-emerald-700'
                    : isAlert
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-blue-100 text-[#1A73E8]'
                }`}>
                  {isApplicant ? <Users size={15} /> : isAlert ? <AlertTriangle size={15} /> : <Briefcase size={15} />}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8] shrink-0" />}
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
