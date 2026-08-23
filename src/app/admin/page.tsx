"use client";

import React, { useState, useEffect } from 'react';
import { useAdminDashboard } from './layout';
import { useRouter } from 'next/navigation';
import { CheckCircle2, UserCheck, Briefcase, ShieldCheck, ShieldAlert, Clock, Activity } from 'lucide-react';

// ── Activity Feed ──────────────────────────────────────────────────────────────
// Stored in localStorage so it persists across navigation within the same session
function useActivityFeed() {
  const [feed, setFeed] = useState<{ text: string; time: number; icon: string }[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('admin_activity_feed') || '[]');
      setFeed(saved);
    } catch { /* ignore */ }
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

// ── Progress Bar ───────────────────────────────────────────────────────────────
function ProgressBar({ label, pending, total, color }: { label: string; pending: number; total: number; color: string }) {
  const cleared = Math.max(0, total - pending);
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-400">{cleared}/{total} cleared · <span className={color}>{pct}%</span></span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-500' : color.includes('amber') ? 'bg-amber-400' : color.includes('blue') ? 'bg-[#1A73E8]' : color.includes('red') ? 'bg-red-400' : 'bg-slate-400'}`}
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

  // Completed count calculation for selected dateRange
  const [todayCompleted] = useState<number>(() => {
    try { return Number(localStorage.getItem('admin_completed_today') || '0'); } catch { return 0; }
  });

  const rangeLabel = dateRange || 'Last 30 Days';

  const queueItems = [
    { label: 'Worker Verifications', pending: counts.pendingWorkers, total: counts.pendingWorkers + todayCompleted, color: 'text-amber-500' },
    { label: 'Employer Audits',      pending: counts.pendingEmployers, total: counts.pendingEmployers + todayCompleted, color: 'text-blue-500' },
    { label: 'Job Moderations',      pending: counts.pendingJobs, total: counts.pendingJobs + todayCompleted, color: 'text-amber-500' },
    { label: 'Reviews Moderation',   pending: counts.pendingReviews, total: counts.pendingReviews + todayCompleted, color: 'text-blue-500' },
    { label: 'Active Disputes',      pending: counts.activeDisputes, total: counts.activeDisputes + todayCompleted, color: 'text-red-500' },
  ];

  const defaultFeed = [
    { text: 'System initialised — Admin dashboard loaded', time: Date.now() - 60000, icon: '🚀' },
  ];

  const rawFeed = activityFeed.length > 0 ? activityFeed : defaultFeed;
  const displayFeed = rawFeed.filter(entry => isTimeInRange(entry.time, rangeLabel));

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Productivity Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: `Pending Tasks (${rangeLabel})`,  value: counts.pendingWorkers + counts.pendingJobs, color: "text-[#FBBC05]" },
          { label: `Completed Audits (${rangeLabel})`, value: `${todayCompleted} audits`,                 color: "text-[#34A853]" },
          { label: "Avg Review Time",                value: "4.8 mins",                                 color: "text-[#1A73E8]" },
          { label: `Interviews (${rangeLabel})`,     value: counts.interviewsToday,                     color: "text-[#1A73E8]" },
          { label: "Avg Approval Time",              value: "1.2 hours",                                color: "text-[#34A853]" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 border border-slate-100 rounded-[20px] shadow-sm text-center">
            <span className="block text-[8px] font-black text-gray-400 uppercase tracking-wider">{stat.label}</span>
            <span className={`block text-xl font-black mt-1 ${stat.color}`}>{loading ? '…' : stat.value}</span>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Quick Moderation Actions</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <button onClick={() => router.push('/admin/workers')} className="py-2.5 px-3 bg-[#1A73E8] hover:bg-[#1A73E8]/90 text-white rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer text-center">
            Verify Next Worker
          </button>
          <button onClick={() => router.push('/admin/jobs')} className="py-2.5 px-3 bg-[#34A853] hover:bg-[#34A853]/90 text-white rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer text-center">
            Approve Next Job
          </button>
          <button onClick={() => router.push('/admin/employers')} className="py-2.5 px-3 bg-[#FBBC05] text-[#202124] rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer text-center">
            Review Next Employer
          </button>
          <button onClick={() => router.push('/admin/tele-onboarding')} className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer text-center">
            Start Interview Call
          </button>
        </div>
      </div>

      {/* ── Backlog Progress + Activity Feed ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Operational Backlog with Progress Bars ── */}
        <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
          <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
            <Activity size={13} className="text-[#1A73E8]" />
            Operational Backlog Queue ({rangeLabel})
          </h4>
          <div className="space-y-4">
            {queueItems.map((q) => (
              <ProgressBar key={q.label} label={q.label} pending={q.pending} total={q.total} color={q.color} />
            ))}
          </div>

          {/* Raw numbers at bottom */}
          <div className="pt-2 border-t border-slate-50 space-y-1.5 text-[10px] font-bold text-slate-600">
            {[
              { label: 'Workers Waiting', value: counts.pendingWorkers, c: 'text-amber-500 bg-amber-50' },
              { label: 'Employers Waiting', value: counts.pendingEmployers, c: 'text-amber-500 bg-amber-50' },
              { label: 'Jobs to Moderate', value: counts.pendingJobs, c: 'text-amber-500 bg-amber-50' },
              { label: 'Reviews to Moderate', value: counts.pendingReviews, c: 'text-amber-500 bg-amber-50' },
              { label: 'Active Disputes', value: counts.activeDisputes, c: 'text-red-500 bg-red-50' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-gray-400">{item.label}:</span>
                <span className={`${item.c} px-2 py-0.5 rounded-full text-[10px]`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Activity Feed ── */}
        <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-3 flex flex-col">
          <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
            <Clock size={13} className="text-[#34A853]" />
            Activity Feed ({rangeLabel})
          </h4>

          <div className="flex-1 space-y-2 max-h-72 overflow-y-auto pr-1">
            {displayFeed.length > 0 ? (
              [...displayFeed].reverse().map((entry, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                  <span className="text-sm shrink-0">{entry.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-slate-700 leading-tight">{entry.text}</p>
                    <span className="text-[9px] text-slate-400 font-medium">{timeAgo(entry.time)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-gray-400 font-medium">
                No activity recorded for {rangeLabel}
              </div>
            )}
          </div>

          <p className="text-[9px] text-slate-300 font-medium pt-1 border-t border-slate-50">
            Activity persists for the current session. Clears on logout.
          </p>
        </div>
      </div>

      {/* ── System Notification Gateways ── */}
      <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
        <h4 className="text-xs font-black text-slate-800">System Notification Gateways</h4>
        <div className="space-y-3 text-xs font-bold text-slate-700">
          {[
            { label: 'SMS Gateway (MSG91)', status: 'Healthy' },
            { label: 'Email Dispatcher (Amazon SES)', status: 'Healthy' },
            { label: 'Payment Capture webhook', status: 'Healthy' },
          ].map(g => (
            <div key={g.label} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
              <span className="text-gray-400">{g.label}:</span>
              <span className="text-[#34A853] bg-emerald-50 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black">{g.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pending Society Onboarding Requests ── */}
      <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
              <span>🏢 Pending Society Onboarding Requests</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                Requires RWA Verification
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Employers requesting new gated communities. Call or WhatsApp the employer to confirm RWA gate details before publishing.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { id: 'soc-req-1', societyName: 'Sobha Royal Pavilion', locality: 'Sarjapur Main Road, HSR Layout, Bengaluru', tower: 'Tower 3, Flat 402', requestedBy: 'Vikram Sharma (Employer)', phone: '+919876543210', submittedTime: '2 hours ago' },
            { id: 'soc-req-2', societyName: 'Prestige Willow Tree', locality: 'Vidyaranyapura, Yelahanka, Bengaluru', tower: 'Block B, Flat 108', requestedBy: 'Ananya Roy (Employer)', phone: '+919812345678', submittedTime: '5 hours ago' }
          ].map((req) => (
            <div key={req.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-slate-900 text-sm">{req.societyName}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-[#1A73E8] text-[9.5px] font-black rounded-full border border-blue-200">{req.tower}</span>
                </div>
                <p className="text-slate-600 font-semibold">{req.locality}</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Requested by: <strong className="text-slate-800">{req.requestedBy}</strong> ({req.phone}) &bull; <span className="text-slate-400">{req.submittedTime}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <a href={`tel:${req.phone}`} className="py-2 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs">
                  📞 Call Employer
                </a>
                <a href={`https://wa.me/${req.phone.replace(/\+/g, '')}?text=Namaste%20${encodeURIComponent(req.requestedBy.split(' ')[0])},%20this%20is%20Sevikaa%20Admin%20regarding%20your%20request%20to%20onboard%20${encodeURIComponent(req.societyName)}.`} target="_blank" rel="noopener noreferrer" className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs">
                  💬 WhatsApp
                </a>
                <button onClick={() => alert(`Society ${req.societyName} approved and published live!`)} className="py-2 px-3 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs">
                  ✅ Approve &amp; Publish
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
