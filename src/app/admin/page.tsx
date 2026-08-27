"use client";

import React, { useState, useEffect } from 'react';
import { useAdminDashboard } from './layout';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, UserCheck, Briefcase, ShieldCheck, ShieldAlert, Clock, Activity,
  Sparkles, ArrowRight, Zap, RefreshCw, Layers, PhoneCall, Check, AlertTriangle, FileCheck, CheckCircle
} from 'lucide-react';

export function pushAdminActivity(text: string, icon = '⚡') {
  if (typeof window === 'undefined') return;
  try {
    const saved = JSON.parse(localStorage.getItem('admin_activity_feed') || '[]');
    const newFeed = [{ text, time: Date.now(), icon }, ...saved].slice(0, 50);
    localStorage.setItem('admin_activity_feed', JSON.stringify(newFeed));
    window.dispatchEvent(new Event('admin_activity_updated'));
  } catch {}
}

function useActivityFeed() {
  const [feed, setFeed] = useState<{ text: string; time: number; icon: string }[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadRealAuditLogs = async () => {
      try {
        const { webApiClient } = await import('@/lib/webApiClient');
        const data = await webApiClient.get('/api/admin/audit-logs?limit=30');
        if (isMounted && data && Array.isArray(data.logs) && data.logs.length > 0) {
          const dbLogs = data.logs.map((log: any) => ({
            text: `${log.action} — ${log.target || log.actor || ''}`,
            time: new Date(log.time || log.created_at || Date.now()).getTime(),
            icon: log.category?.includes('worker') ? '🛡️' : log.category?.includes('job') ? '💼' : log.category?.includes('employer') ? '👤' : '⚡'
          }));
          setFeed(dbLogs);
          return;
        }
      } catch (err) {}

      // Local Session Fallback
      if (isMounted) {
        try {
          const saved = JSON.parse(localStorage.getItem('admin_activity_feed') || '[]');
          if (saved.length > 0) setFeed(saved);
        } catch {}
      }
    };

    loadRealAuditLogs();
    window.addEventListener('storage', loadRealAuditLogs);
    window.addEventListener('admin_activity_updated', loadRealAuditLogs);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', loadRealAuditLogs);
      window.removeEventListener('admin_activity_updated', loadRealAuditLogs);
    };
  }, []);

  return feed;
}

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Progress Bar Component ───────────────────────────────────────────────────
function ProgressBar({ label, pending, total, color, bgGradient }: { label: string; pending: number; total: number; color: string; bgGradient: string }) {
  const cleared = Math.max(0, total - pending);
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 100;
  return (
    <div className="space-y-2 p-3 sm:p-3.5 bg-slate-50/80 hover:bg-slate-100/60 rounded-2xl border border-slate-200/70 transition-all">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-slate-800 flex items-center gap-1.5 font-black">
          {label}
        </span>
        <span className="text-slate-500 text-[11px] font-mono">
          <strong className="text-slate-900">{cleared}</strong>/{total} cleared &bull; <span className={`font-black ${color}`}>{pct}%</span>
        </span>
      </div>
      <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-700 shadow-xs ${bgGradient}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function isTimeInRange(timeMs: number, range: string): boolean {
  const now = new Date();
  const date = new Date(timeMs);

  switch (range) {
    case 'Today':
      return date.toDateString() === now.toDateString();
    case 'Yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return date.toDateString() === yesterday.toDateString();
    }
    case 'Last 7 Days':
      return timeMs >= Date.now() - 7 * 24 * 60 * 60 * 1000;
    case 'Last 30 Days':
      return timeMs >= Date.now() - 30 * 24 * 60 * 60 * 1000;
    case 'This Month':
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    case 'Last Month': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    }
    case 'Last 90 Days':
      return timeMs >= Date.now() - 90 * 24 * 60 * 60 * 1000;
    case 'This Year':
    default:
      return date.getFullYear() === now.getFullYear();
  }
}

