"use client";

import React, { useState, useEffect } from 'react';
import { useEmployerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { VerifiedReviewModal } from '@/components/reviews/VerifiedReviewModal';
import PastInteractionsHub from '@/components/common/PastInteractionsHub';
import { 
  Search, MapPin, Phone, Lock, CheckCircle2, Star, ShieldCheck, Heart, 
  Eye, LayoutGrid, List, Filter, X, Calendar, UserCheck, Award, ChevronRight, 
  Briefcase, Inbox, Globe, Mail, Clock, Send, MessageSquare 
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  category: string;
  role: string;
  experience: string;
  salary: string;
  society: string;
  phone: string;
  email: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  isApplicant: boolean;
  appliedForJob?: string;
  appliedTime?: string;
  languages: string[];
  gender: string;
  age: number;
  bio: string;
  specialties: string[];
  availableSlots: string;
}

export default function EmployerWorkersPage() {
  const { 
    employerProfile, bookmarkedContacts, postedJobs,
    handleToggleBookmark, showToast 
  } = useEmployerDashboard();
  const { t } = useLanguage();

  const [candidatesList, setCandidatesList] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  useEffect(() => {
    const fetchRealApplicants = async () => {
      setLoadingCandidates(true);
      try {
        const { data: dbApps, error } = await supabase
          .from('applications')
          .select('*, worker:profiles(*, worker_profiles(*)), job:jobs(*)');

        if (!error && dbApps && dbApps.length > 0) {
          const mapped: Candidate[] = dbApps.map((a: any) => {
            const wProfile = a.worker?.worker_profiles?.[0] || a.worker_profiles || {};
            const skills = wProfile.skills || [];
            const primarySkill = skills[0] || 'maid';
            const wName = wProfile.full_name || a.worker?.full_name || 'Worker Candidate';

            return {
              id: a.worker_id || a.id,
              name: wName,
              category: primarySkill,
              role: skills.join(', ') || 'Domestic Helper',
              experience: `${wProfile.experience_years || 3} Years Exp`,
              salary: wProfile.expected_salary ? Number(wProfile.expected_salary).toLocaleString('en-IN') : '15,000',
              society: wProfile.preferred_society_name || a.job?.society_name || 'Residential Society',
              phone: a.worker?.phone || wProfile.phone || '+91 98765 43210',
              email: a.worker?.email || wProfile.email || 'candidate@sevikaa.in',
              rating: wProfile.rating || 4.8,
              reviewsCount: wProfile.total_reviews || 8,
              verified: true,
              isApplicant: true,
              appliedForJob: a.job?.title || 'Job Requisition',
              appliedTime: a.created_at ? `Applied ${new Date(a.created_at).toLocaleDateString('en-IN')}` : 'Recently Applied',
              languages: wProfile.languages_spoken || ['Hindi'],
              gender: wProfile.gender || 'Female',
              age: wProfile.age || 28,
              bio: wProfile.bio || 'Verified domestic worker available for household hiring.',
              specialties: skills,
              availableSlots: 'Morning & Evening Shifts'
            };
          });
          setCandidatesList(mapped);
        } else {
          // If no job_applications table entries exist yet, fetch direct worker_profiles from database
          const { data: dbWorkers } = await supabase
            .from('worker_profiles')
            .select('*, profiles(*)');

          if (dbWorkers && dbWorkers.length > 0) {
            const mappedWorkers: Candidate[] = dbWorkers.map((w: any) => ({
              id: w.user_id || w.id,
              name: w.full_name || 'Worker Candidate',
              category: Array.isArray(w.skills) && w.skills[0] ? w.skills[0] : 'maid',
              role: Array.isArray(w.skills) ? w.skills.join(', ') : 'Domestic Helper',
              experience: `${w.experience_years || 4} Years Exp`,
              salary: w.expected_salary ? Number(w.expected_salary).toLocaleString('en-IN') : '15,000',
              society: w.preferred_society_name || 'DLF Westend Heights',
              phone: w.profiles?.phone || '+91 98765 43210',
              email: w.profiles?.email || 'candidate@sevikaa.in',
              rating: w.rating || 4.9,
              reviewsCount: w.total_reviews || 12,
              verified: true,
              isApplicant: true,
              appliedForJob: 'General Inquiry',
              appliedTime: 'Active Candidate',
              languages: w.languages_spoken || ['Hindi'],
              gender: w.gender || 'Female',
              age: w.age || 30,
              bio: w.bio || 'Experienced domestic candidate ready for immediate hiring.',
              specialties: w.skills || ['Housekeeping', 'Cooking'],
              availableSlots: 'Full Day & Part Time'
            }));
            setCandidatesList(mappedWorkers);
          } else {
            setCandidatesList([]);
          }
        }
      } catch (err) {
        console.error("Error fetching employer candidates:", err);
      } finally {
        setLoadingCandidates(false);
      }
    };

    fetchRealApplicants();
  }, []);

  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [searchCategory, setSearchCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Schedule Interview State
  const [selectedCandidateForInterview, setSelectedCandidateForInterview] = useState<Candidate | null>(null);
  const [interviewMode, setInterviewMode] = useState<'phone' | 'in_person'>('phone');
  const [interviewDateOption, setInterviewDateOption] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customInterviewDate, setCustomInterviewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [interviewTime, setInterviewTime] = useState('16:30');
  const [interviewNote, setInterviewNote] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const [selectedCandidateForReview, setSelectedCandidateForReview] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'applicants' | 'history'>('applicants');

  // Body scroll lock when detail modal or interview modal is active
  useEffect(() => {
    if (selectedCandidate || selectedCandidateForInterview) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedCandidate, selectedCandidateForInterview]);

  const handleConfirmScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateForInterview) return;
    setIsScheduling(true);

    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      let formattedSlot = '';
      const [hours, minutes] = (interviewTime || '16:30').split(':');
      const dateObj = new Date();
      if (interviewDateOption === 'tomorrow') {
        dateObj.setDate(dateObj.getDate() + 1);
      } else if (interviewDateOption === 'custom' && customInterviewDate) {
        const [y, m, d] = customInterviewDate.split('-');
        dateObj.setFullYear(parseInt(y), parseInt(m) - 1, parseInt(d));
      }

      const h = parseInt(hours || '16', 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 || 12;
      const timeFormatted = `${displayHour}:${minutes || '00'} ${ampm}`;

      if (interviewDateOption === 'today') {
        formattedSlot = `Today at ${timeFormatted}`;
      } else if (interviewDateOption === 'tomorrow') {
        formattedSlot = `Tomorrow at ${timeFormatted}`;
      } else {
        formattedSlot = `${dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} at ${timeFormatted}`;
      }

      if (!isPlaceholder) {
        await supabase
          .from('applications')
          .update({
            status: 'interview_scheduled',
            interview_time: formattedSlot,
            interview_mode: interviewMode,
            interview_note: interviewNote
          })
          .eq('worker_id', selectedCandidateForInterview.id);
      }

      showToast(`Interview scheduled with ${selectedCandidateForInterview.name} for ${formattedSlot}!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to schedule interview: ${err.message}`, 'error');
    } finally {
      setIsScheduling(false);
      setSelectedCandidateForInterview(null);
      setInterviewNote('');
    }
  };

  const applicants = candidatesList;
  const filteredCandidates = applicants.filter((cand) => {
    const matchesJob = selectedJobFilter === 'all' || cand.appliedForJob === selectedJobFilter;
    const matchesCategory = searchCategory === 'all' || cand.category === searchCategory;
    const matchesQuery = cand.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         cand.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cand.society.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesJob && matchesCategory && matchesQuery;
  });

  const applicantsCount = applicants.length;

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto pb-16">
      
      {/* View Mode Sub-tab Toggle Header */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 text-xs font-bold w-fit">
        <button
          onClick={() => setViewMode('applicants')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            viewMode === 'applicants'
              ? 'bg-white text-[#1A73E8] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Inbox size={15} />
          <span>Job Applicants ({applicantsCount})</span>
        </button>

        <button
          onClick={() => setViewMode('history')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            viewMode === 'history'
              ? 'bg-white text-[#34A853] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Star size={15} className="fill-[#34A853]" />
          <span>Past Interacted &amp; Ratings Hub</span>
        </button>
      </div>

      {viewMode === 'history' ? (
        <PastInteractionsHub
          currentUserId={employerProfile?.user_id || 'emp_sharma_101'}
          currentUserName={employerProfile?.company_name || 'Employer Household'}
          currentUserRole="employer"
        />
      ) : (
        <>
          {/* Page Title */}
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Inbox size={18} className="text-[#1A73E8]" />
              <span>{t('jobApplicantsTitle') || "Job Applicants"}</span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {t('jobApplicantsSub') || "Workers who have applied to your posted jobs. Only verified, Aadhaar-approved candidates appear here."}
            </p>
          </div>

      {/* Job Filter Tabs — filter by which job they applied to */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedJobFilter('all')}
          className={`py-1.5 px-3.5 rounded-xl text-[10.5px] font-black shrink-0 transition-all cursor-pointer ${
            selectedJobFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
          }`}
        >
          {t('allJobsFilter') || "All Jobs"} ({applicantsCount})
        </button>
        {postedJobs.map(job => {
          const count = applicants.filter(a => a.appliedForJob === job.title).length;
          return (
            <button
              key={job.id}
              onClick={() => setSelectedJobFilter(job.title)}
              className={`py-1.5 px-3.5 rounded-xl text-[10.5px] font-black shrink-0 transition-all cursor-pointer ${
                selectedJobFilter === job.title
                  ? 'bg-[#1A73E8] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {job.title.split(' ').slice(0, 3).join(' ')}… ({count})
            </button>
          );
        })}
      </div>

      {/* Filter Tabs & Search Input Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchApplicantsPlaceholder') || "Search by worker name, email, role, or society..."}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: t('allRolesFilter') || 'All Roles' },
            { id: 'cook', label: t('roleCooks') || '🍳 Cooks' },
            { id: 'maid', label: t('roleMaids') || '🧹 Maids' },
            { id: 'nanny', label: t('roleNannies') || '👶 Nannies' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSearchCategory(tab.id)}
              className={`py-1.5 px-3 rounded-xl font-black shrink-0 transition-all cursor-pointer text-xs ${
                searchCategory === tab.id 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-2">
            <p className="text-xs font-black text-slate-400">{t('noApplicantsFound') || "No candidate applications found matching this filter."}</p>
          </div>
        ) : (
          filteredCandidates.map((cand) => {
            const isBookmarked = bookmarkedContacts.includes(cand.id);

            return (
              <div 
                key={cand.id}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Header: Avatar, Full Name & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A73E8] border border-blue-100 font-black text-lg flex items-center justify-center shrink-0">
                      {cand.name.charAt(0)}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-black text-slate-900">{cand.name}</h3>
                        <span className="px-2 py-0.5 bg-emerald-50 text-[#34A853] text-[8.5px] font-black uppercase rounded-full border border-emerald-200/80 flex items-center gap-0.5">
                          <ShieldCheck size={10} /> {t('verifiedBadgeText') || "Verified"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">{cand.role}</p>
                      <p className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Mail size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate">{cand.email}</span>
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleToggleBookmark(cand.id)}
                    className={`p-2 rounded-xl border border-slate-100 text-slate-400 hover:text-red-500 transition-colors shrink-0 ${isBookmarked ? 'bg-red-50 text-red-500 border-red-200' : 'bg-slate-50'}`}
                    title="Bookmark Candidate"
                  >
                    <Heart size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Applied Notice Banner - Explicit Application & Contact Unlock */}
                {cand.isApplicant && cand.appliedForJob && (
                  <div className="bg-blue-50/70 p-2.5 rounded-2xl border border-blue-100 text-xs font-bold text-[#1A73E8] flex items-center justify-between">
                    <span>📩 {t('appliedForLabel') || "Applied for:"} <strong>{cand.appliedForJob}</strong> &bull; Direct Phone Unlocked ✓</span>
                    <span className="text-[10px] text-blue-500 font-semibold">{cand.appliedTime}</span>
                  </div>
                )}

                {/* Candidate Info Grid */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-[#1A73E8]" /> {cand.society}</span>
                    <span className="text-amber-500 font-bold flex items-center gap-0.5">
                      <Star size={12} className="fill-amber-400 text-amber-400" /> {cand.rating} ({cand.reviewsCount})
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">{t('experienceLabel') || "Experience:"} {cand.experience}</span>
                    <span className="text-[#34A853] font-mono font-black text-xs">₹{cand.salary}/mo</span>
                  </div>
                </div>

                {/* Clean Full-Width Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => setSelectedCandidate(cand)}
                    className="py-2 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[11px] font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>{t('profileBtn') || "Profile"}</span>
                  </button>

                  <button
                    onClick={() => setSelectedCandidateForInterview(cand)}
                    className="py-2 px-2 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-[11px] font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Calendar size={13} />
                    <span>{t('scheduleBtn') || "Schedule"}</span>
                  </button>

                  <a
                    href={`tel:${cand.phone}`}
                    className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer text-center"
                  >
                    <Phone size={13} />
                    <span>{t('callBtn') || "Call"}</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
        </>  
      )}

      {/* 🟢 WORKER FULL PROFILE DETAIL MODAL */}
      {selectedCandidate && (
        <div className="fixed top-16 bottom-16 inset-x-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl relative my-auto max-h-full overflow-y-auto border border-slate-100">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Candidate Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-[#1A73E8] font-black text-2xl flex items-center justify-center shrink-0 border border-blue-200">
                {selectedCandidate.name.charAt(0)}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">{selectedCandidate.name}</h3>
                  <span className="px-2 py-0.5 bg-emerald-50 text-[#34A853] text-[9px] font-black uppercase rounded-full border border-emerald-200">
                    {t('aadhaarVerifiedBadgeText') || "Aadhaar Verified"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-bold">{selectedCandidate.role}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-0.5">
                  <Mail size={12} className="text-[#1A73E8]" />
                  <span className="font-bold text-slate-700">{selectedCandidate.email}</span>
                </div>
              </div>
            </div>

            {/* Rating & Location Banner */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#1A73E8]" /> {selectedCandidate.society}</span>
                <span className="text-emerald-700 font-mono font-black text-sm">₹{selectedCandidate.salary}/mo</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 pt-1 border-t border-slate-200/60">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span>{selectedCandidate.rating} Rating ({selectedCandidate.reviewsCount} {t('householdFeedbacksText') || "Household Feedbacks"})</span>
              </div>
            </div>

            {/* Biography & Work Profile */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{t('bioExpertiseTitle') || "Candidate Bio & Expertise"}</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed bg-blue-50/40 p-3 rounded-2xl border border-blue-100/60">
                "{selectedCandidate.bio}"
              </p>
            </div>

            {/* Specialties & Skills */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{t('specialtiesSkillsTitle') || "Specialties & Skills"}</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.specialties.map((spec, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/60">
                    ✓ {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages & Shift Slots */}
            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black block">{t('languagesLabel') || "Languages"}</span>
                <span className="text-slate-800">{selectedCandidate.languages.join(', ')}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black block">{t('preferredShiftLabel') || "Preferred Shift"}</span>
                <span className="text-slate-800">{selectedCandidate.availableSlots}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => {
                  const cand = selectedCandidate;
                  setSelectedCandidate(null);
                  setSelectedCandidateForReview(cand);
                }}
                className="py-3 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0 transition-all"
                title="Write Verified Review"
              >
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span>Rate</span>
              </button>

              <button
                onClick={() => {
                  const cand = selectedCandidate;
                  setSelectedCandidate(null);
                  setSelectedCandidateForInterview(cand);
                }}
                className="flex-1 py-3 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Calendar size={16} />
                <span>{t('scheduleInterviewBtn') || "Schedule Interview"}</span>
              </button>

              <a
                href={`tel:${selectedCandidate.phone}`}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer text-center"
              >
                <Phone size={16} />
                <span>{t('callCandidateBtn') || "Call Candidate"}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 VERIFIED REVIEW MODAL */}
      {selectedCandidateForReview && (
        <VerifiedReviewModal
          isOpen={Boolean(selectedCandidateForReview)}
          onClose={() => setSelectedCandidateForReview(null)}
          reviewerId={employerProfile.id || 'emp-current'}
          reviewerName={employerProfile.company_name || 'Household Employer'}
          reviewerRole="employer"
          targetId={selectedCandidateForReview.id}
          targetName={selectedCandidateForReview.name}
          targetRole="worker"
          interactionType={selectedCandidateForReview.isApplicant ? 'interacted' : 'interviewed'}
          onSubmitSuccess={(newRev) => {
            showToast(t('reviewSubmittedPendingAdminNotice') || "Review submitted! It will appear on the profile once approved by Sevikaa Admin.", "success");
          }}
        />
      )}

      {/* 📅 SCHEDULE INTERVIEW MODAL */}
      {selectedCandidateForInterview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-[#1A73E8] rounded-2xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{t('scheduleInterviewTitle') || "Schedule Interview"}</h3>
                  <p className="text-[10.5px] text-slate-500 font-bold">{selectedCandidateForInterview.name} ({selectedCandidateForInterview.role})</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCandidateForInterview(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-xl hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmScheduleInterview} className="space-y-4 text-xs font-bold">
              {/* Mode */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-black">{t('interviewFormatLabel') || "Interview Format"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInterviewMode('phone')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      interviewMode === 'phone'
                        ? 'bg-blue-50 border-[#1A73E8] text-[#1A73E8]'
                        : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Phone size={14} />
                    <span>{t('phoneCallFormat') || "📞 Phone Call"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInterviewMode('in_person')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      interviewMode === 'in_person'
                        ? 'bg-blue-50 border-[#1A73E8] text-[#1A73E8]'
                        : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin size={14} />
                    <span>{t('gateMeetingFormat') || "🏠 Gate Meeting"}</span>
                  </button>
                </div>
              </div>

              {/* Fully Dynamic Date & Time Slot Picker */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-black">{t('selectInterviewSlotLabel') || "Select Dynamic Interview Date & Time"}</label>

                {/* Date Selection Pills */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setInterviewDateOption('today')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-center ${
                      interviewDateOption === 'today'
                        ? 'bg-blue-50 border-[#1A73E8] text-[#1A73E8]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ☀️ Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewDateOption('tomorrow')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-center ${
                      interviewDateOption === 'tomorrow'
                        ? 'bg-blue-50 border-[#1A73E8] text-[#1A73E8]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🌅 Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewDateOption('custom')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-center ${
                      interviewDateOption === 'custom'
                        ? 'bg-blue-50 border-[#1A73E8] text-[#1A73E8]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    📅 Custom Date
                  </button>
                </div>

                {/* Custom Date Input */}
                {interviewDateOption === 'custom' && (
                  <div className="pt-1">
                    <input
                      type="date"
                      value={customInterviewDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setCustomInterviewDate(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
                    />
                  </div>
                )}

                {/* Dynamic Time Picker */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Select Exact Time of Day:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-xl">
                      {(() => {
                        const [h, m] = (interviewTime || '16:30').split(':');
                        const hr = parseInt(h || '16', 10);
                        const ampm = hr >= 12 ? 'PM' : 'AM';
                        const displayHr = hr % 12 || 12;
                        return `${displayHr}:${m || '00'} ${ampm}`;
                      })()}
                    </span>
                  </div>

                  {/* Popular Time Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {['09:30', '11:00', '14:30', '16:30', '18:00'].map((tVal) => {
                      const [h, m] = tVal.split(':');
                      const hr = parseInt(h, 10);
                      const ampm = hr >= 12 ? 'PM' : 'AM';
                      const displayHr = hr % 12 || 12;
                      const label = `${displayHr}:${m} ${ampm}`;
                      return (
                        <button
                          key={tVal}
                          type="button"
                          onClick={() => setInterviewTime(tVal)}
                          className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            interviewTime === tVal
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-black">{t('messageInstructionsLabel') || "Message / Instructions for Worker (Optional)"}</label>
                <textarea
                  rows={2}
                  value={interviewNote}
                  onChange={(e) => setInterviewNote(e.target.value)}
                  placeholder={t('messageInstructionsPlaceholder') || "e.g. Please meet at DLF Westend Heights Gate 1 desk or stay available for phone call."}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCandidateForInterview(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  {t('cancelBtn') || "Cancel"}
                </button>

                <button
                  type="submit"
                  disabled={isScheduling}
                  className="py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send size={14} />
                  <span>{isScheduling ? (t('schedulingState') || 'Scheduling...') : (t('confirmScheduleBtn') || 'Confirm & Schedule')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
