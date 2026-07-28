"use client";

import React, { useState } from 'react';
import { useEmployerDashboard } from '../layout';
import { 
  Bell, CheckCircle2, AlertTriangle, Briefcase, Calendar, 
  MessageSquare, Clock, ArrowRight, ShieldCheck, Check, Filter, Trash2
} from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: 'changes_requested' | 'job_approved' | 'new_applicant' | 'interview_confirmed' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function EmployerNotificationsPage() {
  const { user, postedJobs, showToast } = useEmployerDashboard();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  useEffect(() => {
    const buildRealNotifications = async () => {
      setLoadingNotifs(true);
      const notifList: NotificationItem[] = [];

      try {
        // 1. Generate notifications from employer's posted jobs
        if (postedJobs && postedJobs.length > 0) {
          postedJobs.forEach((j: any) => {
            if (j.status === 'changes_requested') {
              notifList.push({
                id: `notif_job_${j.id}_changes`,
                type: 'changes_requested',
                title: `Action Required: Changes Requested for "${j.title}"`,
                message: j.adminNote || j.admin_note || 'Admin requested updates to your job details before publishing live.',
                time: j.created_at || 'Recently',
                read: false,
                actionUrl: '/employer/dashboard/jobs',
                actionLabel: 'Update Requisition'
              });
            } else if (j.status === 'approved' || j.status === 'active') {
              notifList.push({
                id: `notif_job_${j.id}_approved`,
                type: 'job_approved',
                title: `Requisition Approved & Live: "${j.title}"`,
                message: 'Your job requisition passed Sevikaa verification and is now active in your society feed.',
                time: j.created_at || 'Recently',
                read: true,
                actionUrl: '/employer/dashboard/jobs',
                actionLabel: 'View Requisition'
              });
            }

            if (j.applicationsCount > 0) {
              notifList.push({
                id: `notif_job_${j.id}_apps`,
                type: 'new_applicant',
                title: `${j.applicationsCount} Candidate Applicants for "${j.title}"`,
                message: `${j.applicationsCount} verified domestic candidates have applied for this position.`,
                time: 'Recent',
                read: false,
                actionUrl: '/employer/dashboard/workers',
                actionLabel: 'Review Applicants'
              });
            }
          });
        }

        // 2. Fetch real interview applications for this employer's jobs
        if (user?.id) {
          const { data: dbApps } = await supabase
            .from('job_applications')
            .select('*, jobs!inner(*)')
            .eq('jobs.employer_id', user.id);

          if (dbApps && dbApps.length > 0) {
            dbApps.forEach((a: any) => {
              if (a.status === 'interview_scheduled') {
                notifList.push({
                  id: `notif_app_${a.id}_interview`,
                  type: 'interview_confirmed',
                  title: `Interview Scheduled: ${a.jobs?.title || 'Domestic Worker'}`,
                  message: `Interview time set for ${a.interview_time || 'Scheduled Date TBD'}. Contact candidate directly on WhatsApp/Phone.`,
                  time: a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : 'Recent',
                  read: false,
                  actionUrl: '/employer/dashboard/workers',
                  actionLabel: 'View Candidate Contact'
                });
              }
            });
          }
        }
      } catch (err) {
        console.error("Error building employer notifications:", err);
      } finally {
        setNotifications(notifList);
        setLoadingNotifs(false);
      }
    };

    buildRealNotifications();
  }, [user, postedJobs]);

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'action_required'>('all');

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
    if (activeTab === 'action_required') return n.type === 'changes_requested';
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
            Real-time updates regarding your job requisitions, admin feedback notes, and candidate applications.
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
          onClick={() => setActiveTab('action_required')}
          className={`py-2 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'action_required'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Action Required ({notifications.filter(n => n.type === 'changes_requested').length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-2 shadow-xs">
            <Bell size={32} className="mx-auto text-slate-300" />
            <h3 className="text-sm font-black text-slate-800">No Notifications Found</h3>
            <p className="text-xs text-slate-400 font-medium">You are all caught up! Updates about your requisitions and candidates will appear here.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isChanges = n.type === 'changes_requested';
            const isApproved = n.type === 'job_approved';
            const isApplicant = n.type === 'new_applicant';

            return (
              <div
                key={n.id}
                onClick={() => {
                  setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                }}
                className={`p-5 rounded-3xl border transition-all space-y-3 cursor-pointer ${
                  !n.read 
                    ? isChanges ? 'bg-amber-50/70 border-amber-300/80 shadow-xs' : 'bg-blue-50/40 border-blue-200/80 shadow-xs' 
                    : 'bg-white border-slate-100 shadow-xs hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white font-black shadow-xs ${
                      isChanges ? 'bg-amber-500' : isApproved ? 'bg-[#34A853]' : isApplicant ? 'bg-[#1A73E8]' : 'bg-purple-600'
                    }`}>
                      {isChanges ? <AlertTriangle size={18} /> : isApproved ? <CheckCircle2 size={18} /> : isApplicant ? <Briefcase size={18} /> : <Calendar size={18} />}
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
                        isChanges 
                          ? 'bg-amber-600 hover:bg-amber-700 text-white' 
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