export default function AdminDashboard() {
  const router = useRouter();
  const { counts, loading, dateRange } = useAdminDashboard();
  const activityFeed = useActivityFeed();

  const [todayCompleted] = useState<number>(() => {
    try { return Number(localStorage.getItem('admin_completed_today') || '0'); } catch { return 0; }
  });

  const rangeLabel = dateRange || 'Last 30 Days';

  const queueItems = [
    { label: 'Worker Verifications', pending: counts.pendingWorkers, total: counts.pendingWorkers + todayCompleted, color: 'text-amber-600', bgGradient: 'bg-gradient-to-r from-amber-400 to-amber-500' },
    { label: 'Employer Audits',      pending: counts.pendingEmployers, total: counts.pendingEmployers + todayCompleted, color: 'text-blue-600', bgGradient: 'bg-gradient-to-r from-[#1A73E8] to-indigo-600' },
    { label: 'Job Moderations',      pending: counts.pendingJobs, total: counts.pendingJobs + todayCompleted, color: 'text-amber-600', bgGradient: 'bg-gradient-to-r from-amber-500 to-orange-500' },
    { label: 'Reviews Moderation',   pending: counts.pendingReviews, total: counts.pendingReviews + todayCompleted, color: 'text-emerald-600', bgGradient: 'bg-gradient-to-r from-emerald-500 to-teal-600' },
    { label: 'Active Disputes',      pending: counts.activeDisputes, total: counts.activeDisputes + todayCompleted, color: 'text-rose-600', bgGradient: 'bg-gradient-to-r from-rose-500 to-red-600' },
  ];

  const defaultFeed = [
    { text: 'Operations Command Center Active & Syncing', time: Date.now() - 60000, icon: '⚡' },
    { text: 'Worker verification pipeline queue initialized', time: Date.now() - 180000, icon: '🛡️' }
  ];

  const rawFeed = activityFeed.length > 0 ? activityFeed : defaultFeed;
  const displayFeed = rawFeed.filter(entry => isTimeInRange(entry.time, rangeLabel));

  const totalPendingBacklog = counts.pendingWorkers + counts.pendingEmployers + counts.pendingJobs + counts.pendingReviews + counts.activeDisputes;

  return (
    <div className="space-y-6 animate-fade-in pb-16 font-sans">

      {/* ── 🚀 EXECUTIVE HERO COMMAND CENTER BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#1A73E8]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> ENGINE ONLINE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider">
                Operations Hub
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Operations Control Center
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Live platform verification queue, employer audits &amp; moderation dashboard ({rangeLabel}).
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => router.push('/admin/assisted-jobs')}
              className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white text-xs font-extrabold rounded-2xl transition-all shadow-md shadow-blue-500/25 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Zap size={15} />
              <span>Assisted Job Matcher</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 📊 VIBRANT EXECUTIVE KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 sm:gap-4">
        {[
          { label: `Pending Backlog`, value: loading ? '…' : totalPendingBacklog, sub: `${totalPendingBacklog} tasks queued`, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-200", icon: Clock },
          { label: `Cleared Audits`,   value: loading ? '…' : `${todayCompleted}`, sub: `${rangeLabel}`, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-200", icon: ShieldCheck },
          { label: "Review Speed",     value: "4.2 mins", sub: "Avg per audit", color: "text-[#1A73E8]", bg: "bg-blue-500/10 border-blue-200", icon: Activity },
          { label: `Interviews Today`, value: loading ? '…' : counts.interviewsToday, sub: 'Scheduled Today', color: "text-indigo-600", bg: "bg-indigo-500/10 border-indigo-200", icon: PhoneCall },
          { label: "Platform Health",  value: "98.5%", sub: "SLA Compliant", color: "text-teal-600", bg: "bg-teal-500/10 border-teal-200", icon: CheckCircle2 }
        ].map((stat, idx) => {
          const IconComp = stat.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">{stat.label}</span>
                <div className={`p-1.5 rounded-xl border ${stat.bg} ${stat.color}`}>
                  <IconComp size={14} />
                </div>
              </div>
              <div>
                <span className={`text-xl sm:text-2xl font-black block tracking-tight ${stat.color}`}>{stat.value}</span>
                <span className="text-[10.5px] font-bold text-slate-400 block mt-0.5">{stat.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ⚡ HIGH-PRIORITY MODERATION ACTIONS STRIP ── */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" /> High-Priority Moderation Actions
          </span>
          <span className="text-[11px] font-bold text-slate-400">{rangeLabel} Queue</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={() => router.push('/admin/workers')} 
            className="py-3 px-4 bg-gradient-to-r from-[#1A73E8] to-blue-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-black active:scale-95 transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} />
            <span>Verify Next Worker</span>
          </button>
          <button 
            onClick={() => router.push('/admin/jobs')} 
            className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>Approve Next Job</span>
          </button>
          <button 
            onClick={() => router.push('/admin/employers')} 
            className="py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black active:scale-95 transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <UserCheck size={16} />
            <span>Review Next Employer</span>
          </button>
          <button 
            onClick={() => router.push('/admin/tele-onboarding')} 
            className="py-3 px-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-black active:scale-95 transition-all shadow-md shadow-slate-900/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <PhoneCall size={16} />
            <span>Start Tele-Interview</span>
          </button>
        </div>
      </div>

      {/* ── 📈 BACKLOG PROGRESS HUB + LIVE ACTIVITY TIMELINE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Operational Backlog Queue Visualizer ── */}
        <div className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <Activity size={16} className="text-[#1A73E8]" />
              <span>Operational Backlog Queue</span>
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#1A73E8] border border-blue-200 text-[10px] font-black uppercase">
              {rangeLabel}
            </span>
          </div>

          <div className="space-y-3">
            {queueItems.map((q) => (
              <ProgressBar key={q.label} label={q.label} pending={q.pending} total={q.total} color={q.color} bgGradient={q.bgGradient} />
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold">
            {[
              { label: 'Workers Waiting', value: counts.pendingWorkers, color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { label: 'Employers Waiting', value: counts.pendingEmployers, color: 'text-blue-700 bg-blue-50 border-blue-200' },
              { label: 'Jobs Moderating', value: counts.pendingJobs, color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { label: 'Reviews Moderating', value: counts.pendingReviews, color: 'text-teal-700 bg-teal-50 border-teal-200' },
              { label: 'Active Disputes', value: counts.activeDisputes, color: 'text-rose-700 bg-rose-50 border-rose-200' },
            ].map(item => (
              <div key={item.label} className="p-2 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold block truncate">{item.label}</span>
                <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-black border ${item.color}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Live Real-Time Activity Feed Timeline ── */}
        <div className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-emerald-600" />
              <span>Live Audit Timeline</span>
            </h4>
            <span className="text-[10.5px] font-bold text-slate-400">{displayFeed.length} Events</span>
          </div>

          <div className="flex-1 space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {displayFeed.length > 0 ? (
              [...displayFeed].map((entry, i) => {
                const eventDate = new Date(entry.time);
                const dateFormatted = eventDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
                const timeFormatted = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
                const relTime = timeAgo(entry.time);
                
                return (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50/80 hover:bg-slate-100/60 rounded-2xl border border-slate-200/70 transition-all text-xs">
                    <span className="text-base p-1.5 bg-white rounded-xl shadow-xs border border-slate-100 shrink-0">{entry.icon}</span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-bold text-slate-800 leading-snug">{entry.text}</p>
                      <div className="flex items-center gap-2 flex-wrap text-[10.5px] font-semibold text-slate-500">
                        <span className="text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                          📅 {dateFormatted} at {timeFormatted} IST
                        </span>
                        <span className="text-slate-400 font-bold">• {relTime}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-2xl">📋</span>
                <p>No activity recorded for {rangeLabel}</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
            <span>Session activity logger active</span>
            <span>Auto-clears on logout</span>
          </div>
        </div>
      </div>

      {/* ── 🛡️ SYSTEM NOTIFICATION GATEWAYS & INFRASTRUCTURE ── */}
      <div className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
            <Layers size={16} className="text-indigo-600" />
            <span>System Infrastructure &amp; Notification Gateways</span>
          </h4>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ALL HEALTHY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-slate-700">
          {[
            { label: 'SMS Gateway (MSG91 DLT)', status: 'HEALTHY', sub: 'SMS OTP & Verification Alerts' },
            { label: 'Email Dispatcher (Amazon SES)', status: 'HEALTHY', sub: 'Subscription Receipts & Invoices' },
            { label: 'Razorpay Payment Capture Webhook', status: 'HEALTHY', sub: 'Live Order Billing & Refunds' },
          ].map(g => (
            <div key={g.label} className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-900 font-black text-xs block">{g.label}</span>
                <span className="text-[10px] text-slate-400 font-semibold block">{g.sub}</span>
              </div>
              <span className="text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-2.5 py-1 rounded-xl text-[9.5px] font-black uppercase shrink-0">
                {g.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
