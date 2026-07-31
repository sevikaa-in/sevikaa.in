"use client";

import React, { useState } from 'react';
import { useEmployerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  PlusCircle, Briefcase, MapPin, IndianRupee, Save, Calendar, 
  Clock, FileText, ShieldCheck, Check, Sparkles, RefreshCw, Eye, CheckCircle2, Star, Zap, Utensils, HeartHandshake, Award, ShieldAlert, Lock
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { key: 'mon', labelKey: 'dayMon', fallback: 'Mon' },
  { key: 'tue', labelKey: 'dayTue', fallback: 'Tue' },
  { key: 'wed', labelKey: 'dayWed', fallback: 'Wed' },
  { key: 'thu', labelKey: 'dayThu', fallback: 'Thu' },
  { key: 'fri', labelKey: 'dayFri', fallback: 'Fri' },
  { key: 'sat', labelKey: 'daySat', fallback: 'Sat' },
  { key: 'sun', labelKey: 'daySun', fallback: 'Sun' }
];

const SHIFT_TIMES = [
  { key: 'early_morning', labelKey: 'shiftEarlyMorning', fallback: 'Early Morning (6 AM - 9 AM)' },
  { key: 'morning', labelKey: 'shiftMorning', fallback: 'Morning (9 AM - 12 PM)' },
  { key: 'afternoon', labelKey: 'shiftAfternoon', fallback: 'Afternoon (12 PM - 3 PM)' },
  { key: 'evening', labelKey: 'shiftEvening', fallback: 'Evening (3 PM - 6 PM)' },
  { key: 'night', labelKey: 'shiftNight', fallback: 'Night (6 PM - 9 PM)' }
];

const CATEGORY_OPTIONS = [
  { id: 'cook', labelKey: 'categoryCook', icon: '🍳', subtitleKey: 'categoryCookSub', defaultTitleKey: 'defaultTitleCook' },
  { id: 'maid', labelKey: 'categoryMaid', icon: '🧹', subtitleKey: 'categoryMaidSub', defaultTitleKey: 'defaultTitleMaid' },
  { id: 'nanny', labelKey: 'categoryNanny', icon: '👶', subtitleKey: 'categoryNannySub', defaultTitleKey: 'defaultTitleNanny' }
];

