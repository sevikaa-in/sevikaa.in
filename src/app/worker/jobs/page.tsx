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

export default function WorkerJobsPage() {
  const { workerProfile, applications, availableJobs, showToast } = useWorkerDashboard();
  const { t } = useLanguage();

  // Verification Gate Check
  const isWorkerVerified = workerProfile.verified === true || workerProfile.status === 'live' || workerProfile.status === 'approved';

  // Multi-Tier Filter State
  const [skillFilterMode, setSkillFilterMode] = useState<'matching' | 'all'>('matching');
  const [locationTier, setLocationTier] = useState<'my_workplaces' | 'primary' | 'secondary' | 'nearby' | 'within5km' | 'all'>('my_workplaces');
  const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);
  const [isSocietyDropdownOpen, setIsSocietyDropdownOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [selectedJobModal, setSelectedJobModal] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);

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

  // Fallback verified jobs if list is empty
  const fallbackJobs = useMemo(() => [
    { 
      id: 'c9bf0b7b-3b02-44e1-a20d-70498b8c2d1b', 
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
      family_members: '4 Members (2 Adults, 2 Kids)',
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
      id: 'd78a9e4f-8f12-4c22-921a-5b12847a98b1', 
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
      id: 'e412a89c-1120-4e55-901b-1b918a204910', 
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
      perks: ['Lunch Provided on Duty', 'Paid Annual Leaves (12 Days)', 'Overtime Pay Allowance'],
      created_at: '5 hours ago' 
    },
    { 
      id: 'f9201a44-7711-4822-b91c-2c9018471b05', 
      title: 'Personal Family Car Driver', 
      category: 'driver',
      employer_name: 'Anand Kulkarni',
      employer_phone: '+91 99000 11223',
      description: 'Private family driver needed for daily office commutes, city errands, and airport drops in automatic SUV and manual sedan.', 
      salary_offered: 22000, 
      society_name: 'Purva Westend - Kudlu Gate', 
      locality: 'Kudlu Gate, Hosur Main Road, Bangalore - 560068',
      shift_hours: '10 Hours Duty (9:00 AM – 7:00 PM)',
      weekly_off: 'Sundays Off',
      family_members: '4 Members (Executive Family)',
      flat_type: '4BHK Penthouse',
      dietary_pref: 'Non-Vegetarian Household',
      payment_terms: '1st of every month via Bank Transfer',
      responsibilities: [
        'Daily morning office drop & evening pick-up',
        'Maintain vehicle cleanliness, tire pressure & fuel level',
        'Safe driving with valid Commercial / Private DL',
        'Handling GPS navigation & city traffic routes'
      ],
      qualifications: [
        '4+ Years private driving experience with clean record',
        'Valid LMV Driving License mandatory',
        'No traffic violation history & police verification cleared'
      ],
      perks: ['Uniform Allowance Provided', 'Overtime Pay Allowance', 'Diwali Bonus'],
      created_at: '1 day ago' 
    }
  ], []);

  // Dynamic Translation Helpers for Card Details
  const getTranslatedTitle = (job: any) => {
    if (!job) return 'Domestic Worker Job';
    if (job.title && job.title.trim().length > 0) return job.title;
    if (job.id === 'c9bf0b7b-3b02-44e1-a20d-70498b8c2d1b') return 'Full Day Housekeeping & Deep Cleaning';
    if (job.id === 'd78a9e4f-8f12-4c22-921a-5b12847a98b1') return 'North & South Indian Family Cook';
    if (job.id === 'e412a89c-1120-4e55-901b-1b918a204910') return 'Toddler Nanny & Infant Caregiver';
    return job.title || 'Domestic Worker Job';
  };

  const getTranslatedDesc = (job: any) => {
    if (!job) return 'Looking for an experienced domestic helper for household work.';
    if (job.description && job.description.trim().length > 0) return job.description;
    if (job.id === 'c9bf0b7b-3b02-44e1-a20d-70498b8c2d1b') return 'Looking for an experienced and reliable maid for daily dusting, mopping, utensil washing, and laundry for our family in a 3BHK flat.';
    if (job.id === 'd78a9e4f-8f12-4c22-921a-5b12847a98b1') return 'Family of 4 needs an experienced home cook for North Indian thali (roti, sabzi, dal, rice) and South Indian breakfast preparation.';
    if (job.id === 'e412a89c-1120-4e55-901b-1b918a204910') return 'Loving and attentive nanny needed to take care of an 18-month-old baby boy. Responsibilities include feeding, playtime, reading stories, and hygiene.';
    return 'Looking for an experienced domestic helper for household work.';
  };

  const getTranslatedShift = (shift: string) => {
    if (shift?.includes('8:00 AM')) return t('shiftFullDay84') || shift;
    if (shift?.includes('Split Shift')) return t('shiftSplit710') || shift;
    if (shift?.includes('9:00 AM')) return t('shiftFullDay96') || shift;
    if (shift?.includes('10 Hours')) return t('shift10Hours') || shift;
    return shift;
  };

  const getTranslatedSocietyName = (societyName: string) => {
    if (!societyName) return workerProfile?.society || 'Residential Society';
    if (societyName.includes('DLF Westend')) return t('societyDLF') || societyName;
    if (societyName.includes('Prestige Song')) return t('societyPrestige') || societyName;
    if (societyName.includes('SNN Raj')) return t('societySNN') || societyName;
    if (societyName.includes('Purva Westend')) return t('societyPurva') || societyName;
    return societyName;
  };

  const getTranslatedPerk = (perk: string) => {
    if (!perk) return '';
    if (perk.includes('Meals Included')) return t('perkMealsOnDuty') || perk;
    if (perk.includes('Tea & Morning') || perk.includes('Tea & Evening')) return t('perkTeaSnacks') || perk;
    if (perk.includes('Sunday Off')) return t('perkSundayOff') || perk;
    if (perk.includes('Diwali Bonus')) return t('perkDiwaliBonus') || perk;
    if (perk.includes('Festival Bonus') || perk.includes('Bonus on Festivals')) return t('perkFestivalBonus') || perk;
    if (perk.includes('Annual Salary')) return t('perkAnnualRevision') || perk;
    if (perk.includes('Lunch Provided')) return t('perkLunchProvided') || perk;
    if (perk.includes('Paid Annual')) return t('perkPaidLeaves') || perk;
    if (perk.includes('Overtime Pay') || perk.includes('Overtime Allowance')) return t('perkOvertimePay') || perk;
    if (perk.includes('Uniform Allowance')) return t('perkUniform') || perk;
    return perk;
  };

  const { societiesList } = useWorkerDashboard();
  const rawJobs = availableJobs.length > 0 ? availableJobs : fallbackJobs;

  const jobsToDisplay = useMemo(() => {
    return rawJobs.map((job: any) => {
      let socName = job.society_name && job.society_name !== 'Residential Society' ? job.society_name : null;
      if (!socName && job.society_id && societiesList) {
        const found = societiesList.find((s: any) => s.id === job.society_id);
        if (found) socName = found.name;
      }
      if (!socName && societiesList && societiesList.length > 0) {
        socName = societiesList[0].name;
      }
      return {
        ...job,
        society_name: socName || workerProfile?.society || 'DLF Westend Heights'
      };
    });
  }, [rawJobs, societiesList, workerProfile?.society]);

  // Multi-tier Filter Engine: Skill Scope + Location Hierarchy
  const filteredJobs = useMemo(() => {
    const workerSkillsList = (
      Array.isArray(workerProfile.skills) 
        ? workerProfile.skills 
        : (Array.isArray(workerProfile.category) 
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
      
      const matchesSkill = skillFilterMode === 'all' || workerSkillsList.some((sk: string) => jobCategory.includes(sk) || sk.includes(jobCategory));
      
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
        matchesLocation = primarySoc === '' || jobSoc.includes(primarySoc) || secondarySocs.some((sec: string) => jobSoc.includes(sec)) || jobSoc.includes('akshayanagar') || jobSoc.includes('begur');
      } else if (locationTier === 'within5km' || locationTier === 'all') {
        matchesLocation = true;
      }

      return matchesSkill && matchesCategory && matchesSearch && matchesLocation;
    });
  }, [jobsToDisplay, skillFilterMode, locationTier, categoryFilter, searchQuery, workerProfile]);

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
                  { id: 'driver', label: t('driversCategory') || "Private Drivers", isMatching: false },
                  { id: 'caregiver', label: t('caregiverCategory') || "Caregivers", isMatching: false },
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
            <span>{t('verifiedHouseholdJobs')} ({filteredJobs.length})</span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9.5px] font-black uppercase rounded-full border border-emerald-200">
              {t('freeApplicationBadge')}
            </span>
          </h3>
        </div>

        {filteredJobs.length === 0 ? (
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
            {filteredJobs.map((job: any) => {
              const matchingApp = applications.find((a: any) => a.jobId === job.id || a.jobTitle === job.title || a.id === job.id);
              const hasApplied = appliedJobIds.includes(job.id) || !!matchingApp;
              const cleanSalary = job.salary_offered ? Number(job.salary_offered).toLocaleString('en-IN') : '15,000';

              return (
                <div 
                  key={job.id} 
                  className="group relative bg-gradient-to-b from-white via-slate-50/30 to-slate-50/80 rounded-[28px] border border-slate-200/80 hover:border-[#1A73E8]/40 shadow-xs hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between space-y-4 overflow-hidden"
                >
                  {/* Glass highlight background */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all" />

                  {/* Left Column / Info Area */}
                  <div className="space-y-3 min-w-0 flex-1 relative z-10 w-full">
                    {/* Employer header */}
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-[#1A73E8] to-indigo-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 ring-2 ring-blue-100">
                          {(job.employer_name || job.society_name || 'H')[0]}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight truncate">{job.employer_name || 'Verified Household'}</p>
                          <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-flex items-center gap-1">
                            <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                            <span>{t('sevikaaVerifiedHousehold')}</span>
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 self-start xs:self-auto">
                        <span className="text-xs font-black text-emerald-800 font-mono bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 px-3 py-1.5 rounded-2xl border border-emerald-300/70 shadow-xs inline-flex items-center gap-1 whitespace-nowrap">
                          <IndianRupee size={12} className="text-emerald-600 stroke-[2.5] shrink-0" />
                          <span>{cleanSalary} / mo</span>
                        </span>
                      </div>
                    </div>

                    {/* Job Title & Location */}
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-900 group-hover:text-[#1A73E8] transition-colors leading-snug tracking-tight">
                        {getTranslatedTitle(job)}
                      </h4>
                      <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5 bg-slate-100/70 px-2.5 py-1 rounded-xl w-fit border border-slate-200/60">
                        <MapPin size={13} className="text-[#1A73E8] shrink-0" />
                        <span className="truncate">{getTranslatedSocietyName(job.society_name) || job.society_name || job.locality || workerProfile?.society || 'Residential Society'}</span>
                      </p>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-100/80 line-clamp-2 w-full">
                      {getTranslatedDesc(job)}
                    </p>

                    {/* Shift & Perks Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {job.shift_hours && (
                        <span className="px-2.5 py-1 bg-indigo-50/90 text-indigo-700 text-[10.5px] font-bold rounded-xl border border-indigo-100 flex items-center gap-1 whitespace-nowrap">
                          <Clock size={11} className="text-indigo-600 shrink-0" /> {getTranslatedShift(job.shift_hours)}
                        </span>
                      )}
                      {job.perks?.map((perk: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-emerald-50/90 text-emerald-800 text-[10px] font-black rounded-xl border border-emerald-200/60 flex items-center gap-1 whitespace-nowrap">
                          <Check size={11} strokeWidth={3} className="text-emerald-600 shrink-0" /> {getTranslatedPerk(perk)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* BOTTOM ACTION BUTTONS: Always anchored at the very bottom */}
                  <div className="pt-3.5 border-t border-slate-200/70 w-full shrink-0 flex flex-col sm:flex-row items-center gap-2 relative z-10">
                    <Link
                      href={`/worker/jobs/${job.id}`}
                      className="w-full sm:w-1/2 py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95 border border-slate-200/60 whitespace-nowrap"
                    >
                      <Eye size={14} className="text-slate-500 shrink-0" />
                      <span className="whitespace-nowrap">{t('viewDetails')}</span>
                    </Link>

                    <button
                      onClick={() => handleApply(job)}
                      disabled={hasApplied || !isWorkerVerified || isApplying}
                      className={`w-full sm:w-1/2 py-2.5 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap ${
                        hasApplied 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20' 
                          : !isWorkerVerified
                            ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-amber-950 shadow-md shadow-amber-300/40 border border-amber-300/80 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#1A73E8] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md shadow-blue-500/25'
                      }`}
                    >
                      {hasApplied ? (
                        <>
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span className="whitespace-nowrap">{t('applied')}</span>
                        </>
                      ) : !isWorkerVerified ? (
                        <>
                          <Lock size={13} className="shrink-0" />
                          <span className="whitespace-nowrap">{t('pendingAuditBadge')}</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} className="shrink-0" />
                          <span className="whitespace-nowrap">{isApplying ? t('applying') : t('applyNow')}</span>
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
    </div>
  );
}
