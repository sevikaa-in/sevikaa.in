"use client";

import React, { useState } from 'react';
import { UserCheck, ShieldAlert, Sparkles, MapPin, ChevronRight, Search, CreditCard } from 'lucide-react';

interface EmployerQueueProps {
  loading: boolean;
  error: string;
  employers: any[];
  onToggleSubscription?: (id: string, currentSub: string) => void;
  onApproveEmployer: (id: string) => void;
  onRejectEmployer: (id: string) => void;
  onSelectEmployer: (employer: any) => void;
}

export const EmployerQueue: React.FC<EmployerQueueProps> = ({
  loading,
  error,
  employers,
  onToggleSubscription,
  onApproveEmployer,
  onRejectEmployer,
  onSelectEmployer
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
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

  const filtered = employers.filter(e => {
    const matchesSearch = (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.billing_address || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto whitespace-nowrap gap-1 pb-2 scrollbar-hide">
        {['all', 'pending_review', 'live', 'suspended', 'deletion_requested'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilterStatus(status);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer ${
              filterStatus === status 
                ? status === 'deletion_requested' ? 'bg-amber-600 text-white shadow-sm' : 'bg-[#1A73E8] text-white shadow-sm' 
                : status === 'deletion_requested' ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-slate-50 text-gray-500 hover:bg-slate-100/75'
            }`}
          >
            {status === 'deletion_requested' ? '⚠️ Deletion Pending' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-400 font-bold flex flex-col items-center justify-center gap-2">
          <Sparkles size={20} className="text-gray-300" />
          <span>No employers in this queue</span>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((emp) => (
            <div 
              key={emp.id} 
              onClick={() => onSelectEmployer(emp)}
              className="p-4 rounded-2xl border border-slate-100 hover:border-[#1A73E8]/40 hover:bg-slate-50/70 hover:shadow-md transition-all duration-200 cursor-pointer group space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 group-hover:text-[#1A73E8] transition-colors">{emp.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      emp.status === 'live' || emp.status === 'approved' 
                        ? 'bg-[#34A853]/10 text-[#34A853]' 
                        : emp.status === 'suspended' || emp.status === 'rejected'
                        ? 'bg-[#EA4335]/10 text-[#EA4335]'
                        : 'bg-[#FBBC05]/10 text-amber-600'
                    }`}>
                      {emp.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="block text-[9.5px] text-slate-500 font-bold">Household / Entity: {emp.company_name || 'Individual Household'}</span>
                  <span className="block text-[9.5px] text-slate-500 font-semibold flex items-center gap-1"><MapPin size={9} className="text-[#1A73E8]" /> Society / Locality: {emp.society_name || emp.billing_address || 'Bangalore'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1 ${
                    emp.subscription_status === 'premium'
                      ? 'bg-indigo-50 text-[#1A73E8]'
                      : 'bg-slate-100 text-gray-400'
                  }`}>
                    <CreditCard size={10} />
                    {emp.subscription_status}
                  </span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-[#1A73E8] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {onToggleSubscription && (
                <div className="flex items-center justify-between border-t border-slate-100/60 pt-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSubscription(emp.id, emp.subscription_status);
                    }}
                    className={`py-1 px-3 rounded-xl text-[9.5px] font-black uppercase transition-all border active:scale-95 cursor-pointer flex items-center gap-1 ${
                      emp.subscription_status === 'premium'
                        ? 'bg-blue-50 text-[#1A73E8] border-blue-200/50 hover:bg-blue-100'
                        : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100'
                    }`}
                    title="Super Admin override: switch between Free and Premium subscription"
                  >
                    <CreditCard size={11} />
                    <span>{emp.subscription_status === 'premium' ? 'Downgrade to Free' : 'Grant Premium Access'}</span>
                  </button>
                </div>
              )}
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
