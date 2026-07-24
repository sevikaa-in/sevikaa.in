"use client";

import React, { useState } from 'react';
import { ShieldAlert, Sparkles, User, AlertCircle, Search, HelpCircle, CheckCircle } from 'lucide-react';

interface DisputesQueueProps {
  loading: boolean;
  error: string;
  disputes: any[];
  onResolveDispute: (id: string) => void;
}

export const DisputesQueue: React.FC<DisputesQueueProps> = ({
  loading,
  error,
  disputes,
  onResolveDispute
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
        <HelpCircle size={16} />
        <span>Error loading dispute backlogs: {error}</span>
      </div>
    );
  }

  const filtered = disputes.filter(d => 
    (d.reported_user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.reporter || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
        <div>
          <h4 className="text-xs font-black text-slate-800">Reports & Disputes Resolution</h4>
          <p className="text-[10px] text-gray-400 font-bold">Investigate safety flags, dispute reports, and resolve escalations</p>
        </div>

        <div className="relative w-full sm:w-48">
          <Search className="absolute left-2.5 top-2 text-gray-400" size={12} />
          <input
            type="text"
            placeholder="Search disputes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-400 font-bold flex flex-col items-center justify-center gap-2">
          <Sparkles size={20} className="text-gray-300" />
          <span>All disputes resolved. Marketplace is safe.</span>
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-slate-50">
          {paginated.map((item) => (
            <div key={item.id} className="pt-4 first:pt-0 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="block text-xs font-black text-slate-800">Target: {item.reported_user}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                      item.priority === 'High' ? 'bg-red-50 text-[#EA4335]' : 'bg-slate-100 text-gray-400'
                    }`}>
                      {item.priority} Urgency
                    </span>
                  </div>
                  <span className="block text-[9px] text-gray-400 font-bold mt-1">Reporter: {item.reporter}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50 space-y-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Reason & Details:</span>
                <p className="text-[10px] text-gray-500 font-bold leading-normal">"{item.reason}"</p>
                {item.evidence && (
                  <span className="block text-[8px] text-[#1A73E8] font-bold mt-1.5">Attached evidence: {item.evidence}</span>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex gap-2">
                <button
                  onClick={() => onResolveDispute(item.id)}
                  className="flex-1 py-1.5 bg-[#34A853] hover:bg-[#34A853]/90 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle size={12} />
                  <span>Resolve & Dismiss</span>
                </button>
                <button
                  onClick={() => alert("Flag forwarded to Super Admin Escalations.")}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer border border-slate-200/20"
                >
                  Escalate
                </button>
                <button
                  onClick={() => alert("Worker profile deactivated pending police check audit.")}
                  className="py-1.5 px-3 border border-[#EA4335]/20 hover:bg-[#EA4335]/5 text-[#EA4335] text-[10px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Suspend User
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[10px] font-bold text-gray-400">
          <span>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} disputes</span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-lg disabled:opacity-50 cursor-pointer active:scale-95 transition-all text-slate-700"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-lg disabled:opacity-50 cursor-pointer active:scale-95 transition-all text-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
