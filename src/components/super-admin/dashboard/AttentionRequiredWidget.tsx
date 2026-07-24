"use client";

import React from 'react';
import { AlertTriangle, UserCheck, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

interface AttentionRequiredWidgetProps {
  loading: boolean;
  error: string;
  counts: {
    pendingWorkers: number;
    pendingSocieties: number;
    failedPayments: number;
    criticalAlerts: number;
  };
}

export const AttentionRequiredWidget: React.FC<AttentionRequiredWidgetProps> = ({
  loading,
  error,
  counts
}) => {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-[20px]"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-[20px] text-xs text-red-600 font-bold flex items-center gap-2">
        <AlertCircle size={16} />
        <span>Failed to load operational alerts: {error}</span>
      </div>
    );
  }

  const hasAlerts = counts.pendingWorkers > 0 || counts.pendingSocieties > 0 || counts.failedPayments > 0 || counts.criticalAlerts > 0;

  if (!hasAlerts) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Attention Required</h3>
        <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
            <Sparkles size={20} />
          </div>
          <span className="text-xs font-extrabold text-slate-800">All Systems Nominal</span>
          <span className="text-[10px] text-gray-400 font-semibold mt-1">No pending verifications or critical system flags require your attention.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Attention Required</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Alerts */}
        {counts.criticalAlerts > 0 && (
          <div className="bg-white border border-red-100 hover:border-red-200 p-4 rounded-[20px] shadow-sm flex items-start gap-3 transition-all duration-200 hover:shadow-md">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-500 shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-red-500 uppercase tracking-wider">Critical</span>
              <span className="block text-lg font-black text-slate-800 mt-0.5">{counts.criticalAlerts} System Alerts</span>
              <span className="block text-[10px] text-gray-400 font-semibold mt-1">AWS SES or MSG91 connectivity lag detected.</span>
            </div>
          </div>
        )}

        {/* Failed Payments */}
        {counts.failedPayments > 0 && (
          <div className="bg-white border border-orange-100 hover:border-orange-200 p-4 rounded-[20px] shadow-sm flex items-start gap-3 transition-all duration-200 hover:shadow-md">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-500 shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-orange-500 uppercase tracking-wider">High Priority</span>
              <span className="block text-lg font-black text-slate-800 mt-0.5">{counts.failedPayments} Failed Payments</span>
              <span className="block text-[10px] text-gray-400 font-semibold mt-1">Razorpay webhook reported reconciliation failures.</span>
            </div>
          </div>
        )}

        {/* Worker Verifications */}
        {counts.pendingWorkers > 0 && (
          <div className="bg-white border border-yellow-100 hover:border-yellow-200 p-4 rounded-[20px] shadow-sm flex items-start gap-3 transition-all duration-200 hover:shadow-md">
            <div className="p-2.5 rounded-xl bg-yellow-50 text-yellow-600 shrink-0">
              <UserCheck size={18} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-yellow-600 uppercase tracking-wider">Medium Priority</span>
              <span className="block text-lg font-black text-slate-800 mt-0.5">{counts.pendingWorkers} Pending Workers</span>
              <span className="block text-[10px] text-gray-400 font-semibold mt-1">Worker profiles awaiting moderator verification review.</span>
            </div>
          </div>
        )}

        {/* Society Approvals */}
        {counts.pendingSocieties > 0 && (
          <div className="bg-white border border-blue-100 hover:border-blue-200 p-4 rounded-[20px] shadow-sm flex items-start gap-3 transition-all duration-200 hover:shadow-md">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500 shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-wider">Normal</span>
              <span className="block text-lg font-black text-slate-800 mt-0.5">{counts.pendingSocieties} Society Approvals</span>
              <span className="block text-[10px] text-gray-400 font-semibold mt-1">New Bangalore residential societies waiting for validation.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
