"use client";

import React, { useState } from 'react';
import { useEmployerDashboard } from '../layout';
import { useLanguage } from '../../../../context/LanguageContext';
import { 
  PlusCircle, Briefcase, MapPin, IndianRupee, Save, Calendar, 
  Clock, FileText, ShieldCheck, Check, Sparkles, RefreshCw, Eye, CheckCircle2, Star, Zap, Utensils, HeartHandshake, Award, ShieldAlert, Lock
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' }
];

const SHIFT_TIMES = [
  { key: 'early_morning', label: 'Early Morning (6 AM - 9 AM)' },
  { key: 'morning', label: 'Morning (9 AM - 12 PM)' },
  { key: 'afternoon', label: 'Afternoon (12 PM - 3 PM)' },
  { key: 'evening', label: 'Evening (3 PM - 6 PM)' },
  { key: 'night', label: 'Night (6 PM - 9 PM)' }
];

const CATEGORY_OPTIONS = [
  { id: 'cook', label: 'Cook / Chef', icon: '🍳', subtitle: 'Meal Prep & Kitchen Care', defaultTitle: 'Experienced North & South Indian Cook' },
  { id: 'maid', label: 'Maid / Housekeeper', icon: '🧹', subtitle: 'Cleaning & Housekeeping', defaultTitle: 'Housemaid for Daily Cleaning & Utensils' },
  { id: 'nanny', label: 'Nanny / Childcare', icon: '👶', subtitle: 'Infant & Toddler Care', defaultTitle: 'Trained Nanny for Infant & Toddler' },
  { id: 'driver', label: 'Private Driver', icon: '🚗', subtitle: 'Family & Executive Driving', defaultTitle: 'Private Driver for Personal & Family Car' },
  { id: 'gardener', label: 'Gardener / Plants', icon: '🌿', subtitle: 'Lawn & Balcony Care', defaultTitle: 'Balcony & Garden Maintenance' },
  { id: 'security', label: 'Security Guard', icon: '🛡️', subtitle: 'Gate & Household Safety', defaultTitle: 'Household Night / Day Security Guard' }
];

