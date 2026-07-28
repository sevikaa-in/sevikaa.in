"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Briefcase, MapPin, Calendar, CreditCard, Mail, Phone, 
  CheckCircle2, XCircle, AlertTriangle, Sparkles, Clock, Check, Globe,
  Home, Users, Utensils, Award, ShieldCheck, FileText
} from 'lucide-react';
import { isRegionalScript, translateToEnglish } from '@/lib/adminTranslator';

interface JobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  onModerateJob: (id: string, action: 'approve' | 'reject' | 'request_changes' | 'unapprove' | 'revert' | boolean, note?: string) => void;
  initialShowFeedback?: boolean;
}

const getEmployerName = (job: any): string => {
  if (!job) return 'Household Employer';
  if (typeof job.employer === 'string' && job.employer.trim()) return job.employer;
  if (typeof job.employer_name === 'string' && job.employer_name.trim()) return job.employer_name;
  if (typeof job.employer_profile_name === 'string' && job.employer_profile_name.trim()) return job.employer_profile_name;
  if (job.employer && typeof job.employer === 'object') {
    const ep = Array.isArray(job.employer.employer_profiles) ? job.employer.employer_profiles[0] : job.employer.employer_profiles;
    if (ep?.name) return ep.name;
    if (ep?.company_name) return ep.company_name;
    if (job.employer.email) return job.employer.email.split('@')[0];
  }
  return 'Household Employer';
};

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  isOpen,
  onClose,
  job,
  onModerateJob,
  initialShowFeedback = false
}) => {
  const [mounted, setMounted] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(initialShowFeedback);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('Admin Audit Feedback: Please clarify if ironing duties are included and update morning shift start time.');
  const [rejectReason, setRejectReason] = useState('Offered salary is below platform minimum rate and job description lacks mandatory duties.');
  const [isTranslated, setIsTranslated] = useState(false);

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

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return;
    onModerateJob(job.id, 'reject', rejectReason.trim());
    onClose();
  };

  // Status badge styling helper
  const statusStr = (job.status || 'pending').toLowerCase();
  const isApproved = statusStr === 'active' || statusStr === 'approved' || statusStr === 'live';
  const isRejected = statusStr === 'rejected';
  const isChangesRequested = statusStr === 'changes_requested' || statusStr === 'request_changes';

  return createPortal(
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl max-h-[88vh] bg-white shadow-2xl rounded-3xl flex flex-col border border-slate-100 animate-scale-up overflow-hidden text-slate-900 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A73E8] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#1A73E8]/20">
              {job.category ? job.category[0].toUpperCase() : 'J'}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 flex-wrap">
                <span>{job.title}</span>
                {isApproved && (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✅ Live &amp; Published
                  </span>
                )}
                {isRejected && (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-50 text-red-700 border border-red-200">
                    ❌ Rejected
                  </span>
                )}
                {isChangesRequested && (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                    ⚠️ Changes Requested
                  </span>
                )}
                {!isApproved && !isRejected && !isChangesRequested && (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                    ⏳ Pending Approval
                  </span>
                )}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">
          
          {/* ❌ REJECTION REASON FORM IN MODAL */}
          {showRejectForm && (
            <div className="bg-red-50 border-2 border-red-300 p-5 rounded-2xl space-y-3 animate-fade-in shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-red-900">
                  <XCircle size={16} className="text-red-600" />
                  <span>Specify Rejection Reason for Employer</span>
                </div>
                <button 
                  onClick={() => setShowRejectForm(false)}
                  className="text-red-700 hover:text-red-900 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[11px] text-red-800 font-medium leading-relaxed">
                Specify the reason for rejecting this job requisition. This note will be stored and displayed directly to the employer (job poster).
              </p>

              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Offered salary is below platform minimum rate or inappropriate job description."
                className="w-full p-3 bg-white border border-red-200 rounded-xl text-xs font-medium text-red-950 focus:outline-none focus:ring-2 focus:ring-red-400"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle size={13} />
                  <span>Confirm &amp; Reject Job</span>
                </button>
              </div>
            </div>
          )}

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
                  className="text-amber-700 hover:text-amber-900 text-xs font-bold cursor-pointer"
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
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Job Requisition Overview</span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-3 text-xs font-bold text-slate-700">
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Job Category</span>
                <span className="text-[#1A73E8] bg-blue-50 px-2 py-0.5 rounded-md inline-block uppercase text-[9.5px] font-black mt-0.5">
                  {job.category || 'General'}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Offered Salary</span>
                <span className="font-black text-emerald-700 mt-0.5 block font-mono">
                  ₹{Number(job.salary_offered || job.salary || 15000).toLocaleString('en-IN')}/mo
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Society &amp; Locality</span>
                <span className="flex items-center gap-1 text-slate-700 mt-0.5 font-bold">
                  <MapPin size={10} className="text-slate-400 shrink-0" />
                  <span className="truncate">{job.society_name || job.locality || 'Bengaluru'}</span>
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Shift &amp; Offs</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {job.shift_hours || 'Full Day'} ({job.weekly_off || 'Sunday Off'})
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Job Description</span>
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

          {/* Household & Family Specifications */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Household &amp; Family Specifications</span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold text-slate-700">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/60 space-y-0.5">
                <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1"><Users size={10} /> Family Size</span>
                <span className="font-extrabold text-slate-900 block">{job.family_members || '4 Members'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/60 space-y-0.5">
                <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1"><Home size={10} /> Residence Type</span>
                <span className="font-extrabold text-slate-900 block">{job.flat_type || '3BHK Apartment'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/60 space-y-0.5">
                <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1"><Utensils size={10} /> Dietary Pref</span>
                <span className="font-extrabold text-slate-900 block">{job.dietary_pref || 'Vegetarian'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/60 space-y-0.5">
                <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1"><CreditCard size={10} /> Payment Terms</span>
                <span className="font-extrabold text-slate-900 block">{job.payment_terms || 'Monthly via UPI / Bank'}</span>
              </div>
            </div>
          </div>

          {/* Job Responsibilities & Qualifications List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Responsibilities */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-600" /> Key Responsibilities
              </span>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                {(job.responsibilities && job.responsibilities.length > 0 ? job.responsibilities : [
                  'Daily floor sweeping, mopping & balcony cleaning',
                  'Utensil washing & kitchen counter upkeep',
                  'Dusting furniture, window sills & home appliances',
                  'Washing clothes & ironing daily wear'
                ]).map((resp: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Qualifications / Requirements */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-1">
                <Award size={12} className="text-[#1A73E8]" /> Requirements &amp; Audit Criteria
              </span>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                {(job.qualifications && job.qualifications.length > 0 ? job.qualifications : [
                  '2+ Years experience in gated apartment housekeeping',
                  'Punctual, honest and clean work habits',
                  'Aadhaar card verification & local reference mandatory'
                ]).map((qual: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8] shrink-0 mt-1.5" />
                    <span>{qual}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Perks & Benefits Badges */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" /> Perks &amp; Employer Offerings
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {(job.perks && job.perks.length > 0 ? job.perks : [
                'Meals Included on Duty', 'Tea & Morning Snacks', 'Sunday Off', 'Diwali Bonus', 'Overtime Allowance'
              ]).map((perk: string, idx: number) => (
                <span key={idx} className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/70 rounded-full text-xs font-bold flex items-center gap-1">
                  <span>🎁</span>
                  <span>{perk}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Employer Contact Context */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Employer Profile Context</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs font-bold text-slate-700">
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Employer Name</span>
                <span className="font-extrabold text-slate-800 truncate block mt-0.5">
                  {getEmployerName(job)}
                </span>
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Phone</span>
                <a 
                  href={`tel:${(job.phone || job.employer_phone || '+919876543210').replace(/\s+/g, '')}`}
                  className="flex items-center gap-1 text-[#1A73E8] hover:underline font-bold mt-0.5 truncate"
                >
                  <Phone size={10} className="shrink-0" />
                  <span className="truncate">{job.phone || job.employer_phone || '+91 98765 43210'}</span>
                </a>
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Email</span>
                <a 
                  href={`mailto:${job.email || job.employer_email || 'employer@sevikaa.com'}`}
                  className="flex items-center gap-1 text-[#1A73E8] hover:underline font-bold mt-0.5 truncate"
                >
                  <Mail size={10} className="shrink-0" />
                  <span className="truncate">{job.email || job.employer_email || 'employer@sevikaa.com'}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Shift & Working Schedule */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-1">
              <Clock size={12} className="text-[#1A73E8]" /> Shift Schedule &amp; Working Days
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                <span className="text-[9.5px] font-black text-blue-900 uppercase block">Daily Shift Hours</span>
                <span className="font-extrabold text-slate-900 block text-sm">{job.shift_hours || 'Full Day (8:00 AM – 4:00 PM)'}</span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
                <span className="text-[9.5px] font-black text-emerald-900 uppercase block">Weekly Off Days</span>
                <span className="font-extrabold text-slate-900 block text-sm">{job.weekly_off || 'Sundays Off'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white shrink-0 shadow-lg">
          {isApproved ? (
            <button
              onClick={() => {
                onModerateJob(job.id, 'unapprove');
                onClose();
              }}
              className="w-full sm:w-auto py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <span>↩️</span>
              <span>Revert to Pending Approval</span>
            </button>
          ) : (
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
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowFeedbackForm(!showFeedbackForm)}
              className="py-2.5 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <AlertTriangle size={14} className="text-amber-600" />
              Request Changes
            </button>

            {isApproved ? (
              <div className="py-2.5 px-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Published &amp; Active</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  onModerateJob(job.id, 'approve');
                  onClose();
                }}
                className="py-2.5 px-5 bg-[#34A853] hover:bg-[#34A853]/90 text-white rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                Approve &amp; Publish Live
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
