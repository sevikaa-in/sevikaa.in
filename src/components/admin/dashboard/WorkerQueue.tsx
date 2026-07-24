"use client";

import React, { useState } from 'react';
import { UserCheck, Users, ShieldAlert, Sparkles, Star, Calendar, MapPin, ChevronRight, Search } from 'lucide-react';

interface WorkerQueueProps {
  loading: boolean;
  error: string;
  workers: any[];
  selectedWorkerId: string;
  onSelectWorker: (worker: any) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export const WorkerQueue: React.FC<WorkerQueueProps> = ({
  loading,
  error,
  workers,
  selectedWorkerId,
  onSelectWorker,
  onUpdateStatus
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
        <span>Error loading worker queue: {error}</span>
      </div>
    );
  }

  // Filter and Search logic
  const filtered = workers.filter(w => {
    const matchesSearch = (w.name || w.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (w.phone || '').includes(searchTerm) ||
                          (w.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
      case 'approved':
        return 'bg-[#34A853]/10 text-[#34A853]';
      case 'suspended':
      case 'deactivated':
      case 'rejected':
        return 'bg-[#EA4335]/10 text-[#EA4335]';
      case 'admin_interview':
        return 'bg-[#1A73E8]/10 text-[#1A73E8]';
      default:
        return 'bg-[#FBBC05]/10 text-amber-600';
    }
  };

  const lifecycleStages = [
    'pending_review',
    'admin_interview',
    'approved',
    'live',
    'suspended'
  ];

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
        <div>
          <h4 className="text-xs font-black text-slate-800">Worker Verification Queue</h4>
          <p className="text-[10px] text-gray-400 font-bold">Manage status progression and details verification</p>
        </div>

        {/* Inline Search */}
        <div className="relative w-full sm:w-48">
          <Search className="absolute left-2.5 top-2 text-gray-400" size={12} />
          <input
            type="text"
            placeholder="Search queue..."
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
        {['all', 'pending_review', 'admin_interview', 'approved', 'live', 'suspended'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilterStatus(status);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer ${
              filterStatus === status 
                ? 'bg-[#1A73E8] text-white shadow-sm' 
                : 'bg-slate-50 text-gray-500 hover:bg-slate-100/75'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Queue Items */}
      {paginated.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-400 font-bold flex flex-col items-center justify-center gap-2">
          <Sparkles size={20} className="text-gray-300" />
          <span>No workers in this pipeline queue</span>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {paginated.map((worker) => {
            const isSelected = selectedWorkerId === worker.id;
            return (
              <div 
                key={worker.id}
                onClick={() => onSelectWorker(worker)}
                className={`py-3.5 px-3 rounded-xl flex items-center justify-between gap-4 transition-colors cursor-pointer border ${
                  isSelected 
                    ? 'bg-slate-50 border-slate-200/50 shadow-sm' 
                    : 'border-transparent hover:bg-slate-50/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">{worker.name || worker.full_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getStatusColor(worker.status)}`}>
                      {worker.status?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Visual Progress Timeline (PRD Lifecycle) */}
                  <div className="flex items-center gap-1 py-1">
                    {lifecycleStages.map((stage, idx) => {
                      const currentIdx = lifecycleStages.indexOf(worker.status);
                      const passed = currentIdx >= idx;
                      return (
                        <div 
                          key={stage}
                          title={stage.replace('_', ' ')}
                          className={`h-1.5 rounded-full transition-colors ${
                            passed 
                              ? worker.status === 'suspended'
                                ? 'bg-[#EA4335] w-6'
                                : 'bg-[#34A853] w-6'
                              : 'bg-slate-200 w-3'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Skills summary & society */}
                  <div className="flex flex-wrap gap-1 text-[9px] font-bold text-gray-400">
                    <span className="bg-white border border-slate-100 px-1.5 py-0.5 rounded">Category: {worker.skills?.join(', ') || 'N/A'}</span>
                    <span className="bg-white border border-slate-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <MapPin size={8} /> Preferred: {worker.preferred_society_name || 'None'}
                    </span>
                  </div>
                </div>

                <ChevronRight size={14} className="text-gray-400" />
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[10px] font-bold text-gray-400">
          <span>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} workers</span>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-lg disabled:opacity-50 cursor-pointer active:scale-95 transition-all text-slate-700"
            >
              Prev
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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
