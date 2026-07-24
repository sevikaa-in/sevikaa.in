"use client";

import React, { useState } from 'react';
import { UserCheck, ShieldAlert, Sparkles, MapPin, ChevronRight, Search, CreditCard } from 'lucide-react';

interface EmployerQueueProps {
  loading: boolean;
  error: string;
  employers: any[];
  onToggleSubscription: (id: string, currentSub: string) => void;
  onApproveEmployer: (id: string) => void;
  onRejectEmployer: (id: string) => void;
}

export const EmployerQueue: React.FC<EmployerQueueProps> = ({
  loading,
  error,
  employers,
  onToggleSubscription,
  onApproveEmployer,
  onRejectEmployer
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
        <ShieldAlert size={16} />
        <span>Error loading employer queue: {error}</span>
      </div>
    );
  }

  const filtered = employers.filter(e => 
    (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.billing_address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
        <div>
          <h4 className="text-xs font-black text-slate-800">Employer Profile Management</h4>
          <p className="text-[10px] text-gray-400 font-bold">Audit identities and premium pricing conversions</p>
        </div>

        <div className="relative w-full sm:w-48">
          <Search className="absolute left-2.5 top-2 text-gray-400" size={12} />
          <input
            type="text"
            placeholder="Search employers..."
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
          <span>No employers in this queue</span>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {paginated.map((emp) => (
            <div key={emp.id} className="py-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="block text-xs font-black text-slate-800">{emp.name}</span>
                  <span className="block text-[9px] text-gray-400 font-bold">Company: {emp.company_name || 'Individual Household'}</span>
                  <span className="block text-[9px] text-gray-400 font-semibold flex items-center gap-0.5"><MapPin size={8} /> {emp.billing_address || 'Bangalore'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1 ${
                    emp.subscription_status === 'premium'
                      ? 'bg-indigo-50 text-[#1A73E8]'
                      : 'bg-slate-100 text-gray-400'
                  }`}>
                    <CreditCard size={10} />
                    {emp.subscription_status}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleSubscription(emp.id, emp.subscription_status)}
                  className="flex-1 py-1.5 px-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl text-[10px] font-bold text-gray-500 active:scale-95 transition-all border border-slate-100/50 cursor-pointer"
                >
                  Toggle Pass (Free/Premium)
                </button>
                <button
                  onClick={() => onApproveEmployer(emp.id)}
                  className="py-1.5 px-3.5 bg-[#34A853] hover:bg-[#34A853]/90 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={() => onRejectEmployer(emp.id)}
                  className="py-1.5 px-3.5 bg-slate-100 hover:bg-red-50 hover:text-[#EA4335] rounded-xl text-[10px] font-bold text-gray-400 active:scale-95 transition-all cursor-pointer border border-slate-100/50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[10px] font-bold text-gray-400">
          <span>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} employers</span>
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