export default function EmployerPostJobPage() {
  const { employerProfile, handlePostJob, showToast } = useEmployerDashboard();
  const { t } = useLanguage();

  // Employer Verification Gate: must be explicitly 'live' or 'approved'
  const isEmployerVerified = employerProfile.status === 'live' || employerProfile.status === 'approved';

  const [category, setCategory] = useState<string>('cook');
  const [title, setTitle] = useState('');
  const [societyName, setSocietyName] = useState(employerProfile.society_name || '');
  const [salary, setSalary] = useState('');
  const [flatType, setFlatType] = useState('3BHK Apartment');
  const [familyMembers, setFamilyMembers] = useState('4 Members (2 Adults, 2 Kids)');
  const [careNeeds, setCareNeeds] = useState('No Special Senior/Infant Care');
  const [dietaryPref, setDietaryPref] = useState('Both Veg & Non-Veg');
  const [selectedPerks, setSelectedPerks] = useState<string[]>([
    'Meals Included on Duty', 
    'Tea & Morning Snacks', 
    'Sunday Off', 
    'Diwali Bonus'
  ]);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([
    'Aadhaar Verification Mandatory',
    '2+ Years Experience in Gated Societies',
    'Local Reference & Police Clearance'
  ]);
  const [leavePolicy, setLeavePolicy] = useState('4 Sundays Off + 1 Paid Leave');
  const [deductionPolicy, setDeductionPolicy] = useState('Pro-rata Daily Rate (Salary ÷ 30)');
  const [customDeduction, setCustomDeduction] = useState('500');
  const [selectedShiftSlot, setSelectedShiftSlot] = useState('fullday');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Weekly Schedule Slots State (dayKey -> shiftKey[])
  const [weeklyGrid, setWeeklyGrid] = useState<Record<string, string[]>>({
    mon: ['early_morning', 'morning', 'evening'],
    tue: ['early_morning', 'morning', 'evening'],
    wed: ['early_morning', 'morning', 'evening'],
    thu: ['early_morning', 'morning', 'evening'],
    fri: ['early_morning', 'morning', 'evening'],
    sat: ['early_morning', 'morning', 'evening']
  });

  const handleCategorySelect = (catId: string) => {
    setCategory(catId);
    const catObj = CATEGORY_OPTIONS.find(c => c.id === catId);
    if (catObj && !title) {
      setTitle(t(catObj.defaultTitleKey) || '');
    }
  };

  const toggleSlot = (dayKey: string, shiftKey: string) => {
    setWeeklyGrid(prev => {
      const currentDaySlots = prev[dayKey] || [];
      const exists = currentDaySlots.includes(shiftKey);
      const updatedDaySlots = exists 
        ? currentDaySlots.filter(s => s !== shiftKey)
        : [...currentDaySlots, shiftKey];
      return { ...prev, [dayKey]: updatedDaySlots };
    });
  };

  const applyMorningPreset = () => {
    const grid: Record<string, string[]> = {};
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].forEach(day => {
      grid[day] = ['early_morning', 'morning'];
    });
    grid['sun'] = [];
    setWeeklyGrid(grid);
  };

  const applyFullDayPreset = () => {
    const grid: Record<string, string[]> = {};
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].forEach(day => {
      grid[day] = ['morning', 'afternoon', 'evening'];
    });
    grid['sun'] = [];
    setWeeklyGrid(grid);
  };

  const applyLiveInPreset = () => {
    const grid: Record<string, string[]> = {};
    DAYS_OF_WEEK.forEach(day => {
      grid[day.key] = ['early_morning', 'morning', 'afternoon', 'evening', 'night'];
    });
    setWeeklyGrid(grid);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmployerVerified) {
      showToast("Employer verification required before posting jobs!", "warning");
      return;
    }
    const finalTitle = title.trim() || t(activeCategoryObj.defaultTitleKey) || 'Domestic Help Required';
    setIsSubmitting(true);
    await handlePostJob({
      title: finalTitle,
      category,
      salary,
      societyName,
      flatType,
      familyMembers,
      careNeeds,
      dietaryPref,
      perks: selectedPerks,
      qualifications: selectedRequirements,
      leavePolicy,
      deductionPolicy: deductionPolicy === 'Custom Amount' ? `₹${customDeduction}/day` : deductionPolicy,
      description,
      weeklyGrid
    });
    setIsSubmitting(false);
  };

  const activeCategoryObj = CATEGORY_OPTIONS.find(c => c.id === category) || CATEGORY_OPTIONS[0];
  const displayTitle = title || t(activeCategoryObj.defaultTitleKey) || t('untitledJobRequirement') || 'Untitled Job Requirement';

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-20">
      
      {/* Page Header */}
      <div className="space-y-1">
        <span className="bg-blue-50 text-[#1A73E8] text-[9.5px] font-black uppercase px-3 py-1 rounded-full border border-blue-200/60 inline-flex items-center gap-1">
          <Sparkles size={12} />
          {t('postJobEyebrow') || "Household Employer Hiring Portal"}
        </span>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>{t('createJobReqTitle') || "Create Job Requisition"}</span>
        </h2>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          {t('createJobReqSub') || "Specify your household requirements and reach Aadhaar-verified domestic helpers in your society."}
        </p>
      </div>

      {/* 🔒 EMPLOYER VERIFICATION REQUIRED BANNER */}
      {!isEmployerVerified && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl flex items-start gap-3 text-amber-900">
          <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="text-xs font-black">{t('employerVerificationRequired') || "Employer ID Verification Required"}</p>
            <p className="text-[11px] font-medium leading-relaxed">
              {t('employerVerificationBannerText') || "You must upload your Aadhaar Card and a live selfie in Account Settings → Identity Verification before posting job requisitions."}
            </p>
            <p className="text-[10.5px] text-amber-700 font-bold mt-1">
              {t('employerVerificationFooterText') || "✦ Verification is free and takes less than 2 minutes. Admin approves within 24 hours."}
            </p>
          </div>
        </div>
      )}

      {/* Live Form Card Preview - ONLY SHOWS WHEN EMPLOYER ENTERS INPUT */}
      {(title.trim().length > 0 || salary.trim().length > 0) && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3.5 relative overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between relative z-10">
            <span className="bg-blue-50 text-[#1A73E8] text-[9.5px] font-black uppercase px-3 py-1 rounded-full border border-blue-200 shadow-2xs flex items-center gap-1.5">
              <Eye size={12} className="text-[#1A73E8]" /> {t('liveWorkerFeedPreview') || "Live Form Card Preview"}
            </span>
            <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" /> Live Draft Preview
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 relative z-10 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-slate-900">
                    {title}
                  </h3>
                  <span className="bg-blue-100 text-[#1A73E8] text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0 flex items-center gap-1">
                    <span>{activeCategoryObj.icon}</span>
                    <span>{t(activeCategoryObj.labelKey)}</span>
                  </span>
                </div>
                <span className="text-xs text-slate-600 font-semibold flex items-center gap-1 mt-1">
                  <MapPin size={12} className="text-[#1A73E8]" /> {societyName || employerProfile.society_name || 'Gated Society'}
                </span>
              </div>
              {salary && (
                <span className="text-base font-black text-[#34A853] font-mono shrink-0">
                  ₹{salary}/mo
                </span>
              )}
            </div>

            {description && (
              <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed pt-2 border-t border-slate-200/80">
                "{description}"
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-700 font-bold pt-2 border-t border-slate-200/80">
              <span>{t('leaveLabel') || "Leave:"} <strong className="text-slate-900">{leavePolicy}</strong></span>
              <span className="text-[#34A853] font-mono">{t('deductionLabel') || "Deduction:"} {deductionPolicy.split(' ')[0]}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        
        {/* Step 1: Category Selection */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white text-[10px] flex items-center justify-center font-black">1</span>
              <span>{t('selectCategoryStepTitle') || "Select Domestic Help Category"}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">{t('step1of4') || "Step 1 of 4"}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORY_OPTIONS.map(cat => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden ${
                    isSelected 
                      ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border-[#1A73E8] ring-2 ring-[#1A73E8]/30 shadow-md text-[#1A73E8] scale-[1.02]' 
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{cat.icon}</span>
                    {isSelected && <CheckCircle2 size={18} className="text-[#1A73E8]" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black leading-tight">{t(cat.labelKey)}</h4>
                    <p className="text-[9.5px] text-slate-400 font-medium leading-tight mt-0.5">{t(cat.subtitleKey)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Compensation & Role Headline */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white text-[10px] flex items-center justify-center font-black">2</span>
              <span>{t('step2Title') || "Position Headline & Monthly Compensation"}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">{t('step2of4') || "Step 2 of 4"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-500 text-[10px] uppercase">{t('jobTitleLabel') || "Job Headline Title"}</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t(activeCategoryObj.defaultTitleKey) || "e.g. Experienced North Indian Cook"}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-500 text-[10px] uppercase">{t('societyNameLabel') || "Gated Society / Location Name"}</label>
              <input 
                type="text" 
                value={societyName} 
                onChange={(e) => setSocietyName(e.target.value)}
                placeholder={t('societyNamePlaceholder') || "e.g. DLF Westend Heights - Akshayanagar"}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase">{t('monthlySalaryLabel') || "Monthly Offered Salary (₹)"}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-black text-xs">₹</span>
                <input 
                  type="text" 
                  value={salary} 
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="15000"
                  className="w-full p-3 pl-8 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase">{t('dietaryPrefLabel') || "Dietary & Food Preference"}</label>
              <select 
                value={dietaryPref} 
                onChange={(e) => setDietaryPref(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
              >
                <option value="Both Veg & Non-Veg">{t('dietBothVegNonveg') || "Both Veg & Non-Veg Allowed"}</option>
                <option value="Pure Vegetarian Only">{t('dietPureVeg') || "Pure Vegetarian Only"}</option>
                <option value="Jain Food Prep Only">{t('dietJainFood') || "Jain Food Prep Only"}</option>
              </select>
            </div>

            {/* Flat / Residence Specification */}
            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase">{t('flatTypeLabel') || "Flat / Residence Type"}</label>
              <select 
                value={flatType} 
                onChange={(e) => setFlatType(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
              >
                <option value="3BHK Apartment">{t('flat3bhk') || "3BHK Apartment"}</option>
                <option value="2BHK Apartment">{t('flat2bhk') || "2BHK Apartment"}</option>
                <option value="1BHK Apartment">{t('flat1bhk') || "1BHK Apartment"}</option>
                <option value="4BHK / Penthouse">{t('flat4bhk') || "4BHK / Penthouse"}</option>
                <option value="Independent House / Villa">{t('flatVilla') || "Independent House / Villa"}</option>
              </select>
            </div>

            {/* Household Family Size */}
            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase">{t('totalFamilyMembersLabel') || "Total Family Members"}</label>
              <select 
                value={familyMembers} 
                onChange={(e) => setFamilyMembers(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
              >
                <option value="4 Members (2 Adults, 2 Kids)">{t('family4Members') || "4 Members (2 Adults, 2 Kids)"}</option>
                <option value="2 Adults (Couple / Working)">{t('family2Adults') || "2 Adults (Couple / Working)"}</option>
                <option value="3 Members (2 Adults, 1 Child)">{t('family3Members') || "3 Members (2 Adults, 1 Child)"}</option>
                <option value="5+ Members (Joint Family)">{t('family5Plus') || "5+ Members (Joint Family)"}</option>
              </select>
            </div>

            {/* Infant / Elderly Care Needs */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-500 text-[10px] uppercase">{t('careNeedsLabel') || "Infant / Elderly Special Care Needs"}</label>
              <select 
                value={careNeeds} 
                onChange={(e) => setCareNeeds(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
              >
                <option value="No Special Senior/Infant Care">{t('careNone') || "No Special Senior / Infant Care Required"}</option>
                <option value="Infant / Baby Care (Under 2 Yrs)">{t('careInfant') || "Infant / Baby Care Needed (Under 2 Yrs)"}</option>
                <option value="Toddler Care (2-5 Yrs)">{t('careToddler') || "Toddler Care Needed (2–5 Yrs)"}</option>
                <option value="Senior Citizen Care (Mobility Support)">{t('careSenior') || "Elderly / Senior Care (Mobility Assistance Needed)"}</option>
              </select>
            </div>

            {/* Offered Perks & Allowances */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-slate-500 text-[10px] uppercase block">{t('perksOfferedLabel') || "Perks & Allowances Offered"}</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'perkMealsOnDuty', label: 'Meals Included on Duty' },
                  { key: 'perkTeaSnacks', label: 'Tea & Morning Snacks' },
                  { key: 'perkSundayOff', label: 'Sunday Off' },
                  { key: 'perkDiwaliBonus', label: 'Diwali Bonus' },
                  { key: 'perkFestivalBonus', label: 'Festival Bonus' },
                  { key: 'perkUniform', label: 'Uniform Allowance Provided' },
                  { key: 'perkOvertimePay', label: 'Overtime Pay Allowance' }
                ].map((perkObj) => {
                  const perkLabel = t(perkObj.key) || perkObj.label;
                  const isSelected = selectedPerks.includes(perkObj.label) || selectedPerks.includes(perkLabel);
                  return (
                    <button
                      key={perkObj.key}
                      type="button"
                      onClick={() => {
                        setSelectedPerks(prev => 
                          prev.includes(perkLabel) ? prev.filter(p => p !== perkLabel) : [...prev, perkLabel]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} className="text-emerald-600" />}
                      <span>{perkLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Candidate Prerequisites & Verification */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-slate-500 text-[10px] uppercase block">{t('prerequisitesLabel') || "Candidate Prerequisites & Verification Requirements"}</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'reqAadhaar', label: 'Aadhaar Verification Mandatory' },
                  { key: 'reqExperience', label: '2+ Years Experience in Gated Societies' },
                  { key: 'reqPoliceClearance', label: 'Local Reference & Police Clearance' },
                  { key: 'reqNonSmoker', label: 'Non-Smoker & Hygienic Work Habits' },
                  { key: 'reqPunctual', label: 'Punctual & Honest' }
                ].map((reqObj) => {
                  const reqLabel = t(reqObj.key) || reqObj.label;
                  const isSelected = selectedRequirements.includes(reqObj.label) || selectedRequirements.includes(reqLabel);
                  return (
                    <button
                      key={reqObj.key}
                      type="button"
                      onClick={() => {
                        setSelectedRequirements(prev => 
                          prev.includes(reqLabel) ? prev.filter(r => r !== reqLabel) : [...prev, reqLabel]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50 text-[#1A73E8] border-blue-300 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} className="text-[#1A73E8]" />}
                      <span>{reqLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-500 text-[10px] uppercase">{t('scopeOfWorkLabel') || "Detailed Scope of Work & Instructions"}</label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify duties, household preferences, meal requirements, or infant care instructions..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Leave & Deduction Terms Agreement */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white text-[10px] flex items-center justify-center font-black">3</span>
              <span>{t('step3Title') || "Leave Entitlements & Daily Deduction Terms"}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">{t('step3of4') || "Step 3 of 4"}</span>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs font-bold">
            {/* Leave Entitlement */}
            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase block">{t('monthlyLeaveLabel') || "Monthly Leave Entitlement"}</label>
              <select 
                value={leavePolicy} 
                onChange={(e) => setLeavePolicy(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer truncate pr-8"
              >
                <option value="4 Sundays Off + 1 Paid Leave">{t('leave4Sun1Paid') || "4 Sundays Off + 1 Paid Leave (Recommended)"}</option>
                <option value="4 Sundays Off Only">{t('leave4SunOnly') || "4 Sundays Off Only"}</option>
                <option value="Alternate Sundays Off">{t('leaveAltSun') || "Alternate Sundays Off (2 Offs / Month)"}</option>
                <option value="No Fixed Off (Paid Overtime)">{t('leaveNoFixedOff') || "No Fixed Off (Paid Overtime Compensation)"}</option>
              </select>
            </div>

            {/* Absence Deduction Policy */}
            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase block">{t('deductionPolicyLabel') || "Unannounced Absence Deduction Policy"}</label>
              <select 
                value={deductionPolicy} 
                onChange={(e) => setDeductionPolicy(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer truncate pr-8"
              >
                <option value="Pro-rata Daily Rate (Salary ÷ 30)">{t('deductionProrata') || "Pro-rata Daily Rate (Salary ÷ 30)"}</option>
                <option value="No Deduction (Mutual Time Adjustment)">{t('deductionNoDeduction') || "No Deduction (Mutual Time Adjustment)"}</option>
                <option value="Custom Amount">{t('deductionCustom') || "Custom Fixed Daily Deduction"}</option>
              </select>
            </div>

            {deductionPolicy === 'Custom Amount' && (
              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">{t('customDeductionLabel') || "Custom Daily Deduction Amount (₹)"}</label>
                <input 
                  type="text" 
                  value={customDeduction}
                  onChange={(e) => setCustomDeduction(e.target.value)}
                  placeholder="500"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Shift Slot Selection */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white text-[10px] flex items-center justify-center font-black">4</span>
              <span>{t('step4Title') || "Work Schedule & Shift Timing Slots"}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">{t('step4of4') || "Step 4 of 4"}</span>
          </div>

          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Select the shift timing slot required for your household. Domestic helpers will view this schedule when applying.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              { id: 'morning', label: '🌅 Morning Shift', timing: '7:00 AM – 12:00 PM', dbValue: 'Morning Duty (7:00 AM – 12:00 PM)', desc: 'Morning cooking breakfast, house cleaning & dishwashing' },
              { id: 'fullday', label: '☀️ Full Day Shift', timing: '8:00 AM – 4:00 PM', dbValue: 'Full Day (8:00 AM – 4:00 PM)', desc: 'Standard 8-hour shift for cooking, childcare & deep cleaning' },
              { id: 'split', label: '⚡ Split Shift (Cook / Maid)', timing: '7:00 AM – 10:00 AM & 6:00 PM – 9:00 PM', dbValue: 'Split Shift: 7:00 AM – 10:00 AM & 6:00 PM – 9:00 PM', desc: 'Morning breakfast + Evening dinner prep double slot' },
              { id: 'evening', label: '🌆 Evening Shift', timing: '4:00 PM – 9:00 PM', dbValue: 'Evening Duty (4:00 PM – 9:00 PM)', desc: 'Evening dinner preparation & kitchen cleanup' },
              { id: 'livein', label: '🏠 24x7 Live-In Help', timing: '24-Hour Resident', dbValue: '24x7 Live-In Accommodation', desc: 'Full-time resident helper with private room & meals included' },
              { id: 'custom', label: '⏱️ Flexible / Custom Hours', timing: 'Part-Time / On-Demand', dbValue: 'Flexible Custom Hours', desc: 'Custom working hours arranged mutually' }
            ].map(shift => (
              <button
                key={shift.id}
                type="button"
                onClick={() => setSelectedShiftSlot(shift.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedShiftSlot === shift.id
                    ? 'bg-blue-50/90 border-[#1A73E8] ring-2 ring-blue-500/20 text-slate-900 shadow-xs scale-[1.01]'
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-slate-900">{shift.label}</span>
                  {selectedShiftSlot === shift.id && <CheckCircle2 size={16} className="text-[#1A73E8]" />}
                </div>
                <span className="text-[11px] font-bold text-[#1A73E8] block mt-0.5">{shift.timing}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1 leading-tight">{shift.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Premium Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !isEmployerVerified}
            className="w-full py-4 px-8 bg-gradient-to-r from-[#1A73E8] to-blue-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black rounded-2xl text-xs shadow-xl shadow-blue-500/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{isSubmitting ? (t('publishingReq') || 'Publishing Requisition...') : (t('publishReqBtn') || 'Publish Job Requisition for Admin Audit')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
