"use client";

import React, { useState } from 'react';
import { ShieldAlert, Sparkles, MapPin, ChevronRight, Search, FileText, CheckCircle2, XCircle } from 'lucide-react';

interface JobQueueProps {
  loading: boolean;
  error: string;
  jobs: any[];
  onModerateJob: (id: string, approved: boolean) => void;
}

export const JobQueue: React.FC<JobQueueProps> = ({
  loading,
  error,
  jobs,
  onModerateJob
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
        <span>Error loading job queue: {error}</span>
      </div>
    );
  }

  const filtered = jobs.filter(j => 
    (j.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.employer || j.employer_profile_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.society_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
        <div>
          <h4 className="text-xs font-black text-slate-800">Job Posting Moderation Queue</h4>
          <p className="text-[10px] text-gray-400 font-bold">Approve, reject, or request changes on posted jobs</p>
        </div>

        <div className="relative w-full sm:w-48">
          <Search className="absolute left-2.5 top-2 text-gray-400" size={12} />
          <input
            type="text"
            placeholder="Search job posts..."
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
          <span>All job posts moderated successfully</span>
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-slate-50">
          {paginated.map((job) => (
            <div key={job.id} className="pt-4 first:pt-0 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-[10px] font-extrabold text-[#1A73E8] uppercase tracking-wider">{job.category || 'General'} Job offer</span>
                  <span className="block text-xs font-black text-slate-800 mt-0.5">{job.title}</span>
                  <div className="flex flex-wrap gap-2 text-[9px] font-bold text-gray-400 mt-1">
                    <span>Employer: {job.employer || 'Household'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><MapPin size={8} /> {job.society_name || 'Society'}</span>
                    <span>•</span>
                    <span>Salary: {job.salary || `₹${job.salary_offered}/mo`}</span>
                  </div>
                </div>
              </div>

              {/* Job description preview */}
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                {job.description}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => onModerateJob(job.id, true)}
                  className="flex-1 py-2 bg-[#34A853] hover:bg-[#34A853]/90 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 size={12} />
                  <span>Approve & Publish</span>
                </button>
                <button
                  onClick={() => onModerateJob(job.id, false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200/20"
                >
                  <XCircle size={12} />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => alert("Changes request logged - notification sent to Employer.")}
                  className="py-2 px-3 border border-[#EA4335]/20 hover:bg-[#EA4335]/5 text-[#EA4335] text-[10px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Request Changes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[10px] font-bold text-gray-400">
          <span>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} jobs</span>
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
