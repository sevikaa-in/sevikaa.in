"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useWorkerDashboard } from '../layout';
import { supabase } from '@/lib/supabaseClient';
import { 
  Briefcase, MapPin, IndianRupee, Clock, CheckCircle2, Globe, Building2, 
  Send, Lock, ShieldAlert, ShieldCheck, Search, LayoutList, LayoutGrid, 
  Filter, Sparkles, X, ChevronRight, UserCheck, PhoneCall, AlertCircle, ArrowUpRight, MessageSquare, Users, Home, Utensils, Award, Calendar, Eye, Check
} from 'lucide-react';

import { useLanguage } from '@/context/LanguageContext';
import { JobCard } from '@/components/worker/JobCard';

export default function WorkerJobsPage() {
  const { workerProfile, applications, availableJobs, showToast } = useWorkerDashboard();
  const { t } = useLanguage();

  // Verification Gate Check
  const isWorkerVerified = workerProfile.verified === true || workerProfile.status === 'live' || workerProfile.status === 'approved';

  // Multi-Tier Filter State
  const [skillFilterMode, setSkillFilterMode] = useState<'matching' | 'all'>('all');
  const [locationTier, setLocationTier] = useState<'my_workplaces' | 'primary' | 'secondary' | 'nearby' | 'within5km' | 'all'>('all');
  const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);
  const [isSocietyDropdownOpen, setIsSocietyDropdownOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedJobModal, setSelectedJobModal] = useState<any>(null);

  // Body scroll lock when detail modal is active
  useEffect(() => {
    if (selectedJobModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedJobModal]);

  const { societiesList } = useWorkerDashboard();
  const rawJobs = availableJobs;

  const jobsToDisplay = useMemo(() => {
    return rawJobs.map((job: any) => {
      let socName = job.society_name && job.society_name !== 'Residential Society' ? job.society_name : null;
      if (!socName && job.society_id && societiesList) {
        const found = societiesList.find((s: any) => s.id === job.society_id);
        if (found) socName = found.name;
      }
      return {
        ...job,
        society_name: socName || workerProfile?.society || 'Gated Society'
      };
    });
  }, [rawJobs, societiesList, workerProfile?.society]);

  // Multi-tier Filter Engine: Skill Scope + Location Hierarchy
  const filteredJobs = useMemo(() => {
    const workerSkillsList = (
      Array.isArray(workerProfile.skills) && workerProfile.skills.length > 0
        ? workerProfile.skills 
        : (Array.isArray(workerProfile.category) && workerProfile.category.length > 0
            ? workerProfile.category 
            : [workerProfile.category || 'maid'])
    ).map((s: any) => String(s).toLowerCase());

    const primarySoc = String(workerProfile.society || '').toLowerCase();
    const secondarySocs = (
      Array.isArray(workerProfile.secondary_societies) 
        ? workerProfile.secondary_societies 
        : [workerProfile.secondary_societies || '']
    ).map((s: any) => String(s).toLowerCase()).filter(Boolean);

    return jobsToDisplay.filter((job: any) => {
      const jobCategory = String(job.category || job.title || '').toLowerCase();
      
      const matchesSkill = skillFilterMode === 'all' || workerSkillsList.some((sk: string) => {
        const cleanSk = sk.toLowerCase();
        if (jobCategory.includes(cleanSk) || cleanSk.includes(jobCategory)) return true;
        if ((cleanSk.includes('maid') || cleanSk.includes('housekeeping')) && (jobCategory.includes('maid') || jobCategory.includes('housekeeping') || jobCategory.includes('clean'))) return true;
        if ((cleanSk.includes('cook') || cleanSk.includes('chef')) && (jobCategory.includes('cook') || jobCategory.includes('chef') || jobCategory.includes('kitchen'))) return true;
        if ((cleanSk.includes('nanny') || cleanSk.includes('childcare')) && (jobCategory.includes('nanny') || jobCategory.includes('child') || jobCategory.includes('baby'))) return true;
        return false;
      });
      
      const matchesCategory = categoryFilter === 'all' || String(job.category || '').toLowerCase() === categoryFilter.toLowerCase() || String(job.title || '').toLowerCase().includes(categoryFilter.toLowerCase());
      
      const matchesSearch = searchQuery === '' || 
        String(job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(job.society_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(job.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      const jobSoc = String(job.society_name || '').toLowerCase();

      let matchesLocation = true;
      if (locationTier === 'my_workplaces') {
        matchesLocation = primarySoc === '' || jobSoc.includes(primarySoc) || primarySoc.includes(jobSoc) || secondarySocs.some((sec: string) => jobSoc.includes(sec));
      } else if (locationTier === 'primary') {
        matchesLocation = primarySoc === '' || jobSoc.includes(primarySoc) || primarySoc.includes(jobSoc);
      } else if (locationTier === 'secondary') {
        matchesLocation = secondarySocs.length === 0 || secondarySocs.some((sec: string) => jobSoc.includes(sec));
      } else if (locationTier === 'nearby') {
        matchesLocation = primarySoc === '' || jobSoc.includes(primarySoc) || secondarySocs.some((sec: string) => jobSoc.includes(sec));
      } else if (locationTier === 'within5km' || locationTier === 'all') {
        matchesLocation = true;
      }

      return matchesSkill && matchesCategory && matchesSearch && matchesLocation;
    });
  }, [jobsToDisplay, skillFilterMode, locationTier, categoryFilter, searchQuery, workerProfile]);

  const finalDisplayJobs = filteredJobs.length > 0 ? filteredJobs : jobsToDisplay;

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
          .from('applications')
          .insert([{
            job_id: job.id,
            worker_id: workerProfile.phone || 'w_user',
            status: 'under_review',
            created_at: new Date().toISOString()
          }]);
      }

      setAppliedJobIds(prev => [...prev, job.id]);
      showToast(`Application submitted for "${job.title}"! Track status in Interviews.`, 'success');
      // No modal to close; navigating to full job page instead.
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
            {t('verifiedHouseholdOpenings')}
          </span>
        </div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Briefcase size={18} className="text-[#1A73E8]" />
          <span>{t('verifiedJobsDirectory')}</span>
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-relaxed">
          {t('verifiedJobsSub')}
        </p>
      </div>

      {/* 🔒 WORKER VERIFICATION REQUIRED BANNER */}
      {!isWorkerVerified && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border border-amber-300/80 p-4 rounded-3xl space-y-2 text-amber-900 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-600 shrink-0" />
              <h3 className="text-xs font-black text-amber-950">{t('aadhaarAuditPending')}</h3>
            </div>
            <span className="bg-amber-200 text-amber-900 text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full">
              🔒 {t('pendingAuditBadge')}
            </span>
          </div>

          <p className="text-xs font-semibold text-amber-800 leading-relaxed">
            {t('auditPendingSub')}
          </p>
        </div>
      )}

      {/* 🔍 SEARCH & 3-ROW STACKED FILTER TOOLBAR */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Row 1: Search Bar */}
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none shadow-xs transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Row 2: Custom Theme Skills Dropdown */}
        <div className="w-full relative">
          <button
            type="button"
            onClick={() => {
              setIsSkillsDropdownOpen(!isSkillsDropdownOpen);
              setIsSocietyDropdownOpen(false);
            }}
            className="w-full py-2.5 px-3.5 bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/80 rounded-2xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/30 shadow-xs cursor-pointer flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2 truncate">
              {skillFilterMode === 'matching' ? (
                <>
                  <Sparkles size={14} className="text-amber-500 shrink-0" />
                  <span>{t('matchingMySkillsBtn') || "Matching My Skills"}</span>
                </>
              ) : categoryFilter === 'all' ? (
                <>
                  <Globe size={14} className="text-[#1A73E8] shrink-0" />
                  <span>{t('allCategoriesBtn') || "All Categories & Roles"}</span>
                </>
              ) : (
                <span>
                  {categoryFilter === 'cook' && (t('cooksCategory') || "Cooks")}
                  {categoryFilter === 'maid' && (t('maidsCategory') || "Maids & Housekeeping")}
                  {categoryFilter === 'nanny' && (t('nanniesCategory') || "Nannies & Childcare")}
                  {categoryFilter === 'driver' && (t('driversCategory') || "Private Drivers")}
                  {categoryFilter === 'caregiver' && (t('caregiverCategory') || "Caregivers")}
                </span>
              )}
            </span>
            <ChevronRight size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isSkillsDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
          </button>

          {isSkillsDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsSkillsDropdownOpen(false)} />
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl rounded-2xl p-1.5 z-40 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                {[
                  { id: 'matching', label: t('matchingMySkillsBtn') || "Matching My Skills", isMatching: true },
                  { id: 'all', label: t('allCategoriesBtn') || "All Categories & Roles", isMatching: false },
                  { id: 'cook', label: t('cooksCategory') || "Cooks", isMatching: false },
                  { id: 'maid', label: t('maidsCategory') || "Maids & Housekeeping", isMatching: false },
                  { id: 'nanny', label: t('nanniesCategory') || "Nannies & Childcare", isMatching: false },
                ].map(opt => {
                  const isSelected = opt.isMatching 
                    ? skillFilterMode === 'matching' 
                    : (skillFilterMode === 'all' && categoryFilter === opt.id);

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (opt.isMatching) {
                          setSkillFilterMode('matching');
                          setCategoryFilter('all');
                        } else {
                          setSkillFilterMode('all');
                          setCategoryFilter(opt.id);
                        }
                        setIsSkillsDropdownOpen(false);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-50 text-[#1A73E8]' 
                          : 'text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {opt.id === 'matching' && <Sparkles size={14} className="text-amber-500 shrink-0" />}
                        {opt.id === 'all' && <Globe size={14} className="text-[#1A73E8] shrink-0" />}
                        <span>{opt.label}</span>
                      </span>
                      {isSelected && <Check size={14} className="text-[#1A73E8] shrink-0 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Row 3: Custom Theme Society Dropdown */}
        <div className="w-full relative">
          <button
            type="button"
            onClick={() => {
              setIsSocietyDropdownOpen(!isSocietyDropdownOpen);
              setIsSkillsDropdownOpen(false);
            }}
            className="w-full py-2.5 px-3.5 bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/80 rounded-2xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/30 shadow-xs cursor-pointer flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2 truncate">
              {locationTier === 'my_workplaces' && <Home size={14} className="text-[#1A73E8] shrink-0" />}
              {locationTier === 'primary' && <Home size={14} className="text-emerald-600 shrink-0" />}
              {locationTier === 'secondary' && <Building2 size={14} className="text-indigo-600 shrink-0" />}
              {locationTier === 'nearby' && <MapPin size={14} className="text-amber-600 shrink-0" />}
              {locationTier === 'within5km' && <MapPin size={14} className="text-purple-600 shrink-0" />}
              {locationTier === 'all' && <Globe size={14} className="text-slate-500 shrink-0" />}

              <span>
                {locationTier === 'my_workplaces' && (t('allMyWorkplacesBtn') || "All My Workplaces (Primary & Secondary)")}
                {locationTier === 'primary' && `${t('primarySocietyBtn') || "Primary Society Only"} (${workerProfile.society?.split(' ')[0] || 'My Society'})`}
                {locationTier === 'secondary' && (t('secondarySocietiesBtn') || "Secondary Societies Only")}
                {locationTier === 'nearby' && (t('nearby2kmBtn') || "Nearby Societies (< 2 km)")}
                {locationTier === 'within5km' && (t('within5kmBtn') || "Within 5 km Radius")}
                {locationTier === 'all' && (t('allCitiesBtn') || "All Societies & Cities")}
              </span>
            </span>
            <ChevronRight size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isSocietyDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
          </button>

          {isSocietyDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsSocietyDropdownOpen(false)} />
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl rounded-2xl p-1.5 z-40 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                {[
                  { id: 'my_workplaces', label: t('allMyWorkplacesBtn') || "All My Workplaces (Primary & Secondary)" },
                  { id: 'primary', label: `${t('primarySocietyBtn') || "Primary Society Only"} (${workerProfile.society?.split(' ')[0] || 'My Society'})` },
                  { id: 'secondary', label: t('secondarySocietiesBtn') || "Secondary Societies Only" },
                  { id: 'nearby', label: t('nearby2kmBtn') || "Nearby Societies (< 2 km)" },
                  { id: 'within5km', label: t('within5kmBtn') || "Within 5 km Radius" },
                  { id: 'all', label: t('allCitiesBtn') || "All Societies & Cities" },
                ].map(opt => {
                  const isSelected = locationTier === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setLocationTier(opt.id as any);
                        setIsSocietyDropdownOpen(false);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-[#1A73E8]/10 text-[#1A73E8]' 
                          : 'text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {opt.id === 'my_workplaces' && <Home size={14} className="text-[#1A73E8] shrink-0" />}
                        {opt.id === 'primary' && <Home size={14} className="text-emerald-600 shrink-0" />}
                        {opt.id === 'secondary' && <Building2 size={14} className="text-indigo-600 shrink-0" />}
                        {opt.id === 'nearby' && <MapPin size={14} className="text-amber-600 shrink-0" />}
                        {opt.id === 'within5km' && <MapPin size={14} className="text-purple-600 shrink-0" />}
                        {opt.id === 'all' && <Globe size={14} className="text-slate-500 shrink-0" />}
                        <span>{opt.label}</span>
                      </span>
                      {isSelected && <Check size={14} className="text-[#1A73E8] shrink-0 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 📄 LIST CARDS VIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>{t('verifiedHouseholdJobs')} ({finalDisplayJobs.length})</span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9.5px] font-black uppercase rounded-full border border-emerald-200">
              {t('freeApplicationBadge')}
            </span>
          </h3>
        </div>

        {finalDisplayJobs.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-3 shadow-xs">
            <Briefcase size={36} className="mx-auto text-slate-300" />
            <div>
              <h4 className="text-xs font-black text-slate-800">{t('noJobsMatching')}</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                {t('noJobsMatchingSub')}
              </p>
            </div>
            <button
              onClick={() => { setCategoryFilter('all'); setSearchQuery(''); setSkillFilterMode('all'); setLocationTier('all'); }}
              className="py-2 px-4 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer"
            >
              {t('resetFilters')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {finalDisplayJobs.map((job: any) => (
              <JobCard
                key={job.id}
                job={job}
                applications={applications}
                appliedJobIds={appliedJobIds}
                isWorkerVerified={isWorkerVerified}
                onApply={handleApply}
                isApplying={isApplying}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
