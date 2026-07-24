"use client";

import React from 'react';
import { UserCheck, ShieldAlert, Sparkles, HelpCircle, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';

interface PlatformOperationsWidgetProps {
  loading: boolean;
  error: string;
  pendingWorkersList: {
    id: string;
    full_name: string;
    skills: string[];
    languages_spoken: string[];
    created_at: string;
  }[];
  onApproveWorker: (id: string) => void;
}

export const PlatformOperationsWidget: React.FC<PlatformOperationsWidgetProps> = ({
  loading,
  error,
  pendingWorkersList,
  onApproveWorker
}) => {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="h-48 bg-slate-200 rounded-[20px]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-[20px] text-xs text-red-600 font-bold flex items-center gap-2">
        <HelpCircle size={16} />
        <span>Failed to load operations backlog: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Platform Operations Queue</h3>

      {pendingWorkersList.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
            <Sparkles size={20} />
          </div>
          <span className="text-xs font-extrabold text-slate-800">Verification Queue Clear</span>
          <span className="text-[10px] text-gray-400 font-semibold mt-1">No worker registrations are currently pending moderator review.</span>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden divide-y divide-slate-50">
          <div className="p-4 bg-slate-50/50 flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Pending Worker Verification Backlog</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">{pendingWorkersList.length} items</span>
          </div>

          <div className="divide-y divide-slate-50">
            {pendingWorkersList.map((worker) => (
              <div key={worker.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/30 transition-colors">
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-800">{worker.full_name || "Unknown Worker"}</span>
                  <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-gray-400">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded-full">Skills: {worker.skills?.join(', ') || 'N/A'}</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded-full">Languages: {worker.languages_spoken?.join(', ') || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApproveWorker(worker.id)}
                    className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold rounded-xl text-[10px] active:scale-95 transition-all flex items-center gap-1 cursor-pointer border border-emerald-200/40"
                  >
                    <CheckCircle2 size={12} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => alert("Verification rejected - worker notified to re-upload documents.")}
                    className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-[10px] active:scale-95 transition-all flex items-center gap-1 cursor-pointer border border-red-200/40"
                  >
                    <XCircle size={12} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
