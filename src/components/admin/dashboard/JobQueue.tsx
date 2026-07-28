"use client";

import React, { useState } from 'react';
import { ShieldAlert, Sparkles, MapPin, ChevronRight, Search, FileText } from 'lucide-react';

interface JobQueueProps {
  loading: boolean;
  error: string;
  jobs: any[];
  onModerateJob: (id: string, action: 'approve' | 'reject' | 'request_changes' | boolean, note?: string) => void;
  onSelectJob: (job: any, showFeedback?: boolean) => void;
}

const getEmployerName = (job: any): string => {
  if (!job) return 'Household Employer';
  if (typeof job.employer === 'string' && job.employer.trim()) return job.employer;
  if (typeof job.employer_name === 'string' && job.employer_name.trim()) return job.employer_name;
  if (typeof job.employer_profile_name === 'string' && job.employer_profile_name.trim()) return job.employer_profile_name;
  if (job.employer && typeof job.employer === 'object') {
    const ep = Array.isArray(job.employer.employer_profiles) ? job.employer.employer_profiles[0] : job.employer.employer_profiles;
    if (ep?.name) return ep.name;
    if (ep?.company_name) return ep.company_name;
    if (job.employer.email) return job.employer.email.split('@')[0];
  }
  return 'Household Employer';
};

export const JobQueue: React.FC<JobQueueProps> = ({
  loading,
  error,
  jobs,
  onModerateJob,
  onSelectJob
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

  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const effectiveSearch = searchTerm.trim();

  const filtered = safeJobs.filter(j => 
    !effectiveSearch ||
    (j.title || '').toLowerCase().includes(effectiveSearch.toLowerCase()) ||
    getEmployerName(j).toLowerCase().includes(effectiveSearch.toLowerCase()) ||
    (j.society_name || '').toLowerCase().includes(effectiveSearch.toLowerCase()) ||
    (j.category || '').toLowerCase().includes(effectiveSearch.toLowerCase()) ||
    (j.description || '').toLowerCase().includes(effectiveSearch.toLowerCase())
  );

  // Sort pending jobs first in the queue
  const sortedJobs = [...filtered].sort((a, b) => {
    const statusA = (a.status || 'pending').toLowerCase();
    const statusB = (b.status || 'pending').toLowerCase();

    const isPendingA = statusA === 'pending' || statusA === 'pending_review';
    const isPendingB = statusB === 'pending' || statusB === 'pending_review';

    if (isPendingA && !isPendingB) return -1;
    if (!isPendingA && isPendingB) return 1;
    return 0;
  });

  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = sortedJobs.slice(startIndex, startIndex + itemsPerPage);

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
        <div className="space-y-3">
          {paginated.map((job) => (
            <div key={job.id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/20 transition-all duration-200 space-y-3">
              <div 
                onClick={() => onSelectJob(job)}
                className="flex justify-between items-start cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-extrabold text-[#1A73E8] uppercase tracking-wider">{job.category || 'General'} Job offer</span>
                    {(() => {
                      const statusStr = (job.status || 'pending').toLowerCase();
                      if (statusStr === 'active' || statusStr === 'approved' || statusStr === 'live') {
                        return (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✅ Live &amp; Published
                          </span>
                        );
                      }
                      if (statusStr === 'rejected') {
                        return (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-50 text-red-700 border border-red-200">
                            ❌ Rejected
                          </span>
                        );
                      }
                      if (statusStr === 'changes_requested' || statusStr === 'request_changes') {
                        return (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                            ⚠️ Changes Requested
                          </span>
                        );
                      }
                      return (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                          ⏳ Pending Approval
                        </span>
                      );
                    })()}
                  </div>
                  <span className="block text-xs font-black text-slate-800 group-hover:text-[#1A73E8] transition-colors">{job.title}</span>
                  <div className="flex flex-wrap gap-2 text-[9px] font-bold text-gray-400 mt-1">
                    <span>Employer: {getEmployerName(job)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><MapPin size={8} /> {job.society_name || 'Society'}</span>
                    <span>•</span>
                    <span>Salary: {job.salary_offered ? `₹${Number(job.salary_offered).toLocaleString('en-IN')}/mo` : job.salary ? `₹${Number(job.salary).toLocaleString('en-IN')}/mo` : 'Market Rate'}</span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-400 group-hover:text-slate-800 transition-colors" />
              </div>

              {/* Job description preview */}
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                {job.description}
              </p>

              {/* View Details CTA */}
              <button
                onClick={() => onSelectJob(job)}
                className="w-full py-2 bg-slate-50 hover:bg-blue-50 hover:border-[#1A73E8]/30 text-slate-600 hover:text-[#1A73E8] rounded-xl text-[10px] font-black border border-slate-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FileText size={11} />
                <span>View Full Details &amp; Moderate</span>
                <ChevronRight size={11} />
              </button>
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
