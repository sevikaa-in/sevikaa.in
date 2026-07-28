"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useEmployerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  User, ShieldAlert, ChevronDown, ChevronUp, Trash2, 
  Save, Phone, CreditCard, Home, MapPin, AlertTriangle, Mail, Building, ShieldCheck, Sparkles, Bell, Check, Zap, History, X,
  Upload, Camera, FileText, Lock, CheckCircle2, IdCard, Eye
} from 'lucide-react';

export default function EmployerAccountPage() {
  const { 
    employerProfile, setEmployerProfile, deletionRequested, 
    handleSaveEmployerProfile, handleRequestAccountDeletion, showToast 
  } = useEmployerDashboard();
  const { t } = useLanguage();

  const [activeInlinePreview, setActiveInlinePreview] = useState<'residency' | 'front' | 'back' | null>(null);

  const [companyName, setCompanyName] = useState(employerProfile.company_name || employerProfile.name || '');
  const [phone, setPhone] = useState(employerProfile.phone?.replace(/\D/g, '').slice(-10) || '');
  const [email, setEmail] = useState(employerProfile.email || '');
  const [towerBlock, setTowerBlock] = useState(employerProfile.tower || '');
  const [address, setAddress] = useState(employerProfile.address || '');
  const [altPhone, setAltPhone] = useState(employerProfile.alt_phone || '');
  const [verificationPref, setVerificationPref] = useState(employerProfile.verification_pref || 'Aadhaar + Police Audit (Default)');
  const [saveLoading, setSaveLoading] = useState(false);

  // ID Verification upload state
  const [residencyProofUploaded, setResidencyProofUploaded] = useState(false);
  const [residencyProofUrl, setResidencyProofUrl] = useState<string | null>(employerProfile.residency_proof_url || null);
  const [aadhaarFrontUploaded, setAadhaarFrontUploaded] = useState(false);
  const [aadhaarBackUploaded, setAadhaarBackUploaded] = useState(false);
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState<string | null>(employerProfile.aadhaar_front_url || null);
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState<string | null>(employerProfile.aadhaar_back_url || null);
  const idVerified = (residencyProofUploaded || residencyProofUrl || aadhaarFrontUploaded || aadhaarFrontUrl) && (aadhaarBackUploaded || aadhaarBackUrl);

  // Profile Photo State
  const [profilePhoto, setProfilePhoto] = useState<string | null>(employerProfile.avatar_url || null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showToast('Profile Photo: Only JPG or PNG files allowed.', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast(`Profile photo size must be under 3MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)}MB.`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(reader.result as string);
      showToast('Employer profile photo uploaded!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleResidencyProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      showToast('Residency Proof: Only JPG, PNG, or PDF files allowed.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(`File size must be under 5MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)}MB.`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setResidencyProofUrl(reader.result as string);
      setResidencyProofUploaded(true);
      showToast('Society Maintenance / Rent Agreement uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleAadhaarFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      showToast('Aadhaar Front: Only JPG, PNG, or PDF files allowed.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(`Aadhaar Front file size must be under 5MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)}MB.`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAadhaarFrontUrl(reader.result as string);
      setAadhaarFrontUploaded(true);
      showToast('Aadhaar Front card uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleAadhaarBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      showToast('Aadhaar Back: Only JPG, PNG, or PDF files allowed.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(`Aadhaar Back file size must be under 5MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)}MB.`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAadhaarBackUrl(reader.result as string);
      setAadhaarBackUploaded(true);
      showToast('Aadhaar Back card uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Communication & Notification Toggles
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  // Discrete Danger Zone State
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('Already hired domestic worker');
  const [customReason, setCustomReason] = useState('');

  // Profile completeness calculation
  const isAadhaarDone = (aadhaarFrontUploaded && aadhaarBackUploaded) || employerProfile.status === 'live' || employerProfile.status === 'approved';
  const isPhotoDone = !!profilePhoto || !!employerProfile.avatar_url;

  const completionSteps = [
    { key: 'name', label: t('stepFullName') || 'Employer Name', done: !!companyName.trim() },
    { key: 'phone', label: t('stepMobileNumber') || 'Mobile Number', done: phone.length === 10 },
    { key: 'email', label: 'Email Address', done: !!email.trim() },
    { key: 'society', label: 'Gated Society', done: !!employerProfile.society_name },
    { key: 'tower', label: 'Tower / Block', done: !!towerBlock.trim() },
    { key: 'address', label: 'Flat Address', done: !!address.trim() },
    { key: 'photo', label: t('stepProfilePhoto') || 'Profile Photo', done: isPhotoDone },
    { key: 'aadhaar', label: t('stepAadhaarUploaded') || 'Aadhaar Uploaded', done: isAadhaarDone }
  ];

  const completedCount = completionSteps.filter(s => s.done).length;
  const completionPercent = Math.round((completedCount / completionSteps.length) * 100);

  // Strict Input Handlers
  const handleNameChange = (val: string) => {
    const lettersOnly = val.replace(/[^a-zA-Z\s]/g, '');
    setCompanyName(lettersOnly);
  };

  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleAltPhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setAltPhone(digitsOnly);
  };

  const onSave = async () => {
    if (phone.length !== 10) {
      showToast("Please enter a valid 10-digit mobile number.", "error");
      return;
    }
    setSaveLoading(true);
    try {
      if (typeof handleSaveEmployerProfile === 'function') {
        await handleSaveEmployerProfile({
          company_name: companyName,
          name: companyName,
          phone: `+91 ${phone}`,
          email,
          tower: towerBlock,
          address,
          alt_phone: altPhone,
          verification_pref: verificationPref,
          avatar_url: profilePhoto || employerProfile.avatar_url
        });
      } else {
        setEmployerProfile((prev: any) => ({
          ...prev,
          company_name: companyName,
          phone: `+91 ${phone}`,
          email,
          tower: towerBlock,
          address,
          alt_phone: altPhone,
          verification_pref: verificationPref
        }));
        showToast("Household account & verification details updated!", "success");
      }
    } catch (err: any) {
      showToast(`Error saving profile: ${err.message}`, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const [saveDocsLoading, setSaveDocsLoading] = useState(false);

  const onSaveDocuments = async () => {
    setSaveDocsLoading(true);
    try {
      if (typeof handleSaveEmployerProfile === 'function') {
        await handleSaveEmployerProfile({
          ...employerProfile,
          residency_proof_url: residencyProofUrl || employerProfile.residency_proof_url,
          aadhaar_front_url: aadhaarFrontUrl || employerProfile.aadhaar_front_url,
          aadhaar_back_url: aadhaarBackUrl || employerProfile.aadhaar_back_url,
        });
      } else {
        setEmployerProfile((prev: any) => ({
          ...prev,
          residency_proof_url: residencyProofUrl || prev.residency_proof_url,
          aadhaar_front_url: aadhaarFrontUrl || prev.aadhaar_front_url,
          aadhaar_back_url: aadhaarBackUrl || prev.aadhaar_back_url,
        }));
      }
      showToast("Identity & verification document proofs saved successfully!", "success");
    } catch (err: any) {
      showToast(`Error saving documents: ${err.message}`, 'error');
    } finally {
      setSaveDocsLoading(false);
    }
  };

  const onSubmitDeletionRequest = async () => {
    const finalReason = deletionReason === 'Other' ? customReason : deletionReason;
    await handleRequestAccountDeletion(finalReason);
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-24 mx-auto">
      
      {/* 👑 PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <User size={22} className="text-[#1A73E8]" />
            <span>{t('employerAccountTitle') || "Household & Employer Account"}</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            {t('employerAccountSub') || "Manage your residential address, contact details, subscription tier, and security preferences."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 border shadow-2xs ${
            employerProfile.status === 'live' || employerProfile.status === 'approved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : employerProfile.status === 'changes_requested'
              ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
              : 'bg-blue-50 text-[#1A73E8] border-blue-200'
          }`}>
            <ShieldCheck size={14} />
            <span>{employerProfile.status === 'changes_requested' ? '⚠️ Revision Requested' : employerProfile.status === 'live' ? '🟢 Account Active' : '⏳ Pending Audit'}</span>
          </span>
        </div>
      </div>

      {/* ⚠️ ADMIN REVISION DIRECTIONS CALLOUT CARD */}
      {(employerProfile?.admin_note || employerProfile?.adminNote || employerProfile?.status === 'changes_requested') && (
        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-3xl space-y-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0 shadow-sm">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-950">⚠️ Admin Audit Feedback & Required Account Updates</h3>
              <p className="text-[11px] text-amber-800 font-semibold mt-0.5">Please review the specific directions below and update your account details accordingly before resubmitting.</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 text-xs font-semibold text-slate-800 whitespace-pre-line leading-relaxed shadow-xs">
            {employerProfile.admin_note || employerProfile.adminNote || 'Please review your account details and residence proof documents to ensure accuracy.'}
          </div>
        </div>
      )}

      {/* 🏡 HERO HOUSEHOLD PROFILE & COMPLETENESS CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl space-y-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Building size={240} className="text-white" />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
          {/* Profile Photo Uploader */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-700 border-4 border-white/20 shadow-lg flex items-center justify-center text-slate-300 font-black text-2xl">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                companyName ? companyName[0].toUpperCase() : 'H'
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-full cursor-pointer shadow-md transition-transform hover:scale-110 active:scale-95 border-2 border-slate-900">
              <Camera size={14} />
              <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>

          {/* Profile Details */}
          <div className="text-center sm:text-left space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg sm:text-xl font-black tracking-tight">{companyName || 'Household Employer'}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                <CreditCard size={11} />
                {(employerProfile.subscription_status || 'free').toUpperCase()} PLAN
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium flex items-center justify-center sm:justify-start gap-1">
              <MapPin size={12} className="text-blue-400" />
              <span className="truncate">{employerProfile.society_name || 'DLF Westend Heights'}, Bengaluru</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1"><Phone size={11} className="text-emerald-400" /> +91 {phone}</span>
              {email && <span className="flex items-center gap-1"><Mail size={11} className="text-amber-400" /> {email}</span>}
            </div>
          </div>

          {/* Completeness Badge */}
          <div className="text-center bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0 min-w-[120px]">
            <span className="block text-[10px] font-black uppercase text-slate-300 tracking-wider">Completeness</span>
            <span className={`text-2xl font-black font-mono mt-0.5 block ${
              completionPercent === 100 ? 'text-emerald-400' : completionPercent >= 60 ? 'text-amber-400' : 'text-blue-400'
            }`}>
              {completionPercent}%
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-2 relative z-10 pt-2 border-t border-white/10">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300">
            <span>{t('profileCompletenessTitle') || "Account Readiness"}</span>
            <span>{completedCount} of {completionSteps.length} steps completed</span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                completionPercent === 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-300' : 'bg-gradient-to-r from-blue-500 to-indigo-400'
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {/* Step Badges */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {completionSteps.map((step) => (
              <span 
                key={step.key} 
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all ${
                  step.done 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                {step.done ? <Check size={11} className="text-emerald-400" /> : <Lock size={11} />}
                <span>{step.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* EMPLOYER PROFILE / HOUSEHOLD PHOTO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <User size={16} className="text-[#1A73E8]" />
            <span>{t('employerPhotoTitle') || "Employer / Household Photo"}</span>
          </h3>
          {profilePhoto ? (
            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={10} /> {t('uploadedBadge') || "Uploaded"}
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-slate-200">
              {t('optionalBadge') || "Optional"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-5">
          {/* Avatar preview */}
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Employer Logo" className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-slate-300" />
            )}
          </div>
          <div className="space-y-2 flex-1">
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              {t('employerPhotoDesc') || "Upload a photo for your household account. Workers see this avatar on your job postings when applying."}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">{t('photoSpecs') || "JPG · PNG · Max 3MB"}</p>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoChange} />
                <div className="py-2 px-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer">
                  <Upload size={11} />
                  <span>{profilePhoto ? (t('changePhotoBtn') || 'Change Photo') : (t('uploadPhotoBtn') || 'Upload Photo')}</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="file" accept="image/jpeg,image/png" capture="user" className="hidden" onChange={handlePhotoChange} />
                <div className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer">
                  <Camera size={11} />
                  <span>{t('takeSelfieBtn') || "Take Selfie"}</span>
                </div>
              </label>
              {profilePhoto && (
                <button onClick={() => setProfilePhoto(null)} className="py-2 px-3 text-red-400 hover:text-red-600 text-[10.5px] font-bold cursor-pointer">
                  {t('removeBtn') || "Remove"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Household Profile & Contact Details Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{t('contactInfoTitle') || "Household Profile & Contact Information"}</h3>
          <span className="bg-blue-50 text-[#1A73E8] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200/60">
            {employerProfile.subscription_status || 'Standard Plan'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
          
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase flex justify-between">
              <span>{t('employerFullNameLabel') || "Employer Full Name"}</span>
              <span className="text-[9px] text-slate-400 lowercase font-normal">{t('lettersOnlyLabel') || "(letters only)"}</span>
            </label>
            <input 
              type="text" 
              value={companyName} 
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Lakhan Lal Sah"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
            />
          </div>

          {/* Primary Phone */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase flex justify-between">
              <span>{t('primaryPhoneLabel') || "Primary 10-Digit Mobile"}</span>
              <span className={`text-[9px] font-bold ${phone.length === 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {phone.length === 10 ? (t('digitsValidText') || '✓ 10 Digits Valid') : `${phone.length}/10 digits`}
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">+91</span>
              <input 
                type="text" 
                maxLength={10}
                value={phone} 
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="9876543210"
                className={`w-full p-2.5 pl-12 bg-slate-50 border rounded-xl text-slate-800 font-bold focus:bg-white focus:outline-none font-mono ${
                  phone.length === 10 ? 'border-emerald-300 focus:border-emerald-500' : 'border-amber-300 focus:border-amber-500'
                }`}
              />
            </div>
          </div>

          {/* Primary Email */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase">{t('primaryEmailLabel') || "Primary Email Address"}</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lakhan.sah@gmail.com"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
            />
          </div>

          {/* Secondary Alternate Phone */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase">{t('altPhoneLabel') || "Alternate / Family Contact Phone (Optional)"}</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">+91</span>
              <input 
                type="text" 
                maxLength={10}
                value={altPhone} 
                onChange={(e) => handleAltPhoneChange(e.target.value)}
                placeholder="Optional backup phone"
                className="w-full p-2.5 pl-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Society Community */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase">{t('gatedSocietyLabel') || "Gated Society Community"}</label>
            <input 
              type="text" 
              value={employerProfile.society_name} 
              disabled
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold opacity-80"
            />
          </div>

          {/* Tower / Block */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase">{t('towerBlockLabel') || "Tower / Building Block"}</label>
            <input 
              type="text" 
              value={towerBlock} 
              onChange={(e) => setTowerBlock(e.target.value)}
              placeholder="e.g. Tower 4 / Block B"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
            />
          </div>

          {/* Flat / Apartment Address */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-slate-500 text-[10px] uppercase">{t('flatAddressLabel') || "Flat / Apartment Door Number & Address"}</label>
            <input 
              type="text" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Apt 802, 8th Floor"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
            />
          </div>

          {/* Worker Verification Requirement Preference */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-slate-500 text-[10px] uppercase">{t('preferredVerificationLabel') || "Preferred Candidate Verification Requirement"}</label>
            <select
              value={verificationPref}
              onChange={(e) => setVerificationPref(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
            >
              <option value="Aadhaar + Police Audit (Default)">{t('verifPrefDefault') || "Aadhaar Card + Police Background Audit Required (Recommended)"}</option>
              <option value="Aadhaar Verification Only">{t('verifPrefAadhaarOnly') || "Aadhaar Card Photo ID Verification Only"}</option>
              <option value="Self-Audited Hiring">{t('verifPrefSelfAudited') || "Direct Self-Audited Hiring"}</option>
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onSave}
            disabled={saveLoading || phone.length !== 10 || !companyName.trim()}
            className="py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            <span>{saveLoading ? (t('savingText') || 'Saving...') : (t('saveSettingsBtn') || 'Save Account Settings')}</span>
          </button>
        </div>
      </div>

      {/* EMPLOYER ID VERIFICATION CARD */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <IdCard size={16} className="text-[#1A73E8]" />
            <span>{t('employerIdVerificationTitle') || "Employer Identity Verification"}</span>
          </h3>
          {idVerified ? (
            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={10} /> {t('uploadedBadge') || "Verified"}
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <Lock size={10} /> {t('pendingVerificationBadge') || "Pending Verification"}
            </span>
          )}
        </div>

        {!idVerified && (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-amber-900">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-black">{t('idVerificationRequiredTitle') || "ID & Residency Verification Required"}</p>
              <p className="text-[11px] font-medium leading-relaxed">
                {t('idVerificationRequiredDesc') || "To prevent fake job postings, all employers must verify their society residency (via Gate Passcode or Maintenance Bill) before publishing job requisitions."}
              </p>
            </div>
          </div>
        )}

        {/* 🏢 SOCIETY RESIDENCY PROOF UPLOAD (MAINTENANCE BILL / RENT RECEIPT) */}
        <div className="bg-[#1A73E8]/5 border border-[#1A73E8]/20 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Building size={15} className="text-[#1A73E8]" />
              <span>{t('societyResidencyTitle') || "Society Residency Verification (Maintenance Bill / Rent Receipt)"}</span>
            </span>
            <span className="bg-blue-100 text-blue-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">{t('requiredProofBadge') || "Required Proof"}</span>
          </div>

          <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
            {t('societyResidencyDesc') || "Upload a recent Society Maintenance Bill, Electricity Receipt, or Rent Agreement showing your Flat & Tower number for instant Admin approval."}
          </p>

          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex-1">
                <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleResidencyProofChange} />
                <div className="w-full py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs">
                  <Upload size={14} />
                  <span>{(residencyProofUploaded || residencyProofUrl || employerProfile.residency_proof_url) ? (t('changeMaintenanceBtn') || "Change Maintenance Bill / Rent Agreement") : (t('uploadMaintenanceBtn') || "Upload Maintenance Bill / Rent Agreement")}</span>
                </div>
              </label>

              {(residencyProofUploaded || residencyProofUrl || employerProfile.residency_proof_url) && (
                <button
                  type="button"
                  onClick={() => setActiveInlinePreview(activeInlinePreview === 'residency' ? null : 'residency')}
                  className="py-2.5 px-4 bg-blue-100 hover:bg-blue-200 text-[#1A73E8] rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  <Eye size={14} />
                  <span>{activeInlinePreview === 'residency' ? 'Hide Preview' : 'View Proof'}</span>
                </button>
              )}
            </div>

            {/* Inline Residency Proof Preview Drawer */}
            {activeInlinePreview === 'residency' && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 animate-fade-in border border-slate-800 shadow-md mt-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                    <Building size={14} /> Society Residency Verification Proof
                  </span>
                  <button onClick={() => setActiveInlinePreview(null)} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">
                    Close Preview ✕
                  </button>
                </div>
                <div className="flex justify-center bg-black/60 rounded-xl p-2 min-h-[200px] max-h-[340px] overflow-hidden">
                  {(residencyProofUrl || employerProfile.residency_proof_url) ? (
                    <img src={residencyProofUrl || employerProfile.residency_proof_url || ''} alt="Residency Proof" className="max-h-[320px] w-full object-contain rounded-lg" />
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-1 my-auto">
                      <Building size={32} className="mx-auto text-blue-400 opacity-60 mb-2" />
                      <p>Residency Verification Proof Uploaded &amp; Stored</p>
                      <p className="text-[10px] text-slate-500 font-normal">Active society residency proof linked to employer account</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          {/* Aadhaar Front */}
          <div className="space-y-2">
            <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${(aadhaarFrontUploaded || employerProfile.aadhaar_front_url) ? 'border-emerald-300 bg-emerald-50/60' : 'border-dashed border-slate-200 bg-slate-50 hover:border-blue-300'}`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${(aadhaarFrontUploaded || employerProfile.aadhaar_front_url) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900">{t('aadhaarFrontLabel') || "Aadhaar — Front"}</p>
                <p className="text-[10px] text-slate-400 font-semibold truncate">{t('aadhaarFrontDesc') || "Name, photo & DOB · JPG · PNG · PDF · Max 5MB"}</p>
              </div>
              {(aadhaarFrontUploaded || employerProfile.aadhaar_front_url) ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveInlinePreview(activeInlinePreview === 'front' ? null : 'front')}
                    className="py-1.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-[10.5px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Eye size={12} className="text-emerald-700" />
                    <span>{activeInlinePreview === 'front' ? 'Hide Preview' : 'View'}</span>
                  </button>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleAadhaarFrontChange} />
                    <div className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer">
                      <Upload size={11} />
                      <span>Change</span>
                    </div>
                  </label>
                  <button onClick={() => { setAadhaarFrontUploaded(false); if (activeInlinePreview === 'front') setActiveInlinePreview(null); }} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer">✕</button>
                </div>
              ) : (
                <label className="cursor-pointer shrink-0">
                  <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleAadhaarFrontChange} />
                  <div className="py-2 px-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap">
                    <Upload size={11} /><span>{t('uploadFrontBtn') || "Upload Front"}</span>
                  </div>
                </label>
              )}
            </div>

            {/* Inline Front Preview Drawer */}
            {activeInlinePreview === 'front' && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 animate-fade-in border border-slate-800 shadow-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                    <FileText size={14} /> Aadhaar Front Side Uploaded Document
                  </span>
                  <button onClick={() => setActiveInlinePreview(null)} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">
                    Close Preview ✕
                  </button>
                </div>
                <div className="flex justify-center bg-black/60 rounded-xl p-2 min-h-[200px] max-h-[340px] overflow-hidden">
                  {(aadhaarFrontUrl || employerProfile.aadhaar_front_url) ? (
                    <img src={aadhaarFrontUrl || employerProfile.aadhaar_front_url || ''} alt="Aadhaar Front" className="max-h-[320px] w-full object-contain rounded-lg" />
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-1 my-auto">
                      <FileText size={32} className="mx-auto text-blue-400 opacity-60 mb-2" />
                      <p>Employer Aadhaar Front Verified &amp; Stored</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Aadhaar Back */}
          <div className="space-y-2">
            <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${(aadhaarBackUploaded || employerProfile.aadhaar_back_url) ? 'border-emerald-300 bg-emerald-50/60' : 'border-dashed border-slate-200 bg-slate-50 hover:border-blue-300'}`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${(aadhaarBackUploaded || employerProfile.aadhaar_back_url) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900">{t('aadhaarBackLabel') || "Aadhaar — Back"}</p>
                <p className="text-[10px] text-slate-400 font-semibold truncate">{t('aadhaarBackDesc') || "Aadhaar number & address · JPG · PNG · PDF · Max 5MB"}</p>
              </div>
              {(aadhaarBackUploaded || employerProfile.aadhaar_back_url) ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveInlinePreview(activeInlinePreview === 'back' ? null : 'back')}
                    className="py-1.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-[10.5px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Eye size={12} className="text-emerald-700" />
                    <span>{activeInlinePreview === 'back' ? 'Hide Preview' : 'View'}</span>
                  </button>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleAadhaarBackChange} />
                    <div className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer">
                      <Upload size={11} />
                      <span>Change</span>
                    </div>
                  </label>
                  <button onClick={() => { setAadhaarBackUploaded(false); if (activeInlinePreview === 'back') setActiveInlinePreview(null); }} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer">✕</button>
                </div>
              ) : (
                <label className="cursor-pointer shrink-0">
                  <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleAadhaarBackChange} />
                  <div className="py-2 px-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap">
                    <Upload size={11} /><span>{t('uploadBackBtn') || "Upload Back"}</span>
                  </div>
                </label>
              )}
            </div>

            {/* Inline Back Preview Drawer */}
            {activeInlinePreview === 'back' && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 animate-fade-in border border-slate-800 shadow-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                    <FileText size={14} /> Aadhaar Back Side Uploaded Document
                  </span>
                  <button onClick={() => setActiveInlinePreview(null)} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">
                    Close Preview ✕
                  </button>
                </div>
                <div className="flex justify-center bg-black/60 rounded-xl p-2 min-h-[200px] max-h-[340px] overflow-hidden">
                  {(aadhaarBackUrl || employerProfile.aadhaar_back_url) ? (
                    <img src={aadhaarBackUrl || employerProfile.aadhaar_back_url || ''} alt="Aadhaar Back" className="max-h-[320px] w-full object-contain rounded-lg" />
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-1 my-auto">
                      <FileText size={32} className="mx-auto text-blue-400 opacity-60 mb-2" />
                      <p>Employer Aadhaar Back Verified &amp; Stored</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 💾 IN-CARD SAVE BUTTON FOR DOCUMENTS */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={saveLoading}
            className="py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>{saveLoading ? (t('savingText') || 'Saving...') : (t('saveDocumentsBtn') || 'Save Document Proofs')}</span>
          </button>
        </div>

        {idVerified && (
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-emerald-900">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-black">{t('idPendingAdminAuditTitle') || "Identity Documents Submitted — Pending Admin Audit"}</p>
              <p className="text-[10.5px] font-medium">{t('idPendingAdminAuditDesc') || "Sevikaa Admin will verify your documents within 24 hours. You will be notified via SMS once approved to post jobs."}</p>
            </div>
          </div>
        )}
      </div>

      {/* COMMUNICATION & APPLICANT NOTIFICATION SETTINGS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Bell size={16} className="text-[#1A73E8]" />
          <span>{t('alertsTitle') || "Candidate Applicant & Society Alerts"}</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <h4 className="font-black text-slate-900">{t('smsAlertsTitle') || "SMS Instant Notifications (Jio DLT)"}</h4>
              <p className="text-[10.5px] text-slate-400 font-semibold">{t('smsAlertsDesc') || "Receive DLT-approved SMS alerts when domestic workers apply to your jobs"}</p>
            </div>
            <button
              onClick={() => setSmsAlerts(!smsAlerts)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${smsAlerts ? 'bg-[#1A73E8]' : 'bg-slate-300'}`}
            >
              <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${smsAlerts ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <h4 className="font-black text-slate-900">{t('emailDigestTitle') || "Society Helper Digest Email"}</h4>
              <p className="text-[10.5px] text-slate-400 font-semibold">{t('emailDigestDesc') || "Weekly digest of newly verified domestic helpers in your society"}</p>
            </div>
            <button
              onClick={() => setEmailDigest(!emailDigest)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${emailDigest ? 'bg-[#1A73E8]' : 'bg-slate-300'}`}
            >
              <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${emailDigest ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* DISCRETE DANGER ZONE CARD */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden transition-all">
        <button
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900">{t('dangerZoneTitle') || "Account Management & Danger Zone"}</h4>
              <p className="text-[10px] text-slate-400 font-semibold">{t('dangerZoneSub') || "Self-service account deletion & DPDP compliance"}</p>
            </div>
          </div>
          {showDangerZone ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        {showDangerZone && (
          <div className="p-5 border-t border-slate-100 bg-red-50/20 space-y-3">
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {t('dangerZoneDesc') || "Submitting an account deletion request will close your active job postings and initiate offboarding."}
            </p>

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deletionRequested}
              className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{deletionRequested ? (t('deletionLoggedBtn') || 'Deletion Request Logged') : (t('requestDeletionBtn') || 'Request Account Deletion')}</span>
            </button>
          </div>
        )}
      </div>

      {/* DELETION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4 animate-scale-up border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-600" />
                <h3 className="text-sm font-black text-slate-900">{t('requestDeletionModalTitle') || "Request Account Deletion"}</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              {t('requestDeletionModalSub') || "Please state your reason for deleting your household account."}
            </p>

            <div className="space-y-2 text-xs font-bold text-slate-700">
              <label className="text-[10px] text-slate-400 uppercase">{t('reasonLabel') || "Reason for Offboarding"}</label>
              <select 
                value={deletionReason} 
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="Already hired domestic worker">{t('reasonHired') || "Already hired domestic worker"}</option>
                <option value="Moving to a non-partner society">{t('reasonMoving') || "Moving to a non-partner society"}</option>
                <option value="No longer requiring domestic help">{t('reasonNoLonger') || "No longer requiring domestic help"}</option>
                <option value="Other">{t('reasonOther') || "Other Reason"}</option>
              </select>

              {deletionReason === 'Other' && (
                <textarea 
                  placeholder="Specify reason..." 
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                {t('cancelBtn') || "Cancel"}
              </button>
              <button 
                onClick={onSubmitDeletionRequest}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md"
              >
                {t('submitDeletionBtn') || "Submit Deletion Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
