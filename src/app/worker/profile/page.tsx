"use client";

import React, { useState } from 'react';
import { useWorkerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  User, CheckCircle2, ShieldAlert, AlertTriangle, ChevronDown, ChevronUp, 
  Trash2, Save, Phone, IndianRupee, Briefcase, Languages, Clock,
  Upload, Camera, FileText, Image, Star, ChevronRight, Lock, X, Video, ShieldCheck, MapPin, Eye, Play
} from 'lucide-react';

const SKILL_CATEGORIES = [
  { id: 'cook', key: 'cook', label: 'Cook / Chef', defaultLabel: 'Cook / Chef', icon: '🍳' },
  { id: 'maid', key: 'maid', label: 'Housekeeping', defaultLabel: 'Housekeeping', icon: '🧹' },
  { id: 'nanny', key: 'nanny', label: 'Childcare / Nanny', defaultLabel: 'Childcare / Nanny', icon: '👶' },
  { id: 'driver', key: 'driver', label: 'Family Driver', defaultLabel: 'Family Driver', icon: '🚗' },
  { id: 'gardener', key: 'gardener', label: 'Gardener', defaultLabel: 'Gardener', icon: '🌿' },
  { id: 'security', key: 'security', label: 'Security Guard', defaultLabel: 'Security Guard', icon: '🛡️' },
  { id: 'laundry', key: 'laundry', label: 'Laundry & Ironing', defaultLabel: 'Laundry & Ironing', icon: '👕' },
  { id: 'eldercare', key: 'eldercare', label: 'Elder Care', defaultLabel: 'Elder Care', icon: '🤝' }
];

const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Hinglish', 'Kannada', 'Tamil', 'Telugu', 'Assamese', 'Nepali', 'Bengali', 'Marathi', 'Malayalam', 'Odia', 'Gujarati', 'Punjabi'];

const SHIFT_SLOT_OPTIONS = [
  { key: 'shiftFullDay', subKey: 'shiftFullDaySub', label: 'Full Day (8–12 Hours)', icon: '🕒', sub: 'Standard daily shifts (8 AM – 7 PM)' },
  { key: 'shiftEarlyMorning', subKey: 'shiftEarlyMorningSub', label: 'Early Morning (6 AM – 9 AM)', icon: '☀️', sub: 'Breakfast & morning cleaning' },
  { key: 'shiftMorning', subKey: 'shiftMorningSub', label: 'Morning Shift (9 AM – 12 PM)', icon: '🌅', sub: 'Mid-morning household chores' },
  { key: 'shiftAfternoon', subKey: 'shiftAfternoonSub', label: 'Afternoon Shift (12 PM – 3 PM)', icon: '🌤️', sub: 'Lunch prep & afternoon help' },
  { key: 'shiftEvening', subKey: 'shiftEveningSub', label: 'Evening Shift (3 PM – 6 PM)', icon: '🌆', sub: 'Evening snacks & dinner prep' },
  { key: 'shiftNight', subKey: 'shiftNightSub', label: 'Night Shift (6 PM – 9 PM)', icon: '🌙', sub: 'Dinner serving & night security' },
  { key: 'shiftLiveIn', subKey: 'shiftLiveInSub', label: 'Live-In (24x7 Residence)', icon: '🏠', sub: 'Full residence with room & meals' },
  { key: 'shiftPartTime', subKey: 'shiftPartTimeSub', label: 'Part-Time Flexible Hours', icon: '⚡', sub: 'Hourly or multi-client visits' },
];

