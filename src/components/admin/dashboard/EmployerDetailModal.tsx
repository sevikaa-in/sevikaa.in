"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Check, Mail, Phone, MapPin, Calendar, CreditCard, 
  Briefcase, Sparkles, ShieldAlert, AlertTriangle, ShieldCheck,
  ZoomIn, ZoomOut, RotateCw, Camera, FileText, Maximize2, Globe, RotateCcw, Lock
} from 'lucide-react';
import { isRegionalScript, translateToEnglish } from '@/lib/adminTranslator';
import { supabase } from '../../../lib/supabaseClient';
import { usePrivateUrl } from '@/hooks/usePrivateUrl';

interface EmployerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employer: any;
  onApproveEmployer: (id: string) => void;
  onRejectEmployer: (id: string) => void;
  onUnapproveEmployer?: (id: string) => void;
  onRequestChanges?: (id: string, note: string) => void;
  onUpdateBadge?: (badgeKey: string, status: 'Pending' | 'Verified' | 'Rejected') => void;
}

export const EmployerDetailModal: React.FC<EmployerDetailModalProps> = ({
  isOpen,
  onClose,
  employer,
  onApproveEmployer,
  onRejectEmployer,
  onUnapproveEmployer,
  onRequestChanges,
  onUpdateBadge
}) => {
  const [mounted, setMounted] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState('');

  // Resolved Document URLs (handles public URLs and signed private Cloudinary refs)
  const avatarRes = usePrivateUrl(employer?.avatar_url || employer?.profile_photo_url);
  const residencyRes = usePrivateUrl(employer?.residency_proof_url || employer?.maintenance_bill_url);
  const aadhaarFrontRes = usePrivateUrl(employer?.aadhaar_front_url);
  const aadhaarBackRes = usePrivateUrl(employer?.aadhaar_back_url);

  // Document inspection state
  const [activeDocTab, setActiveDocTab] = useState<'profile_photo' | 'selfie' | 'residency_proof' | 'aadhaar_front' | 'aadhaar_back'>('profile_photo');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const resetTransform = () => { setZoomLevel(1); setRotation(0); };

  const [isTranslated, setIsTranslated] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !employer) return;

    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (isPlaceholder) {
      setJobs([]);
      return;
    }

    const fetchJobs = async () => {
      setLoadingJobs(true);
      const empId = employer.user_id || employer.id;
      if (!empId) {
        setJobs([]);
        setLoadingJobs(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .or(`employer_id.eq.${empId},user_id.eq.${empId}`);
        
        if (!error && Array.isArray(data)) {
          setJobs(data);
        } else {
          const { webApiClient } = await import('@/lib/webApiClient');
          const jData = await webApiClient.get('/api/admin/data?tab=jobs');
          if (jData && Array.isArray(jData.jobs)) {
            const filtered = jData.jobs.filter((j: any) => j.employer_id === empId || j.user_id === empId);
            setJobs(filtered);
          }
        }
      } catch (err) {
        console.warn("Employer jobs fetch notice:", err);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [isOpen, employer]);

  if (!isOpen || !employer || !mounted) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
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
              {employer.name ? employer.name[0] : 'E'}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>{employer.name}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  employer.status === 'live' || employer.status === 'approved' 
                    ? 'bg-emerald-50 text-[#34A853] border border-emerald-200/50' 
                    : employer.status === 'suspended' || employer.status === 'rejected'
                    ? 'bg-red-50 text-[#EA4335] border border-red-200/50'
                    : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                }`}>
                  {employer.status?.replace('_', ' ')}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Employer Profile Audit &bull; ID: <span className="font-mono text-slate-600">{employer.id}</span></p>
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

          {/* Deletion Pending Call Verification Box */}
          {employer.status === 'deletion_requested' && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-amber-700" />
                  <h4 className="text-xs font-black text-amber-900">Employer Account Deletion Requested</h4>
                </div>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[8px] font-black uppercase">
                  Call Verification Pending
                </span>
              </div>

              <p className="text-[11px] text-amber-900/90 font-medium">
                Stated Offboarding Reason: <strong>"{employer.offboarding_reason || 'Already hired domestic worker'}"</strong>
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                <a 
                  href={`tel:${employer.phone}`}
                  className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                >
                  <Phone size={13} />
                  <span>Call Employer ({employer.phone || '+91 98765 43210'})</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onApproveEmployer(employer.id);
                      onClose();
                    }}
                    className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
                  >
                    Restore Profile Live
                  </button>
                  <button
                    onClick={() => {
                      onRejectEmployer(employer.id);
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
          
          {/* Metadata Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Employer Identity Metadata</span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-3 text-xs font-bold text-slate-700">
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Account Type</span>
                <span className="inline-flex items-center gap-1 text-[#1A73E8] bg-blue-50 px-2 py-0.5 rounded text-[10px] font-black uppercase mt-0.5">
                  <CreditCard size={10} />
                  {employer.subscription_status || 'Free'} Pass
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Signup Date</span>
                <span className="flex items-center gap-1 text-slate-700 mt-0.5">
                  <Calendar size={10} className="text-slate-400" />
                  {formatDate(employer.signup_date || employer.created_at)}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Household / Company</span>
                <span className="text-slate-800 font-extrabold mt-0.5 block">{employer.company_name || 'Individual Household'}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Primary Phone</span>
                <span className="flex items-center gap-1 text-slate-700 mt-0.5 font-bold">
                  <Phone size={10} className="text-slate-400" />
                  {employer.phone || 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Alternate Contact</span>
                <span className="flex items-center gap-1 text-slate-700 mt-0.5 font-bold">
                  <Phone size={10} className="text-slate-400" />
                  {employer.alternate_phone || employer.alt_phone || 'None Listed'}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Email Address</span>
                <span className="flex items-center gap-1 text-slate-700 mt-0.5 font-bold">
                  <Mail size={10} className="text-slate-400" />
                  <span className="truncate">{employer.email || 'N/A'}</span>
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Residential Gated Society</span>
                <span className="flex items-center gap-1 text-slate-800 font-extrabold bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <MapPin size={12} className="text-[#1A73E8] shrink-0" />
                  <span>
                    {(() => {
                      if (employer.society_name && employer.society_name.trim()) return employer.society_name.trim();
                      if (employer.preferred_society && employer.preferred_society.trim()) return employer.preferred_society.trim();
                      const rawAddr = employer.billing_address || employer.address || '';
                      if (rawAddr) {
                        const parts = rawAddr.split(',').map((p: string) => p.trim());
                        const societyPart = parts.find((p: string) => !/^(flat|apt|unit|house|no\.|building|\d+)/i.test(p));
                        if (societyPart) return societyPart;
                      }
                      return 'N/A';
                    })()}
                  </span>
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Tower / Flat Number & Address</span>
                <span className="flex items-start gap-1 text-slate-700 font-semibold bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>{employer.tower_block ? `${employer.tower_block} • ` : ''}{employer.billing_address || employer.address || 'Bangalore'}, {employer.city || 'Kolkata'} {employer.pincode ? `(${employer.pincode})` : ''}</span>
                </span>
              </div>
              {employer.gstin && (
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Tax GSTIN / Business ID</span>
                  <span className="flex items-center gap-1.5 text-slate-800 font-mono font-bold bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <FileText size={12} className="text-slate-400 shrink-0" />
                    <span>{employer.gstin}</span>
                  </span>
                </div>
              )}
              <div className={employer.gstin ? 'col-span-1' : 'col-span-1 sm:col-span-2'}>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Preferred Helper Verification Standard</span>
                <span className="flex items-center gap-1.5 text-blue-900 font-black bg-blue-50/80 p-2 rounded-xl border border-blue-100">
                  <ShieldCheck size={14} className="text-[#1A73E8] shrink-0" />
                  <span className="truncate">{employer.verification_pref || employer.verification_requirement || 'Aadhaar Card + Police Audit Required'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* 🔍 EMPLOYER IDENTITY DOCUMENT INSPECTOR */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#1A73E8]" />
                Employer Document Inspector
              </span>
              <div className="flex gap-1">
                <button onClick={handleZoomIn} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer transition-all" title="Zoom In"><ZoomIn size={13} /></button>
                <button onClick={handleZoomOut} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer transition-all" title="Zoom Out"><ZoomOut size={13} /></button>
                <button onClick={handleRotate} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer transition-all" title="Rotate 90°"><RotateCw size={13} /></button>
              </div>
            </div>

            {/* Document Selection Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold text-slate-600 overflow-x-auto">
              {[
                { id: 'profile_photo', label: 'Profile Photo', icon: <Camera size={11} /> },
                { id: 'residency_proof', label: 'Maintenance Bill / Rent Receipt', icon: <Globe size={11} /> },
                { id: 'aadhaar_front', label: 'Aadhaar Front', icon: <FileText size={11} /> },
                { id: 'aadhaar_back', label: 'Aadhaar Back', icon: <FileText size={11} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveDocTab(tab.id as any);
                    resetTransform();
                  }}
                  className={`flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
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

            {/* Viewer Canvas */}
            <div className="relative w-full h-[320px] bg-slate-900/5 rounded-2xl overflow-hidden flex items-center justify-center p-3 border border-slate-100">
              {activeDocTab === 'profile_photo' && (
                (avatarRes.url || employer.avatar_url || employer.profile_photo_url) ? (
                  <img 
                    src={avatarRes.url || employer.avatar_url || employer.profile_photo_url || undefined} 
                    alt="Employer Profile Photo" 
                    className="max-h-full max-w-full object-contain transition-transform duration-200 rounded-lg shadow-sm"
                    style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
                  />
                ) : (
                  <div className="text-center space-y-2 p-4 text-slate-400">
                    <Camera size={32} className="mx-auto text-slate-300" />
                    <span className="block text-xs font-bold">Employer Household Photo Uploaded</span>
                    <p className="text-[10px] text-slate-400">Public profile photo shown to workers on job postings</p>
                  </div>
                )
              )}

              {activeDocTab === 'residency_proof' && (
                (residencyRes.url || employer.residency_proof_url || employer.maintenance_bill_url) ? (
                  <img 
                    src={residencyRes.url || employer.residency_proof_url || employer.maintenance_bill_url || undefined} 
                    alt="Society Residency Proof / Maintenance Receipt" 
                    className="max-h-full max-w-full object-contain transition-transform duration-200 rounded-lg shadow-sm"
                    style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
                  />
                ) : (
                  <div className="text-center space-y-2 p-4 text-slate-400">
                    <Globe size={32} className="mx-auto text-slate-300" />
                    <span className="block text-xs font-bold text-slate-700">Society Maintenance Bill / Rent Receipt</span>
                    <p className="text-[10px] text-slate-400">Shows Flat &amp; Tower address for instant Admin residency approval</p>
                  </div>
                )
              )}

              {activeDocTab === 'aadhaar_front' && (
                (aadhaarFrontRes.url || employer.aadhaar_front_url) ? (
                  <img 
                    src={aadhaarFrontRes.url || employer.aadhaar_front_url || undefined} 
                    alt="Aadhaar Front" 
                    className="max-h-full max-w-full object-contain transition-transform duration-200 rounded-lg shadow-sm"
                    style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
                  />
                ) : (
                  <div className="text-center space-y-2 p-4 text-slate-400">
                    <FileText size={32} className="mx-auto text-slate-300" />
                    <span className="block text-xs font-bold">Aadhaar Front Scan Uploaded</span>
                    <p className="text-[10px] text-slate-400">Contains photo, full name &amp; date of birth</p>
                  </div>
                )
              )}

              {activeDocTab === 'aadhaar_back' && (
                (aadhaarBackRes.url || employer.aadhaar_back_url) ? (
                  <img 
                    src={aadhaarBackRes.url || employer.aadhaar_back_url || undefined} 
                    alt="Aadhaar Back" 
                    className="max-h-full max-w-full object-contain transition-transform duration-200 rounded-lg shadow-sm"
                    style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
                  />
                ) : (
                  <div className="text-center space-y-2 p-4 text-slate-400">
                    <FileText size={32} className="mx-auto text-slate-300" />
                    <span className="block text-xs font-bold">Aadhaar Back Scan Uploaded</span>
                    <p className="text-[10px] text-slate-400">Contains Aadhaar number &amp; residential address</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Platform Verification Badges */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
              Platform Verification Badges
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'mobile', label: 'Mobile Phone Verification' },
                { key: 'aadhaar_front', label: 'Aadhaar Front (Identity & Photo)' },
                { key: 'aadhaar_back', label: 'Aadhaar Back (Address & Pin)' },
                { key: 'residency', label: 'Society Residence Proof Verification' },
                { key: 'interview', label: 'In-Person / Phone Admin Verification' },
                { key: 'profile', label: 'Overall Profile Approval Status' }
              ].map((badge) => {
                const currentStatus = employer.badges?.[badge.key] || (
                  badge.key === 'residency' ? (employer.is_residency_verified === true ? 'Verified' : 'Pending') :
                  badge.key === 'aadhaar_front' ? (employer.is_aadhaar_front_verified === true ? 'Verified' : 'Pending') :
                  badge.key === 'aadhaar_back' ? (employer.is_aadhaar_back_verified === true ? 'Verified' : 'Pending') :
                  badge.key === 'mobile' ? (employer.phone ? 'Verified' : 'Pending') :
                  badge.key === 'interview' ? (employer.is_interview_verified === true ? 'Verified' : 'Pending') :
                  badge.key === 'profile' ? (employer.status === 'approved' || employer.status === 'active' ? 'Verified' : 'Pending') :
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

          {/* Job Postings History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posted Jobs Overview ({jobs.length})</span>
              <span className="text-[9px] text-slate-400 font-bold">Employer requirement history</span>
            </div>

            {loadingJobs ? (
              <div className="py-6 text-center text-xs text-slate-400 font-bold animate-pulse">Loading job listings...</div>
            ) : jobs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-bold flex flex-col items-center gap-1">
                <Sparkles size={18} className="text-slate-300" />
                <span>No Job Listings Posted</span>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.id} className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800 capitalize">{job.title || `${job.category} needed`}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        job.status === 'live' || job.status === 'approved' ? 'bg-emerald-50 text-[#34A853]' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-600 font-semibold leading-relaxed line-clamp-2">
                      {job.description}
                    </p>
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 pt-1.5 border-t border-slate-100">
                      <span>Salary: ₹{job.salary_range_min || 'N/A'}/mo</span>
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Sticky Footer */}
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
                placeholder="Enter specific directions for employer (e.g. Please update society flat number or upload address proof)..."
                className="w-full p-2.5 bg-white border border-amber-300/80 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />

              <div className="flex flex-wrap gap-1.5">
                {[
                  "Please update complete society building & flat number",
                  "Contact phone number invalid, please update",
                  "Please upload valid residence proof document",
                  "Please update household requirement description"
                ].map((template) => {
                  const isSelected = requestReason.includes(template);
                  return (
                    <button
                      key={template}
                      type="button"
                      onClick={() => {
                        setRequestReason(prev => {
                          if (!prev || !prev.trim()) return `- ${template}`;
                          if (prev.includes(template)) {
                            // Toggle off
                            const lines = prev.split('\n').filter(line => !line.includes(template));
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
                    if (onRequestChanges) {
                      onRequestChanges(employer.id, requestReason.trim());
                    } else {
                      onRejectEmployer(employer.id);
                    }
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
                    onRejectEmployer(employer.id);
                    onClose();
                  }}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-red-50 hover:bg-red-100 text-[#EA4335] rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border border-red-200/50"
                >
                  Reject / Suspend Account
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
                {employer.status === 'live' || employer.status === 'approved' ? (
                  <button
                    onClick={() => {
                      const empId = employer.id || employer.user_id;
                      if (onUnapproveEmployer) {
                        onUnapproveEmployer(empId);
                      } else {
                        import('@/lib/webApiClient').then(({ webApiClient }) => {
                          webApiClient.post('/api/admin/employer/update', {
                            id: empId,
                            is_approved: false,
                            status: 'pending_review'
                          }).catch(() => {});
                        });
                      }
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
                      const isTelePassed = employer?.is_tele_onboarded === true || employer?.is_interview_verified === true;
                      if (!isTelePassed) {
                        alert(`⛔ Restricted Action: Telephonic Verification Required!\n\nThis employer account has not passed Telephonic Verification yet.\n\nPlease perform Tele-Onboarding verification first before approving the employer account Live.`);
                        return;
                      }

                      const hasName = !!(employer?.company_name || employer?.name)?.trim();
                      const hasPhone = (employer?.phone || '').replace(/\D/g, '').length >= 10;
                      const hasEmail = !!(employer?.email)?.trim();
                      const hasSociety = !!(employer?.society_name)?.trim();
                      const hasTower = !!(employer?.tower_block || employer?.tower)?.trim();
                      const hasAddress = !!(employer?.address || employer?.billing_address)?.trim();
                      const hasPhoto = !!(employer?.avatar_url || employer?.profile_photo_url);
                      const hasResidency = !!(employer?.residency_proof_url || employer?.maintenance_bill_url);
                      const hasAadhaarFront = !!employer?.aadhaar_front_url;
                      const hasAadhaarBack = !!employer?.aadhaar_back_url;

                      const steps = [hasName, hasPhone, hasEmail, hasSociety, hasTower, hasAddress, hasPhoto, hasResidency, hasAadhaarFront, hasAadhaarBack];
                      const completedCount = steps.filter(Boolean).length;
                      const is100PercentComplete = completedCount === 10;

                      if (!is100PercentComplete) {
                        alert(`⚠️ Restricted Action: Cannot approve an incomplete employer profile!\n\nProfile is currently ${completedCount * 10}% complete (${completedCount} of 10 steps).\n\nAll 10 profile steps (Employer Name, Mobile, Email, Gated Society, Tower/Block, Flat Address, Profile Photo, Residency Proof, Aadhaar Front, and Aadhaar Back) must be 100% complete before Admin approval.`);
                        return;
                      }
                      onApproveEmployer(employer.id);
                      onClose();
                    }}
                    className={`py-2.5 px-5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      !(employer?.is_tele_onboarded === true || employer?.is_interview_verified === true)
                        ? 'bg-amber-100/90 text-amber-900 border border-amber-300/80 hover:bg-amber-200/90 cursor-pointer shadow-xs'
                        : 'bg-[#34A853] hover:bg-[#2b8a43] text-white cursor-pointer shadow-md shadow-[#34A853]/20 active:scale-95'
                    }`}
                  >
                    {!(employer?.is_tele_onboarded === true || employer?.is_interview_verified === true) ? (
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

