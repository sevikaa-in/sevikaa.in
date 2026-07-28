"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Check, Camera, FileText, Video, RotateCw, ZoomIn, ZoomOut, 
  ShieldCheck, Calendar, MapPin, Phone, Mail, User, ShieldAlert, Award, Globe
} from 'lucide-react';
import { isRegionalScript, translateToEnglish } from '@/lib/adminTranslator';

interface WorkerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: any;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdateBadge: (badgeKey: string, status: 'Pending' | 'Verified' | 'Rejected') => void;
}

const getPublicUrl = (bucketName: string, path: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl) return `/${path}`; // Fallback if env not set
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
};

export const WorkerDetailModal: React.FC<WorkerDetailModalProps> = ({
  isOpen,
  onClose,
  worker,
  onUpdateStatus,
  onUpdateBadge
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<'selfie' | 'aadhaar_front' | 'aadhaar_back' | 'video'>('selfie');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [notes, setNotes] = useState('');
  const [isTranslated, setIsTranslated] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !worker || !mounted) return null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(2.5, prev + 0.2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.5, prev - 0.2));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const resetTransform = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const applyNoteTemplate = (tpl: string) => {
    setNotes(prev => prev ? `${prev}\n${tpl}` : tpl);
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

            <div className="border-t border-slate-100 pt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Emergency Contact</span>
                <span className="text-slate-700 font-semibold truncate block">{worker.emergency_contact || 'None Listed'}</span>
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Preferred Sector / Society</span>
                <span className="text-slate-700 font-semibold flex items-center gap-0.5 min-w-0">
                  <MapPin size={10} className="text-slate-400 shrink-0" />
                  <span className="truncate">{worker.preferred_society_name || 'N/A'}</span>
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3.5 flex flex-wrap gap-1.5">
              {worker.skills?.map((skill: string) => (
                <span key={skill} className="bg-[#1A73E8]/10 text-[#1A73E8] px-2.5 py-1 rounded-xl text-[9.5px] font-black uppercase">
                  {skill}
                </span>
              ))}
              {worker.languages_spoken?.map((lang: string) => (
                <span key={lang} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl text-[9.5px] font-black uppercase">
                  {lang}
                </span>
              ))}
            </div>

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
                {isTranslated 
                  ? translateToEnglish(worker.bio || worker.notes || 'Verified candidate profile.') 
                  : (worker.bio || worker.notes || 'Verified candidate profile.')}
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
                    src={getPublicUrl('worker-selfies', worker.profile_picture_url)} 
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
                    src={getPublicUrl('worker-documents', worker.aadhaar_front_url)} 
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
                    src={getPublicUrl('worker-documents', worker.aadhaar_back_url)} 
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

              {activeDocTab === 'video' && (
                worker.video_url ? (
                  <video 
                    controls 
                    src={getPublicUrl('worker-videos', worker.video_url)} 
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
                { key: 'aadhaar', label: 'Aadhaar ID Card Verification' },
                { key: 'police', label: 'Police PCC Background Verification' },
                { key: 'interview', label: 'In-Person / Phone Admin Interview' },
                { key: 'video', label: 'Video Introduction Verification' },
                { key: 'profile', label: 'Overall Profile Approval Status' }
              ].map((badge) => {
                const currentStatus = worker.badges?.[badge.key] || 'Pending';
                return (
                  <div key={badge.key} className="p-3 bg-slate-50/70 rounded-xl space-y-2 border border-slate-100/50">
                    <span className="text-[9.5px] font-bold text-slate-600 block">{badge.label}</span>
                    <div className="flex gap-1">
                      {['Pending', 'Verified', 'Rejected'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => onUpdateBadge(badge.key, status as any)}
                          className={`flex-1 py-1 rounded-lg text-[8.5px] font-black uppercase active:scale-95 transition-all cursor-pointer ${
                            currentStatus === status
                              ? status === 'Verified'
                                ? 'bg-[#34A853] text-white shadow-sm'
                                : status === 'Rejected'
                                ? 'bg-[#EA4335] text-white shadow-sm'
                                : 'bg-[#FBBC05] text-[#202124] shadow-sm'
                              : 'bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
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
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white shrink-0 shadow-lg">
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
              onClick={() => {
                onUpdateStatus(worker.id, 'admin_interview');
                onClose();
              }}
              className="flex-1 sm:flex-initial py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border border-amber-200/50"
            >
              Move to Interview
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Close Drawer
            </button>
            <button
              onClick={() => {
                onUpdateStatus(worker.id, 'live');
                onClose();
              }}
              className="py-2.5 px-5 bg-[#34A853] hover:bg-[#2b8a43] text-white rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md shadow-[#34A853]/20 flex items-center gap-1.5"
            >
              <Check size={15} strokeWidth={3} />
              Approve Live Profile
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

