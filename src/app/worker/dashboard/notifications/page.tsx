"use client";

import React, { useState } from 'react';
import { useWorkerDashboard } from '../layout';
import { 
  Bell, CheckCircle2, AlertTriangle, Briefcase, Calendar, 
  MessageSquare, Clock, ArrowRight, ShieldCheck, Check, Trash2, Phone
} from 'lucide-react';
import Link from 'next/link';

interface WorkerNotificationItem {
  id: string;
  type: 'interview_scheduled' | 'profile_approved' | 'job_match' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

import { useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';

export default function WorkerNotificationsPage() {
  const { user, workerProfile, applications, availableJobs, showToast } = useWorkerDashboard();
  const [notifications, setNotifications] = useState<WorkerNotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  useEffect(() => {
    const buildRealWorkerNotifications = async () => {
      setLoadingNotifs(true);
      const notifList: WorkerNotificationItem[] = [];
      const isLive = workerProfile.status === 'live' || workerProfile.status === 'approved';

      try {
        // 1. Profile Verification Status Notification
        notifList.push({
          id: 'notif_w_profile',
          type: 'profile_approved',
          title: isLive ? 'Worker Passport Verified & Live' : 'Verification Documents Under Admin Audit',
          message: isLive 
            ? 'Your candidate passport passed Aadhaar & background verification. Employers in your preferred society can now view and contact you.'
            : 'Sevikaa verification officers are checking your Aadhaar card & profile details. Approval completes within 24 hours.',
          time: 'Status Update',
          read: isLive,
          actionUrl: '/worker/dashboard/profile',
          actionLabel: 'View Worker Passport'
        });

        // 2. Scheduled Interview Invites from applications
        if (applications && applications.length > 0) {
          applications.forEach((app: any) => {
            if (app.status === 'interview_scheduled') {
              notifList.push({
                id: `notif_w_app_${app.id}`,
                type: 'interview_scheduled',
                title: `Interview Invite: ${app.jobTitle}`,
                message: `Employer ${app.employerName} scheduled an interview for ${app.interviewTime || 'Scheduled Date TBD'}. Tap to view contact details.`,
                time: app.date || 'Recent',
                read: false,
                actionUrl: '/worker/dashboard/interviews',
                actionLabel: 'View Interview Schedule'
              });
            }
          });
        }

        // 3. New Job Requisitions in Society
        if (availableJobs && availableJobs.length > 0) {
          notifList.push({
            id: 'notif_w_jobs_match',
            type: 'job_match',
            title: `${availableJobs.length} Job Requisitions Available Nearby`,
            message: `${availableJobs.length} active household requisitions are open in ${workerProfile.society || 'your preferred society'}.`,
            time: 'Live Feed',
            read: true,
            actionUrl: '/worker/dashboard/jobs',
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

    buildRealWorkerNotifications();
  }, [user, workerProfile, applications, availableJobs]);

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'interviews'>('all');

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'success');
  };

  const handleClearAll = () => {
    setNotifications([]);
    showToast('Notifications cleared', 'info');
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'interviews') return n.type === 'interview_scheduled';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#1A73E8] flex items-center justify-center font-black relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EA4335] text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <span>Notifications &amp; Activity Center</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Real-time alerts for interview invitations, job matches, and verification passport status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="py-2 px-3.5 bg-blue-50 hover:bg-blue-100 text-[#1A73E8] rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Check size={14} strokeWidth={3} />
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`py-2 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'unread'
              ? 'bg-[#1A73E8] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Unread ({unreadCount})
        </button>

        <button
          onClick={() => setActiveTab('interviews')}
          className={`py-2 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'interviews'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Interviews ({notifications.filter(n => n.type === 'interview_scheduled').length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-2 shadow-xs">
            <Bell size={32} className="mx-auto text-slate-300" />
            <h3 className="text-sm font-black text-slate-800">No Notifications Found</h3>
            <p className="text-xs text-slate-400 font-medium">You are all caught up! Updates regarding interviews and new job postings will appear here.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isInterview = n.type === 'interview_scheduled';
            const isApproval = n.type === 'profile_approved';
            const isJobMatch = n.type === 'job_match';

            return (
              <div
                key={n.id}
                onClick={() => {
                  setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                }}
                className={`p-5 rounded-3xl border transition-all space-y-3 cursor-pointer ${
                  !n.read 
                    ? isInterview ? 'bg-emerald-50/70 border-emerald-300/80 shadow-xs' : 'bg-blue-50/40 border-blue-200/80 shadow-xs' 
                    : 'bg-white border-slate-100 shadow-xs hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white font-black shadow-xs ${
                      isInterview ? 'bg-emerald-600' : isApproval ? 'bg-[#1A73E8]' : 'bg-indigo-600'
                    }`}>
                      {isInterview ? <Calendar size={18} /> : isApproval ? <ShieldCheck size={18} /> : <Briefcase size={18} />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900">{n.title}</h4>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#1A73E8]" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 shrink-0">{n.time}</span>
                </div>

                {n.actionUrl && (
                  <div className="flex justify-end pt-2 border-t border-slate-100/60">
                    <Link
                      href={n.actionUrl}
                      onClick={(e) => e.stopPropagation()}
                      className={`py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                        isInterview 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-[#1A73E8] hover:bg-blue-600 text-white'
                      }`}
                    >
                      <span>{n.actionLabel}</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
