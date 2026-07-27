"use client";

import React, { useState } from 'react';
import { useEmployerDashboard } from '../layout';
import { 
  PlusCircle, Briefcase, MapPin, IndianRupee, Save, Calendar, 
  Clock, FileText, ShieldCheck, Check, Sparkles, RefreshCw 
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
  { id: 'cook', label: '🍳 Cook / Meal Preparation' },
  { id: 'maid', label: '🧹 Maid / Housekeeping & Cleaning' },
  { id: 'nanny', label: '👶 Nanny / Childcare & Infant Care' },
  { id: 'driver', label: '🚗 Private Family Driver' },
  { id: 'gardener', label: '🌿 Gardener / Lawn Maintenance' },
  { id: 'security', label: '🛡️ Household Security Guard' }
];

export default function EmployerPostJobPage() {
  const { employerProfile, handlePostJob } = useEmployerDashboard();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('cook');
  const [salary, setSalary] = useState('15000');
  const [leavePolicy, setLeavePolicy] = useState('4 Sundays Off + 1 Paid Leave');
  const [deductionPolicy, setDeductionPolicy] = useState('Pro-rata Daily Rate (Salary ÷ 30)');
  const [customDeduction, setCustomDeduction] = useState('500');
  const [description, setDescription] = useState('');

  // Weekly Schedule Slots State (dayKey -> shiftKey[])
  const [weeklyGrid, setWeeklyGrid] = useState<Record<string, string[]>>({
    mon: ['morning', 'evening'],
    tue: ['morning', 'evening'],
    wed: ['morning', 'evening'],
    thu: ['morning', 'evening'],
    fri: ['morning', 'evening'],
    sat: ['morning', 'evening']
  });

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
    if (!title.trim()) return;
    await handlePostJob({
      title,
      category,
      salary,
      leavePolicy,
      deductionPolicy: deductionPolicy === 'Custom Amount' ? `₹${customDeduction}/day` : deductionPolicy,
      description,
      weeklyGrid
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl pb-16">
      
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <PlusCircle size={18} className="text-[#1A73E8]" />
          <span>Post New Job Requisition</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Create job openings for Cooks, Maids, Nannies, Drivers &amp; Staff under your single employer account.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        
        {/* Basic Requirement Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Requirement Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-500 text-[10px] uppercase">Job Title / Post Headline</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Experienced North Indian Cook for Family of 4"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase">Job Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase">Monthly Offered Salary (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">₹</span>
                <input 
                  type="text" 
                  value={salary} 
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="15000"
                  className="w-full p-3 pl-8 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-500 text-[10px] uppercase">Detailed Scope of Work</label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify duties, household preferences, meal requirements, or infant care instructions..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Leave & Deduction Terms Agreement */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Leave &amp; Daily Deduction Terms</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase">Monthly Leave Entitlement</label>
              <select 
                value={leavePolicy} 
                onChange={(e) => setLeavePolicy(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
              >
                <option value="4 Sundays Off + 1 Paid Leave">4 Sundays Off + 1 Paid Leave</option>
                <option value="4 Sundays Off Only">4 Sundays Off Only</option>
                <option value="Alternate Sundays Off">Alternate Sundays Off</option>
                <option value="No Fixed Off (Paid Overtime)">No Fixed Off (Paid Overtime)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase">Unannounced Absence Deduction Policy</label>
              <select 
                value={deductionPolicy} 
                onChange={(e) => setDeductionPolicy(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
              >
                <option value="Pro-rata Daily Rate (Salary ÷ 30)">Pro-rata Daily Rate (Salary ÷ 30)</option>
                <option value="No Deduction (Mutual Adjustment)">No Deduction (Mutual Adjustment)</option>
                <option value="Custom Amount">Custom Fixed Amount / Day</option>
              </select>
            </div>

            {deductionPolicy === 'Custom Amount' && (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-500 text-[10px] uppercase">Custom Daily Deduction Amount (₹)</label>
                <input 
                  type="text" 
                  value={customDeduction}
                  onChange={(e) => setCustomDeduction(e.target.value)}
                  placeholder="500"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Shift & Time Slot Picker */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Weekly Work Schedule Slots</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Select preferred working hours for each day of the week</p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
              <button 
                type="button" 
                onClick={applyMorningPreset}
                className="py-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-[#1A73E8] rounded-xl text-[10px] font-black transition-all cursor-pointer"
              >
                ⚡ Morning
              </button>
              <button 
                type="button" 
                onClick={applyFullDayPreset}
                className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black transition-all cursor-pointer"
              >
                ⚡ Full Day
              </button>
              <button 
                type="button" 
                onClick={applyLiveInPreset}
                className="py-1 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[10px] font-black transition-all cursor-pointer"
              >
                ⚡ 24x7 Live-in
              </button>
            </div>
          </div>

          {/* Interactive Schedule Grid */}
          <div className="overflow-x-auto pt-2">
            <div className="min-w-[500px] border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <div className="grid grid-cols-6 bg-slate-100 font-black text-slate-700 p-2.5 text-[10.5px] uppercase border-b border-slate-200">
                <span>Day</span>
                {SHIFT_TIMES.map(shift => (
                  <span key={shift.key} className="text-center">{shift.label.split(' ')[0]}</span>
                ))}
              </div>

              {DAYS_OF_WEEK.map(day => {
                const daySlots = weeklyGrid[day.key] || [];
                return (
                  <div key={day.key} className="grid grid-cols-6 items-center p-2.5 border-b border-slate-100 last:border-b-0 text-slate-800 font-bold hover:bg-slate-50/50">
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

        {/* Submit Action */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={!title.trim()}
            className="py-3.5 px-6 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>Publish Job Requisition for Admin Audit</span>
          </button>
        </div>
      </form>
    </div>
  );
}
