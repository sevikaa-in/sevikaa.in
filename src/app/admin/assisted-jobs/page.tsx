"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdminDashboard } from '../layout';
import { 
  Users, Building, PhoneCall, CheckCircle2, Search, RefreshCw, Briefcase, 
  MapPin, Sparkles, Send, Clock, AlertCircle, Loader2, Home, Utensils, 
  FileText, ShieldCheck, IndianRupee, X, Check, Filter, ChevronLeft, ChevronRight,
  ArrowLeft
} from 'lucide-react';

export default function AssistedJobMatcherPage() {
  const { showToast } = useAdminDashboard();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Data States
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [jobsList, setJobsList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Pagination States for Worker Directory
  const [page, setPage] = useState(1);
  const limit = 12;

  // Search & Navigation States
  const [phoneSearch, setPhoneSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);

  // Custom Job Filters for Selected Candidate Sub-View
  const [skillFilter, setSkillFilter] = useState<string>('All');
  const [societyFilter, setSocietyFilter] = useState<string>('');
  const [shiftFilter, setShiftFilter] = useState<string>('All');
  const [minSalaryFilter, setMinSalaryFilter] = useState<string>('');

  // Job Inspector Drawer / Modal State
  const [inspectingJob, setInspectingJob] = useState<any | null>(null);
  const [submittingJobId, setSubmittingJobId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  // Lock background body scroll when inspection drawer is open
  useEffect(() => {
    if (inspectingJob) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [inspectingJob]);

  // Master Societies List for Searchable Scrollable Gated Society Dropdown
  const [allSocieties, setAllSocieties] = useState<any[]>([]);
  const [showSocietyMenu, setShowSocietyMenu] = useState(false);

  useEffect(() => {
    fetch('/api/societies')
      .then(r => r.json())
      .then(d => { if (d.success && Array.isArray(d.societies)) setAllSocieties(d.societies); })
      .catch(() => {});
  }, []);

  // Fetch paginated workers & jobs with instant search query
  const fetchPaginatedData = async (targetPage = page, query = phoneSearch) => {
    setLoadingData(true);
    try {
      const qParam = query.trim() ? `&q=${encodeURIComponent(query.trim())}` : '';
      // Strictly filter candidate directory to Live & Approved verified candidates only
      const statusParam = 'approved';
      const [wRes, jRes] = await Promise.all([
        fetch(`/api/admin/data?tab=workers&status=${statusParam}&page=${targetPage}&limit=${limit}${qParam}`).then(r => r.json()),
        fetch('/api/admin/data?tab=jobs&limit=100').then(r => r.json()).catch(() => ({ jobs: [] }))
      ]);

      if (wRes?.success) setWorkersList(wRes.workers || []);
      if (jRes?.success || jRes?.jobs) setJobsList(jRes.jobs || []);
    } catch (e) {
      console.warn("Assisted data fetch notice:", e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchPaginatedData(page, phoneSearch);
  }, [page]);

  // Debounced Instant Database Search when Admin Types Phone Number
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPaginatedData(1, phoneSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [phoneSearch]);

  const searchedWorkers = workersList;

  // When a worker is selected, pre-fill filters based on candidate profile
  const handleSelectWorker = (worker: any) => {
    setSelectedWorker(worker);
    setAppliedJobIds([]);
    setSkillFilter('All');
    
    const soc = (worker.primary_gated_society || worker.primary_society_id || '').trim();
    if (soc && soc !== 'Not Assigned' && soc !== 'NCR') {
      setSocietyFilter(soc);
    } else {
      setSocietyFilter('');
    }

    setShiftFilter('All');
    setMinSalaryFilter('');
  };

  // Reset Job Filters to view ALL Jobs across Sevikaa Platform
  const handleResetFilters = () => {
    setSkillFilter('All');
    setSocietyFilter('');
    setShiftFilter('All');
    setMinSalaryFilter('');
  };

  // Filter open jobs based on active filters
  const activeSocietyQuery = societyFilter.toLowerCase().trim();

  const matchingJobs = jobsList.filter(j => {
    // 1. Skill Filter
    if (skillFilter !== 'All') {
      const cat = (j.category || j.title || '').toLowerCase();
      const targetSkill = skillFilter.toLowerCase();
      if (!cat.includes(targetSkill) && !targetSkill.includes(cat)) return false;
    }

    // 2. Society Filter
    if (activeSocietyQuery && activeSocietyQuery !== 'not assigned' && activeSocietyQuery !== 'ncr') {
      const soc = (j.society_name || j.primary_gated_society || j.location || '').toLowerCase();
      if (!soc.includes(activeSocietyQuery)) return false;
    }

    // 3. Shift Slot Filter
    if (shiftFilter !== 'All') {
      const shift = (j.shift_hours || j.work_timing || j.shift || '').toLowerCase();
      if (!shift.includes(shiftFilter.toLowerCase())) return false;
    }

    // 4. Minimum Salary Filter
    if (minSalaryFilter && Number(minSalaryFilter) > 0) {
      const offeredSalary = Number(j.salary_offered || j.salary_range_min || j.salary || 0);
      if (offeredSalary > 0 && offeredSalary < Number(minSalaryFilter)) return false;
    }

    return true;
  });

  // Format phone number (+91 XXX)
  const formatPhone = (p?: string) => {
    if (!p) return 'N/A';
    const cleaned = p.replace(/\D/g, '').slice(-10);
    return cleaned ? `+91 ${cleaned}` : 'N/A';
  };

  // Submit Application on Behalf of Candidate for Specific Job Post
  const handleApplyForWorker = async (job: any) => {
    if (!selectedWorker) return;
    setSubmittingJobId(job.id);
    try {
      const res = await fetch('/api/admin/worker/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: selectedWorker.id,
          jobId: job.id,
          employerPhone: job.phone || job.employer_phone,
          workerName: selectedWorker.full_name || selectedWorker.name || 'Candidate',
          category: Array.isArray(selectedWorker.skills) ? selectedWorker.skills[0] : 'Domestic Help',
          expYears: selectedWorker.experience_years || '0',
          societyName: job.society_name || 'Society'
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to submit application');

      setAppliedJobIds(prev => Array.from(new Set([...prev, job.id])));
      showToast(data.message || `Targeted application submitted for ${selectedWorker.full_name}! DLT SMS dispatched.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error submitting application', 'error');
    } finally {
      setSubmittingJobId(null);
    }
  };

  const masterCategories = ['All', 'Cook', 'Maid', 'Nanny', 'Driver', 'Elder Care', 'All Rounder', 'Gardener', 'Security Guard'];

  return (
    <div className="animate-fade-in w-full space-y-6 pb-16 max-w-7xl">
      
      {/* 👑 HEADER BANNER */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <Sparkles className="text-[#1A73E8]" size={22} />
              <span>Assisted Job Matcher &amp; Targeted Application Hub</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Search candidate phone numbers, open their job placement sub-view, inspect employer job details, and submit targeted 1-on-1 applications.
            </p>
          </div>

          <button
            onClick={() => fetchPaginatedData(page)}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs transition-colors"
          >
            <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} /> Refresh Data
          </button>
        </div>
      </div>

      {!selectedWorker ? (
        /* STEP 1: PAGINATED WORKER CANDIDATE DIRECTORY */
        <div className="space-y-6">
          
          {/* SEARCH BAR */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <PhoneCall size={16} className="text-[#1A73E8]" />
              <span>Step 1: Instant Candidate Phone Lookup (Caller Input)</span>
            </span>

            <div className="relative">
              <Search className="absolute left-4 top-4 text-[#1A73E8]" size={18} />
              <input
                type="text"
                placeholder="Type candidate 10-digit mobile number (e.g. 9876543210) or name..."
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-blue-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1A73E8] focus:bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* WORKER DIRECTORY GRID */}
          {loadingData ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center space-y-3 shadow-2xs">
              <Loader2 size={32} className="text-[#1A73E8] animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Fetching Registered Workers...</h4>
            </div>
          ) : searchedWorkers.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center space-y-3 shadow-2xs">
              <AlertCircle size={40} className="text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                {phoneSearch ? `No Verified Candidate Found Matching "${phoneSearch}"` : 'No Verified Candidate Profiles Available'}
              </h4>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                {phoneSearch 
                  ? 'Verify the candidate mobile number or try searching by candidate name.' 
                  : 'Candidates on this page are currently pending review or completing tele-interview setup. Complete and approve candidate profiles in the Telephonic Onboarding Hub first.'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchedWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    onClick={() => handleSelectWorker(worker)}
                    className="bg-white p-5 rounded-3xl border border-slate-200/90 hover:border-[#1A73E8] shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer group relative flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#1A73E8] transition-colors">
                            {worker.full_name || worker.name || 'Worker Candidate'}
                          </h4>
                          <p className="text-xs font-mono font-bold text-[#1A73E8]">
                            {formatPhone(worker.phone)}
                          </p>
                        </div>
                        <span className="bg-blue-50 text-[#1A73E8] border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {worker.experience_years || 0} Yrs Exp
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {(() => {
                          const skillsArr = Array.isArray(worker.skills) 
                            ? worker.skills 
                            : (typeof worker.skills === 'string' && worker.skills.trim()) 
                            ? worker.skills.split(',').map((s: string) => s.trim()).filter(Boolean) 
                            : (worker.category ? [worker.category] : ['Domestic Worker']);
                          return skillsArr.slice(0, 3).map((skill: string) => (
                            <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                              {skill}
                            </span>
                          ));
                        })()}
                        {worker.status === 'live' || worker.status === 'approved' ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[9.5px] font-bold">
                            ✓ Live
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md text-[9.5px] font-bold">
                            ⚡ {worker.status || 'Pending'}
                          </span>
                        )}
                      </div>

                      <div className="text-[10.5px] text-slate-500 font-medium space-y-0.5 pt-1">
                        <div className="flex items-center gap-1 font-bold text-slate-700">
                          <MapPin size={12} className="text-[#1A73E8]" /> Primary: {worker.primary_gated_society || worker.primary_society_id || 'Not Assigned'}
                        </div>
                        {worker.secondary_gated_society && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Building size={12} className="text-emerald-600" /> Secondary: {worker.secondary_gated_society}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
                      <span className="font-bold text-slate-900">
                        ₹{worker.expected_salary || 12000}/mo
                      </span>
                      <span className="text-[#1A73E8] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Select &amp; Find Jobs ➔
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-semibold text-slate-600">
                  Showing Page <span className="font-bold text-slate-900">{page}</span> ({searchedWorkers.length} candidates)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1 || loadingData}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={15} /> Previous Page
                  </button>

                  <button
                    disabled={searchedWorkers.length < limit || loadingData}
                    onClick={() => setPage(p => p + 1)}
                    className="py-2 px-3 bg-[#1A73E8] hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next Page <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* STEP 2: SELECTED CANDIDATE JOB PLACEMENT SUB-VIEW */
        <div className="space-y-6 animate-fade-in">
          
          {/* BACK TO DIRECTORY & SELECTED CANDIDATE STICKY HEADER */}
          <div className="bg-gradient-to-r from-blue-50/90 via-slate-50 to-emerald-50/90 p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedWorker(null)}
                className="text-xs font-bold text-[#1A73E8] hover:underline flex items-center gap-1 cursor-pointer mb-1"
              >
                <ArrowLeft size={14} /> Back to Worker Candidate Directory
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">{selectedWorker.full_name || selectedWorker.name}</h3>
                <span className="text-xs font-mono font-bold text-[#1A73E8] bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {formatPhone(selectedWorker.phone)}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {selectedWorker.experience_years || 0} Yrs Exp
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1 font-bold text-slate-800">
                        <MapPin size={13} className="text-[#1A73E8]" /> Primary: {selectedWorker.primary_gated_society || selectedWorker.primary_society_id || 'Not Assigned'}
                </span>
                {selectedWorker.secondary_gated_society && (
                  <span className="flex items-center gap-1 font-bold text-slate-800">
                    <Building size={13} className="text-emerald-600" /> Secondary: {selectedWorker.secondary_gated_society}
                  </span>
                )}
                <span className="font-bold text-slate-700">
                  Expected Salary: ₹{selectedWorker.expected_salary || 12000}/mo
                </span>
              </div>
            </div>
          </div>

          {/* MULTI-CRITERIA FILTERS BAR WITH RESET BUTTON */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Filter size={15} className="text-[#1A73E8]" />
                <span>Job Matching Filters (Pre-filled from candidate preferences)</span>
              </span>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 bg-blue-50 text-[#1A73E8] px-3 py-1 rounded-full border border-blue-200">
                  {matchingJobs.length} Matching Jobs
                </span>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-full border border-amber-200 cursor-pointer transition-colors"
                >
                  Clear Filters (View ALL Platform Jobs)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category Filter */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Service Category</label>
                <select
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1A73E8]"
                >
                  {masterCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Searchable & Scrollable Gated Society Filter */}
              <div className="space-y-1 relative">
                <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                  <span>Gated Society Filter</span>
                  {societyFilter && <span className="text-[9px] text-[#1A73E8] font-bold">Filtered ✓</span>}
                </label>
                <input
                  type="text"
                  value={societyFilter}
                  onFocus={() => setShowSocietyMenu(true)}
                  onChange={(e) => {
                    setSocietyFilter(e.target.value);
                    setShowSocietyMenu(true);
                  }}
                  placeholder="Search or select society..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8]"
                />

                {showSocietyMenu && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-up">
                    <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-[10px] font-bold text-slate-500">
                      <span>Select Society ({allSocieties.length} Total)</span>
                      <button type="button" onClick={() => setShowSocietyMenu(false)} className="text-slate-400 hover:text-slate-700">✕ Close</button>
                    </div>

                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSocietyFilter('');
                          setShowSocietyMenu(false);
                        }}
                        className="w-full p-2.5 text-left hover:bg-blue-50 font-bold text-[#1A73E8] transition-colors"
                      >
                        🌐 All Gated Societies
                      </button>

                      {allSocieties
                        .filter(s => (s.name || '').toLowerCase().includes(societyFilter.toLowerCase()) || (s.locality || '').toLowerCase().includes(societyFilter.toLowerCase()))
                        .slice(0, 50)
                        .map((soc, idx) => (
                          <button
                            key={soc.id || idx}
                            type="button"
                            onClick={() => {
                              setSocietyFilter(soc.name);
                              setShowSocietyMenu(false);
                            }}
                            className="w-full p-2.5 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div>
                              <span className="font-bold text-slate-800 group-hover:text-[#1A73E8] block">{soc.name}</span>
                              <span className="text-[10px] text-slate-400">{soc.locality || soc.city || 'Gated Society'}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#1A73E8]">Filter ➔</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Shift Filter */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Shift Slot</label>
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8]"
                >
                  <option value="All">All Shift Slots</option>
                  <option value="Full Day">Full Day (8–12 Hours)</option>
                  <option value="Part Time">Part Time (2–4 Hours)</option>
                  <option value="Live-In">Live-In (24 Hours)</option>
                  <option value="Morning Shift">Morning Shift (6 AM – 12 PM)</option>
                  <option value="Evening Shift">Evening Shift (4 PM – 9 PM)</option>
                </select>
              </div>

              {/* Min Salary Filter */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Min Salary (₹/mo)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={minSalaryFilter}
                  onChange={(e) => setMinSalaryFilter(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8]"
                />
              </div>
            </div>
          </div>

          {/* OPEN JOBS GRID WITH TARGETED APPLICATION SUBMISSION */}
          <div className="space-y-4">
            {matchingJobs.length === 0 ? (
              <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center space-y-3 shadow-2xs">
                <AlertCircle size={40} className="text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Open Jobs Match Current Filters</h4>
                <p className="text-xs text-slate-400 font-medium">Click "Clear Filters" above to explore all open employer jobs available across the platform.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="text-[9.5px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1A73E8] border border-blue-200">
                          {job.category || job.title || 'Domestic Help'}
                        </span>
                        <span className="text-xs font-black text-emerald-600">
                          ₹{job.salary_offered || job.salary_range_min || job.salary || 15000}/mo
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">
                        {job.employer_name || job.company_name || 'Household Employer'}
                      </h4>

                      <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
                        {job.description || 'Punctual, honest and reliable domestic service worker required.'}
                      </p>

                      <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-[#1A73E8]" />
                          <span>{job.society_name || job.primary_gated_society || 'Jaypee Greens'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setInspectingJob(job)}
                          className="text-[#1A73E8] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <FileText size={12} /> Inspect Specs 👁️
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={submittingJobId === job.id || appliedJobIds.includes(job.id)}
                      onClick={() => handleApplyForWorker(job)}
                      className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer mt-2 ${
                        appliedJobIds.includes(job.id)
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-[#1A73E8] hover:bg-blue-700 text-white'
                      }`}
                    >
                      {submittingJobId === job.id ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : appliedJobIds.includes(job.id) ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>✓ Application Submitted &amp; DLT SMS Dispatched</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Submit Application on Behalf of Worker</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 👁️ JOB DETAILS INSPECTION PORTAL MODAL */}
      {mounted && inspectingJob && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in" onClick={() => setInspectingJob(null)}>
          <div 
            className="w-full max-w-2xl max-h-[85vh] bg-white shadow-2xl rounded-3xl flex flex-col border border-slate-100 animate-scale-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#1A73E8] tracking-wider">Telephonic Job Specification Inspection</span>
                <h3 className="text-base font-black text-slate-900">{inspectingJob.title || inspectingJob.category || 'Job Requisition'}</h3>
              </div>
              <button
                onClick={() => setInspectingJob(null)}
                className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">
              {/* Employer Info + Direct Call Action */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-slate-900 block">{inspectingJob.employer_name || inspectingJob.company_name || 'Household Owner'}</span>
                    <p className="text-xs font-mono font-bold text-[#1A73E8]">
                      {formatPhone(inspectingJob.phone || inspectingJob.employer_phone)}
                    </p>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    ₹{inspectingJob.salary_offered || inspectingJob.salary_range_min || 15000}/mo
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-600 font-medium truncate max-w-[250px]">
                    📍 {inspectingJob.society_name || 'Jaypee Greens'}, {inspectingJob.locality || 'Noida'}
                  </p>
                  <a
                    href={`tel:${inspectingJob.phone || inspectingJob.employer_phone}`}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <PhoneCall size={12} /> Call Employer
                  </a>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-3 text-xs font-medium text-slate-700">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">📋 Job &amp; Household Requirements</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-100 space-y-1 shadow-xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">👨‍👩‍👧‍👦 Family Members</span>
                    <span className="font-bold text-slate-900">{inspectingJob.family_members || '4 Members (2 Adults, 2 Kids)'}</span>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-slate-100 space-y-1 shadow-xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">🏠 Residence Type</span>
                    <span className="font-bold text-slate-900">{inspectingJob.flat_type || '3BHK Apartment'}</span>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-slate-100 space-y-1 shadow-xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">🍳 Dietary Preference</span>
                    <span className="font-bold text-slate-900">{inspectingJob.dietary_pref || 'Pure Vegetarian Household'}</span>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-slate-100 space-y-1 shadow-xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">⏰ Shift Timings</span>
                    <span className="font-bold text-slate-900">{inspectingJob.shift_hours || inspectingJob.work_timing || 'Full Day (8:00 AM – 4:00 PM)'}</span>
                  </div>
                </div>

                <div className="space-y-1 border-t border-slate-100 pt-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">📝 Full Description</span>
                  <p className="p-3.5 bg-white rounded-2xl border border-slate-100 text-slate-800 leading-relaxed font-medium shadow-xs">
                    {inspectingJob.description || 'Looking for an experienced domestic service worker for daily duties.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 shrink-0 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setInspectingJob(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Modal
              </button>
              <button
                type="button"
                disabled={submittingJobId === inspectingJob.id || appliedJobIds.includes(inspectingJob.id)}
                onClick={() => {
                  handleApplyForWorker(inspectingJob);
                  setInspectingJob(null);
                }}
                className={`py-2.5 px-5 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  appliedJobIds.includes(inspectingJob.id)
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-[#1A73E8] hover:bg-blue-700 text-white'
                }`}
              >
                {submittingJobId === inspectingJob.id ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : appliedJobIds.includes(inspectingJob.id) ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>✓ Application Submitted &amp; DLT SMS Dispatched</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit Application on Behalf of Worker</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
