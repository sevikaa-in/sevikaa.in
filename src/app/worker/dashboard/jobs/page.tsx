"use client";

import React, { useState } from 'react';
import { useWorkerDashboard } from '../layout';
import { Briefcase, MapPin, IndianRupee, Clock, CheckCircle2, Globe, Building2, Send } from 'lucide-react';

export default function WorkerJobsPage() {
  const { workerProfile, applications, availableJobs, showToast } = useWorkerDashboard();

  // Tab filter: 'all' (All Locations) vs 'preferred' (Preferred Society Only)
  const [filterMode, setFilterMode] = useState<'all' | 'preferred'>('all');
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  // Sample fallback mock jobs from other locations if list is empty
  const fallbackJobs = [
    { 
      id: 'job_b1', 
      title: 'Full Day Housekeeping & Washing', 
      description: 'Daily cleaning, dusting, and laundry for 3BHK household in Electronic City Phase 1.', 
      salary_offered: 14000, 
      society_name: 'SNN Raj Serenity - Bangalore', 
      created_at: '1 hour ago' 
    },
    { 
      id: 'job_b2', 
      title: 'Evening Meal Preparation Cook', 
      description: 'North Indian dinner cooking for 4 members (Roti, Sabzi, Dal, Rice).', 
      salary_offered: 12000, 
      society_name: 'DLF Westend Heights - Akshayanagar', 
      created_at: '4 hours ago' 
    },
    { 
      id: 'job_b3', 
      title: 'Toddler Nanny & Caretaker', 
      description: 'Taking care of 2-year-old child, feeding, and light playtime assistance.', 
      salary_offered: 19000, 
      society_name: 'Prestige Song of the South - Bangalore', 
      created_at: '6 hours ago' 
    }
  ];

  const jobsToDisplay = availableJobs.length > 0 ? availableJobs : fallbackJobs;

  const preferredJobs = jobsToDisplay.filter(j => 
    j.society_name?.toLowerCase().includes(workerProfile.society?.toLowerCase() || '') ||
    workerProfile.society?.toLowerCase().includes(j.society_name?.toLowerCase() || '')
  );

  const displayedJobs = filterMode === 'preferred' && preferredJobs.length > 0 
    ? preferredJobs 
    : jobsToDisplay;

  const handleApply = (jobId: string, title: string) => {
    if (appliedJobIds.includes(jobId)) return;
    setAppliedJobIds(prev => [...prev, jobId]);
    showToast(`Application submitted for ${title}!`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-16">
      
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Briefcase size={18} className="text-[#1A73E8]" />
          <span>Available Jobs &amp; Applications</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Browse verified household job postings near you and across all partner societies.
        </p>
      </div>

      {/* Location Filter Tabs */}
      <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 max-w-md text-xs font-black">
        <button
          onClick={() => setFilterMode('all')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filterMode === 'all' 
              ? 'bg-white text-[#1A73E8] shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe size={14} />
          <span>All City Locations ({jobsToDisplay.length})</span>
        </button>

        <button
          onClick={() => setFilterMode('preferred')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filterMode === 'preferred' 
              ? 'bg-white text-[#1A73E8] shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={14} />
          <span>My Preferred Society ({preferredJobs.length})</span>
        </button>
      </div>

      {/* Notice Banner if filterMode === 'preferred' but zero jobs in exact society */}
      {filterMode === 'preferred' && preferredJobs.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-[#1A73E8]">
            <Globe size={16} />
            <span>Showing Open Jobs From Other Nearby Locations</span>
          </div>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            There are currently no active job postings in <strong>{workerProfile.society || 'your selected society'}</strong>. We are showing open verified jobs in nearby societies below!
          </p>
        </div>
      )}

      {/* Open Jobs List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
          <span>Open Jobs Feed ({displayedJobs.length})</span>
          <span className="text-[10px] text-slate-400 font-semibold">100% Free Application</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedJobs.map((job) => {
            const hasApplied = appliedJobIds.includes(job.id);
            return (
              <div key={job.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{job.title}</h4>
                      <span className="text-[10.5px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#1A73E8] shrink-0" /> 
                        <span className="truncate">{job.society_name}</span>
                      </span>
                    </div>
                    <span className="text-sm font-black text-emerald-600 shrink-0 font-mono">₹{job.salary_offered}/mo</span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock size={10} /> {job.created_at || 'Just now'}
                  </span>
                  <button
                    onClick={() => handleApply(job.id, job.title)}
                    disabled={hasApplied}
                    className={`py-2 px-4 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer ${
                      hasApplied 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-[#1A73E8] hover:bg-blue-600 text-white'
                    }`}
                  >
                    {hasApplied ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Applied</span>
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        <span>Apply Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Applied Jobs Track Section */}
      {applications.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Active Applications Track ({applications.length})</h3>
          
          {applications.map((app) => (
            <div key={app.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-900">{app.jobTitle}</h4>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <MapPin size={10} /> {app.society}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-emerald-600 font-mono">₹{app.salary}</span>
                <span className="px-2.5 py-1 bg-blue-50 text-[#1A73E8] text-[9px] font-black uppercase rounded-full border border-blue-200/50">
                  Interview Scheduled
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
