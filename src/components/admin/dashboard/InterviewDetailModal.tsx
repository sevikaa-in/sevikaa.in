"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, User, Mail, Phone, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, 
  Sparkles, FileText, Check, ShieldCheck, PlayCircle, ShieldAlert, Award,
  PhoneCall, Copy, MessageSquare, CheckCheck, ChevronDown, Building2
} from 'lucide-react';

import { usePrivateUrl } from '@/hooks/usePrivateUrl';

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
  const [mounted, setMounted] = useState(false);

  // Reschedule Modal State
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:30 AM');
  const [customReason, setCustomReason] = useState('');

  // Admin Live Profile Editor & Asset Upload States
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [uploadLinkSent, setUploadLinkSent] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string; type: 'image' | 'video' } | null>(null);

  const [editFullName, setEditFullName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('female');
  const [editExperience, setEditExperience] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editPrimarySociety, setEditPrimarySociety] = useState('');
  const [editLanguages, setEditLanguages] = useState('');
  const [isSocietyDropdownOpen, setIsSocietyDropdownOpen] = useState(false);
  const [allSocieties, setAllSocieties] = useState<any[]>([]);
  const [adminUploadingAsset, setAdminUploadingAsset] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const loadSocieties = async () => {
      try {
        const { webApiClient } = await import('@/lib/webApiClient');
        const data = await webApiClient.get('/api/societies');
        if (data?.societies && data.societies.length > 0) {
          setAllSocieties(data.societies);
          return;
        }
      } catch (e) {}

      try {
        const { webApiClient } = await import('@/lib/webApiClient');
        const data2 = await webApiClient.get('/api/super-admin/data?tab=societies');
        if (data2?.societies && data2.societies.length > 0) {
          setAllSocieties(data2.societies);
        }
      } catch (e) {}
    };
    loadSocieties();
  }, []);

  // Initialize edit fields when interview changes
  useEffect(() => {
    if (interview?.worker) {
      const w = interview.worker;
      setEditFullName(w.full_name || w.name || '');
      setEditAge(w.age ? String(w.age) : '28');
      setEditGender(w.gender || 'female');
      setEditExperience(w.experience_years ? String(w.experience_years) : '0');
      setEditSalary(w.expected_salary ? String(w.expected_salary) : '0');
      setEditSkills(Array.isArray(w.skills) ? w.skills.join(', ') : (w.skills || 'Domestic Help'));
      setEditEmergencyContact(w.emergency_contact || '');
      setEditPrimarySociety(w.primary_society_id || w.society || '');
      const existingLangs = (w.languages_spoken && Array.isArray(w.languages_spoken) && w.languages_spoken.length > 0)
        ? w.languages_spoken.join(', ')
        : (w.preferred_language ? ({ hi: 'Hindi', en: 'English', kn: 'Kannada', te: 'Telugu', ta: 'Tamil' }[w.preferred_language as string] || w.preferred_language) : '');
      setEditLanguages(existingLangs);
    }
  }, [interview]);

  // Live photo polling while Admin drawer is open ONLY if assets are missing
  useEffect(() => {
    if (!isOpen) return;
    const targetId = interview?.worker?.id || interview?.id;
    if (!targetId) return;

    const w = interview?.worker;
    const isMissingAssets = !w?.profile_picture_url || !w?.aadhaar_front_url || !w?.aadhaar_back_url;
    if (!isMissingAssets) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/worker/upload-token?userId=${targetId}`);
        const data = await res.json();
        if (data?.existingAssets && interview?.worker) {
          let updated = false;
          if (data.existingAssets.profile_picture_url && !interview.worker.profile_picture_url) {
            interview.worker.profile_picture_url = data.existingAssets.profile_picture_url;
            updated = true;
          }
          if (data.existingAssets.aadhaar_front_url && !interview.worker.aadhaar_front_url) {
            interview.worker.aadhaar_front_url = data.existingAssets.aadhaar_front_url;
            updated = true;
          }
          if (data.existingAssets.aadhaar_back_url && !interview.worker.aadhaar_back_url) {
            interview.worker.aadhaar_back_url = data.existingAssets.aadhaar_back_url;
            updated = true;
          }
          if (updated) {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.warn("Live photo poll notice:", err);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [interview, isOpen]);

  const handleSaveAdminBioEdit = async () => {
    if (!interview?.id) return;
    setSavingBio(true);
    try {
      const skillsArray = editSkills.split(',').map(s => s.trim()).filter(Boolean);
      const languagesArray = editLanguages.split(',').map(s => s.trim()).filter(Boolean);
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/admin/worker/update', {
        userId: interview.worker?.id || interview.id,
        full_name: editFullName,
        age: editAge,
        gender: editGender,
        experience_years: editExperience,
        expected_salary: editSalary,
        skills: skillsArray,
        languages_spoken: languagesArray,
        emergency_contact: editEmergencyContact,
        primary_society_id: editPrimarySociety
      });
      if (data && !data.error) {
        setIsEditingBio(false);
        if (interview.worker) {
          interview.worker.full_name = editFullName;
          interview.worker.name = editFullName;
          interview.worker.age = parseInt(editAge) || 28;
          interview.worker.gender = editGender;
          interview.worker.experience_years = parseInt(editExperience) || 0;
          interview.worker.expected_salary = parseInt(editSalary) || 0;
          interview.worker.skills = skillsArray;
          interview.worker.languages_spoken = languagesArray;
          interview.worker.emergency_contact = editEmergencyContact;
          interview.worker.primary_society_id = editPrimarySociety;
        }
      }
    } catch (err) {
      console.error("Save bio edit failed:", err);
    } finally {
      setSavingBio(false);
    }
  };

  const handleSendUploadLinkSms = async () => {
    const activePhone = worker?.phone;
    if (!activePhone) return;
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/admin/worker/send-upload-sms', { userId: worker.id || interview.id, phone: activePhone });
      if (data && data.success) {
        setUploadLinkSent(true);
        setTimeout(() => setUploadLinkSent(false), 4000);
      }
    } catch (e) {
      console.error("Failed sending 1-click upload link SMS:", e);
    }
  };

  const handleSendSmsReminder = async () => {
    if (!worker?.phone) return;
    setSmsSending(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      await webApiClient.post('/api/notifications/trigger', {
        type: 'interview_scheduled',
        userId: worker.id || interview.id,
        name: interview.workerName,
        phone: worker.phone,
        email: worker.email || null,
        userLanguage: worker.preferred_language || 'hi'
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

  const handleAdminDirectUpload = async (assetType: 'profile_picture_url' | 'aadhaar_front_url' | 'aadhaar_back_url', file: File) => {
    setAdminUploadingAsset(assetType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', worker?.id || interview?.id);
      formData.append('assetType', assetType);

      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/admin/worker/upload-asset', formData);
      if (data && data.success && data.publicUrl && interview?.worker) {
        interview.worker[assetType] = data.publicUrl;
      }
    } catch (err) {
      console.error("Direct admin upload error:", err);
    } finally {
      setAdminUploadingAsset(null);
    }
  };

  // Reset notes when interview selection changes
  React.useEffect(() => {
    if (interview) {
      setNotesText(interview.resultNotes || '');
    }
  }, [interview]);

  if (!isOpen || !interview || !mounted) return null;

  const { worker } = interview;

  const selfieRes = usePrivateUrl(worker?.profile_picture_url);
  const aadhaarFrontRes = usePrivateUrl(worker?.aadhaar_front_url);
  const aadhaarBackRes = usePrivateUrl(worker?.aadhaar_back_url);
  const videoRes = usePrivateUrl(worker?.video_url);

  const workerName = 
    interview.workerName ||
    (worker?.full_name && worker.full_name.trim() && worker.full_name !== 'Verified Worker' ? worker.full_name.trim() : null) ||
    (worker?.name && worker.name.trim() && worker.name !== 'Verified Worker' ? worker.name.trim() : null) ||
    (worker?.email ? worker.email.split('@')[0].charAt(0).toUpperCase() + worker.email.split('@')[0].slice(1) : null) ||
    (worker?.phone ? `Candidate (${worker.phone.slice(-4)})` : 'Registered Candidate');

  const getPublicUrl = (bucket: string, path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    return `${base}/storage/v1/object/public/${bucket}/${cleanPath}`;
  };

  const selfieUrl = selfieRes.url || (worker ? getPublicUrl('worker-selfies', worker.profile_picture_url) : '');
  const aadhaarFrontUrl = aadhaarFrontRes.url || (worker ? getPublicUrl('worker-documents', worker.aadhaar_front_url) : '');
  const aadhaarBackUrl = aadhaarBackRes.url || (worker ? getPublicUrl('worker-documents', worker.aadhaar_back_url) : '');
  const videoUrl = videoRes.url || (worker ? getPublicUrl('worker-videos', worker.video_url) : '');

  return createPortal(
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[99999] flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl h-screen bg-white shadow-2xl flex flex-col border-l border-slate-100 animate-slide-left overflow-hidden relative z-[100000]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1A73E8] flex items-center justify-center font-black text-sm shrink-0">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 flex-wrap">
                <span>Verification Interview for {workerName}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100/50">
                  {interview.status}
                </span>
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Category: {interview.category} &bull; Time Slot: {interview.time}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-gray-400 hover:text-slate-800 cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Call Action Bar */}
        {worker?.phone && (
          <div className="px-5 py-3 border-b border-slate-50 bg-emerald-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <PhoneCall size={14} className="text-emerald-700" />
              </div>
              <div>
                <span className="block text-[9px] font-black text-emerald-800 uppercase tracking-wide">Phone Interview — Call {workerName} Directly</span>
                <span className="text-sm font-black text-slate-800 tracking-wide">{worker.phone}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Tap-to-Call */}
              <a
                href={`tel:${worker.phone}`}
                className="py-2 px-3.5 bg-[#34A853] hover:bg-[#2b8a43] text-white rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
              >
                <PhoneCall size={13} />
                Call Now
              </a>
              {/* WhatsApp Direct */}
              <a
                href={`https://wa.me/91${worker.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Namaste ${workerName}! This is Sevikaa Verification Team regarding your interview call.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
              >
                <MessageSquare size={13} />
                WhatsApp
              </a>
              {/* Copy Number */}
              <button
                onClick={handleCopyPhone}
                className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copied ? <CheckCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {/* SMS Reminder */}
              <button
                onClick={handleSendSmsReminder}
                disabled={smsSent || smsSending}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border ${
                  smsSent
                    ? 'bg-blue-50 border-blue-100 text-[#1A73E8]'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                } disabled:cursor-not-allowed shadow-xs`}
              >
                {smsSent ? <CheckCheck size={13} /> : <MessageSquare size={13} />}
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
                <div className="flex items-center justify-between">
                  <span className="block text-[9.5px] font-black text-slate-700 uppercase tracking-wider">Candidate Biography</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingBio(!isEditingBio)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[#1A73E8] rounded-xl text-[10px] font-extrabold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                  >
                    <FileText size={11} />
                    <span>{isEditingBio ? 'Cancel Edit' : 'Edit Candidate Details'}</span>
                  </button>
                </div>

                {isEditingBio ? (
                  <div className="space-y-3 pt-2 border-t border-slate-100 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Category / Skills</label>
                        <select
                          value={editSkills}
                          onChange={(e) => setEditSkills(e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8]"
                        >
                          <option value="" className="text-slate-900 bg-white">Select Category...</option>
                          <option value="Cook" className="text-slate-900 bg-white">Cook / Chef</option>
                          <option value="House Maid" className="text-slate-900 bg-white">House Maid / Cleaning</option>
                          <option value="Nanny / Baby Care" className="text-slate-900 bg-white">Nanny / Baby Care</option>
                          <option value="Elderly Care" className="text-slate-900 bg-white">Elderly Care / Patient Care</option>
                          <option value="Driver" className="text-slate-900 bg-white">Driver</option>
                          <option value="Pet Care" className="text-slate-900 bg-white">Pet Care</option>
                          <option value="All Rounder" className="text-slate-900 bg-white">All Rounder / Multi-tasker</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Age</label>
                        <input
                          type="number"
                          value={editAge}
                          onChange={(e) => setEditAge(e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Gender</label>
                        <select
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8]"
                        >
                          <option value="female" className="text-slate-900 bg-white">Female</option>
                          <option value="male" className="text-slate-900 bg-white">Male</option>
                          <option value="other" className="text-slate-900 bg-white">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Experience (Years)</label>
                        <input
                          type="number"
                          value={editExperience}
                          onChange={(e) => setEditExperience(e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Expected Salary (₹/mo)</label>
                        <input
                          type="number"
                          value={editSalary}
                          onChange={(e) => setEditSalary(e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8]"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Emergency / Alternate Phone (10 Digits)</label>
                        <input
                          type="tel"
                          maxLength={10}
                          value={editEmergencyContact}
                          onChange={(e) => setEditEmergencyContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="e.g. 9876543210"
                          className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8] font-mono"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Languages Spoken</label>
                        <input
                          type="text"
                          value={editLanguages}
                          onChange={(e) => setEditLanguages(e.target.value)}
                          placeholder="e.g. Telugu, Hindi, English"
                          className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8]"
                        />
                      </div>
                      <div className="col-span-2 relative">
                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Primary Gated Society</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={editPrimarySociety}
                            onChange={(e) => {
                              setEditPrimarySociety(e.target.value);
                              setIsSocietyDropdownOpen(true);
                            }}
                            onFocus={() => setIsSocietyDropdownOpen(true)}
                            placeholder="Type to search society..."
                            className="w-full py-1.5 pl-2.5 pr-7 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8]"
                          />
                          <button
                            type="button"
                            onClick={() => setIsSocietyDropdownOpen(!isSocietyDropdownOpen)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-700 cursor-pointer"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        {/* Searchable Scrollable Dropdown Menu (All India Address Search) */}
                        {isSocietyDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[100010] max-h-52 overflow-y-auto p-1 space-y-0.5 animate-scale-up">
                            {allSocieties
                              .filter((soc: any) => {
                                if (!editPrimarySociety) return true;
                                const q = editPrimarySociety.toLowerCase().trim();
                                return (
                                  (soc.name && soc.name.toLowerCase().includes(q)) ||
                                  (soc.address && soc.address.toLowerCase().includes(q)) ||
                                  (soc.locality && soc.locality.toLowerCase().includes(q)) ||
                                  (soc.city && soc.city.toLowerCase().includes(q)) ||
                                  (soc.pincode && String(soc.pincode).includes(q))
                                );
                              })
                              .map((soc: any) => (
                                <button
                                  key={soc.id || soc.name}
                                  type="button"
                                  onClick={() => {
                                    setEditPrimarySociety(soc.name);
                                    setIsSocietyDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                                >
                                  <span className="font-extrabold">{soc.name}</span>
                                  <span className="text-[10px] text-gray-400 font-semibold">
                                    {[soc.city, soc.pincode].filter(Boolean).join(' • ')}
                                  </span>
                                </button>
                              ))}
                            {allSocieties.filter((soc: any) => {
                              if (!editPrimarySociety) return true;
                              const q = editPrimarySociety.toLowerCase().trim();
                              return (
                                (soc.name && soc.name.toLowerCase().includes(q)) ||
                                (soc.address && soc.address.toLowerCase().includes(q)) ||
                                (soc.locality && soc.locality.toLowerCase().includes(q)) ||
                                (soc.city && soc.city.toLowerCase().includes(q)) ||
                                (soc.pincode && String(soc.pincode).includes(q))
                              );
                            }).length === 0 && (
                              <div className="px-3 py-2 text-xs text-gray-500 font-semibold italic text-center">
                                Using custom society: "{editPrimarySociety}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveAdminBioEdit}
                      disabled={savingBio}
                      className="w-full py-2 px-3 bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      {savingBio ? 'Saving Changes...' : 'Save & Sync Candidate Details'}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4 text-xs font-bold text-slate-700">
                    <div className="space-y-0.5 col-span-2 sm:col-span-1">
                      <span className="block text-[9px] text-gray-400 uppercase font-extrabold">Full Name</span>
                      <span className="text-slate-900 font-black">{workerName}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] text-gray-400 uppercase font-extrabold">Age / Gender</span>
                      <span>{worker.age || 'N/A'} yrs / {worker.gender || 'N/A'}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] text-gray-400 uppercase font-extrabold">Experience</span>
                      <span>{worker.experience_years || 0} years</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] text-gray-400 uppercase font-extrabold">Expected Salary</span>
                      <span className="text-[#34A853] font-black">₹{worker.expected_salary || 0}/mo</span>
                    </div>
                    <div className="space-y-0.5 col-span-2 sm:col-span-1">
                      <span className="block text-[9px] text-gray-400 uppercase font-extrabold">Phone</span>
                      <span className="break-all">{worker.phone || 'N/A'}</span>
                    </div>
                    <div className="space-y-0.5 col-span-2 sm:col-span-1">
                      <span className="block text-[9px] text-gray-400 uppercase font-extrabold">Emergency Contact</span>
                      <span className="break-all">{worker.emergency_contact || 'N/A'}</span>
                    </div>
                    <div className="space-y-0.5 col-span-2 sm:col-span-1">
                      <span className="block text-[9px] text-gray-400 uppercase font-extrabold">Primary Gated Society</span>
                      <span className="text-slate-900 font-black flex items-center gap-1">
                        <Building2 size={12} className="text-[#1A73E8]" />
                        <span>{worker.primary_society_id || worker.society || 'Not Assigned'}</span>
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] text-gray-400 uppercase font-extrabold">Status</span>
                      <span className="capitalize px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-full text-[9px] font-black inline-block">{worker.status || 'Pending'}</span>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <span className="block text-[9px] text-gray-400 uppercase font-black">Languages Spoken</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      const langs = (worker.languages_spoken && Array.isArray(worker.languages_spoken) && worker.languages_spoken.length > 0)
                        ? worker.languages_spoken
                        : (worker.languages && Array.isArray(worker.languages) && worker.languages.length > 0)
                          ? worker.languages
                          : (worker.preferred_language
                              ? [
                                  { hi: 'Hindi', en: 'English', kn: 'Kannada', ta: 'Tamil', te: 'Telugu', bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi', ml: 'Malayalam', as: 'Assamese', ne: 'Nepali' }[worker.preferred_language as string] || worker.preferred_language
                                ]
                              : []);
                      if (langs.length === 0) {
                        return <span className="text-[10px] text-gray-400 italic">None logged / Not selected</span>;
                      }
                      return langs.map((lang: string) => (
                        <span key={lang} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-full text-[9.5px] font-extrabold uppercase shadow-2xs">
                          {lang}
                        </span>
                      ));
                    })()}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="block text-[10px] font-black text-slate-800 uppercase tracking-wider">Candidate Verification Assets</span>
                  <span className="text-[9px] text-gray-400 font-bold">4 Verified Media Documents</span>
                </div>
                <button
                  type="button"
                  onClick={handleSendUploadLinkSms}
                  className="px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100 text-emerald-800 rounded-xl text-[10.5px] font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <MessageSquare size={13} />
                  <span>{uploadLinkSent ? 'SMS Upload Link Sent ✓' : 'Send 1-Click Photo Upload Link (SMS)'}</span>
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                
                {/* 1. Selfie Photo */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between items-center text-center space-y-2.5 min-h-[140px] hover:border-slate-300 transition-all">
                  <span className="text-[9.5px] font-black text-slate-600 uppercase tracking-wide">1. Selfie Photo</span>
                  {selfieUrl ? (
                    <div className="space-y-2 w-full">
                      <span className="px-2 py-0.5 bg-emerald-50 text-[#34A853] border border-emerald-200 rounded-full text-[9px] font-black inline-block">
                        Uploaded ✓
                      </span>
                      <button 
                        type="button"
                        onClick={() => setPreviewMedia({ url: selfieUrl, title: `${workerName} - Selfie Photo`, type: 'image' })}
                        className="w-full py-1.5 px-2 bg-white border border-slate-200 hover:bg-blue-50 text-[#1A73E8] rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <FileText size={11} /> Inspect Selfie
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 my-auto w-full">
                      <span className="px-2 py-0.5 bg-slate-100 text-gray-400 rounded-full text-[9px] font-black inline-block">
                        Not Uploaded
                      </span>
                      <label className="w-full py-1.5 px-2 bg-[#34A853] hover:bg-emerald-700 text-white rounded-xl text-[9.5px] font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95">
                        <span>{adminUploadingAsset === 'profile_picture_url' ? 'Uploading...' : '💬 WhatsApp File'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleAdminDirectUpload('profile_picture_url', e.target.files[0]);
                            }
                          }} 
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* 2. Aadhaar Front Card */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between items-center text-center space-y-2.5 min-h-[140px] hover:border-slate-300 transition-all">
                  <span className="text-[9.5px] font-black text-slate-600 uppercase tracking-wide">2. Aadhaar Front</span>
                  {aadhaarFrontUrl ? (
                    <div className="space-y-2 w-full">
                      <span className="px-2 py-0.5 bg-emerald-50 text-[#34A853] border border-emerald-200 rounded-full text-[9px] font-black inline-block">
                        Uploaded ✓
                      </span>
                      <button 
                        type="button"
                        onClick={() => setPreviewMedia({ url: aadhaarFrontUrl, title: `${workerName} - Aadhaar Front Card`, type: 'image' })}
                        className="w-full py-1.5 px-2 bg-white border border-slate-200 hover:bg-blue-50 text-[#1A73E8] rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <FileText size={11} /> Inspect Front
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 my-auto w-full">
                      <span className="px-2 py-0.5 bg-slate-100 text-gray-400 rounded-full text-[9px] font-black inline-block">
                        Not Uploaded
                      </span>
                      <label className="w-full py-1.5 px-2 bg-[#34A853] hover:bg-emerald-700 text-white rounded-xl text-[9.5px] font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95">
                        <span>{adminUploadingAsset === 'aadhaar_front_url' ? 'Uploading...' : '💬 WhatsApp File'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleAdminDirectUpload('aadhaar_front_url', e.target.files[0]);
                            }
                          }} 
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* 3. Aadhaar Back Card */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between items-center text-center space-y-2.5 min-h-[140px] hover:border-slate-300 transition-all">
                  <span className="text-[9.5px] font-black text-slate-600 uppercase tracking-wide">3. Aadhaar Back</span>
                  {aadhaarBackUrl ? (
                    <div className="space-y-2 w-full">
                      <span className="px-2 py-0.5 bg-emerald-50 text-[#34A853] border border-emerald-200 rounded-full text-[9px] font-black inline-block">
                        Uploaded ✓
                      </span>
                      <button 
                        type="button"
                        onClick={() => setPreviewMedia({ url: aadhaarBackUrl, title: `${workerName} - Aadhaar Back Card`, type: 'image' })}
                        className="w-full py-1.5 px-2 bg-white border border-slate-200 hover:bg-blue-50 text-[#1A73E8] rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <FileText size={11} /> Inspect Back
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 my-auto w-full">
                      <span className="px-2 py-0.5 bg-slate-100 text-gray-400 rounded-full text-[9px] font-black inline-block">
                        Not Uploaded
                      </span>
                      <label className="w-full py-1.5 px-2 bg-[#34A853] hover:bg-emerald-700 text-white rounded-xl text-[9.5px] font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95">
                        <span>{adminUploadingAsset === 'aadhaar_back_url' ? 'Uploading...' : '💬 WhatsApp File'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleAdminDirectUpload('aadhaar_back_url', e.target.files[0]);
                            }
                          }} 
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* 4. Verification Video */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between items-center text-center space-y-2.5 min-h-[140px] hover:border-slate-300 transition-all">
                  <span className="text-[9.5px] font-black text-slate-600 uppercase tracking-wide">4. Intro Video (15s)</span>
                  {videoUrl ? (
                    <div className="space-y-2 w-full">
                      <span className="px-2 py-0.5 bg-emerald-50 text-[#34A853] border border-emerald-200 rounded-full text-[9px] font-black inline-block">
                        Uploaded ✓
                      </span>
                      <button 
                        type="button"
                        onClick={() => setPreviewMedia({ url: videoUrl, title: `${workerName} - 15s Intro Video`, type: 'video' })}
                        className="w-full py-1.5 px-2 bg-white border border-slate-200 hover:bg-blue-50 text-[#1A73E8] rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <PlayCircle size={11} /> Play Video
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendUploadLinkSms()}
                        className="w-full py-1 px-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/70 rounded-lg text-[8.5px] font-extrabold cursor-pointer transition-all"
                      >
                        Request Retake
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 my-auto">
                      <span className="px-2 py-0.5 bg-slate-100 text-gray-400 rounded-full text-[9px] font-black inline-block">
                        Not Uploaded
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 💬 Official WhatsApp Reception Notice Banner */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-emerald-900 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <span>Candidates can also send selfie &amp; Aadhaar photos to official Sevikaa WhatsApp: <strong>+91 7096093039</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleSendUploadLinkSms}
                  className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-[9.5px] font-black hover:bg-emerald-100 transition-colors shadow-2xs whitespace-nowrap"
                >
                  {uploadLinkSent ? 'SMS Sent ✓' : 'Send SMS Link'}
                </button>
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
                <button
                  type="button"
                  onClick={() => {
                    if (notesText.trim()) {
                      onLogResult(interview.id, interview.result || 'Pass', notesText.trim());
                    }
                  }}
                  disabled={!notesText.trim()}
                  className="w-full mt-2 py-2 px-3 bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                >
                  <MessageSquare size={13} />
                  <span>Send &amp; Save Feedback Notes</span>
                </button>
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
              onClick={() => setIsRescheduleOpen(true)}
              className="w-full sm:w-auto py-2.5 px-4 border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
            >
              <Calendar size={14} />
              Reschedule &amp; Select Time
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

        {/* Reschedule Date & Time Picker Sub-Modal */}
        {isRescheduleOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100001] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <Calendar size={18} className="text-[#1A73E8]" />
                  <h4 className="text-sm font-black">Reschedule Verification Interview</h4>
                </div>
                <button 
                  onClick={() => setIsRescheduleOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-full text-gray-400 hover:text-slate-800 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-[10px] text-gray-500 font-bold">
                Select a new date and time slot for <strong>{workerName}</strong>. An automated DLT SMS notification will be dispatched instantly.
              </p>

              {/* Date Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500">Interview Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Time Slot Presets */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500">Time Slot</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    '09:00 AM (Morning)',
                    '11:30 AM (Mid-Day)',
                    '02:30 PM (Afternoon)',
                    '05:00 PM (Late Afternoon)'
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-2 px-2.5 rounded-xl text-[10px] font-bold border transition-all text-center cursor-pointer ${
                        selectedTimeSlot === slot
                          ? 'bg-[#1A73E8] text-white border-[#1A73E8] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500">Reschedule Reason / Admin Notes</label>
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="e.g. Candidate requested afternoon shift call due to work..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none resize-none text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRescheduleOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const formattedDate = new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    const resMsg = `Rescheduled to ${formattedDate} at ${selectedTimeSlot}. ${customReason ? 'Reason: ' + customReason : ''}`;
                    onLogResult(interview.id, 'Re-interview', resMsg);
                    setIsRescheduleOpen(false);
                    onClose();
                  }}
                  className="flex-1 py-2.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm active:scale-95"
                >
                  Confirm &amp; Send DLT SMS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* In-App Enlarged Image & Video Media Lightbox Modal (Clean Light Mode) */}
        {previewMedia && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100005] flex flex-col items-center justify-center p-4 animate-fade-in"
            onClick={() => setPreviewMedia(null)}
          >
            <div 
              className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-5 flex flex-col space-y-3 relative shadow-2xl animate-scale-up overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 px-1">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#1A73E8]" />
                  <h4 className="text-xs font-black text-slate-800">{previewMedia.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-xl transition-all"
                  >
                    Open Original Tab ↗
                  </a>
                  <button 
                    onClick={() => setPreviewMedia(null)}
                    className="p-1 hover:bg-slate-100 text-gray-400 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center min-h-[420px] max-h-[72vh] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden p-3 relative">
                {previewMedia.type === 'video' ? (
                  <video 
                    src={previewMedia.url} 
                    controls 
                    autoPlay 
                    className="max-h-[68vh] w-auto max-w-full rounded-xl shadow-sm border border-slate-200" 
                  />
                ) : (
                  <img 
                    src={previewMedia.url} 
                    alt={previewMedia.title} 
                    className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-sm border border-slate-200" 
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
