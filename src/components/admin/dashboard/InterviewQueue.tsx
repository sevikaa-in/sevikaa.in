"use client";

import React, { useState } from 'react';
import { Clock, AlertCircle, Search, Sparkles, ChevronRight } from 'lucide-react';

interface InterviewQueueProps {
  loading: boolean;
  error: string;
  interviews: any[];
  onLogResult: (id: string, result: 'Pass' | 'Fail' | 'Re-interview', notes: string) => void;
  onSelectInterview: (interview: any) => void;
}

export const InterviewQueue: React.FC<InterviewQueueProps> = ({
  loading,
  error,
  interviews,
  onSelectInterview
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'upcoming' | 'completed'>('today');

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl"></div>
        <div className="h-48 bg-slate-200 rounded-[20px]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-[20px] text-xs text-red-600 font-bold flex items-center gap-2">
        <AlertCircle size={16} />
        <span>Error loading interview logs: {error}</span>
      </div>
    );
  }

  const filtered = interviews.filter(i => {
    const matchesSearch = (i.workerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = 
      activeSubTab === 'today' ? (i.status === 'Today' || i.status === 'pending_review' || i.status === 'admin_interview') :
      activeSubTab === 'upcoming' ? i.status === 'Scheduled' :
      i.status === 'Completed' || i.status === 'approved' || i.status === 'live';

    return matchesSearch && matchesTab;
  });

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
        <div>
          <h4 className="text-xs font-black text-slate-800">Interview Management Center</h4>
          <p className="text-[10px] text-gray-400 font-bold">Click any candidate card to open interview audit & feedback drawer</p>
        </div>

        <div className="relative w-full sm:w-48">
          <Search className="absolute left-2.5 top-2 text-gray-400" size={12} />
          <input
            type="text"
            placeholder="Search workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-1 border-b border-slate-50 pb-2 text-[10px] font-bold text-gray-500">
        {[
          { id: 'today', label: "Today's Interviews" },
          { id: 'upcoming', label: "Upcoming" },
          { id: 'completed', label: "Completed Log" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-1 py-1.5 border-b-2 cursor-pointer ${
              activeSubTab === tab.id ? 'border-[#1A73E8] text-[#1A73E8]' : 'border-transparent hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-400 font-bold flex flex-col items-center justify-center gap-2">
          <Sparkles size={20} className="text-gray-300" />
          <span>No interviews in this sub-queue</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectInterview(item)}
              className="p-4 rounded-2xl border border-slate-100 hover:border-[#1A73E8]/30 hover:bg-blue-50/20 transition-all duration-200 flex items-center justify-between cursor-pointer group shadow-sm hover:shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-700 text-xs group-hover:bg-[#1A73E8] group-hover:text-white transition-colors">
                  {item.workerName?.charAt(0) || 'W'}
                </div>
                <div>
                  <span className="block text-xs font-black text-slate-800 group-hover:text-[#1A73E8] transition-colors">
                    {item.workerName}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1"><Clock size={11} /> {item.time || 'Slot: Morning'}</span>
                    <span>•</span>
                    <span>Category: {item.category || 'Domestic Help'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                  item.status === 'Completed' || item.status === 'approved' || item.status === 'live'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                    : 'bg-blue-50 text-[#1A73E8] border border-blue-200/50'
                }`}>
                  {item.status || 'Pending Audit'}
                </span>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-[#1A73E8] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