export default function EmployerPostJobPage() {
  const { employerProfile, handlePostJob, showToast } = useEmployerDashboard();
  const { t } = useLanguage();

  // Employer Verification Gate: must be explicitly 'live' or 'approved'
  const isEmployerVerified = employerProfile.status === 'live' || employerProfile.status === 'approved';

  const [category, setCategory] = useState<string>('cook');
  const [title, setTitle] = useState('Experienced North & South Indian Cook');
  const [salary, setSalary] = useState('15000');
  const [dietaryPref, setDietaryPref] = useState('Both Veg & Non-Veg');
  const [leavePolicy, setLeavePolicy] = useState('4 Sundays Off + 1 Paid Leave');
  const [deductionPolicy, setDeductionPolicy] = useState('Pro-rata Daily Rate (Salary ÷ 30)');
  const [customDeduction, setCustomDeduction] = useState('500');
  const [description, setDescription] = useState('Looking for a punctual, hygiene-focused cook to prepare breakfast, lunch & dinner for family of 4 in DLF Akshayanagar.');
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
      setTitle(catObj.defaultTitle);
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
    if (!title.trim()) return;
    setIsSubmitting(true);
    await handlePostJob({
      title,
      category,
      salary,
      dietaryPref,
      leavePolicy,
      deductionPolicy: deductionPolicy === 'Custom Amount' ? `₹${customDeduction}/day` : deductionPolicy,
      description,
      weeklyGrid
    });
    setIsSubmitting(false);
  };

  const activeCategoryObj = CATEGORY_OPTIONS.find(c => c.id === category) || CATEGORY_OPTIONS[0];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-20">
      
      {/* Page Header */}
      <div className="space-y-1">
        <span className="bg-blue-50 text-[#1A73E8] text-[9.5px] font-black uppercase px-3 py-1 rounded-full border border-blue-200/60 inline-flex items-center gap-1">
          <Sparkles size={12} />
          Household Employer Hiring Portal
        </span>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Create Job Requisition</span>
        </h2>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Specify your household requirements and reach Aadhaar-verified domestic helpers in your society.
        </p>
      </div>

      {/* 🔒 EMPLOYER VERIFICATION REQUIRED BANNER */}
      {!isEmployerVerified && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl flex items-start gap-3 text-amber-900">
          <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="text-xs font-black">Employer ID Verification Required</p>
            <p className="text-[11px] font-medium leading-relaxed">
              You must upload your Aadhaar Card and a live selfie in <strong>Account Settings → Identity Verification</strong> before posting job requisitions. This prevents fraudulent listings and protects domestic workers.
            </p>
            <p className="text-[10.5px] text-amber-700 font-bold mt-1">
              ✦ Verification is free and takes less than 2 minutes. Admin approves within 24 hours.
            </p>
          </div>
        </div>
      )}


      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-2xl space-y-4 relative overflow-hidden border border-blue-500/20">
        <div className="flex items-center justify-between relative z-10">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9.5px] font-black uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
            <Eye size={12} /> Live Worker Feed Preview
          </span>
          <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 backdrop-blur-xs flex items-center gap-1">
            <Clock size={10} /> Pending Admin Audit
          </span>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2.5 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-white">{title || 'Untitled Job Requirement'}</h3>
                <span className="bg-blue-500/30 text-blue-200 text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-400/30 shrink-0 flex items-center gap-1">
                  <span>{activeCategoryObj.icon}</span>
                  <span>{activeCategoryObj.label}</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-300 font-semibold flex items-center gap-1 mt-1">
                <MapPin size={11} className="text-blue-400" /> {employerProfile.society_name || 'DLF Westend Heights'}
              </span>
            </div>
            <span className="text-sm font-black text-emerald-400 font-mono shrink-0">₹{salary || '0'}/mo</span>
          </div>

          {description && (
            <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed pt-2 border-t border-white/10">
              "{description}"
            </p>
          )}

          <div className="flex items-center justify-between text-[10.5px] text-slate-300 font-bold pt-2 border-t border-white/10">
            <span>Leave: <strong>{leavePolicy}</strong></span>
            <span className="text-emerald-300 font-mono">Deduction: {deductionPolicy.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        
        {/* Step 1: Premium Visual Category Cards */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white text-[10px] flex items-center justify-center font-black">1</span>
              <span>Select Domestic Help Category</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Step 1 of 4</span>
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
                    <h4 className="text-xs font-black leading-tight">{cat.label}</h4>
                    <p className="text-[9.5px] text-slate-400 font-medium leading-tight mt-0.5">{cat.subtitle}</p>
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
              <span>Position Headline &amp; Monthly Compensation</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Step 2 of 4</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-500 text-[10px] uppercase">Job Headline Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Experienced North Indian Cook for Family of 4"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase">Monthly Offered Salary (₹)</label>
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
              <label className="text-slate-500 text-[10px] uppercase">Dietary &amp; Food Preference</label>
              <select 
                value={dietaryPref} 
                onChange={(e) => setDietaryPref(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
              >
                <option value="Both Veg & Non-Veg">Both Veg &amp; Non-Veg Allowed</option>
                <option value="Pure Vegetarian Only">Pure Vegetarian Only</option>
                <option value="Jain Food Prep Only">Jain Food Prep Only</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-500 text-[10px] uppercase">Detailed Scope of Work &amp; Instructions</label>
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
              <span>Leave Entitlements &amp; Daily Deduction Terms</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Step 3 of 4</span>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs font-bold">
            {/* Leave Entitlement */}
            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase block">Monthly Leave Entitlement</label>
              <select 
                value={leavePolicy} 
                onChange={(e) => setLeavePolicy(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer truncate pr-8"
              >
                <option value="4 Sundays Off + 1 Paid Leave">4 Sundays Off + 1 Paid Leave (Recommended)</option>
                <option value="4 Sundays Off Only">4 Sundays Off Only</option>
                <option value="Alternate Sundays Off">Alternate Sundays Off (2 Offs / Month)</option>
                <option value="No Fixed Off (Paid Overtime)">No Fixed Off (Paid Overtime Compensation)</option>
              </select>
            </div>

            {/* Absence Deduction Policy */}
            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase block">Unannounced Absence Deduction Policy</label>
              <select 
                value={deductionPolicy} 
                onChange={(e) => setDeductionPolicy(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer truncate pr-8"
              >
                <option value="Pro-rata Daily Rate (Salary ÷ 30)">Pro-rata Daily Rate (Salary ÷ 30)</option>
                <option value="No Deduction (Mutual Adjustment)">No Deduction (Mutual Time Adjustment)</option>
                <option value="Custom Amount">Custom Fixed Daily Deduction</option>
              </select>
            </div>

            {deductionPolicy === 'Custom Amount' && (
              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">Custom Daily Deduction Amount (₹)</label>
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

        {/* Step 4: 7-Day Shift & Time Slot Picker */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white text-[10px] flex items-center justify-center font-black">4</span>
                <span>Weekly Work Schedule Slots</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Select preferred working hours for each day of the week</p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
              <button 
                type="button" 
                onClick={applyMorningPreset}
                className="py-1 px-3 bg-blue-50 hover:bg-blue-100 text-[#1A73E8] rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-xs active:scale-95"
              >
                ⚡ Morning Shift
              </button>
              <button 
                type="button" 
                onClick={applyFullDayPreset}
                className="py-1 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-xs active:scale-95"
              >
                ⚡ Full Day Shift
              </button>
              <button 
                type="button" 
                onClick={applyLiveInPreset}
                className="py-1 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-xs active:scale-95"
              >
                ⚡ 24x7 Live-In
              </button>
            </div>
          </div>

          {/* Interactive Schedule Grid */}
          <div className="overflow-x-auto pt-2">
            <div className="min-w-[500px] border border-slate-200/80 rounded-2xl overflow-hidden text-xs">
              <div className="grid grid-cols-6 bg-slate-100 font-black text-slate-700 p-2.5 text-[10.5px] uppercase border-b border-slate-200">
                <span>Day</span>
                {SHIFT_TIMES.map(shift => (
                  <span key={shift.key} className="text-center">{shift.label.split(' ')[0]}</span>
                ))}
              </div>

              {DAYS_OF_WEEK.map(day => {
                const daySlots = weeklyGrid[day.key] || [];
                return (
                  <div key={day.key} className="grid grid-cols-6 items-center p-2.5 border-b border-slate-100 last:border-b-0 text-slate-800 font-bold hover:bg-slate-50/50 transition-colors">
                    <span className="font-black text-slate-900">{day.label}</span>
                    {SHIFT_TIMES.map(shift => {
                      const isChecked = daySlots.includes(shift.key);
                      return (
                        <div key={shift.key} className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleSlot(day.key, shift.key)}
                            className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                              isChecked 
                                ? 'bg-[#1A73E8] border-[#1A73E8] text-white shadow-xs scale-105' 
                                : 'border-slate-300 hover:border-slate-400 bg-white text-transparent'
                            }`}
                          >
                            ✓
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Premium Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting || !isEmployerVerified}
            className="w-full py-4 px-8 bg-gradient-to-r from-[#1A73E8] to-blue-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black rounded-2xl text-xs shadow-xl shadow-blue-500/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{isSubmitting ? 'Publishing Requisition...' : 'Publish Job Requisition for Admin Audit'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
