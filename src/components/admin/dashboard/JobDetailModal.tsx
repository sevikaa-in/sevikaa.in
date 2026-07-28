"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Briefcase, MapPin, Calendar, CreditCard, Mail, Phone, 
  CheckCircle2, XCircle, AlertTriangle, Sparkles, Clock, Check, Globe
} from 'lucide-react';
import { isRegionalScript, translateToEnglish } from '@/lib/adminTranslator';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  onModerateJob: (id: string, action: 'approve' | 'reject' | 'request_changes' | boolean, note?: string) => void;
  initialShowFeedback?: boolean;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  isOpen,
  onClose,
  job,
  onModerateJob,
  initialShowFeedback = false
}) => {
  const [mounted, setMounted] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(initialShowFeedback);
  const [feedbackNote, setFeedbackNote] = useState('Admin Audit Feedback: Please clarify if ironing duties are included and update morning shift start time.');

  useEffect(() => {
    setMounted(true);
    if (initialShowFeedback) {
      setShowFeedbackForm(true);
    }
  }, [initialShowFeedback]);

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

  const handleSendFeedback = () => {
    if (!feedbackNote.trim()) return;
    onModerateJob(job.id, 'request_changes', feedbackNote.trim());
    onClose();
  };

  const [isTranslated, setIsTranslated] = useState(false);
  const hasRegionalText = isRegionalScript(job.title) || isRegionalScript(job.description);

  return createPortal(
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl max-h-[85vh] bg-white shadow-2xl rounded-3xl flex flex-col border border-slate-100 animate-scale-up overflow-hidden"
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
          
          {/* 🚨 REQUEST CHANGES FEEDBACK FORM IN MODAL */}
          {showFeedbackForm && (
            <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl space-y-3 animate-fade-in shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span>Request Requisition Changes from Employer</span>
                </div>
                <button 
                  onClick={() => setShowFeedbackForm(false)}
                  className="text-amber-700 hover:text-amber-900 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                Specify feedback note detailing what the employer needs to clarify or update before this requisition can go live.
              </p>

              <textarea
                rows={3}
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                placeholder="e.g. Please clarify if ironing duties are included and update morning shift start time."
                className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-medium text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSendFeedback}
                  className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle size={13} />
                  <span>Send Feedback Note &amp; Flag Job</span>
                </button>
              </div>
            </div>
          )}

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
                <span className="font-black text-slate-900 mt-0.5 block font-mono">
                  ₹{job.salary_offered || job.salary || '15,000'}/mo
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

            <div className="border-t border-slate-100 pt-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Job Requisition Description</span>
                <button
                  type="button"
                  onClick={() => setIsTranslated(!isTranslated)}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                    isTranslated 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                      : 'bg-blue-50 text-[#1A73E8] border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <Globe size={12} />
                  <span>{isTranslated ? 'Show Original Text' : '🌐 Translate to English'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50/80 p-3.5 rounded-xl border border-slate-100/60">
                {isTranslated 
                  ? translateToEnglish(job.description || job.title) 
                  : (job.description || 'No detailed description provided.')}
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
                  <span className="truncate">{job.phone || job.employer_phone || 'N/A'}</span>
                </span>
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Email</span>
                <span className="flex items-center gap-1 text-slate-700 font-bold mt-0.5 truncate">
                  <Mail size={10} className="text-slate-400 shrink-0" />
                  <span className="truncate">{job.email || job.employer_email || 'N/A'}</span>
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
              onModerateJob(job.id, 'reject');
              onClose();
            }}
            className="w-full sm:w-auto py-2.5 px-3 bg-red-50 hover:bg-red-100 text-[#EA4335] rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border border-red-200/50 flex items-center justify-center gap-1.5"
          >
            <XCircle size={14} />
            Reject Job
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowFeedbackForm(!showFeedbackForm)}
              className="py-2.5 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <AlertTriangle size={14} className="text-amber-600" />
              Request Changes
            </button>

            <button
              onClick={() => {
                onModerateJob(job.id, 'approve');
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

