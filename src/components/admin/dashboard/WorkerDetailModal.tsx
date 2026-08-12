"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Check, Camera, FileText, Video, RotateCw, RotateCcw, ZoomIn, ZoomOut, 
  ShieldCheck, Calendar, MapPin, Phone, PhoneCall, Mail, User, ShieldAlert, Award, Globe, Clock, Building, Lock
} from 'lucide-react';
import { isRegionalScript, translateToEnglish } from '@/lib/adminTranslator';
import { formatWorkerShift } from '@/utils/formatWorkerShift';
import { usePrivateUrl } from '@/hooks/usePrivateUrl';

interface WorkerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: any;
  onUpdateStatus: (id: string, status: string, note?: string) => void;
  onUpdateBadge: (badgeKey: string, status: 'Pending' | 'Verified' | 'Rejected') => void;
}



export const WorkerDetailModal: React.FC<WorkerDetailModalProps> = ({
  isOpen,
  onClose,
  worker,
  onUpdateStatus,
  onUpdateBadge
}) => {
  const [mounted, setMounted] = useState(false);

  // Resolved Private Cloudinary Assets
  const selfieRes = usePrivateUrl(worker?.profile_picture_url);
  const aadhaarFrontRes = usePrivateUrl(worker?.aadhaar_front_url);
  const aadhaarBackRes = usePrivateUrl(worker?.aadhaar_back_url);
  const policeDocRes = usePrivateUrl(worker?.police_verification_url);
  const videoRes = usePrivateUrl(worker?.video_url);

  const [activeDocTab, setActiveDocTab] = useState<'selfie' | 'aadhaar_front' | 'aadhaar_back' | 'police' | 'video'>('selfie');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [notes, setNotes] = useState('');
  const [isTranslated, setIsTranslated] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState('');

  if (!isOpen || !worker || !mounted) return null;

  const handleZoomIn = () => setZoomLevel((prev: number) => Math.min(2.5, prev + 0.2));
  const handleZoomOut = () => setZoomLevel((prev: number) => Math.max(0.5, prev - 0.2));
  const handleRotate = () => setRotation((prev: number) => (prev + 90) % 360);

  const resetTransform = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const applyNoteTemplate = (tpl: string) => {
    setNotes((prev: string) => prev ? `${prev}\n${tpl}` : tpl);
  };

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
              {worker.name ? worker.name[0] : (worker.full_name ? worker.full_name[0] : 'W')}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>{worker.name || worker.full_name}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  worker.status === 'live' || worker.status === 'approved' 
                    ? 'bg-emerald-50 text-[#34A853] border border-emerald-200/50' 
                    : worker.status === 'suspended' || worker.status === 'rejected'
                    ? 'bg-red-50 text-[#EA4335] border border-red-200/50'
                    : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                }`}>
                  {worker.status?.replace('_', ' ')}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Verification Workspace &bull; User ID: <span className="font-mono text-slate-600">{worker.id}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
            title="Close Drawer (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">

          {/* Deletion Pending Call Verification Box */}
          {worker.status === 'deletion_requested' && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-amber-700" />
                  <h4 className="text-xs font-black text-amber-900">User Initiated Account Deletion Request</h4>
                </div>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[8px] font-black uppercase">
                  Call Verification Pending
                </span>
              </div>

              <p className="text-[11px] text-amber-900/90 font-medium">
                Stated Offboarding Reason: <strong>"{worker.offboarding_reason || 'Moving to another city'}"</strong>
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                <a 
                  href={`tel:${worker.phone}`}
                  className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                >
                  <Phone size={13} />
                  <span>Call Candidate ({worker.phone || '+91 98765 43210'})</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onUpdateStatus(worker.id, 'approved');
                      onClose();
                    }}
                    className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
                  >
                    Restore Profile Live
                  </button>
                  <button
                    onClick={() => {
                      onUpdateStatus(worker.id, 'rejected');
                      onClose();
                    }}
                    className="py-2 px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
                  >
                    Approve &amp; Execute Deletion
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* General Metadata Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Registration Metadata</span>
              <span className="text-[9.5px] font-bold text-[#1A73E8] bg-blue-50 px-2.5 py-0.5 rounded-full">
                {worker.skills?.[0] || 'Domestic Help'}
              </span>
            </div>

            {/* Stage 1 Telephonic Verification Status Banner */}
            {(() => {
              const isTelePassed = worker.is_tele_onboarded === true || worker.is_interview_verified === true || worker.badges?.interview === 'Verified' || worker.status === 'live' || worker.status === 'approved';
              return (
                <div className={`flex items-center justify-between p-3 rounded-2xl border ${
                  isTelePassed ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900' : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PhoneCall size={16} className={isTelePassed ? "text-[#34A853] shrink-0" : "text-amber-600 shrink-0"} />
                    <div className="min-w-0">
                      <span className="text-xs font-black block truncate">
                        {isTelePassed ? 'Stage 1 Passed: Telephonic Onboarding Verified' : 'Stage 1 Pending: Telephonic Onboarding Call Required'}
                      </span>
                      <span className="text-[10px] font-medium opacity-80 block truncate">
                        {isTelePassed ? 'Candidate telephonic interview completed and details confirmed.' : 'Perform Tele-Onboarding call before final Stage 2 Live Approval.'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-[9.5px] font-black uppercase shrink-0 shadow-2xs ${
                    isTelePassed ? 'bg-[#34A853] text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {isTelePassed ? '✓ Tele-Verified' : '⏳ Call Pending'}
                  </span>
                </div>
              );
            })()}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-3 text-xs">
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Age / Gender</span>
                <span className="font-black text-slate-800 truncate block">{worker.age || 'N/A'} yrs &bull; <span className="capitalize">{worker.gender || 'N/A'}</span></span>
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Expected Salary</span>
                <span className="font-black text-slate-800 truncate block">₹{worker.expected_salary || '0'}/mo</span>
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Experience</span>
                <span className="font-black text-slate-800 truncate block">{worker.experience_years || '0'} Years</span>
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Phone</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 min-w-0">
                  <Phone size={10} className="text-slate-400 shrink-0" />
                  <span className="truncate">{worker.phone || 'N/A'}</span>
                </span>
              </div>
              <div className="col-span-2 min-w-0">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Email</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 min-w-0">
                  <Mail size={10} className="text-slate-400 shrink-0" />
                  <span className="truncate break-all">{worker.email || 'N/A'}</span>
                </span>
              </div>
            </div>

            {(() => {
              const secondarySocietiesList: string[] = (() => {
                if (Array.isArray(worker.secondary_societies) && worker.secondary_societies.length > 0) {
                  return worker.secondary_societies.filter(Boolean);
                }
                const rawSec = worker.secondary_gated_society || worker.secondary_society_name || worker.secondary_society || '';
                if (rawSec && typeof rawSec === 'string') {
                  return rawSec.split(',').map((s: string) => s.trim()).filter(Boolean);
                }
                if (Array.isArray(worker.preferred_areas) && worker.preferred_areas.length > 1) {
                  return worker.preferred_areas.slice(1).filter(Boolean);
                }
                return [];
              })();

              return (
                <div className="border-t border-slate-100 pt-3.5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
                    <div className="min-w-0">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Primary Gated Society</span>
                      <span className="text-slate-800 font-extrabold flex items-center gap-1 min-w-0 mt-0.5">
                        <MapPin size={11} className="text-[#1A73E8] shrink-0" />
                        <span className="truncate">
                          {worker.primary_gated_society || 
                           worker.preferred_society_name || 
                           worker.society_name || 
                           worker.society || 
                           worker.preferred_society || 
                           worker.societies?.name || 
                           (Array.isArray(worker.preferred_areas) && worker.preferred_areas[0]) || 
                           'Not Assigned'}
                        </span>
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Preferred Shift Slot</span>
                      <span className="text-[#1A73E8] font-extrabold flex items-center gap-1 min-w-0 mt-0.5">
                        <Clock size={11} className="text-[#1A73E8] shrink-0" />
                        <span className="truncate">{formatWorkerShift(worker.preferred_shift || worker.work_timing || worker.preferredShift, worker.availability_slots)}</span>
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Alternate / Emergency Contact</span>
                      <span className="text-slate-700 font-semibold flex items-center gap-1 min-w-0 mt-0.5">
                        <Phone size={10} className="text-slate-400 shrink-0" />
                        <span className="truncate">{worker.alternate_phone || worker.alt_phone || worker.emergency_contact || 'None Listed'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Secondary Workplace Societies Chips */}
                  <div className="space-y-1 pt-1 border-t border-slate-50">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      Secondary Workplace Societies ({secondarySocietiesList.length}/5)
                    </span>
                    {secondarySocietiesList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {secondarySocietiesList.slice(0, 5).map((soc: string, idx: number) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 rounded-xl text-xs font-extrabold shadow-2xs"
                          >
                            <Building size={12} className="text-emerald-600 shrink-0" />
                            <span>{soc}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 p-2 rounded-xl border border-slate-100 block">
                        None Listed (Only Primary Gated Society Configured)
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {(() => {
              const parseDbArray = (val: any): string[] => {
                if (Array.isArray(val)) return val.filter(Boolean);
                if (typeof val === 'string' && val.trim()) {
                  const cleaned = val.replace(/^\{|\}$/g, '').replace(/"/g, '');
                  return cleaned.split(',').map((s: string) => s.trim()).filter(Boolean);
                }
                return [];
              };
              const skillsList = parseDbArray(worker.skills).length > 0 ? parseDbArray(worker.skills) : parseDbArray(worker.category);
              const langsList = parseDbArray(worker.languages_spoken || worker.languages);

              return (
                <div className="border-t border-slate-100 pt-3.5 flex flex-wrap gap-1.5">
                  {skillsList.map((skill: string) => (
                    <span key={skill} className="bg-[#1A73E8]/10 text-[#1A73E8] px-2.5 py-1 rounded-xl text-[9.5px] font-black uppercase">
                      {skill}
                    </span>
                  ))}
                  {langsList.map((lang: string) => (
                    <span key={lang} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl text-[9.5px] font-black uppercase">
                      {lang}
                    </span>
                  ))}
                </div>
              );
            })()}

            {/* Candidate Bio / Statement with Translate Button */}
            <div className="border-t border-slate-100 pt-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Candidate Bio &amp; Profile Summary</span>
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
                {(() => {
                  const defaultText = (worker.status === 'live' || worker.status === 'approved') 
                    ? 'Verified Worker Profile.' 
                    : 'Worker Profile — Pending Verification.';
                  const textToUse = worker.bio || worker.notes || defaultText;
                  return isTranslated ? translateToEnglish(textToUse) : textToUse;
                })()}
              </p>
            </div>
          </div>

          {/* Document Viewer Frame */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Document Inspector Frame
              </span>
              {activeDocTab !== 'video' && (
                <div className="flex gap-1">
                  <button onClick={handleZoomIn} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer transition-all" title="Zoom In"><ZoomIn size={13} /></button>
                  <button onClick={handleZoomOut} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer transition-all" title="Zoom Out"><ZoomOut size={13} /></button>
                  <button onClick={handleRotate} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer transition-all" title="Rotate 90°"><RotateCw size={13} /></button>
                </div>
              )}
            </div>

            {/* Tab Selection */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold text-slate-600">
              {[
                { id: 'selfie', label: 'Selfie Photo', icon: <Camera size={11} /> },
                { id: 'aadhaar_front', label: 'Aadhaar Front', icon: <FileText size={11} /> },
                { id: 'aadhaar_back', label: 'Aadhaar Back', icon: <FileText size={11} /> },
                { id: 'police', label: 'Police Doc', icon: <ShieldCheck size={11} /> },
                { id: 'video', label: 'Intro Video', icon: <Video size={11} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveDocTab(tab.id as any);
                    resetTransform();
                  }}
                  className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg cursor-pointer transition-all ${
                    activeDocTab === tab.id 
                      ? 'bg-white text-[#1A73E8] shadow-sm font-black' 
                      : 'hover:text-slate-900'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Viewer canvas */}
            <div className="relative w-full h-[360px] bg-slate-900/5 rounded-2xl overflow-hidden flex items-center justify-center p-3 border border-slate-100">
              {activeDocTab === 'selfie' && (
                worker.profile_picture_url ? (
                  <img 
                    src={selfieRes.url} 
                    alt="Candidate Selfie" 
                    className="max-h-full max-w-full object-contain transition-transform duration-200 rounded-lg shadow-sm"
                    style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
                  />
                ) : (
                  <div className="text-center space-y-2 p-4 text-slate-400">
                    <Camera size={32} className="mx-auto text-slate-300" />
                    <span className="block text-xs font-bold">No Selfie Photo Uploaded</span>
                  </div>
                )
              )}

              {activeDocTab === 'aadhaar_front' && (
                worker.aadhaar_front_url ? (
                  <img 
                    src={aadhaarFrontRes.url} 
                    alt="Aadhaar Front" 
                    className="max-h-full max-w-full object-contain transition-transform duration-200 rounded-lg shadow-sm"
                    style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
                  />
                ) : (
                  <div className="text-center space-y-2 p-4 text-slate-400">
                    <FileText size={32} className="mx-auto text-slate-300" />
                    <span className="block text-xs font-bold">No Aadhaar Front Image Uploaded</span>
                  </div>
                )
              )}

              {activeDocTab === 'aadhaar_back' && (
                worker.aadhaar_back_url ? (
                  <img 
                    src={aadhaarBackRes.url} 
                    alt="Aadhaar Back" 
                    className="max-h-full max-w-full object-contain transition-transform duration-200 rounded-lg shadow-sm"
                    style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
                  />
                ) : (
                  <div className="text-center space-y-2 p-4 text-slate-400">
                    <FileText size={32} className="mx-auto text-slate-300" />
                    <span className="block text-xs font-bold">No Aadhaar Back Image Uploaded</span>
                  </div>
                )
              )}

              {activeDocTab === 'police' && (
                worker.police_verification_url ? (
                  <img 
                    src={policeDocRes.url} 
                    alt="Police Verification Document" 
                    className="max-h-full max-w-full object-contain transition-transform duration-200 rounded-lg shadow-sm"
                    style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
                  />
                ) : (
                  <div className="text-center space-y-2 p-4 text-slate-400">
                    <ShieldCheck size={32} className="mx-auto text-amber-400 opacity-60" />
                    <span className="block text-xs font-bold">No Police Verification Document Uploaded</span>
                  </div>
                )
              )}

              {activeDocTab === 'video' && (
                worker.video_url ? (
                  <video 
                    controls 
                    src={videoRes.url} 
                    className="max-h-full max-w-full rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="text-center space-y-2 p-4 text-slate-400">
                    <Video size={32} className="mx-auto text-slate-300" />
                    <span className="block text-xs font-bold">No Intro Video Uploaded</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Badges checklist */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
              Platform Verification Badges
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'mobile', label: 'Mobile Phone Verification' },
                { key: 'aadhaar_front', label: 'Aadhaar Front (Identity & Name)' },
                { key: 'aadhaar_back', label: 'Aadhaar Back (Address & Pin)' },
                { key: 'police', label: 'Police PCC Background Verification' },
                { key: 'interview', label: 'In-Person / Phone Admin Interview' },
                { key: 'video', label: 'Video Introduction Verification' },
                { key: 'profile', label: 'Overall Profile Approval Status' }
              ].map((badge) => {
                const currentStatus = worker.badges?.[badge.key] || (
                  badge.key === 'aadhaar_front' ? (worker.is_aadhaar_front_verified === true || worker.is_aadhaar_verified === true || worker.is_tele_onboarded === true || worker.status === 'approved' || worker.status === 'live' || Boolean(worker.aadhaar_front_url) ? 'Verified' : 'Pending') :
                  badge.key === 'aadhaar_back' ? (worker.is_aadhaar_back_verified === true || worker.is_aadhaar_verified === true || worker.is_tele_onboarded === true || worker.status === 'approved' || worker.status === 'live' || Boolean(worker.aadhaar_back_url) ? 'Verified' : 'Pending') :
                  badge.key === 'interview' ? (worker.is_interview_verified === true || worker.is_tele_onboarded === true || worker.status === 'approved' || worker.status === 'live' ? 'Verified' : 'Pending') :
                  badge.key === 'video' ? (worker.is_video_verified === true || worker.is_tele_onboarded === true || worker.status === 'approved' || worker.status === 'live' || Boolean(worker.video_url) ? 'Verified' : 'Pending') :
                  badge.key === 'police' ? (worker.is_police_verified === true || Boolean(worker.police_verification_url) ? 'Verified' : 'Pending') :
                  badge.key === 'mobile' ? (worker.phone ? 'Verified' : 'Pending') :
                  badge.key === 'profile' ? (worker.status === 'approved' || worker.status === 'live' || worker.status === 'active' ? 'Verified' : 'Pending') :
                  'Pending'
                );
                return (
                  <div key={badge.key} className="p-3 bg-slate-50/70 rounded-xl flex items-center justify-between border border-slate-100/50 gap-2">
                    <span className="text-xs font-bold text-slate-700">{badge.label}</span>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 ${
                      currentStatus === 'Verified'
                        ? 'bg-[#34A853] text-white shadow-2xs'
                        : currentStatus === 'Rejected'
                        ? 'bg-[#EA4335] text-white shadow-2xs'
                        : 'bg-[#FBBC05] text-[#202124] shadow-2xs'
                    }`}>
                      {currentStatus === 'Verified' ? '✓ VERIFIED' : currentStatus === 'Rejected' ? '✕ REJECTED' : '⏳ PENDING'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes & Template triggers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
              Auditing Notes & Action Logs
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Log document check results or candidate updates..."
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none resize-none transition-colors"
            />
            <div className="flex flex-wrap gap-1.5">
              {[
                "Selfie blurry, please re-upload",
                "Aadhaar front cut off",
                "Intro video quality low",
                "Verified successfully"
              ].map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => applyNoteTemplate(tpl)}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[9px] font-bold cursor-pointer transition-all active:scale-95 border border-slate-200/40"
                >
                  + {tpl.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Drawer Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 shadow-lg space-y-3">
          {showRequestForm ? (
            <div className="w-full bg-amber-50/80 border border-amber-200 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-amber-700" />
                  Suggest Profile Updates / Revision Directions
                </span>
                <button 
                  onClick={() => setShowRequestForm(false)}
                  className="text-xs text-amber-700 hover:text-amber-900 font-bold"
                >
                  Cancel
                </button>
              </div>

              <textarea
                rows={2}
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Enter specific directions for worker (e.g. Please re-upload clearer selfie photo or select primary society)..."
                className="w-full p-2.5 bg-white border border-amber-300/80 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />

              <div className="flex flex-wrap gap-1.5">
                {[
                  "Selfie photo is blurry, please re-upload",
                  "Aadhaar document image cut off",
                  "Please select primary society workplace",
                  "Please fill past work experience details"
                ].map((template) => {
                  const isSelected = requestReason.includes(template);
                  return (
                    <button
                      key={template}
                      type="button"
                      onClick={() => {
                        setRequestReason((prev: string) => {
                          if (!prev || !prev.trim()) return `- ${template}`;
                          if (prev.includes(template)) {
                            // Toggle off
                            const lines = prev.split('\n').filter((line: string) => !line.includes(template));
                            return lines.join('\n');
                          }
                          return `${prev}\n- ${template}`;
                        });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[9.5px] font-bold transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-amber-700 text-white border-amber-800 shadow-xs' 
                          : 'bg-amber-100/70 hover:bg-amber-200 text-amber-900 border-amber-200/60'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{template}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    if (!requestReason.trim()) return;
                    onUpdateStatus(worker.id, 'changes_requested', requestReason.trim());
                    setShowRequestForm(false);
                    onClose();
                  }}
                  disabled={!requestReason.trim()}
                  className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all disabled:opacity-50 shadow-sm"
                >
                  Send Profile Revision Directions
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    onUpdateStatus(worker.id, 'suspended');
                    onClose();
                  }}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-red-50 hover:bg-red-100 text-[#EA4335] rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border border-red-200/50"
                >
                  Suspend / Reject
                </button>
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border border-amber-200/50 flex items-center gap-1"
                >
                  <ShieldAlert size={14} />
                  Request Profile Updates
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {(worker.status === 'live' || worker.status === 'approved') ? (
                  <button
                    onClick={() => {
                      onUpdateStatus(worker.id, 'pending_verification');
                      onClose();
                    }}
                    className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                  >
                    <RotateCcw size={15} strokeWidth={2.5} />
                    Unapprove / Set Pending
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const isTelePassed = worker?.is_tele_onboarded === true || worker?.is_interview_verified === true || worker?.badges?.interview === 'Verified';
                      if (!isTelePassed) {
                        alert(`⛔ Restricted Action: Telephonic Onboarding Verification Required!\n\nThis candidate has not passed Stage 1 Telephonic Verification yet.\n\nPlease perform Tele-Onboarding verification first before marking the profile Live for employers.`);
                        return;
                      }

                      const hasName = !!(worker?.full_name || worker?.name)?.trim();
                      const hasPhone = (worker?.phone || '').replace(/\D/g, '').length >= 10;
                      const hasGenderAge = !!worker?.gender && !!worker?.age;
                      const hasSkills = Array.isArray(worker?.skills) ? worker.skills.length > 0 : !!worker?.skills;
                      const hasSalary = !!worker?.expected_salary || !!worker?.expectedSalary;
                      const hasExperience = worker?.experience_years !== undefined || !!worker?.experience;
                      const hasLanguages = Array.isArray(worker?.languages_spoken || worker?.languages) && (worker?.languages_spoken || worker?.languages).length > 0;
                      const hasPhoto = !!(worker?.profile_picture_url || worker?.avatar_url);
                      const hasAadhaarFront = !!worker?.aadhaar_front_url;
                      const hasAadhaarBack = !!worker?.aadhaar_back_url;

                      const steps = [hasName, hasPhone, hasGenderAge, hasSkills, hasSalary, hasExperience, hasLanguages, hasPhoto, hasAadhaarFront, hasAadhaarBack];
                      const completedCount = steps.filter(Boolean).length;
                      const is100PercentComplete = completedCount === 10;

                      if (!is100PercentComplete) {
                        alert(`⚠️ Restricted Action: Cannot approve an incomplete worker profile!\n\nProfile is currently ${completedCount * 10}% complete (${completedCount} of 10 steps).\n\nAll 10 profile steps (Candidate Name, Mobile, Gender & Age, Skills, Salary, Experience, Languages, Profile Photo, Aadhaar Front, and Aadhaar Back) must be 100% complete before Admin approval.`);
                        return;
                      }
                      onUpdateStatus(worker.id, 'live');
                      onClose();
                    }}
                    className={`py-2.5 px-5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      !(worker?.is_tele_onboarded === true || worker?.is_interview_verified === true || worker?.badges?.interview === 'Verified')
                        ? 'bg-amber-100/90 text-amber-900 border border-amber-300/80 hover:bg-amber-200/90 cursor-pointer shadow-xs'
                        : 'bg-[#34A853] hover:bg-[#2b8a43] text-white cursor-pointer shadow-md shadow-[#34A853]/20 active:scale-95'
                    }`}
                  >
                    {!(worker?.is_tele_onboarded === true || worker?.is_interview_verified === true || worker?.badges?.interview === 'Verified') ? (
                      <>
                        <Lock size={14} />
                        <span>🔒 Approve Live (Tele-Call Pending)</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} strokeWidth={3} />
                        <span>Approve Live Profile</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

