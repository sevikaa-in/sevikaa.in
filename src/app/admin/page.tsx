"use client";

import React from 'react';
import { useAdminDashboard } from './layout';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const {
    counts,
    loading,
    error
  } = useAdminDashboard();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Productivity Analytics Bar (Step 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Today's Pending Tasks", value: counts.pendingWorkers + counts.pendingJobs, color: "text-[#FBBC05]" },
          { label: "Completed Today", value: "14 audits", color: "text-[#34A853]" },
          { label: "Avg Review Time", value: "4.8 mins", color: "text-[#1A73E8]" },
          { label: "Interviews Scheduled", value: counts.interviewsToday, color: "text-[#1A73E8]" },
          { label: "Avg Approval Time", value: "1.2 hours", color: "text-[#34A853]" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 border border-slate-100 rounded-[20px] shadow-sm text-center">
            <span className="block text-[8px] font-black text-gray-400 uppercase tracking-wider">{stat.label}</span>
            <span className={`block text-xl font-black mt-1 ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Quick Owner Actions Panel (Step 7) */}
      <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Quick Moderation Actions</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <button onClick={() => router.push('/admin/dashboard/workers')} className="py-2.5 px-3 bg-[#1A73E8] hover:bg-[#1A73E8]/90 text-white rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer text-center">
            Verify Next Worker
          </button>
          <button onClick={() => router.push('/admin/dashboard/jobs')} className="py-2.5 px-3 bg-[#34A853] hover:bg-[#34A853]/90 text-white rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer text-center">
            Approve Next Job
          </button>
          <button onClick={() => router.push('/admin/dashboard/employers')} className="py-2.5 px-3 bg-[#FBBC05] text-[#202124] rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer text-center">
            Review Next Employer
          </button>
          <button onClick={() => router.push('/admin/dashboard/interviews')} className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer text-center">
            Start Interview Call
          </button>
        </div>
      </div>

      {/* Alerts feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Active backlogs */}
        <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
          <h4 className="text-xs font-black text-slate-800">Operational Backlog Queue</h4>
          <div className="space-y-3 text-xs font-bold text-slate-700">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-gray-400">Workers Waiting:</span>
              <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">{counts.pendingWorkers}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-gray-400">Employers Waiting:</span>
              <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">{counts.pendingEmployers}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-gray-400">Jobs Awaiting Moderation:</span>
              <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">{counts.pendingJobs}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-gray-400">Reviews to Moderate:</span>
              <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">{counts.pendingReviews}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Disputes Reported:</span>
              <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full text-[10px]">{counts.activeDisputes}</span>
            </div>
          </div>
        </div>

        {/* System notification health */}
        <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
          <h4 className="text-xs font-black text-slate-800">System Notification Gateways</h4>
          <div className="space-y-3 text-xs font-bold text-slate-700">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-gray-400">SMS Gateway (MSG91):</span>
              <span className="text-[#34A853] bg-emerald-50 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black">Healthy</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-gray-400">Email Dispatcher (Amazon SES):</span>
              <span className="text-[#34A853] bg-emerald-50 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black">Healthy</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Payment Capture webhook:</span>
              <span className="text-[#34A853] bg-emerald-50 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black">Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
