"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useEmployerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  User, ShieldAlert, ChevronDown, ChevronUp, Trash2, 
  Save, Phone, CreditCard, Home, MapPin, AlertTriangle, Mail, Building, ShieldCheck, Sparkles, Bell, Check, Zap, History, X,
  Upload, Camera, FileText, Lock, CheckCircle2, IdCard, Eye, Search, RefreshCw, ArrowRight
} from 'lucide-react';
import { ChangeMobileInlineSection } from '@/components/profile/ChangeMobileInlineSection';
import { ChangeEmailInlineSection } from '@/components/profile/ChangeEmailInlineSection';

export default function EmployerAccountPage() {
  const { 
    employerProfile, setEmployerProfile, deletionRequested, 
    handleSaveEmployerProfile, handleRequestAccountDeletion, showToast 
  } = useEmployerDashboard();
  const { t } = useLanguage();

  const [isChangeMobileOpen, setIsChangeMobileOpen] = useState(false);
  const [activeInlinePreview, setActiveInlinePreview] = useState<'residency' | 'front' | 'back' | null>(null);

  const [companyName, setCompanyName] = useState(employerProfile.company_name || employerProfile.name || '');
  const [phone, setPhone] = useState(employerProfile.phone?.replace(/\D/g, '').slice(-10) || '');
  const [email, setEmail] = useState(employerProfile.email || '');
  const [towerBlock, setTowerBlock] = useState(employerProfile.tower || '');
  const [address, setAddress] = useState(employerProfile.address || '');
  const [city, setCity] = useState(employerProfile.city || '');
  const [stateName, setStateName] = useState(employerProfile.state || '');
  const [pincode, setPincode] = useState(employerProfile.pincode || '');
  const [gstin, setGstin] = useState(employerProfile.gstin || '');
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

  // Society Relocation Inbuilt Section State
  const [isRelocationOpen, setIsRelocationOpen] = useState(false);
  const [relocationReason, setRelocationReason] = useState('Moved to new residential gated society');
  const [targetSociety, setTargetSociety] = useState('');
  const [relocationProofUrl, setRelocationProofUrl] = useState<string | null>(null);
  const [relocationSubmitLoading, setRelocationSubmitLoading] = useState(false);

  // Custom Searchable Society Picker Modal State
  const [isSocietyPickerOpen, setIsSocietyPickerOpen] = useState(false);
  const [societySearchQuery, setSocietySearchQuery] = useState('');

  const VERIFIED_SOCIETIES = [
    { value: "DLF Westend Heights - Akshayanagar, Bengaluru", label: "DLF Westend Heights", locality: "Akshayanagar, Bengaluru" },
    { value: "Prestige Song of the South - Begur, Bengaluru", label: "Prestige Song of the South", locality: "Begur Main Rd, Bengaluru" },
    { value: "SNN Raj Serenity - Yelenahalli, Bengaluru", label: "SNN Raj Serenity", locality: "Yelenahalli, Begur, Bengaluru" },
    { value: "Purva Westend - Kudlu Gate, Bengaluru", label: "Purva Westend", locality: "Kudlu Gate, Hosur Rd, Bengaluru" },
    { value: "Sobha Royal Pavilion - Sarjapur Road, Bengaluru", label: "Sobha Royal Pavilion", locality: "Sarjapur Road, Bengaluru" },
    { value: "Godrej Eternity - Kanakapura Road, Bengaluru", label: "Godrej Eternity", locality: "Kanakapura Road, Bengaluru" },
    { value: "Prestige Falcon City - Kanakapura Road, Bengaluru", label: "Prestige Falcon City", locality: "Kanakapura Road, Bengaluru" },
    { value: "Brigade Lakefront - Whitefield, Bengaluru", label: "Brigade Lakefront", locality: "Whitefield, Bengaluru" },
    { value: "Hiranandani Meadows - Thane, Mumbai", label: "Hiranandani Meadows", locality: "Thane West, Mumbai" },
    { value: "DLF Pinnacle - Phase 5, Gurgaon", label: "DLF Pinnacle", locality: "DLF Phase 5, Gurgaon" },
    { value: "Naya Gaon Gated Community - Kolkata", label: "Naya Gaon Gated Community", locality: "Naya Gaon, Kolkata" },
  ];

  const filteredVerifiedSocieties = VERIFIED_SOCIETIES.filter((soc) =>
    soc.label.toLowerCase().includes(societySearchQuery.toLowerCase()) ||
    soc.locality.toLowerCase().includes(societySearchQuery.toLowerCase())
  );

  const handleRelocationProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      showToast('Relocation Proof: Only JPG, PNG, or PDF files allowed.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(`File size must be under 5MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)}MB.`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRelocationProofUrl(reader.result as string);
      showToast('New residence proof document attached successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRelocationRequest = async () => {
    if (!targetSociety.trim()) {
      showToast('Please enter the target new gated society name.', 'error');
      return;
    }
    if (!relocationProofUrl) {
      showToast('Please upload a proof of residence document for the new society.', 'error');
      return;
    }
    setRelocationSubmitLoading(true);
    try {
      const noteMsg = `⏳ Society Relocation Request to "${targetSociety.trim()}" submitted for admin verification. Reason: ${relocationReason}`;
      if (typeof handleSaveEmployerProfile === 'function') {
        await handleSaveEmployerProfile({
          ...employerProfile,
          status: 'changes_requested',
          admin_note: noteMsg,
          residency_proof_url: relocationProofUrl
        });
      } else {
        setEmployerProfile((prev: any) => ({
          ...prev,
          status: 'changes_requested',
          admin_note: noteMsg,
          residency_proof_url: relocationProofUrl
        }));
      }
      setIsRelocationOpen(false);
      showToast(`Society relocation request to "${targetSociety.trim()}" submitted to admin for audit!`, 'success');
    } catch (err: any) {
      showToast(`Error submitting relocation request: ${err.message}`, 'error');
    } finally {
      setRelocationSubmitLoading(false);
    }
  };

  // Sync state when employerProfile finishes loading from DB / context on page refresh
  React.useEffect(() => {
    if (employerProfile) {
      if (employerProfile.company_name || employerProfile.name) {
        setCompanyName(employerProfile.company_name || employerProfile.name || '');
      }
      if (employerProfile.phone) {
        const cleanP = employerProfile.phone.replace(/\D/g, '').slice(-10);
        if (cleanP) setPhone(cleanP);
      }
      if (employerProfile.email) setEmail(employerProfile.email);
      if (employerProfile.tower) setTowerBlock(employerProfile.tower);
      if (employerProfile.address) setAddress(employerProfile.address);
      if (employerProfile.city) setCity(employerProfile.city);
      if (employerProfile.state) setStateName(employerProfile.state);
      if (employerProfile.pincode) setPincode(employerProfile.pincode);
      if (employerProfile.gstin) setGstin(employerProfile.gstin);
      if (employerProfile.alt_phone) setAltPhone(employerProfile.alt_phone);
      if (employerProfile.residency_proof_url) setResidencyProofUrl(employerProfile.residency_proof_url);
      if (employerProfile.aadhaar_front_url) setAadhaarFrontUrl(employerProfile.aadhaar_front_url);
      if (employerProfile.aadhaar_back_url) setAadhaarBackUrl(employerProfile.aadhaar_back_url);
      if (employerProfile.avatar_url) setProfilePhoto(employerProfile.avatar_url);
    }
  }, [employerProfile]);

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
          city,
          state: stateName,
          pincode,
          gstin,
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
          city,
          state: stateName,
          pincode,
          gstin,
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
    if (email) {
      try {
        fetch('/api/notifications/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'account-deletion',
            toEmail: email,
            data: { employerName: companyName }
          })
        }).catch((err: any) => console.warn("Deletion email notice:", err));
      } catch (emailErr) {
        console.warn("Deletion email error notice:", emailErr);
      }
    }
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-24 mx-auto">
      
      {/* 👑 PAGE HEADER - DEDICATED SEPARATE LINES */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Line 1: Title (Full 100% Width) */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 tracking-tight">
          <User size={24} className="text-[#1A73E8] shrink-0" />
          <span>{t('employerAccountTitle') || "Household & Employer Account"}</span>
        </h2>

        {/* Line 2: Status Badge on its own line */}
        <div>
          <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-2xs ${
            employerProfile.status === 'live' || employerProfile.status === 'approved'
              ? 'bg-emerald-50 text-[#34A853] border-emerald-200'
              : employerProfile.status === 'changes_requested'
              ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
              : 'bg-blue-50 text-[#1A73E8] border-blue-200'
          }`}>
            <ShieldCheck size={15} className="shrink-0" />
            <span>
              {employerProfile.status === 'changes_requested' 
                ? '⚠️ Revision Requested' 
                : employerProfile.status === 'live' 
                ? '🟢 Account Active' 
                : '⏳ Pending Admin Audit'}
            </span>
          </span>
        </div>

        {/* Line 3: Subtitle */}
        <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
          {t('employerAccountSub') || "Manage your residential address, contact details, subscription tier, and security preferences."}
        </p>
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

      {/* 🏡 HERO HOUSEHOLD PROFILE & COMPLETENESS CARD - LIGHT BRIGHT EXECUTIVE THEME */}
      <div className="bg-gradient-to-r from-blue-50/90 via-white to-emerald-50/90 text-slate-900 p-5 sm:p-7 rounded-3xl space-y-5 border-2 border-slate-200/90 relative overflow-hidden">
        
        {/* Top Header Row: 100% Width Available for Avatar, Long Employer Name & Full Society Location */}
        <div className="flex items-center gap-4 relative z-10">
          {/* Avatar Container with Sophisticated Circular SVG Progress Ring */}
          <div className="relative group shrink-0 flex items-center justify-center">
            {/* SVG Circular Progress Ring */}
            <svg className="w-20 h-20 sm:w-24 sm:h-24 -rotate-90 pointer-events-none drop-shadow-xs">
              <circle
                cx="50%"
                cy="50%"
                r="36"
                className="stroke-slate-200"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r="36"
                className={`transition-all duration-1000 ${
                  completionPercent === 100 ? 'stroke-[#34A853]' : completionPercent >= 60 ? 'stroke-amber-500' : 'stroke-[#1A73E8]'
                }`}
                strokeWidth="4"
                strokeDasharray="226"
                strokeDashoffset={226 - (226 * completionPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Profile Avatar Image with Premium Executive Vibrant Fallback */}
            <div className="absolute inset-1.5 rounded-full overflow-hidden bg-gradient-to-tr from-[#1A73E8] via-indigo-600 to-[#34A853] border-2 border-white shadow-md flex items-center justify-center text-white font-black text-2xl sm:text-3xl tracking-tight select-none">
              {profilePhoto && (profilePhoto.startsWith('data:') || profilePhoto.startsWith('http') || profilePhoto.startsWith('/')) ? (
                <img 
                  src={profilePhoto} 
                  alt={companyName || "Employer"} 
                  className="w-full h-full object-cover" 
                  onError={() => setProfilePhoto(null)}
                />
              ) : (
                <span className="drop-shadow-xs">{companyName && companyName.trim() ? companyName.trim().charAt(0).toUpperCase() : 'E'}</span>
              )}
            </div>

            {/* Camera Upload Button Overlay */}
            <label className="absolute bottom-0 right-0 p-1.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-full cursor-pointer shadow-md transition-transform hover:scale-110 active:scale-95 border-2 border-white">
              <Camera size={12} />
              <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>

          {/* Employer Name, Dedicated Society Location Row, and Plan/Readiness Badges */}
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{companyName || 'Household Employer'}</h3>
            </div>

            {/* Dedicated Row for Society Location */}
            <p className="text-xs sm:text-sm font-extrabold text-slate-700 flex items-center gap-1.5 leading-snug">
              <MapPin size={15} className="text-[#1A73E8] shrink-0" />
              <span>{employerProfile.society_name || 'DLF Westend Heights'}{city ? `, ${city}` : ''}</span>
            </p>

            {/* Badges Row: Account Ready & Subscription Plan */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs ${
                completionPercent === 100
                  ? 'bg-emerald-100 text-[#34A853] border border-emerald-300'
                  : completionPercent >= 60
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-blue-100 text-[#1A73E8] border border-blue-300'
              }`}>
                <Sparkles size={12} />
                <span>{completionPercent}% Account Ready</span>
              </span>

              <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-blue-100 text-[#1A73E8] border border-blue-300 flex items-center gap-1 shadow-2xs whitespace-nowrap">
                <CreditCard size={11} />
                {(employerProfile.subscription_status || 'Standard Plan').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Dedicated Full-Width Rows for Mobile Number, Email & Tower/Address */}
        <div className="flex flex-col gap-2 pt-1 relative z-10">
          <div className="bg-white p-3 px-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-xs font-black text-slate-800">
            <div className="flex items-center gap-2.5 shrink-0">
              <Phone size={15} className="text-[#34A853] shrink-0" />
              <span className="text-slate-500 font-bold">Mobile Number:</span>
            </div>
            <span className="font-mono text-sm font-black text-slate-900 break-all">+91 {phone}</span>
          </div>

          <div className="bg-white p-3 px-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-xs font-black text-slate-800">
            <div className="flex items-center gap-2.5 shrink-0">
              <Mail size={15} className="text-amber-600 shrink-0" />
              <span className="text-slate-500 font-bold">Email Address:</span>
            </div>
            <span className="text-sm font-black text-slate-900 break-all sm:text-right">{email || 'Not Provided'}</span>
          </div>

          <div className="bg-white p-3 px-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-xs font-black text-slate-800">
            <div className="flex items-center gap-2.5 shrink-0">
              <Home size={15} className="text-[#1A73E8] shrink-0" />
              <span className="text-slate-500 font-bold">Tower / Unit Address:</span>
            </div>
            <span className="text-sm font-black text-slate-900 break-words sm:text-right">
              {[towerBlock ? `Tower ${towerBlock}` : '', address, city ? `(${city})` : ''].filter(Boolean).join(', ') || 'Address not provided'}
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-3 relative z-10 pt-4 border-t border-slate-200/80">
          <div className="flex justify-between items-center text-xs font-black text-slate-700">
            <span>{t('profileCompletenessTitle') || "Account Readiness"}</span>
            <span>{completedCount} of {completionSteps.length} steps completed</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                completionPercent === 100 ? 'bg-gradient-to-r from-[#34A853] to-emerald-400' : 'bg-gradient-to-r from-[#1A73E8] to-blue-400'
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {/* Step Badges - Dynamically Responsive Flex Wrap to Fit Exact Text Size */}
          <div className="flex flex-wrap gap-2 pt-2">
            {completionSteps.map((step) => (
              <div 
                key={step.key} 
                className={`py-2 px-3.5 rounded-xl text-xs font-black inline-flex items-center gap-2 border transition-all ${
                  step.done 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs' 
                    : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                <span className="whitespace-nowrap">{step.label}</span>
                {step.done ? <CheckCircle2 size={14} className="text-[#34A853] shrink-0" /> : <Lock size={14} className="text-slate-400 shrink-0" />}
              </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-bold">
          
          {/* Employer Full Name Row */}
          <div className="sm:col-span-2 space-y-1">
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

          {/* Primary Phone (Inbuilt Inline Section) */}
          <div className="sm:col-span-2">
            <ChangeMobileInlineSection
              currentPhone={phone}
              label={t('primaryPhoneLabel') || "Primary 10-Digit Mobile"}
              onSuccess={(newP) => {
                setPhone(newP);
                setEmployerProfile((prev: any) => ({ ...prev, phone: `+91 ${newP}` }));
                showToast('Mobile number updated successfully!', 'success');
              }}
            />
          </div>

          {/* Primary Email (Inbuilt Inline Section) */}
          <div className="sm:col-span-2">
            <ChangeEmailInlineSection
              currentEmail={email}
              label={t('primaryEmailLabel') || "Primary Email Address"}
              onSuccess={(newE) => {
                setEmail(newE);
                setEmployerProfile((prev: any) => ({ ...prev, email: newE }));
                showToast('Email address updated successfully!', 'success');
              }}
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

          {/* Society Community & Link to Dedicated Relocation Page */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-slate-500 text-[10px] uppercase font-bold truncate">{t('gatedSocietyLabel') || "Gated Society Community"}</label>
              <Link
                href="/employer/account/relocate"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-[#1A73E8] border border-blue-200/90 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 group whitespace-nowrap shrink-0 shadow-2xs"
              >
                <RefreshCw size={11} className="group-hover:rotate-180 transition-transform duration-500 text-[#1A73E8]" />
                <span>Request Transfer</span>
                <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform text-[#1A73E8]" />
              </Link>
            </div>
            <input 
              type="text" 
              value={employerProfile.society_name || 'Society Not Selected'} 
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

          {/* Tax Invoicing & Billing Address Details */}
          <div className="sm:col-span-2 pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-[#1A73E8]" />
              <span>Tax Invoicing & Official Billing Details</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* City Input */}
              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase">City</label>
                <input 
                  type="text" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kolkata / Bengaluru"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                />
              </div>

              {/* State Input */}
              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase">State</label>
                <input 
                  type="text" 
                  value={stateName} 
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. West Bengal"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                />
              </div>

              {/* Pincode Input */}
              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase">Pincode</label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={pincode} 
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 700001"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* GSTIN Input */}
            <div className="space-y-1">
              <label className="text-slate-500 text-[10px] uppercase flex justify-between">
                <span>GSTIN / Tax ID (Optional for GST Tax Invoice)</span>
                <span className="text-[9px] text-slate-400 lowercase font-normal">(for business input credit)</span>
              </label>
              <input 
                type="text" 
                maxLength={15}
                value={gstin} 
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="e.g. 19AAAAA0000A1Z5"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono uppercase"
              />
            </div>
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

      {/* 🛡️ POWERED BY YGAYATRA BRAND FOOTER */}
      <div className="pt-8 pb-2 flex flex-col items-center justify-center gap-1.5 opacity-75 hover:opacity-100 transition-opacity select-none">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          Powered By
        </span>
        <img 
          src="/ygayatra.png" 
          alt="Ygayatra" 
          className="h-6 sm:h-7 object-contain grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100" 
        />
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
