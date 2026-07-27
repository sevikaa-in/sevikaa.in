"use client";

import React, { useState } from 'react';
import { useEmployerDashboard } from '../layout';
import { useLanguage } from '../../../../context/LanguageContext';
import { 
  User, ShieldAlert, ChevronDown, ChevronUp, Trash2, 
  Save, Phone, CreditCard, Home, MapPin, AlertTriangle, Mail, Building, ShieldCheck, Sparkles, Bell, Check, Zap, History, X,
  Upload, Camera, FileText, Lock, CheckCircle2, IdCard
} from 'lucide-react';

export default function EmployerAccountPage() {
  const { 
    employerProfile, setEmployerProfile, deletionRequested, 
    handleRequestAccountDeletion, showToast 
  } = useEmployerDashboard();
  const { t } = useLanguage();

  const [companyName, setCompanyName] = useState(employerProfile.company_name || 'Lakhan Lal Sah');
  const [phone, setPhone] = useState(employerProfile.phone?.replace(/\D/g, '').slice(-10) || '9876543210');
  const [email, setEmail] = useState(employerProfile.email || 'lakhan.sah@gmail.com');
  const [towerBlock, setTowerBlock] = useState(employerProfile.tower || 'Tower 4');
  const [address, setAddress] = useState(employerProfile.address || 'Apt 802');
  const [altPhone, setAltPhone] = useState(employerProfile.alt_phone || '');
  const [verificationPref, setVerificationPref] = useState(employerProfile.verification_pref || 'Aadhaar + Police Audit (Default)');
  const [saveLoading, setSaveLoading] = useState(false);

  // ID Verification upload state
  const [aadhaarFrontUploaded, setAadhaarFrontUploaded] = useState(false);
  const [aadhaarBackUploaded, setAadhaarBackUploaded] = useState(false);
  const idVerified = aadhaarFrontUploaded && aadhaarBackUploaded;

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
    setAadhaarFrontUploaded(true);
    showToast('Aadhaar Front card uploaded successfully!', 'success');
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
    setAadhaarBackUploaded(true);
    showToast('Aadhaar Back card uploaded successfully!', 'success');
  };

  // Communication & Notification Toggles
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  // Discrete Danger Zone State
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('Already hired domestic worker');
  const [customReason, setCustomReason] = useState('');

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

  const onSave = () => {
    if (phone.length !== 10) return;
    setSaveLoading(true);
    setTimeout(() => {
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
      setSaveLoading(false);
      showToast("Household account & verification details updated!", "success");
    }, 500);
  };

  const onSubmitDeletionRequest = async () => {
    const finalReason = deletionReason === 'Other' ? customReason : deletionReason;
    await handleRequestAccountDeletion(finalReason);
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl pb-16">
      
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <User size={18} className="text-[#1A73E8]" />
          <span>Household &amp; Employer Account Settings</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Manage your residential address, contact details, subscription tier, and security preferences.
        </p>
      </div>

      {/* ✅ SUBSCRIPTION PLAN CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-md space-y-4 relative overflow-hidden border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 size={10} /> Active Subscription
            </span>
            <h3 className="text-base font-black text-white">{employerProfile.subscription_status || 'Standard Plan'}</h3>
            <p className="text-[11px] text-slate-300 font-medium">One flat subscription — no credits, no unlock fees, no hidden charges.</p>
          </div>
          <div className="text-right bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shrink-0">
            <span className="text-[10px] text-slate-300 font-bold block uppercase">Status</span>
            <span className="text-lg font-black text-emerald-400">Active ✓</span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
          {[
            { icon: '📞', label: 'Direct candidate calls — included' },
            { icon: '🎥', label: 'Worker intro videos — included' },
            { icon: '📋', label: 'Unlimited job postings — included' },
            { icon: '🛡️', label: 'Aadhaar-verified workers only' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-[10.5px] text-slate-200 font-semibold">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 📷 EMPLOYER PROFILE / HOUSEHOLD PHOTO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <User size={16} className="text-[#1A73E8]" />
            <span>Employer / Household Photo</span>
          </h3>
          {profilePhoto ? (
            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={10} /> Uploaded
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-slate-200">
              Optional
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
              Upload a photo for your household account. Workers see this avatar on your job postings when applying.
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">JPG · PNG · Max 3MB</p>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoChange} />
                <div className="py-2 px-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer">
                  <Upload size={11} />
                  <span>{profilePhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="file" accept="image/jpeg,image/png" capture="user" className="hidden" onChange={handlePhotoChange} />
                <div className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer">
                  <Camera size={11} />
                  <span>Take Selfie</span>
                </div>
              </label>
              {profilePhoto && (
                <button onClick={() => setProfilePhoto(null)} className="py-2 px-3 text-red-400 hover:text-red-600 text-[10.5px] font-bold cursor-pointer">
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Household Profile & Contact Details Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Household Profile &amp; Contact Information</h3>
          <span className="bg-blue-50 text-[#1A73E8] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200/60">
            {employerProfile.subscription_status || 'Standard Plan'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
          
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase flex justify-between">
              <span>Employer Full Name</span>
              <span className="text-[9px] text-slate-400 lowercase font-normal">(letters only)</span>
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
              <span>Primary 10-Digit Mobile</span>
              <span className={`text-[9px] font-bold ${phone.length === 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {phone.length === 10 ? '✓ 10 Digits Valid' : `${phone.length}/10 digits`}
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
            <label className="text-slate-500 text-[10px] uppercase">Primary Email Address</label>
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
            <label className="text-slate-500 text-[10px] uppercase">Alternate / Family Contact Phone (Optional)</label>
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
            <label className="text-slate-500 text-[10px] uppercase">Gated Society Community</label>
            <input 
              type="text" 
              value={employerProfile.society_name} 
              disabled
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold opacity-80"
            />
          </div>

          {/* Tower / Block */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase">Tower / Building Block</label>
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
            <label className="text-slate-500 text-[10px] uppercase">Flat / Apartment Door Number &amp; Address</label>
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
            <label className="text-slate-500 text-[10px] uppercase">Preferred Candidate Verification Requirement</label>
            <select
              value={verificationPref}
              onChange={(e) => setVerificationPref(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
            >
              <option value="Aadhaar + Police Audit (Default)">Aadhaar Card + Police Background Audit Required (Recommended)</option>
              <option value="Aadhaar Verification Only">Aadhaar Card Photo ID Verification Only</option>
              <option value="Self-Audited Hiring">Direct Self-Audited Hiring</option>
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
            <span>{saveLoading ? 'Saving...' : 'Save Account Settings'}</span>
          </button>
        </div>
      </div>

      {/* 🪪 EMPLOYER ID VERIFICATION CARD */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <IdCard size={16} className="text-[#1A73E8]" />
            <span>Employer Identity Verification</span>
          </h3>
          {idVerified ? (
            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={10} /> Verified
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <Lock size={10} /> Pending Verification
            </span>
          )}
        </div>

        {!idVerified && (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-amber-900">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-black">ID Verification Required to Post Jobs</p>
              <p className="text-[11px] font-medium leading-relaxed">
                To prevent fake job postings, all employers must verify their Aadhaar ID and upload a live selfie before publishing job requisitions. This protects domestic workers from fraudulent listings.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {/* Aadhaar Front */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${aadhaarFrontUploaded ? 'border-emerald-300 bg-emerald-50/60' : 'border-dashed border-slate-200 bg-slate-50 hover:border-blue-300'}`}>
            <div className={`p-2.5 rounded-xl shrink-0 ${aadhaarFrontUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              <FileText size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900">Aadhaar — Front</p>
              <p className="text-[10px] text-slate-400 font-semibold">Name, photo & DOB · JPG · PNG · PDF · Max 5MB</p>
            </div>
            {aadhaarFrontUploaded ? (
              <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1.5 rounded-xl shrink-0">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-800">Uploaded</span>
                <button onClick={() => setAadhaarFrontUploaded(false)} className="text-emerald-600 hover:text-red-500 ml-1 cursor-pointer">✕</button>
              </div>
            ) : (
              <label className="cursor-pointer shrink-0">
                <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleAadhaarFrontChange} />
                <div className="py-2 px-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap">
                  <Upload size={11} /><span>Upload Front</span>
                </div>
              </label>
            )}
          </div>

          {/* Aadhaar Back */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${aadhaarBackUploaded ? 'border-emerald-300 bg-emerald-50/60' : 'border-dashed border-slate-200 bg-slate-50 hover:border-blue-300'}`}>
            <div className={`p-2.5 rounded-xl shrink-0 ${aadhaarBackUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              <FileText size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900">Aadhaar — Back</p>
              <p className="text-[10px] text-slate-400 font-semibold">Aadhaar number & address · JPG · PNG · PDF · Max 5MB</p>
            </div>
            {aadhaarBackUploaded ? (
              <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1.5 rounded-xl shrink-0">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-800">Uploaded</span>
                <button onClick={() => setAadhaarBackUploaded(false)} className="text-emerald-600 hover:text-red-500 ml-1 cursor-pointer">✕</button>
              </div>
            ) : (
              <label className="cursor-pointer shrink-0">
                <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleAadhaarBackChange} />
                <div className="py-2 px-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap">
                  <Upload size={11} /><span>Upload Back</span>
                </div>
              </label>
            )}
          </div>
        </div>

        {idVerified && (
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-emerald-900">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-black">Identity Documents Submitted — Pending Admin Audit</p>
              <p className="text-[10.5px] font-medium">Sevikaa Admin will verify your documents within 24 hours. You will be notified via SMS once approved to post jobs.</p>
            </div>
          </div>
        )}
      </div>

      {/* 🔔 COMMUNICATION & APPLICANT NOTIFICATION SETTINGS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Bell size={16} className="text-[#1A73E8]" />
          <span>Candidate Applicant &amp; Society Alerts</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <h4 className="font-black text-slate-900">SMS Instant Notifications (Jio DLT)</h4>
              <p className="text-[10.5px] text-slate-400 font-semibold">Receive DLT-approved SMS alerts when domestic workers apply to your jobs</p>
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
              <h4 className="font-black text-slate-900">Society Helper Digest Email</h4>
              <p className="text-[10.5px] text-slate-400 font-semibold">Weekly digest of newly verified domestic helpers in your society</p>
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

      {/* DISCRETE DANGER ZONE CARD (Bottom of Page) */}
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
              <h4 className="text-xs font-black text-slate-900">Account Management &amp; Danger Zone</h4>
              <p className="text-[10px] text-slate-400 font-semibold">Self-service account deletion &amp; DPDP compliance</p>
            </div>
          </div>
          {showDangerZone ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        {showDangerZone && (
          <div className="p-5 border-t border-slate-100 bg-red-50/20 space-y-3">
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Submitting an account deletion request will close your active job postings and initiate offboarding. 
              A Sevikaa Admin will call your registered phone to confirm your request.
            </p>

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deletionRequested}
              className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{deletionRequested ? 'Deletion Request Logged' : 'Request Account Deletion'}</span>
            </button>
          </div>
        )}
      </div>


      {/* DELETION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-600" />
                <h3 className="text-sm font-black text-slate-900">Request Account Deletion</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Please state your reason for deleting your household account. A Sevikaa Admin will call your phone <strong>+91 {phone}</strong> within 24 hours to confirm offboarding.
            </p>

            <div className="space-y-2 text-xs font-bold text-slate-700">
              <label className="text-[10px] text-slate-400 uppercase">Reason for Offboarding</label>
              <select 
                value={deletionReason} 
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="Already hired domestic worker">Already hired domestic worker</option>
                <option value="Moving to a non-partner society">Moving to a non-partner society</option>
                <option value="No longer requiring domestic help">No longer requiring domestic help</option>
                <option value="Other">Other Reason</option>
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
                Cancel
              </button>
              <button 
                onClick={onSubmitDeletionRequest}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md"
              >
                Submit Deletion Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
