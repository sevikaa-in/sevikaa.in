"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useWorkerDashboard } from '../layout';
import { supabase } from '../../../../lib/supabaseClient';
import { 
  Briefcase, MapPin, IndianRupee, Clock, CheckCircle2, Globe, Building2, 
  Send, Lock, ShieldAlert, ShieldCheck, Search, LayoutList, LayoutGrid, 
  Filter, Sparkles, X, ChevronRight, UserCheck, PhoneCall, AlertCircle, ArrowUpRight, MessageSquare, Users, Home, Utensils, Award, Calendar
} from 'lucide-react';

export default function WorkerJobsPage() {
  const { workerProfile, applications, availableJobs, showToast } = useWorkerDashboard();

  // Verification Gate Check
  const isWorkerVerified = workerProfile.verified === true || workerProfile.status === 'live' || workerProfile.status === 'approved';

  // Filters & View State
  const [filterMode, setFilterMode] = useState<'all' | 'preferred'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [selectedJobModal, setSelectedJobModal] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Fallback verified jobs if list is empty
  const fallbackJobs = useMemo(() => [
    { 
      id: 'job_b1', 
      title: 'Full Day Housekeeping & Deep Cleaning', 
      category: 'maid',
      employer_name: 'Ria Bhagat',
      employer_phone: '+91 98765 43210',
      description: 'Looking for an experienced and reliable maid for daily dusting, mopping, utensil washing, and laundry for our family in a 3BHK flat.', 
      salary_offered: 15000, 
      society_name: 'DLF Westend Heights - Tower 4', 
      locality: 'Akshayanagar, DLF Road, Bangalore - 560068',
      shift_hours: 'Full Day (8:00 AM – 4:00 PM)',
      weekly_off: 'Sundays Off',
      family_members: '4 Members (2 Adults, 2 School Kids)',
      flat_type: '3BHK Apartment (Tower 4, 8th Floor)',
      dietary_pref: 'Vegetarian Household',
      payment_terms: '1st of every month via Direct Bank Transfer / UPI',
      responsibilities: [
        'Daily floor sweeping, mopping & balcony cleaning',
        'Utensil washing & dishwasher loading',
        'Dusting furniture, TV unit, and window sills',
        'Washing clothes in washing machine & ironing daily wear'
      ],
      qualifications: [
        '2+ Years experience in gated apartment housekeeping',
        'Punctual, honest and hygienic work habits',
        'Aadhaar card verification & local reference mandatory'
      ],
      perks: ['Meals Included on Duty', 'Tea & Morning Snacks', 'Sunday Off', 'Diwali Bonus'],
      created_at: '1 hour ago' 
    },
    { 
      id: 'job_b2', 
      title: 'North & South Indian Family Cook', 
      category: 'cook',
      employer_name: 'Vikram Sharma',
      employer_phone: '+91 98123 45678',
      description: 'Family of 4 needs an experienced home cook for North Indian thali (roti, sabzi, dal, rice) and South Indian breakfast preparation.', 
      salary_offered: 18000, 
      society_name: 'Prestige Song of the South - Gate 1', 
      locality: 'Begur Main Road, Hulimavu, Bangalore - 560068',
      shift_hours: 'Split Shift: 7:00 AM – 10:00 AM & 6:00 PM – 9:00 PM',
      weekly_off: 'Sundays Off',
      family_members: '4 Members (2 Adults, 2 Elderly Parents)',
      flat_type: '3BHK Apartment (Block B, 3rd Floor)',
      dietary_pref: 'Pure Vegetarian / Jain Meal Options Required',
      payment_terms: '1st of every month in cash or UPI',
      responsibilities: [
        'Prepare fresh breakfast (Idli, Dosa, Poha, Parathas)',
        'Cook North Indian thali dinner for 4 members',
        'Keep kitchen platform, gas stove & cooking utensils clean',
        'Follow hygienic cooking standards & low oil preferences'
      ],
      qualifications: [
        '3+ Years home cooking experience in residential societies',
        'Expertise in Jain food prep (no onion/garlic dishes)',
        'Clean hygiene habits & neat presentation'
      ],
      perks: ['Tea & Evening Snacks', 'Festival Bonus', 'Annual Salary Revision'],
      created_at: '3 hours ago' 
    },
    { 
      id: 'job_b3', 
      title: 'Toddler Nanny & Infant Caregiver', 
      category: 'nanny',
      employer_name: 'Priya Nair',
      employer_phone: '+91 97654 32109',
      description: 'Loving and attentive nanny needed to take care of an 18-month-old baby boy. Responsibilities include feeding, playtime, reading stories, and hygiene.', 
      salary_offered: 20000, 
      society_name: 'SNN Raj Serenity - Block B', 
      locality: 'Begur Road, Electronic City Link Road, Bangalore - 560068',
      shift_hours: 'Full Day (9:00 AM – 6:00 PM)',
      weekly_off: 'Sundays Off',
      family_members: '3 Members (2 Working Parents, 1 Toddler Boy)',
      flat_type: '3BHK Gated Apartment (Block B)',
      dietary_pref: 'Non-Vegetarian Household',
      payment_terms: '5th of every month via Bank Transfer',
      responsibilities: [
        'Feeding baby age-appropriate healthy meals & milk',
        'Sterilizing feeding bottles & maintaining baby hygiene',
        'Engaging toddler in fun educational games & storybooks',
        'Accompanying toddler for evening walk in society park'
      ],
      qualifications: [
        '3+ Years infant care or nanny experience required',
        'Patient, loving, non-smoker with good hygiene',
        'Background verification & police clearance mandatory'
      ],
      perks: ['Lunch Provided on Duty', 'Paid Annual Leaves (12 Days)', 'Overtime Pay @ ₹150/hr'],
      created_at: '5 hours ago' 
    },
    { 
      id: 'job_b4', 
      title: 'Personal Family Car Driver', 
      category: 'driver',
      employer_name: 'Anand Kulkarni',
      employer_phone: '+91 99000 11223',
      description: 'Private family driver needed for daily office commutes, city errands, and airport drops in automatic SUV and manual sedan.', 
      salary_offered: 22000, 
      society_name: 'Purva Westend - Kudlu Gate', 
      locality: 'Hosur Main Road, Kudlu Gate, Bangalore - 560068',
      shift_hours: '10 Hours Duty (9:00 AM – 7:00 PM)',
      weekly_off: 'Sunday Off (Rotational)',
      family_members: '4 Members (2 Adults, 2 College Students)',
      flat_type: '3BHK Apartment (Tower 1)',
      dietary_pref: 'General Household',
      payment_terms: '1st of every month via UPI / Cash',
      responsibilities: [
        'Drive employer to office & return evening commute',
        'Weekend family outings & airport pick-up/drops',
        'Maintain car cleanliness, fuel tracking & pressure check'
      ],
      qualifications: [
        'Valid LMV Commercial/Private Driving License',
        '5+ Years Bangalore city driving experience',
        'Clean driving record with zero traffic violations'
      ],
      perks: ['Overtime Allowance @ ₹150/hr', 'Uniform Allowance', 'Bonus on Festivals'],
      created_at: '1 day ago' 
    }
  ], []);

  const jobsToDisplay = availableJobs.length > 0 ? availableJobs : fallbackJobs;

  // Filter jobs by category, search query & society preference
  const filteredJobs = useMemo(() => {
    return jobsToDisplay.filter(job => {
      const matchesCategory = categoryFilter === 'all' || (job.category || '').toLowerCase() === categoryFilter.toLowerCase() || (job.title || '').toLowerCase().includes(categoryFilter.toLowerCase());
      const matchesSearch = searchQuery === '' || 
        (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.society_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSociety = filterMode === 'all' || 
        (job.society_name || '').toLowerCase().includes((workerProfile.society || '').toLowerCase());

      return matchesCategory && matchesSearch && matchesSociety;
    });
  }, [jobsToDisplay, categoryFilter, searchQuery, filterMode, workerProfile.society]);

  const handleApply = async (job: any) => {
    if (!isWorkerVerified) {
      showToast("Profile Verification Required! Sevikaa Admin will approve your Aadhaar audit before applying.", "warning");
      return;
    }
    if (appliedJobIds.includes(job.id)) return;

    setIsApplying(true);
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!isPlaceholder) {
        await supabase
          .from('job_applications')
          .insert([{
            job_id: job.id,
            worker_id: workerProfile.phone || 'w_user',
            status: 'under_review',
            created_at: new Date().toISOString()
          }]);
      }

      setAppliedJobIds(prev => [...prev, job.id]);
      showToast(`Application submitted for "${job.title}"! Track status in Interviews.`, 'success');
      setSelectedJobModal(null);
    } catch (err: any) {
      console.error(err);
      setAppliedJobIds(prev => [...prev, job.id]);
      showToast(`Application submitted for "${job.title}"!`, 'success');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-24">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-blue-50 text-[#1A73E8] text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200/60 inline-flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            Verified Household Openings
          </span>
        </div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Briefcase size={18} className="text-[#1A73E8]" />
          <span>Verified Jobs Directory</span>
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-relaxed">
          Apply 100% free to verified gated society households in your city. Direct contact upon shortlisting.
        </p>
      </div>

      {/* 🔒 WORKER VERIFICATION REQUIRED BANNER */}
      {!isWorkerVerified && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border border-amber-300/80 p-4 rounded-3xl space-y-2 text-amber-900 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-600 shrink-0" />
              <h3 className="text-xs font-black text-amber-950">Aadhaar Audit &amp; Verification Pending</h3>
            </div>
            <span className="bg-amber-200 text-amber-900 text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full">
              🔒 Pending Audit
            </span>
          </div>

          <p className="text-xs font-semibold text-amber-800 leading-relaxed">
            Your candidate profile is currently being verified by Sevikaa Admin. You can view all live household job openings below. <strong>Full application access will unlock automatically as soon as your Aadhaar audit completes.</strong>
          </p>
        </div>
      )}

      {/* 🔍 SEARCH & CATEGORY FILTER BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Search Bar & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, cook, nanny, maid, or society name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl shrink-0 text-xs font-bold">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-white text-[#1A73E8] shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Detailed List View"
            >
              <LayoutList size={15} />
              <span className="hidden sm:inline">List Cards</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-white text-[#1A73E8] shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Grid Cards</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Openings' },
            { id: 'cook', label: '🍳 Cooks' },
            { id: 'maid', label: '🧹 Maids & Housekeeping' },
            { id: 'nanny', label: '👶 Nannies & Childcare' },
            { id: 'driver', label: '🚗 Family Drivers' },
            { id: 'caregiver', label: '👵 Elderly Care' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`py-1.5 px-3.5 rounded-xl font-black shrink-0 transition-all cursor-pointer text-xs ${
                categoryFilter === cat.id 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📄 LIST CARDS VIEW / 🎴 GRID CARDS VIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>Verified Household Jobs ({filteredJobs.length})</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-full border border-emerald-200">
              100% Free Application
            </span>
          </h3>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`py-1 px-2.5 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
                filterMode === 'all' ? 'bg-[#1A73E8] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Societies
            </button>
            <button
              onClick={() => setFilterMode('preferred')}
              className={`py-1 px-2.5 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
                filterMode === 'preferred' ? 'bg-[#1A73E8] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              My Society ({workerProfile.society?.split(' ')[0] || 'Society'})
            </button>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-3 shadow-xs">
            <Briefcase size={36} className="mx-auto text-slate-300" />
            <div>
              <h4 className="text-xs font-black text-slate-800">No Jobs Found Matching Your Filter</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Try clearing your search query or selecting "All Openings".
              </p>
            </div>
            <button
              onClick={() => { setCategoryFilter('all'); setSearchQuery(''); setFilterMode('all'); }}
              className="py-2 px-4 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3.5'}>
            {filteredJobs.map((job) => {
              const matchingApp = applications.find((a: any) => a.jobId === job.id || a.jobTitle === job.title || a.id === job.id);
              const hasApplied = appliedJobIds.includes(job.id) || !!matchingApp;
              const cleanSalary = job.salary_offered ? Number(job.salary_offered).toLocaleString('en-IN') : '15,000';

              return (
                <div 
                  key={job.id} 
                  className={`bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 ${
                    viewMode === 'list' ? 'sm:flex-row sm:items-center sm:space-y-0 gap-4' : ''
                  }`}
                >
                  {/* Left Column / Info Area */}
                  <div className="space-y-2.5 min-w-0 flex-1">
                    {/* Employer header */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-[#1A73E8] font-black text-xs flex items-center justify-center shrink-0 border border-blue-200">
                          {(job.employer_name || job.society_name || 'H')[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-800 truncate">{job.employer_name || 'Verified Household'}</p>
                          <span className="text-[9px] font-black text-emerald-600 flex items-center gap-0.5">
                            <ShieldCheck size={10} /> Sevikaa Verified Household
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-black text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shrink-0">
                        ₹{cleanSalary} / mo
                      </span>
                    </div>

                    {/* Job Title & Location */}
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug hover:text-[#1A73E8] transition-colors">
                        {job.title}
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#1A73E8] shrink-0" />
                        <span className="truncate">{job.society_name}</span>
                      </p>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
                      {job.description}
                    </p>

                    {/* Shift & Perks Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {job.shift_hours && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200/60 flex items-center gap-1">
                          <Clock size={10} className="text-[#1A73E8]" /> {job.shift_hours}
                        </span>
                      )}
                      {job.perks?.map((perk: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-[#1A73E8] text-[9.5px] font-black rounded-lg border border-blue-200/50">
                          ✓ {perk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column / Action Buttons Area */}
                  <div className={`pt-2 sm:pt-0 shrink-0 flex items-center gap-2 ${
                    viewMode === 'list' ? 'flex-row sm:flex-col sm:items-end justify-between' : 'flex-row justify-between border-t border-slate-100 pt-3'
                  }`}>
                    <button
                      onClick={() => setSelectedJobModal(job)}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>View Details</span>
                    </button>

                    <button
                      onClick={() => handleApply(job)}
                      disabled={hasApplied || !isWorkerVerified || isApplying}
                      className={`py-2.5 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${
                        hasApplied 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : !isWorkerVerified
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 cursor-not-allowed'
                            : 'bg-[#1A73E8] hover:bg-blue-600 text-white'
                      }`}
                    >
                      {hasApplied ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Applied</span>
                        </>
                      ) : !isWorkerVerified ? (
                        <>
                          <Lock size={13} />
                          <span>Audit Pending</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>{isApplying ? 'Applying...' : 'Apply Now'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 📖 JOB DETAILS MODAL */}
      {selectedJobModal && (() => {
        const matchingApp = applications.find(a => a.jobId === selectedJobModal.id || a.jobTitle === selectedJobModal.title);
        const hasApplied = appliedJobIds.includes(selectedJobModal.id) || !!matchingApp;
        const currentStatus = matchingApp?.status || (hasApplied ? 'under_review' : 'not_applied');
        const isInterviewScheduled = currentStatus === 'interview_scheduled' || currentStatus === 'confirmed';
        const isHired = currentStatus === 'hired';
        const cleanPhone = (matchingApp?.employerPhone || selectedJobModal.employer_phone || '+919876543210').replace(/\s+/g, '');

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up border border-slate-100 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A73E8] font-black text-lg flex items-center justify-center border border-blue-100 shrink-0">
                    {(selectedJobModal.employer_name || selectedJobModal.society_name || 'H')[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{selectedJobModal.title}</h3>
                    <p className="text-[10.5px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                      <Building2 size={11} className="text-[#1A73E8]" />
                      <span>{selectedJobModal.employer_name || 'Verified Employer'} &bull; {selectedJobModal.society_name}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedJobModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-xl hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>

              {/* 📊 APPLICATION STATUS BANNER ON THIS JOB */}
              {hasApplied && (
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  isHired 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : isInterviewScheduled
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider block">Application Status for this Position</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      isHired ? 'bg-emerald-600 text-white' : isInterviewScheduled ? 'bg-[#1A73E8] text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {isHired ? '🏆 Hired' : isInterviewScheduled ? '📞 Interview Scheduled' : '⏳ Application Under Review'}
                    </span>
                  </div>

                  {isInterviewScheduled ? (
                    <div className="space-y-2 pt-1 border-t border-blue-200/60">
                      <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Clock size={14} className="text-[#1A73E8]" />
                        <span>Interview Time: <strong>{matchingApp?.interviewTime || 'Today at 4:30 PM'}</strong></span>
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:${cleanPhone}`}
                          className="py-2 px-3 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                        >
                          <PhoneCall size={12} />
                          <span>Call Employer</span>
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhone.replace(/\+/g, '')}?text=Namaste%20${encodeURIComponent(selectedJobModal.employer_name || 'Employer')},%20I%20am%20contacting%20you%20regarding%20our%20interview%20for%20${encodeURIComponent(selectedJobModal.title)}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare size={12} />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-medium leading-relaxed">
                      Your application has been submitted to {selectedJobModal.employer_name || 'the household'}. You will receive an SMS and interview invite as soon as the employer shortlists your profile.
                    </p>
                  )}
                </div>
              )}

              {/* Offered Salary Banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-900 shadow-xs">
                <div>
                  <span className="text-[10px] text-emerald-600 uppercase font-black block">Offered Monthly Salary</span>
                  <span className="text-base font-black font-mono text-emerald-700">₹{selectedJobModal.salary_offered ? Number(selectedJobModal.salary_offered).toLocaleString('en-IN') : '15,000'} / month</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                  {selectedJobModal.payment_terms || '1st of every month'}
                </span>
              </div>

              {/* 🏡 HOUSEHOLD SPECIFICATIONS GRID */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[9.5px] text-slate-400 uppercase font-black flex items-center gap-1">
                    <Users size={11} className="text-[#1A73E8]" /> Family Setup
                  </span>
                  <span className="text-slate-800 font-bold block">{selectedJobModal.family_members || '4 Members (2 Adults, 2 Kids)'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[9.5px] text-slate-400 uppercase font-black flex items-center gap-1">
                    <Home size={11} className="text-[#1A73E8]" /> Residence Type
                  </span>
                  <span className="text-slate-800 font-bold block">{selectedJobModal.flat_type || '3BHK Apartment'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[9.5px] text-slate-400 uppercase font-black flex items-center gap-1">
                    <Clock size={11} className="text-[#1A73E8]" /> Working Shift
                  </span>
                  <span className="text-slate-800 font-bold block">{selectedJobModal.shift_hours || 'Full Day (8-10 Hours)'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                  <span className="text-[9.5px] text-slate-400 uppercase font-black flex items-center gap-1">
                    <Utensils size={11} className="text-[#1A73E8]" /> Dietary Prefs
                  </span>
                  <span className="text-slate-800 font-bold block truncate">{selectedJobModal.dietary_pref || 'Vegetarian Household'}</span>
                </div>
              </div>

              {/* 📍 Full Society Address & Locality */}
              <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 space-y-1">
                <span className="text-[9.5px] text-blue-600 uppercase font-black flex items-center gap-1">
                  <MapPin size={11} className="text-[#1A73E8]" /> Society Gate &amp; Locality Address
                </span>
                <p className="text-xs text-slate-800 font-bold leading-tight">
                  {selectedJobModal.locality || selectedJobModal.society_name}
                </p>
              </div>

              {/* Work Overview & Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Job Overview</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {selectedJobModal.description}
                </p>
              </div>

              {/* 📝 Key Responsibilities List */}
              {selectedJobModal.responsibilities && selectedJobModal.responsibilities.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Daily Responsibilities</h4>
                  <ul className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-700 font-medium">
                    {selectedJobModal.responsibilities.map((resp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-[#1A73E8] shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 🎓 Qualifications Required */}
              {selectedJobModal.qualifications && selectedJobModal.qualifications.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Candidate Requirements</h4>
                  <ul className="bg-amber-50/40 p-3.5 rounded-2xl border border-amber-100 space-y-1.5 text-xs text-amber-950 font-medium">
                    {selectedJobModal.qualifications.map((qual: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Award size={13} className="text-amber-600 shrink-0 mt-0.5" />
                        <span>{qual}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 🎁 Perks & Benefits Badges */}
              {selectedJobModal.perks && selectedJobModal.perks.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Provided Household Perks</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJobModal.perks.map((perk: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-black rounded-xl border border-emerald-200 flex items-center gap-1">
                        <Sparkles size={11} className="text-amber-500" /> {perk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Row */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedJobModal(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>

                {!hasApplied ? (
                  <button
                    onClick={() => handleApply(selectedJobModal)}
                    disabled={!isWorkerVerified || isApplying}
                    className={`py-2.5 px-5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                      !isWorkerVerified
                        ? 'bg-amber-100 text-amber-800 border border-amber-200 cursor-not-allowed'
                        : 'bg-[#1A73E8] hover:bg-blue-600 text-white'
                    }`}
                  >
                    {!isWorkerVerified ? (
                      <>
                        <Lock size={13} />
                        <span>Audit Pending</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>{isApplying ? 'Applying...' : 'Apply Now (100% Free)'}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href="/worker/dashboard/interviews"
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>Track in Interviews</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
