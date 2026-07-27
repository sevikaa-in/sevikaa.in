"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Briefcase, MapPin, Calendar, CreditCard, Mail, Phone, 
  CheckCircle2, XCircle, AlertTriangle, Sparkles, Clock, Check
} from 'lucide-react';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  onModerateJob: (id: string, approved: boolean) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  isOpen,
  onClose,
  job,
  onModerateJob
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !job || !mounted) return null;

  const daysOfWeek = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' }
  ];

  const shiftTimes = [
    { key: 'early_morning', label: 'Early Morning (6 AM - 8 AM)' },
    { key: 'morning', label: 'Morning (8 AM - 12 PM)' },
    { key: 'afternoon', label: 'Afternoon (12 PM - 4 PM)' },
    { key: 'evening', label: 'Evening (4 PM - 8 PM)' },
    { key: 'night', label: 'Night (8 PM - 10 PM)' }
  ];

  const gridData = job.required_slots?.weekly_grid || job.required_slots || {};
  const isLiveIn = job.required_slots?.live_in || false;
  const isFullDay = job.required_slots?.full_day || false;

  const hasSlot = (day: string, shift: string) => {
    const daySlots = gridData[day];
    return Array.isArray(daySlots) && daySlots.includes(shift);
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-[9999] flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full sm:w-[680px] md:w-[760px] lg:w-[820px] h-screen max-h-screen bg-white shadow-2xl flex flex-col border-l border-slate-200/80 animate-slide-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A73E8] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#1A73E8]/20">
              {job.category ? job.category[0].toUpperCase() : 'J'}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>{job.title}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200/50">
                  Pending Moderation
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Job Verification Audit &bull; Job ID: <span className="font-mono text-slate-600">{job.id}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
            title="Close Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          
          {/* Job Overview Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Job Requisition Metadata</span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-3 text-xs font-bold text-slate-700">
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Job Category</span>
                <span className="text-[#1A73E8] bg-blue-50 px-2 py-0.5 rounded-md inline-block uppercase text-[9.5px] font-black mt-0.5">
                  {job.category || 'General'}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Offered Salary</span>
                <span className="font-black text-slate-900 mt-0.5 block">
                  ₹{job.salary_offered || job.salary_range_min || 'N/A'} {job.salary_range_max ? `- ₹${job.salary_range_max}` : ''}/mo
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Residential Society</span>
                <span className="flex items-center gap-1 text-slate-700 mt-0.5 font-bold">
                  <MapPin size={10} className="text-slate-400" />
                  {job.society_name || 'N/A'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3.5 space-y-1">
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Job Requisition Description</span>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50/80 p-3.5 rounded-xl border border-slate-100/60">
                {job.description || 'No detailed description provided.'}
              </p>
            </div>
          </div>

          {/* Employer Contact Context */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Employer Profile Context</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs font-bold text-slate-700">
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Employer Name</span>
                <span className="font-extrabold text-slate-800 truncate block mt-0.5">{job.employer || 'N/A'}</span>
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Phone</span>
                <span className="flex items-center gap-1 text-slate-700 font-bold mt-0.5 truncate">
                  <Phone size={10} className="text-slate-400 shrink-0" />
                  <span className="truncate">{job.phone || 'N/A'}</span>
                </span>
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Email</span>
                <span className="flex items-center gap-1 text-slate-700 font-bold mt-0.5 truncate">
                  <Mail size={10} className="text-slate-400 shrink-0" />
                  <span className="truncate">{job.email || 'N/A'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weekly Schedule Requirements</span>
              <div className="flex items-center gap-2">
                {isLiveIn && <span className="bg-purple-50 text-purple-700 text-[8.5px] font-black px-2 py-0.5 rounded-full uppercase">24h Live-In</span>}
                {isFullDay && <span className="bg-blue-50 text-[#1A73E8] text-[8.5px] font-black px-2 py-0.5 rounded-full uppercase">Full Day (8-12h)</span>}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase">
                    <th className="py-2 px-2 text-left">Shift Time</th>
                    {daysOfWeek.map(d => (
                      <th key={d.key} className="py-2 px-1.5">{d.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {shiftTimes.map(shift => (
                    <tr key={shift.key} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2 text-left text-[9.5px] font-bold text-slate-600">{shift.label}</td>
                      {daysOfWeek.map(day => {
                        const active = hasSlot(day.key, shift.key);
                        return (
                          <td key={day.key} className="py-2 px-1.5 text-center">
                            <div className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                              active ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-300'
                            }`}>
                              {active ? '✓' : '•'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white shrink-0 shadow-lg">
          <button
            onClick={() => {
              onModerateJob(job.id, false);
              onClose();
            }}
            className="w-full sm:w-auto py-2.5 px-4 bg-red-50 hover:bg-red-100 text-[#EA4335] rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border border-red-200/50 flex items-center justify-center gap-1.5"
          >
            <XCircle size={14} />
            Reject &amp; Draft Requisition
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Close Drawer
            </button>
            <button
              onClick={() => {
                onModerateJob(job.id, true);
                onClose();
              }}
              className="py-2.5 px-5 bg-[#34A853] hover:bg-[#2b8a43] text-white rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md shadow-[#34A853]/20 flex items-center justify-center gap-1.5"
            >
              <Check size={15} strokeWidth={3} />
              Approve &amp; Publish Live
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