export default function WorkerProfilePage() {
  const { 
    workerProfile, setWorkerProfile, badges, saveLoading, deletionRequested, 
    handleSaveProfile, handleRequestAccountDeletion, showToast
  } = useWorkerDashboard();
  const { t } = useLanguage();

  const [name, setName] = useState(workerProfile.name || '');
  const [expectedSalary, setExpectedSalary] = useState(workerProfile.expectedSalary || '');
  const [experience, setExperience] = useState(workerProfile.experience || '');
  const [phone, setPhone] = useState(workerProfile.phone?.replace(/\D/g, '').slice(-10) || '');
  const [gender, setGender] = useState(workerProfile.gender || 'female');
  const [age, setAge] = useState(String(workerProfile.age || '28'));
  const [preferredShift, setPreferredShift] = useState(workerProfile.preferredShift || 'Full Day (8–12 Hours)');
  const [isShiftDropdownOpen, setIsShiftDropdownOpen] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState(workerProfile.emergencyContact?.replace(/\D/g, '').slice(-10) || '');
  const [bio, setBio] = useState(workerProfile.bio || '');

  const [languages, setLanguages] = useState<string[]>(workerProfile.languages || []);
  const rawSkills = Array.isArray(workerProfile.skills) 
    ? workerProfile.skills 
    : (Array.isArray(workerProfile.category) 
        ? workerProfile.category 
        : [workerProfile.category || 'maid']);

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    rawSkills.map((c: string) => 
      SKILL_CATEGORIES.find(s => typeof c === 'string' && c.includes(s.defaultLabel.split(' ')[0]))?.id || c
    ) || []
  );
  
  // Profile photo, ID doc & intro video states
  const [profilePhoto, setProfilePhoto] = useState<string | null>(workerProfile.profile_picture_url || workerProfile.avatar_url || null);
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState<string | null>(workerProfile.aadhaar_front_url || null);
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState<string | null>(workerProfile.aadhaar_back_url || null);
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(workerProfile.video_url || null);

  const [aadhaarFrontUploaded, setAadhaarFrontUploaded] = useState(!!workerProfile.aadhaar_front_url);
  const [aadhaarBackUploaded, setAadhaarBackUploaded] = useState(!!workerProfile.aadhaar_back_url);
  const [photoSelfieUploaded, setPhotoSelfieUploaded] = useState(!!workerProfile.profile_picture_url);
  const [videoUploaded, setVideoUploaded] = useState(!!workerProfile.video_url);

  React.useEffect(() => {
    if (workerProfile.name) setName(workerProfile.name);
    if (workerProfile.phone) {
      const cleanP = workerProfile.phone.replace(/\D/g, '').slice(-10);
      if (cleanP) setPhone(cleanP);
    }
    if (workerProfile.expectedSalary) setExpectedSalary(workerProfile.expectedSalary);
    if (workerProfile.experience) setExperience(workerProfile.experience);
    if (workerProfile.gender) setGender(workerProfile.gender);
    if (workerProfile.age) setAge(String(workerProfile.age));
    if (workerProfile.bio) setBio(workerProfile.bio);
    if (workerProfile.emergencyContact) {
      const cleanE = workerProfile.emergencyContact.replace(/\D/g, '').slice(-10);
      if (cleanE) setEmergencyContact(cleanE);
    }
    if (workerProfile.languages && workerProfile.languages.length > 0) setLanguages(workerProfile.languages);
    if (workerProfile.category && workerProfile.category.length > 0) {
      setSelectedSkills(
        workerProfile.category.map((c: string) => 
          SKILL_CATEGORIES.find(s => c.includes(s.defaultLabel.split(' ')[0]))?.id || c
        )
      );
    }

    if (typeof window === 'undefined') return;
    const pPhoto = workerProfile.profile_picture_url || workerProfile.avatar_url || localStorage.getItem('sevikaa_worker_photo');
    if (pPhoto) {
      setProfilePhoto(pPhoto);
      setPhotoSelfieUploaded(true);
    }

    const aFront = workerProfile.aadhaar_front_url || localStorage.getItem('sevikaa_worker_aadhaar_front');
    if (aFront) {
      setAadhaarFrontUrl(aFront);
      setAadhaarFrontUploaded(true);
    }

    const aBack = workerProfile.aadhaar_back_url || localStorage.getItem('sevikaa_worker_aadhaar_back');
    if (aBack) {
      setAadhaarBackUrl(aBack);
      setAadhaarBackUploaded(true);
    }

    const video = workerProfile.video_url || localStorage.getItem('sevikaa_worker_video');
    if (video) {
      setIntroVideoUrl(video);
      setVideoUploaded(true);
    }
  }, [workerProfile]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      showToast('Intro Video: Only MP4 or WebM video files allowed.', 'error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast(`Intro Video size must be under 50MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)}MB.`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        setIntroVideoUrl(result);
        setVideoUploaded(true);
        if (typeof window !== 'undefined') localStorage.setItem('sevikaa_worker_video', result);
        showToast('60-second intro video uploaded successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Discrete Danger Zone State
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('Moving to another city');
  const [customReason, setCustomReason] = useState('');
  const [activeInlinePreview, setActiveInlinePreview] = useState<'front' | 'back' | 'video' | null>(null);

  // Profile completeness check
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const isAadhaarDone = (aadhaarFrontUploaded && aadhaarBackUploaded) || workerProfile.status === 'live' || workerProfile.status === 'approved';
  const isPhotoDone = !!profilePhoto || !!workerProfile.avatar_url || !!workerProfile.profile_picture_url;

  const completionSteps = [
    { key: 'name', label: t('stepFullName') || 'Full Name', done: !!name.trim() },
    { key: 'phone', label: t('stepMobileNumber') || 'Mobile Number', done: cleanPhone.length === 10 },
    { key: 'gender', label: t('stepGenderAge') || 'Gender & Age', done: !!gender && !!age },
    { key: 'skills', label: t('stepSkillsSelected') || 'Skills Selected', done: selectedSkills.length > 0 },
    { key: 'salary', label: t('stepExpectedSalary') || 'Expected Salary', done: !!String(expectedSalary).trim() && String(expectedSalary) !== '0' },
    { key: 'experience', label: t('stepExperience') || 'Experience', done: !!String(experience).trim() },
    { key: 'languages', label: t('stepLanguages') || 'Languages', done: languages.length > 0 },
    { key: 'photo', label: t('stepProfilePhoto') || 'Profile Photo', done: isPhotoDone },
    { key: 'aadhaar', label: t('stepAadhaarUploaded') || 'Aadhaar Uploaded', done: isAadhaarDone },
  ];
  const completedCount = completionSteps.filter(s => s.done).length;
  const completionPercent = Math.round((completedCount / completionSteps.length) * 100);

  // Strict Input Handlers
  const handleNameChange = (val: string) => {
    const lettersOnly = val.replace(/[^a-zA-Z\s]/g, '');
    setName(lettersOnly);
  };

  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
    );
  };

  const toggleLanguage = (lang: string) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const AADHAAR_MAX_MB = 5;
  const SELFIE_MAX_MB = 3;
  const ALLOWED_AADHAAR_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  const ALLOWED_SELFIE_TYPES = ['image/jpeg', 'image/png'];

  const validateFile = (
    file: File, 
    allowedTypes: string[], 
    maxMB: number, 
    label: string
  ): boolean => {
    if (!allowedTypes.includes(file.type)) {
      showToast(`${label}: Only ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} files allowed.`, 'error');
      return false;
    }
    if (file.size > maxMB * 1024 * 1024) {
      showToast(`${label}: File must be under ${maxMB}MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)}MB.`, 'error');
      return false;
    }
    return true;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file, ALLOWED_SELFIE_TYPES, SELFIE_MAX_MB, 'Profile photo')) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        setProfilePhoto(result);
        if (typeof window !== 'undefined') localStorage.setItem('sevikaa_worker_photo', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAadhaarFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file, ALLOWED_AADHAAR_TYPES, AADHAAR_MAX_MB, 'Aadhaar front')) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        setAadhaarFrontUrl(result);
        setAadhaarFrontUploaded(true);
        if (typeof window !== 'undefined') localStorage.setItem('sevikaa_worker_aadhaar_front', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAadhaarBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file, ALLOWED_AADHAAR_TYPES, AADHAAR_MAX_MB, 'Aadhaar back')) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        setAadhaarBackUrl(result);
        setAadhaarBackUploaded(true);
        if (typeof window !== 'undefined') localStorage.setItem('sevikaa_worker_aadhaar_back', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const [saveDocsLoading, setSaveDocsLoading] = useState(false);

  const onSaveDocuments = async () => {
    setSaveDocsLoading(true);
    try {
      await handleSaveProfile({
        ...workerProfile,
        aadhaarFrontUrl: aadhaarFrontUrl || workerProfile.aadhaar_front_url,
        aadhaarBackUrl: aadhaarBackUrl || workerProfile.aadhaar_back_url,
        introVideoUrl: introVideoUrl || workerProfile.video_url
      });
      showToast('Identity & verification document proofs saved successfully!', 'success');
    } catch (err: any) {
      showToast(`Error saving documents: ${err.message}`, 'error');
    } finally {
      setSaveDocsLoading(false);
    }
  };

  const onSave = async () => {
    if (phone.length !== 10) return;
    await handleSaveProfile({
      name,
      expectedSalary,
      experience,
      phone: `+91 ${phone}`,
      gender,
      age: Number(age),
      preferredShift,
      emergencyContact: emergencyContact ? `+91 ${emergencyContact}` : '',
      bio,
      languages,
      category: selectedSkills.map(id => SKILL_CATEGORIES.find(s => s.id === id)?.defaultLabel || id),
      profilePicUrl: profilePhoto,
      aadhaarFrontUrl,
      aadhaarBackUrl,
      introVideoUrl
    });
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
            <span>{t('workerProfileTitle') || "Worker Profile, Skills & Verification"}</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            {t('workerProfileSub') || "Complete your profile details, skills, and documents to start applying for verified household jobs."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 border shadow-2xs ${
            workerProfile.status === 'live' || workerProfile.status === 'approved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : workerProfile.status === 'changes_requested'
              ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
              : 'bg-blue-50 text-[#1A73E8] border-blue-200'
          }`}>
            <ShieldCheck size={14} />
            <span>{workerProfile.status === 'changes_requested' ? '⚠️ Revision Requested' : workerProfile.status === 'live' ? '🟢 Verified Worker' : '⏳ Pending Audit'}</span>
          </span>
        </div>
      </div>

      {/* ⚠️ ADMIN REVISION DIRECTIONS CALLOUT CARD */}
      {(workerProfile?.admin_note || workerProfile?.adminNote || workerProfile?.status === 'changes_requested') && (
        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-3xl space-y-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0 shadow-sm">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-950">⚠️ Admin Audit Feedback & Required Profile Updates</h3>
              <p className="text-[11px] text-amber-800 font-semibold mt-0.5">Please review the specific directions below and update your profile accordingly before resubmitting.</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 text-xs font-semibold text-slate-800 whitespace-pre-line leading-relaxed shadow-xs">
            {workerProfile.admin_note || workerProfile.adminNote || 'Please review your uploaded documents and profile information to ensure accuracy.'}
          </div>
        </div>
      )}

      {/* 🏡 HERO WORKER PROFILE & COMPLETENESS CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl space-y-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Briefcase size={240} className="text-white" />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
          {/* Profile Photo Uploader */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-700 border-4 border-white/20 shadow-lg flex items-center justify-center text-slate-300 font-black text-2xl">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                name ? name[0].toUpperCase() : 'W'
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
              <h3 className="text-lg sm:text-xl font-black tracking-tight">{name || 'Domestic Worker'}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <IndianRupee size={11} />
                ₹{expectedSalary || '15000'}/mo
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium flex items-center justify-center sm:justify-start gap-1">
              <MapPin size={12} className="text-blue-400" />
              <span className="truncate">{workerProfile.society || 'DLF Westend Heights'}, Bengaluru</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1"><Phone size={11} className="text-emerald-400" /> +91 {phone}</span>
              <span className="flex items-center gap-1"><Briefcase size={11} className="text-amber-400" /> {experience || '3+ Years Exp'}</span>
              <span className="flex items-center gap-1"><Clock size={11} className="text-indigo-400" /> {preferredShift}</span>
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
            <span>{t('profileCompletenessTitle') || "Profile Readiness"}</span>
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
                {step.done ? <CheckCircle2 size={11} className="text-emerald-400" /> : <Lock size={11} />}
                <span>{step.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 🏢 STACKED FORM CARDS */}
      <div className="space-y-6">

        {/* 👤 SECTION A: PERSONAL & WORK DETAILS */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-blue-50 text-[#1A73E8]">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Personal &amp; Salary Details</h3>
              <p className="text-[10.5px] text-slate-400 font-semibold">Your basic profile &amp; salary expectations</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter full name"
                className="w-full p-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1A73E8] rounded-2xl text-xs font-bold text-slate-800 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Primary Mobile Number (OTP Verified)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-black text-slate-400">+91</span>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  maxLength={10}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-3 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1A73E8] rounded-2xl text-xs font-black text-slate-900 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8] cursor-pointer"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Age (Years)</label>
                <input 
                  type="number" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full p-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1A73E8] rounded-2xl text-xs font-bold text-slate-800 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Expected Salary (₹/month)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-black text-slate-400">₹</span>
                  <input 
                    type="number" 
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    placeholder="15000"
                    className="w-full pl-8 pr-3 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1A73E8] rounded-2xl text-xs font-black text-emerald-700 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Total Experience</label>
                <input 
                  type="text" 
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 4 Years"
                  className="w-full p-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1A73E8] rounded-2xl text-xs font-bold text-slate-800 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Preferred Shift Slot</label>
              <select
                value={preferredShift}
                onChange={(e) => setPreferredShift(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8] cursor-pointer"
              >
                {SHIFT_SLOT_OPTIONS.map(slot => (
                  <option key={slot.key} value={slot.label}>
                    {slot.icon} {slot.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">About Me / Bio</label>
              <textarea 
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief introduction about your experience, punctuality, and work ethic..."
                className="w-full p-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#1A73E8] rounded-2xl text-xs font-medium text-slate-800 focus:outline-none transition-colors"
              />
            </div>

            {/* 💾 IN-CARD SAVE BUTTON FOR PERSONAL DETAILS */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onSave}
                disabled={saveLoading || cleanPhone.length !== 10}
                className="py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>{saveLoading ? 'Saving Profile...' : 'Save Profile Details'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 🍳 SECTION B: SKILLS & LANGUAGES */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Briefcase size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Skills &amp; Languages Spoken</h3>
                <p className="text-[10.5px] text-slate-400 font-semibold">Select your core services &amp; languages</p>
              </div>
            </div>

            {/* Skills Multi-Select Flex Wrap */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">Work Services (Select All That Apply)</label>
              <div className="flex flex-wrap gap-2.5">
                {SKILL_CATEGORIES.map(skill => {
                  const isSelected = selectedSkills.includes(skill.id);
                  return (
                    <button
                      type="button"
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`px-4 py-3 rounded-2xl border transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                        isSelected 
                          ? 'bg-blue-50/90 border-[#1A73E8] text-[#1A73E8] shadow-xs font-black ring-1 ring-[#1A73E8]' 
                          : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/80 font-bold'
                      }`}
                    >
                      <span className="text-base shrink-0">{skill.icon}</span>
                      <span className="text-xs">{skill.defaultLabel}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-[#1A73E8] ml-1 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Languages Multi-Select */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="block text-xs font-black text-slate-700 flex items-center gap-1">
                <Languages size={14} className="text-[#1A73E8]" /> Spoken Languages
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(lang => {
                  const isSelected = languages.includes(lang);
                  return (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#1A73E8] text-white font-black shadow-xs' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold'
                      }`}
                    >
                      {isSelected ? `✓ ${lang}` : `+ ${lang}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 🛡️ SECTION C: ID & VIDEO INTRO PROOF VERIFICATION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Aadhaar Card &amp; Video Intro Verification</h3>
              <p className="text-[10.5px] text-slate-400 font-semibold">Government ID proof &amp; 60-second video introduction</p>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase border ${
            isAadhaarDone 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {isAadhaarDone ? '✓ Verified Identity' : '⏳ Action Required'}
          </span>
        </div>

        {/* COMPACT LIST CARDS MATCHING EMPLOYER DESIGN */}
        <div className="space-y-2.5">
          
          {/* Aadhaar Front */}
          <div className="space-y-2">
            <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${(aadhaarFrontUploaded || workerProfile.aadhaar_front_url) ? 'border-emerald-300 bg-emerald-50/60' : 'border-dashed border-slate-200 bg-slate-50 hover:border-blue-300'}`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${(aadhaarFrontUploaded || workerProfile.aadhaar_front_url) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900">Aadhaar — Front</p>
                <p className="text-[10px] text-slate-400 font-semibold truncate">Name, photo &amp; DOB &bull; JPG &bull; PNG &bull; PDF &bull; Max 5MB</p>
              </div>
              {(aadhaarFrontUploaded || workerProfile.aadhaar_front_url) ? (
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
                  <button 
                    type="button"
                    onClick={() => { setAadhaarFrontUploaded(false); setAadhaarFrontUrl(null); if (activeInlinePreview === 'front') setActiveInlinePreview(null); }} 
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
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
                  {(aadhaarFrontUrl || workerProfile.aadhaar_front_url) ? (
                    <img src={aadhaarFrontUrl || workerProfile.aadhaar_front_url || ''} alt="Aadhaar Front" className="max-h-[320px] w-full object-contain rounded-lg" />
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-1 my-auto">
                      <FileText size={32} className="mx-auto text-blue-400 opacity-60 mb-2" />
                      <p>Aadhaar Front Document Verified &amp; Stored</p>
                      <p className="text-[10px] text-slate-500 font-normal">Active document proof linked to worker profile</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Aadhaar Back */}
          <div className="space-y-2">
            <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${(aadhaarBackUploaded || workerProfile.aadhaar_back_url) ? 'border-emerald-300 bg-emerald-50/60' : 'border-dashed border-slate-200 bg-slate-50 hover:border-blue-300'}`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${(aadhaarBackUploaded || workerProfile.aadhaar_back_url) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900">Aadhaar — Back</p>
                <p className="text-[10px] text-slate-400 font-semibold truncate">Aadhaar number &amp; address &bull; JPG &bull; PNG &bull; PDF &bull; Max 5MB</p>
              </div>
              {(aadhaarBackUploaded || workerProfile.aadhaar_back_url) ? (
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
                  <button 
                    type="button"
                    onClick={() => { setAadhaarBackUploaded(false); setAadhaarBackUrl(null); if (activeInlinePreview === 'back') setActiveInlinePreview(null); }} 
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
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
                  {(aadhaarBackUrl || workerProfile.aadhaar_back_url) ? (
                    <img src={aadhaarBackUrl || workerProfile.aadhaar_back_url || ''} alt="Aadhaar Back" className="max-h-[320px] w-full object-contain rounded-lg" />
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-1 my-auto">
                      <FileText size={32} className="mx-auto text-blue-400 opacity-60 mb-2" />
                      <p>Aadhaar Back Document Verified &amp; Stored</p>
                      <p className="text-[10px] text-slate-500 font-normal">Active address proof linked to worker profile</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Intro Video */}
          <div className="space-y-2">
            <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${(videoUploaded || workerProfile.video_url) ? 'border-purple-300 bg-purple-50/60' : 'border-dashed border-slate-200 bg-slate-50 hover:border-purple-300'}`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${(videoUploaded || workerProfile.video_url) ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                <Video size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900">Intro Video (60s)</p>
                <p className="text-[10px] text-slate-400 font-semibold truncate">Self introduction &bull; MP4 &bull; WebM &bull; Max 50MB</p>
              </div>
              {(videoUploaded || workerProfile.video_url) ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveInlinePreview(activeInlinePreview === 'video' ? null : 'video')}
                    className="py-1.5 px-3 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl text-[10.5px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Play size={12} className="text-purple-700 fill-purple-700" />
                    <span>{activeInlinePreview === 'video' ? 'Hide Video' : 'Play Video'}</span>
                  </button>
                  <label className="cursor-pointer">
                    <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoChange} />
                    <div className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer">
                      <Upload size={11} />
                      <span>Change</span>
                    </div>
                  </label>
                  <button 
                    type="button"
                    onClick={() => { setVideoUploaded(false); setIntroVideoUrl(null); if (activeInlinePreview === 'video') setActiveInlinePreview(null); }} 
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer shrink-0">
                  <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoChange} />
                  <div className="py-2 px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap">
                    <Upload size={11} /><span>Upload Video</span>
                  </div>
                </label>
              )}
            </div>

            {/* Inline Video Player Drawer */}
            {activeInlinePreview === 'video' && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 animate-fade-in border border-purple-950 shadow-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                    <Video size={14} /> 60-Second Video Intro Preview
                  </span>
                  <button onClick={() => setActiveInlinePreview(null)} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">
                    Close Video ✕
                  </button>
                </div>
                <div className="flex justify-center bg-black rounded-xl p-1 min-h-[220px] max-h-[360px] overflow-hidden">
                  {(introVideoUrl || workerProfile.video_url) ? (
                    <video src={introVideoUrl || workerProfile.video_url || ''} controls autoPlay className="max-h-[340px] w-full object-contain rounded-lg" />
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-1 my-auto">
                      <Video size={32} className="mx-auto text-purple-400 opacity-60 mb-2" />
                      <p>Video Intro Active &amp; Stored</p>
                      <p className="text-[10px] text-slate-500 font-normal">Self introduction video ready for employer hiring applications</p>
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
            onClick={onSaveDocuments}
            disabled={saveDocsLoading}
            className="py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>{saveDocsLoading ? 'Saving Documents...' : 'Save Uploaded Documents'}</span>
          </button>
        </div>
      </div>

      {/* 🔴 DANGER ZONE: ACCOUNT DELETION */}
      <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-xs space-y-3">
        <button
          type="button"
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="w-full flex justify-between items-center text-xs font-black text-red-600 hover:text-red-700 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Trash2 size={16} />
            <span>Danger Zone &amp; Worker Account Offboarding</span>
          </span>
          {showDangerZone ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showDangerZone && (
          <div className="pt-3 border-t border-red-50 space-y-3 animate-fade-in">
            <p className="text-xs text-slate-500 font-medium">
              If you are moving or no longer wish to work through Sevikaa, you can request profile offboarding.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deletionRequested}
              className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-black transition-all border border-red-200/70 disabled:opacity-50 cursor-pointer"
            >
              {deletionRequested ? 'Account Deletion Pending Review' : 'Request Worker Profile Deletion'}
            </button>
          </div>
        )}
      </div>

      {/* DELETION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-up border border-slate-100">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 pb-3">
              <AlertTriangle size={24} />
              <h3 className="text-sm font-black text-slate-900">Request Profile Deletion</h3>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Please select the primary reason for offboarding your Sevikaa worker profile:
            </p>

            <select
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500"
            >
              <option value="Moving to another city">Moving to another city</option>
              <option value="Found permanent full-time employment">Found permanent full-time employment</option>
              <option value="No longer available for domestic work">No longer available for domestic work</option>
              <option value="Other">Other reason</option>
            </select>

            {deletionReason === 'Other' && (
              <textarea
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specify your reason..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-red-500"
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmitDeletionRequest}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black shadow-md"
              >
                Confirm Offboarding Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
