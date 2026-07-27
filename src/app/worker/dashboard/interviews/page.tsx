"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useWorkerDashboard } from '../layout';
import { supabase } from '../../../../lib/supabaseClient';
import { 
  Calendar, MapPin, PhoneCall, Clock, CheckCircle2, MessageSquare, 
  Compass, Briefcase, Building2, Sparkles, UserCheck, X, Send, 
  ChevronRight, AlertCircle, ArrowUpRight, ShieldCheck, Phone
} from 'lucide-react';

export default function WorkerInterviewsPage() {
  const { applications, availableJobs, showToast } = useWorkerDashboard();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'applied' | 'history'>('upcoming');
  const [selectedAppForReschedule, setSelectedAppForReschedule] = useState<any>(null);
  const [rescheduleTime, setRescheduleTime] = useState('Tomorrow Afternoon (2:00 PM)');
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  // Group applications by status
  const upcomingInterviews = useMemo(() => {
    return applications.filter(a => a.status === 'interview_scheduled' || a.status === 'confirmed');
  }, [applications]);

  const appliedJobs = useMemo(() => {
    return applications.filter(a => a.status === 'under_review' || a.status === 'pending');
  }, [applications]);

  const historyInterviews = useMemo(() => {
    return applications.filter(a => a.status === 'hired' || a.status === 'rejected' || a.status === 'completed');
  }, [applications]);

  const displayedList = useMemo(() => {
    if (activeTab === 'upcoming') return upcomingInterviews;
    if (activeTab === 'applied') return appliedJobs;
    return historyInterviews;
  }, [activeTab, upcomingInterviews, appliedJobs, historyInterviews]);

  const handleConfirmAttendance = async (app: any) => {
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!isPlaceholder && app.id) {
        await supabase
          .from('job_applications')
          .update({ status: 'confirmed' })
          .eq('id', app.id);
      }
    } catch (err) {
      console.error("Confirm attendance error:", err);
    }
    showToast(`Attendance confirmed for interview with ${app.employerName || 'Employer'}!`, 'success');
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForReschedule) return;
    setIsSubmittingReschedule(true);
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!isPlaceholder && selectedAppForReschedule.id) {
        await supabase
          .from('job_applications')
          .update({ 
            reschedule_time: rescheduleTime,
            reschedule_note: rescheduleNote 
          })
          .eq('id', selectedAppForReschedule.id);
      }
    } catch (err) {
      console.error("Reschedule error:", err);
    } finally {
      setIsSubmittingReschedule(false);
      setSelectedAppForReschedule(null);
      setRescheduleNote('');
      showToast("Reschedule request sent to employer! You will receive an SMS confirmation.", "success");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl pb-20">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-blue-50 text-[#1A73E8] text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200/60 inline-flex items-center gap-1">
            <Calendar size={11} />
            Interview Scheduler &amp; Status Tracker
          </span>
        </div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Calendar size={18} className="text-[#1A73E8]" />
          <span>Scheduled Interviews</span>
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-relaxed">
          Manage upcoming household employer calls, society gate meetings, and track your job application progress.
        </p>
      </div>

      {/* 🌟 HERO INTERVIEW STATUS BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-xl space-y-4 relative overflow-hidden border border-blue-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 size={10} /> Live Application Pipeline
            </span>
            <h3 className="text-sm font-black text-white">
              {upcomingInterviews.length > 0 
                ? `${upcomingInterviews.length} Upcoming Household Interview${upcomingInterviews.length > 1 ? 's' : ''}` 
                : 'No Upcoming Interviews Today'}
            </h3>
            <p className="text-[11px] text-slate-300 font-medium">
              Keep your phone reachable and Aadhaar ready for gate desk entry.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shrink-0 flex items-center gap-3 text-center">
            <div>
              <span className="text-[8.5px] text-slate-300 font-bold block uppercase">Interviews</span>
              <span className="text-base font-black text-amber-300">{upcomingInterviews.length}</span>
            </div>
            <div className="w-px h-7 bg-white/15" />
            <div>
              <span className="text-[8.5px] text-slate-300 font-bold block uppercase">Review</span>
              <span className="text-base font-black text-blue-300">{appliedJobs.length}</span>
            </div>
            <div className="w-px h-7 bg-white/15" />
            <div>
              <span className="text-[8.5px] text-slate-300 font-bold block uppercase">Hired</span>
              <span className="text-base font-black text-emerald-400">{historyInterviews.filter(h => h.status === 'hired').length}</span>
            </div>
          </div>
        </div>

        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10.5px] text-slate-300 font-semibold relative z-10">
          <span className="flex items-center gap-1.5 text-blue-200">
            <Sparkles size={12} className="text-amber-400" />
            <span>Always confirm attendance at least 1 hour before scheduled time.</span>
          </span>
        </div>
      </div>

      {/* 📊 TAB FILTER CONTROLS */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl text-xs font-bold text-slate-600 gap-1">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'upcoming' ? 'bg-white text-[#1A73E8] font-black shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <Calendar size={13} />
          <span>Upcoming ({upcomingInterviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('applied')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'applied' ? 'bg-white text-[#1A73E8] font-black shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <Clock size={13} />
          <span>Applied ({appliedJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'history' ? 'bg-white text-[#1A73E8] font-black shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <CheckCircle2 size={13} />
          <span>Hired &amp; History ({historyInterviews.length})</span>
        </button>
      </div>

      {/* 📅 INTERVIEW & APPLICATION CARDS LIST */}
      <div className="space-y-3.5">
        {displayedList.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-3 shadow-xs">
            <Calendar size={36} className="mx-auto text-slate-300" />
            <div>
              <h4 className="text-xs font-black text-slate-800">
                {activeTab === 'upcoming' 
                  ? 'No Upcoming Interviews' 
                  : activeTab === 'applied' 
                  ? 'No Active Job Applications' 
                  : 'No Completed Interview History'}
              </h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                {activeTab === 'upcoming'
                  ? 'When employers schedule a phone call or gate meeting with you, it will appear here.'
                  : 'Browse verified society jobs to send applications directly to hiring households.'}
              </p>
            </div>
            <Link
              href="/worker/dashboard/jobs"
              className="py-2.5 px-5 bg-[#1A73E8] text-white rounded-xl text-xs font-black shadow-md cursor-pointer hover:bg-blue-600 transition-all inline-flex items-center gap-1.5"
            >
              <Briefcase size={14} /> Explore Live Jobs ({availableJobs.length})
            </Link>
          </div>
        ) : (
          displayedList.map((app) => {
            const isUpcoming = app.status === 'interview_scheduled' || app.status === 'confirmed';
            const isHired = app.status === 'hired';
            const isPhoneCall = app.interviewMode !== 'in_person';
            const cleanPhone = (app.employerPhone || '+91 98765 43210').replace(/\s+/g, '');

            return (
              <div 
                key={app.id} 
                className={`bg-white p-5 rounded-3xl border transition-all space-y-4 shadow-xs hover:shadow-md ${
                  isHired 
                    ? 'border-emerald-200 bg-emerald-50/20' 
                    : isUpcoming
                    ? 'border-blue-200'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                      isHired 
                        ? 'bg-emerald-600 text-white' 
                        : isUpcoming 
                        ? 'bg-[#1A73E8] text-white' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {app.employerName?.[0] || 'E'}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 leading-tight truncate">{app.jobTitle}</h4>
                      <p className="text-[10.5px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                        <Building2 size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate">{app.employerName || 'Verified Employer'} &bull; {app.society}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase shrink-0 border flex items-center gap-1 ${
                    isHired 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : isUpcoming
                      ? 'bg-blue-50 text-[#1A73E8] border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {isHired ? (
                      <><CheckCircle2 size={10} /> Hired</>
                    ) : isUpcoming ? (
                      <><Clock size={10} /> Interview Scheduled</>
                    ) : (
                      <><Clock size={10} /> Under Review</>
                    )}
                  </span>
                </div>

                {/* Job Specs Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold text-slate-700">
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Offered Salary</span>
                    <span className="text-xs font-black text-emerald-700 mt-0.5 block">
                      ₹{app.salary} / month
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Work Shift</span>
                    <span className="text-[10.5px] font-black text-slate-800 mt-0.5 block truncate">
                      {app.shift || 'Full Day (8-12 Hrs)'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 col-span-2 sm:col-span-1">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Interview Mode</span>
                    <span className="text-[10.5px] font-black text-[#1A73E8] mt-0.5 block truncate flex items-center gap-1">
                      {isPhoneCall ? '📞 Phone Call' : '🏠 Gate Desk In-Person'}
                    </span>
                  </div>
                </div>

                {/* Interview Timing Box */}
                {app.interviewTime && (
                  <div className={`p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 border ${
                    isUpcoming 
                      ? 'bg-blue-50/70 border-blue-200/80 text-blue-900' 
                      : 'bg-slate-50 border-slate-200/80 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-black">
                      <Clock size={15} className="text-[#1A73E8] shrink-0" />
                      <span>{app.interviewTime}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUpcoming && (
                        <button
                          onClick={() => handleConfirmAttendance(app)}
                          className="text-[10px] font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <CheckCircle2 size={11} /> Confirm Attendance
                        </button>
                      )}
                      {isUpcoming && (
                        <button
                          onClick={() => setSelectedAppForReschedule(app)}
                          className="text-[10px] font-black text-[#1A73E8] hover:underline cursor-pointer"
                        >
                          Request Reschedule
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    {/* Call Direct */}
                    <a
                      href={`tel:${cleanPhone}`}
                      className="flex-1 sm:flex-initial py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md shadow-[#1A73E8]/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <PhoneCall size={14} />
                      <span>Call {app.employerName || 'Employer'}</span>
                    </a>

                    {/* WhatsApp Quick Chat */}
                    <a
                      href={`https://wa.me/${cleanPhone.replace(/\+/g, '')}?text=Namaste%20${encodeURIComponent(app.employerName || 'Employer')},%20I%20am%20contacting%20you%20regarding%20our%20Sevikaa%20interview%20for%20${encodeURIComponent(app.jobTitle)}%20at%20${encodeURIComponent(app.society)}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <MessageSquare size={14} />
                      <span>WhatsApp Chat</span>
                    </a>

                    {/* Gate Directions */}
                    {!isPhoneCall && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(app.society)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <MapPin size={14} className="text-slate-500" />
                        <span>Gate Directions</span>
                      </a>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-semibold ml-auto">
                    Applied {app.date}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 📝 RESCHEDULE REQUEST MODAL */}
      {selectedAppForReschedule && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-[#1A73E8] rounded-xl">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Request Interview Reschedule</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{selectedAppForReschedule.jobTitle}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAppForReschedule(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">Preferred New Date &amp; Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
                >
                  <option value="Tomorrow Morning (10:00 AM)">Tomorrow Morning (10:00 AM)</option>
                  <option value="Tomorrow Afternoon (2:00 PM)">Tomorrow Afternoon (2:00 PM)</option>
                  <option value="Tomorrow Evening (5:00 PM)">Tomorrow Evening (5:00 PM)</option>
                  <option value="Day After Tomorrow Morning (11:00 AM)">Day After Tomorrow Morning (11:00 AM)</option>
                  <option value="Weekend Saturday Morning (10:30 AM)">Weekend Saturday Morning (10:30 AM)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">Reason / Note for Employer (Optional)</label>
                <textarea
                  rows={2}
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  placeholder="e.g. Current work shift conflicts with this time. Kindly request afternoon slot."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAppForReschedule(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReschedule}
                  className="py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl text-xs font-black shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{isSubmittingReschedule ? 'Sending...' : 'Send Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

