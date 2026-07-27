"use client";

import React, { useState } from 'react';
import { 
  X, User, Mail, Phone, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, 
  Sparkles, FileText, Check, ShieldCheck, PlayCircle, ShieldAlert, Award,
  PhoneCall, Copy, MessageSquare, CheckCheck
} from 'lucide-react';

interface InterviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: any;
  onLogResult: (id: string, result: 'Pass' | 'Fail' | 'Re-interview', notes: string) => void;
}

export const InterviewDetailModal: React.FC<InterviewDetailModalProps> = ({
  isOpen,
  onClose,
  interview,
  onLogResult
}) => {
  const [notesText, setNotesText] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSendSmsReminder = async () => {
    if (!worker?.phone) return;
    setSmsSending(true);
    try {
      await fetch('/api/notifications/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'interview_scheduled',
          userId: worker.id || interview.id,
          name: interview.workerName,
          phone: worker.phone,
          email: worker.email || null,
          userLanguage: worker.preferred_language || 'hi'
        })
      });
      setSmsSent(true);
    } catch (e) {
      console.error('SMS reminder failed:', e);
    } finally {
      setSmsSending(false);
    }
  };

  const handleCopyPhone = () => {
    if (!worker?.phone) return;
    navigator.clipboard.writeText(worker.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset notes when interview selection changes
  React.useEffect(() => {
    if (interview) {
      setNotesText(interview.resultNotes || '');
    }
  }, [interview]);

  if (!isOpen || !interview) return null;

  const { worker } = interview;

  const getPublicUrl = (bucket: string, path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    return `${base}/storage/v1/object/public/${bucket}/${cleanPath}`;
  };

  const selfieUrl = worker ? getPublicUrl('worker-selfies', worker.profile_picture_url) : '';
  const aadhaarFrontUrl = worker ? getPublicUrl('worker-documents', worker.aadhaar_front_url) : '';
  const videoUrl = worker ? getPublicUrl('worker-videos', worker.video_url) : '';

  return (
    <div 
      className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px] z-50 flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full sm:w-[680px] md:w-[760px] lg:w-[840px] h-full bg-white shadow-2xl flex flex-col border-l border-slate-200/80 animate-slide-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1A73E8] flex items-center justify-center font-black text-sm">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span>Verification Interview for {interview.workerName}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100/50">
                  {interview.status}
                </span>
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Category: {interview.category} &bull; Time Slot: {interview.time}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-gray-400 hover:text-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Call Action Bar */}
        {worker?.phone && (
          <div className="px-5 py-3 border-b border-slate-50 bg-emerald-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                <PhoneCall size={13} className="text-emerald-700" />
              </div>
              <div>
                <span className="block text-[9px] font-black text-emerald-800 uppercase tracking-wide">Phone Interview — Call Worker Directly</span>
                <span className="text-xs font-black text-slate-800">{worker.phone}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Tap-to-Call */}
              <a
                href={`tel:${worker.phone}`}
                className="py-2 px-3.5 bg-[#34A853] hover:bg-[#2b8a43] text-white rounded-xl text-[10px] font-black transition-all active:scale-95 flex items-center gap-1.5"
              >
                <PhoneCall size={12} />
                Call Now
              </a>
              {/* Copy Number */}
              <button
                onClick={handleCopyPhone}
                className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <CheckCheck size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {/* SMS Reminder */}
              <button
                onClick={handleSendSmsReminder}
                disabled={smsSent || smsSending}
                className={`py-2 px-3 rounded-xl text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border ${
                  smsSent
                    ? 'bg-blue-50 border-blue-100 text-[#1A73E8]'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                } disabled:cursor-not-allowed`}
              >
                {smsSent ? <CheckCheck size={12} /> : <MessageSquare size={12} />}
                {smsSending ? 'Sending...' : smsSent ? 'SMS Sent ✓' : 'SMS Reminder'}
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Panel: Worker Bio & Credentials (Col 7) */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Bio Card */}
            {worker ? (
              <div className="bg-slate-50/40 border border-slate-100 p-5 rounded-2xl space-y-4">
                <span className="block text-[9.5px] font-black text-slate-700 uppercase tracking-wider">Candidate Biography</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-xs font-bold text-slate-700">
                  <div className="space-y-0.5">
                    <span className="block text-[9px] text-gray-400 uppercase">Age / Gender</span>
                    <span>{worker.age || 'N/A'} yrs / {worker.gender || 'N/A'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-[9px] text-gray-400 uppercase">Experience</span>
                    <span>{worker.experience_years || 0} years</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-[9px] text-gray-400 uppercase">Expected Salary</span>
                    <span>₹{worker.expected_salary || 0}/mo</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-[9px] text-gray-400 uppercase">Phone</span>
                    <span>{worker.phone || 'N/A'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-[9px] text-gray-400 uppercase">Emergency Contact</span>
                    <span>{worker.emergency_contact || 'N/A'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-[9px] text-gray-400 uppercase">Status</span>
                    <span className="capitalize">{worker.status || 'Pending'}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <span className="block text-[9px] text-gray-400 uppercase font-black">Languages Spoken</span>
                  <div className="flex flex-wrap gap-1">
                    {worker.languages_spoken?.map((lang: string) => (
                      <span key={lang} className="px-2 py-0.5 bg-white border border-slate-100 text-slate-700 rounded-full text-[9px] font-extrabold uppercase">
                        {lang}
                      </span>
                    )) || <span className="text-[10px] text-gray-400">None logged</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-100 text-xs text-gray-400 font-bold rounded-xl text-center">
                Worker biography profile is not loaded or missing.
              </div>
            )}

            {/* Document Checklists Links */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
              <span className="block text-[9.5px] font-black text-slate-700 uppercase tracking-wider">Candidate Verification Assets</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Selfie Photo */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50 flex flex-col justify-between items-center text-center space-y-2 min-h-[96px]">
                  <span className="text-[8.5px] font-black text-gray-400 uppercase">Selfie Photo</span>
                  {selfieUrl ? (
                    <a 
                      href={selfieUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9.5px] font-bold text-[#1A73E8] hover:underline flex items-center gap-0.5"
                    >
                      <FileText size={10} /> View Selfie Photo
                    </a>
                  ) : (
                    <span className="text-[9px] text-gray-400 font-black">Not Uploaded</span>
                  )}
                </div>

                {/* Aadhaar Scanner */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50 flex flex-col justify-between items-center text-center space-y-2 min-h-[96px]">
                  <span className="text-[8.5px] font-black text-gray-400 uppercase">Aadhaar Card</span>
                  {aadhaarFrontUrl ? (
                    <a 
                      href={aadhaarFrontUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9.5px] font-bold text-[#1A73E8] hover:underline flex items-center gap-0.5"
                    >
                      <FileText size={10} /> Inspect Document
                    </a>
                  ) : (
                    <span className="text-[9px] text-gray-400 font-black">Not Uploaded</span>
                  )}
                </div>

                {/* Verification Video */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50 flex flex-col justify-between items-center text-center space-y-2 min-h-[96px]">
                  <span className="text-[8.5px] font-black text-gray-400 uppercase">Intro Video</span>
                  {videoUrl ? (
                    <a 
                      href={videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9.5px] font-bold text-[#1A73E8] hover:underline flex items-center gap-0.5"
                    >
                      <PlayCircle size={10} /> Play Video
                    </a>
                  ) : (
                    <span className="text-[9px] text-gray-400 font-black">Not Uploaded</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Decision Logs (Col 5) */}
          <div className="md:col-span-5 flex flex-col h-full space-y-4">
            <span className="block text-[9.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Award size={12} />
              <span>Log Interview Audit Results</span>
            </span>

            {/* Checklists Indicators */}
            {worker && (
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Funnel Badges Checks</span>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-700">
                  <div className="flex items-center gap-1">
                    <span className={worker.badges?.mobile === 'Verified' ? 'text-emerald-500' : 'text-gray-300'}><CheckCircle2 size={12} /></span>
                    <span>Mobile Link</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={worker.badges?.aadhaar === 'Verified' ? 'text-emerald-500' : 'text-gray-300'}><CheckCircle2 size={12} /></span>
                    <span>Aadhaar Verified</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={worker.badges?.video === 'Verified' ? 'text-emerald-500' : 'text-gray-300'}><CheckCircle2 size={12} /></span>
                    <span>Intro Video Match</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={worker.badges?.interview === 'Verified' ? 'text-emerald-500' : 'text-gray-300'}><CheckCircle2 size={12} /></span>
                    <span>Admin Checked</span>
                  </div>
                </div>
              </div>
            )}

            {/* Decision Notes */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex-1 flex flex-col space-y-3">
              <span className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Evaluation Audit Logs</span>
              
              <div className="flex-1 flex flex-col space-y-2">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Result Decision Notes</label>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Enter detailed evaluation notes regarding telephone checks or references verification..."
                  className="flex-1 min-h-[120px] w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none resize-none text-slate-800"
                />
              </div>

              {interview.status === 'Completed' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50 space-y-1">
                  <span className="block text-[9px] text-gray-400 uppercase font-black">Logged Result</span>
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    {interview.result === 'Pass' ? (
                      <span className="text-[#34A853] flex items-center gap-0.5"><CheckCircle2 size={12} /> Passed Audit</span>
                    ) : (
                      <span className="text-[#EA4335] flex items-center gap-0.5"><XCircle size={12} /> Failed Audit</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {interview.status !== 'Completed' ? (
          <div className="p-5 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/20">
            <button
              onClick={() => {
                onLogResult(interview.id, 'Re-interview', notesText || 'Reschedule requested.');
                onClose();
              }}
              className="w-full sm:w-auto py-2.5 px-4 border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
            >
              <AlertCircle size={14} />
              Reschedule &amp; Re-audit
            </button>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  onLogResult(interview.id, 'Fail', notesText || 'Failed verification checks.');
                  onClose();
                }}
                className="flex-1 sm:flex-initial py-2.5 px-4 bg-slate-100 hover:bg-red-50 hover:text-[#EA4335] text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
              >
                <XCircle size={14} />
                Fail Candidate
              </button>
              <button
                onClick={() => {
                  onLogResult(interview.id, 'Pass', notesText || 'Passed verification checks.');
                  onClose();
                }}
                className="flex-1 sm:flex-initial py-2.5 px-4 bg-[#34A853] hover:bg-[#2b8a43] text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
              >
                <CheckCircle2 size={14} />
                Pass Audit &amp; Approve Live
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 border-t border-slate-50 flex justify-end bg-slate-50/20">
            <button
              onClick={onClose}
              className="py-2 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Close Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
