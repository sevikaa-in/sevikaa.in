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
    
    const statusStr = (w.status || 'pending_review').toLowerCase();
    const isLiveApproved = statusStr === 'live' || statusStr === 'approved' || statusStr === 'active';
    const isPending = statusStr === 'pending' || statusStr === 'pending_review';
    const isAdminInterview = statusStr === 'admin_interview';
    const isSuspended = statusStr === 'suspended' || statusStr === 'rejected' || statusStr === 'deactivated' || statusStr === 'changes_requested';
    const isDeletion = statusStr === 'deletion_requested' || statusStr === 'pending_deletion';
    const isLeadIncomplete = !isLiveApproved && (!w.skills || w.skills.length === 0 || w.name === 'Registered Candidate' || w.full_name === 'Verified Worker' || w.full_name === 'Worker Candidate');

    const matchesStatus = filterStatus === 'all' 
      ? true 
      : filterStatus === 'incomplete_lead' 
        ? isLeadIncomplete
        : filterStatus === 'pending_review'
          ? isPending
          : filterStatus === 'admin_interview'
            ? isAdminInterview
            : filterStatus === 'live'
              ? isLiveApproved
              : filterStatus === 'suspended'
                ? isSuspended
                : filterStatus === 'deletion_requested'
                  ? isDeletion
                  : w.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Sort pending approval workers to top of the queue
  const sortedWorkers = [...filtered].sort((a, b) => {
    const isAPending = a.status === 'pending' || a.status === 'pending_review' || a.status === 'pending_verification';
    const isBPending = b.status === 'pending' || b.status === 'pending_review' || b.status === 'pending_verification';
    if (isAPending && !isBPending) return -1;
    if (!isAPending && isBPending) return 1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedWorkers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = sortedWorkers.slice(startIndex, startIndex + itemsPerPage);

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
        {['all', 'incomplete_lead', 'pending_review', 'admin_interview', 'live', 'suspended', 'deletion_requested'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilterStatus(status);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer ${
              filterStatus === status 
                ? status === 'incomplete_lead' ? 'bg-amber-500 text-white shadow-sm' : status === 'deletion_requested' ? 'bg-amber-600 text-white shadow-sm' : 'bg-[#1A73E8] text-white shadow-sm' 
                : status === 'incomplete_lead' ? 'bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100' : status === 'deletion_requested' ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-slate-50 text-gray-500 hover:bg-slate-100/75'
            }`}
          >
            {status === 'incomplete_lead' ? '⚡ Dropped Leads (OTP Verified)' : status === 'deletion_requested' ? '⚠️ Deletion Pending' : status.replace('_', ' ')}
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
                    { (worker.status === 'pending' || worker.status === 'pending_review' || worker.status === 'pending_verification') ? (
                      <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200/80 animate-pulse">
                        ⏳ Pending Approval
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getStatusColor(worker.status)}`}>
                        {worker.status?.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Visual Progress Timeline (4-Step Verification Sequence) */}
                  <div className="flex items-center gap-1 py-1">
                    {(() => {
                      const isProfileComplete = Boolean(
                        (worker.full_name || worker.name)?.trim() &&
                        worker.gender && worker.age &&
                        worker.expected_salary &&
                        (Array.isArray(worker.skills) ? worker.skills.length > 0 : !!worker.skills) &&
                        (worker.profile_picture_url || worker.avatar_url) &&
                        (worker.aadhaar_front_url || worker.is_aadhaar_front_verified) &&
                        (worker.aadhaar_back_url || worker.is_aadhaar_back_verified)
                      );
                      const isTelePassed = Boolean(worker.is_tele_onboarded || worker.is_interview_verified || worker.status === 'admin_interview' || worker.status === 'live' || worker.status === 'approved');
                      const isLiveApproved = Boolean(worker.status === 'live' || worker.status === 'approved' || worker.status === 'active');
                      const isSuspended = Boolean(worker.status === 'suspended' || worker.status === 'deactivated' || worker.status === 'rejected');

                      const steps = [
                        { name: '1. OTP Registered Lead', active: true },
                        { name: '2. Profile & Documents (100% Complete)', active: isProfileComplete || isLiveApproved },
                        { name: '3. Telephonic Onboarding Verification Passed', active: isTelePassed },
                        { name: '4. Final Admin Approval (Marked Live)', active: isLiveApproved }
                      ];

                      return steps.map((step) => (
                        <div 
                          key={step.name}
                          title={step.name}
                          className={`h-1.5 rounded-full transition-all ${
                            step.active 
                              ? isSuspended
                                ? 'bg-[#EA4335] w-6'
                                : 'bg-[#34A853] w-6'
                              : 'bg-slate-200 w-3'
                          }`}
                        />
                      ));
                    })()}
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
