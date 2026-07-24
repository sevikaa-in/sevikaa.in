"use client";

import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, XCircle, Search, Sparkles } from 'lucide-react';

interface InterviewQueueProps {
  loading: boolean;
  error: string;
  interviews: any[];
  onLogResult: (id: string, result: 'Pass' | 'Fail' | 'Re-interview', notes: string) => void;
}

export const InterviewQueue: React.FC<InterviewQueueProps> = ({
  loading,
  error,
  interviews,
  onLogResult
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'upcoming' | 'completed'>('today');
  const [notes, setNotes] = useState<Record<string, string>>({});

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
      activeSubTab === 'today' ? i.status === 'Today' :
      activeSubTab === 'upcoming' ? i.status === 'Scheduled' :
      i.status === 'Completed';

    return matchesSearch && matchesTab;
  });

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
        <div>
          <h4 className="text-xs font-black text-slate-800">Interview Management Center</h4>
          <p className="text-[10px] text-gray-400 font-bold">Schedule reviews and log telephone/in-person checks (PRD 4.1)</p>
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
        <div className="space-y-4 divide-y divide-slate-50">
          {filtered.map((item) => (
            <div key={item.id} className="pt-4 first:pt-0 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-xs font-black text-slate-800">{item.workerName}</span>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 mt-1">
                    <span className="flex items-center gap-0.5"><Clock size={10} /> {item.time}</span>
                    <span>•</span>
                    <span>Category: {item.category}</span>
                  </div>
                </div>
              </div>

              {item.status !== 'Completed' ? (
                <div className="space-y-2">
                  <textarea
                    rows={1}
                    value={notes[item.id] || ''}
                    onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                    placeholder="Log summary interview feedback notes..."
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-800 focus:bg-white focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLogResult(item.id, 'Pass', notes[item.id] || 'Passed checks')}
                      className="flex-1 py-1.5 bg-[#34A853] hover:bg-[#34A853]/90 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 size={12} />
                      <span>Pass Audit</span>
                    </button>
                    <button
                      onClick={() => onLogResult(item.id, 'Fail', notes[item.id] || 'Failed audit')}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-red-50 hover:text-[#EA4335] text-gray-700 rounded-xl text-[10px] font-bold active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200/20"
                    >
                      <XCircle size={12} />
                      <span>Fail</span>
                    </button>
                    <button
                      onClick={() => onLogResult(item.id, 'Re-interview', notes[item.id] || 'Re-interview requested')}
                      className="py-1.5 px-3 border border-yellow-200/60 hover:bg-yellow-50/50 text-yellow-600 rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50 space-y-1">
                  <div className="flex justify-between text-[9px] font-bold">
                    <span className="text-gray-400">Result Decision:</span>
                    <span className={`uppercase ${item.result === 'Pass' ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                      {item.result}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold leading-normal">Notes: "{item.resultNotes}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
