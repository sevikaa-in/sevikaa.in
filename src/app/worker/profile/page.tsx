"use client";

import React, { useState } from 'react';
import { useWorkerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  User, CheckCircle2, ShieldAlert, AlertTriangle, ChevronDown, ChevronUp, 
  Trash2, Save, Phone, IndianRupee, Briefcase, Languages, Clock,
  Upload, Camera, FileText, Image, Star, ChevronRight, Lock, X, Video
} from 'lucide-react';

const SKILL_CATEGORIES = [
  { id: 'cook', key: 'skillCook', defaultLabel: 'Cook / Chef', icon: '🍳' },
  { id: 'maid', key: 'skillMaid', defaultLabel: 'Housekeeping', icon: '🧹' },
  { id: 'nanny', key: 'skillNanny', defaultLabel: 'Nanny / Childcare', icon: '👶' },
  { id: 'driver', key: 'skillDriver', defaultLabel: 'Driver', icon: '🚗' },
  { id: 'gardener', key: 'skillGardener', defaultLabel: 'Gardener', icon: '🌿' },
  { id: 'security', key: 'skillSecurity', defaultLabel: 'Security Guard', icon: '🛡️' },
  { id: 'laundry', key: 'skillLaundry', defaultLabel: 'Laundry / Ironing', icon: '👕' },
  { id: 'eldercare', key: 'skillEldercare', defaultLabel: 'Elder Care', icon: '🤝' }
];

const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Kannada', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Odia'];

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
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    workerProfile.category?.map((c: string) => 
      SKILL_CATEGORIES.find(s => c.includes(s.defaultLabel.split(' ')[0]))?.id || c
    ) || []
  );
  
  // Profile photo, ID doc & intro video states
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [aadhaarFrontUploaded, setAadhaarFrontUploaded] = useState(false);
  const [aadhaarBackUploaded, setAadhaarBackUploaded] = useState(false);
  const [photoSelfieUploaded, setPhotoSelfieUploaded] = useState(false);
  const [videoUploaded, setVideoUploaded] = useState(false);

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
    setVideoUploaded(true);
    showToast('60-second intro video uploaded successfully!', 'success');
  };

  // Discrete Danger Zone State
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('Moving to another city');
  const [customReason, setCustomReason] = useState('');

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
    const url = URL.createObjectURL(file);
    setProfilePhoto(url);
  };

  const handleAadhaarFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file, ALLOWED_AADHAAR_TYPES, AADHAAR_MAX_MB, 'Aadhaar front')) return;
    setAadhaarFrontUploaded(true);
  };

  const handleAadhaarBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file, ALLOWED_AADHAAR_TYPES, AADHAAR_MAX_MB, 'Aadhaar back')) return;
    setAadhaarBackUploaded(true);
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
      category: selectedSkills.map(id => SKILL_CATEGORIES.find(s => s.id === id)?.defaultLabel || id)
    });
  };

  const onSubmitDeletionRequest = async () => {
    const finalReason = deletionReason === 'Other' ? customReason : deletionReason;
    await handleRequestAccountDeletion(finalReason);
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <User size={18} className="text-[#1A73E8]" />
          <span>{t('workerProfileTitle') || "Profile, Skills & Verification"}</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          {t('workerProfileSub') || "Complete your profile to start applying to verified household jobs."}
        </p>
      </div>

      {/* 📊 PROFILE COMPLETION PROGRESS */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-3xl space-y-3 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black">{t('profileCompletenessTitle') || "Profile Completeness"}</h3>
            <p className="text-[10.5px] text-slate-300 font-semibold mt-0.5">
              {completedCount < completionSteps.length 
                ? `${completionSteps.length - completedCount} ${t('stepsRemainingSub') || 'steps remaining to activate job applications'}` 
                : (t('profileCompleteSub') || '✓ Profile complete — you can apply to jobs!')}
            </p>
          </div>
          <span className={`text-2xl font-black font-mono ${completionPercent === 100 ? 'text-emerald-400' : completionPercent >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
            {completionPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              completionPercent === 100 ? 'bg-emerald-400' : completionPercent >= 60 ? 'bg-amber-400' : 'bg-[#1A73E8]'
            }`}
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {/* Step pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {completionSteps.map(step => (
            <span key={step.key} className={`flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-full border ${
              step.done 
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}>
              {step.done ? '✓' : '○'} {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* 📷 PROFILE PHOTO — also used as Aadhaar face match */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Image size={15} className="text-[#1A73E8]" />
            <span>{t('profilePhotoTitle') || "Profile Photo"}</span>
          </h3>
          {profilePhoto 
            ? <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1"><CheckCircle2 size={10} /> {t('uploadedBadge') || 'Uploaded'}</span>
            : <span className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-200">{t('requiredBadge') || 'Required'}</span>
          }
        </div>

        <div className="flex items-center gap-5">
          {/* Avatar preview */}
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
            {profilePhoto 
              ? <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              : <User size={28} className="text-slate-300" />
            }
          </div>
          <div className="space-y-2 flex-1">
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              {t('profilePhotoDesc') || "Upload a clear front-facing photo. This is shown to employers on your application and used as your face match for Aadhaar verification."}
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

      {/* Candidate Details Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">{t('candidateDetailsTitle') || "Candidate Details"}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase flex justify-between">
              <span>{t('fullNameLabel') || "Full Name"}</span>
              <span className="text-[9px] text-slate-400 lowercase font-normal">{t('lettersOnlyLabel') || "(letters only)"}</span>
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Sunita Sharma"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
            />
          </div>

          {/* Primary Mobile */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase flex justify-between">
              <span>{t('mobileNumberLabel') || "Fixed 10-Digit Mobile Number"}</span>
              <span className={`text-[9px] font-bold ${phone.length === 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {phone.length === 10 ? (t('validDigitBadge') || '✓ Valid') : `${phone.length}/10`}
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

          {/* Gender */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase">{t('genderLabel') || "Gender"}</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
            >
              <option value="female">{t('genderFemale') || "Female"}</option>
              <option value="male">{t('genderMale') || "Male"}</option>
              <option value="other">{t('genderOther') || "Other"}</option>
            </select>
          </div>

          {/* Age */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase">{t('ageLabel') || "Age (Years)"}</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28"
              min={18}
              max={65}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
            />
          </div>

          {/* Expected Salary */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase">{t('expectedSalaryLabel') || "Expected Monthly Salary (₹)"}</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-black">₹</span>
              <input 
                type="text" 
                value={expectedSalary} 
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="e.g. 18000"
                className="w-full p-2.5 pl-7 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Years of Experience */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase">{t('experienceLabel') || "Years of Experience"}</label>
            <select 
              value={experience} 
              onChange={(e) => setExperience(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
            >
              <option value="">{t('selectExperiencePlaceholder') || "Select experience..."}</option>
              <option value="Less than 1 Year">{t('expLessThan1') || "Less than 1 Year"}</option>
              <option value="1-2 Years">{t('exp1to2') || "1-2 Years"}</option>
              <option value="2-4 Years">{t('exp2to4') || "2-4 Years"}</option>
              <option value="4-6 Years">{t('exp4to6') || "4-6 Years"}</option>
              <option value="6-10 Years">{t('exp6to10') || "6-10 Years"}</option>
              <option value="10+ Years">{t('expMoreThan10') || "10+ Years"}</option>
            </select>
          </div>

          {/* Preferred Work Shift / Hours - Custom Theme Dropdown */}
          <div className="space-y-1 relative">
            <label className="text-slate-500 text-[10px] uppercase block">{t('preferredShiftLabel') || "Preferred Work Shift / Availability"}</label>
            
            <button
              type="button"
              onClick={() => setIsShiftDropdownOpen(!isShiftDropdownOpen)}
              className="w-full p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-slate-800 font-bold flex items-center justify-between text-left transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-sm shrink-0">
                  {SHIFT_SLOT_OPTIONS.find(s => s.label === preferredShift)?.icon || '🕒'}
                </span>
                <span className="truncate">{t(SHIFT_SLOT_OPTIONS.find(s => s.label === preferredShift)?.key || '') || preferredShift}</span>
              </div>
              {isShiftDropdownOpen ? <ChevronUp size={15} className="text-[#1A73E8] shrink-0 ml-1" /> : <ChevronDown size={15} className="text-slate-400 shrink-0 ml-1" />}
            </button>

            {isShiftDropdownOpen && (
              <>
                {/* Backdrop overlay */}
                <div className="fixed inset-0 z-20" onClick={() => setIsShiftDropdownOpen(false)} />

                {/* Custom Sevikaa Theme Popover Menu - Expanded Width & Full Details */}
                <div className="absolute top-full left-0 mt-1 w-full min-w-[290px] sm:min-w-[320px] bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 space-y-1 max-h-72 overflow-y-auto animate-scale-up">
                  {SHIFT_SLOT_OPTIONS.map((slot) => {
                    const isSelected = preferredShift === slot.label;
                    return (
                      <button
                        key={slot.label}
                        type="button"
                        onClick={() => {
                          setPreferredShift(slot.label);
                          setIsShiftDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-50/90 text-[#1A73E8] font-black border border-blue-200/60 shadow-xs' 
                            : 'hover:bg-slate-50 text-slate-700 font-semibold'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-lg shrink-0 mt-0.5">{slot.icon}</span>
                          <div>
                            <p className="text-xs font-black text-slate-900 leading-tight whitespace-normal">{t(slot.key) || slot.label}</p>
                            <p className="text-[10px] text-slate-400 font-semibold leading-normal mt-0.5 whitespace-normal">{t(slot.subKey) || slot.sub}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={16} className="text-[#1A73E8] shrink-0 ml-2 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Emergency Backup Contact */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[10px] uppercase">{t('emergencyContactLabel') || "Emergency Backup Mobile (Optional)"}</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">+91</span>
              <input 
                type="text" 
                maxLength={10}
                value={emergencyContact} 
                onChange={(e) => setEmergencyContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Backup family contact"
                className="w-full p-2.5 pl-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Self Bio / Work Summary */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-slate-500 text-[10px] uppercase">{t('shortBioLabel') || "Short Self Introduction & Specializations"}</label>
            <textarea 
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('bioPlaceholder') || "e.g. Hardworking cook with 5+ years experience in North & South Indian cooking..."}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-50 flex justify-end">
          <button
            onClick={onSave}
            disabled={saveLoading || phone.length !== 10 || !name.trim()}
            className="py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            <span>{saveLoading ? (t('savingText') || 'Saving...') : (t('saveProfileDetailsBtn') || 'Save Profile Details')}</span>
          </button>
        </div>
      </div>

      {/* 🎯 SKILLS / CATEGORY SELECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Briefcase size={15} className="text-[#1A73E8]" />
            <span>{t('skillsCategoriesTitle') || "Skills & Service Categories"}</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-bold">{selectedSkills.length} selected</span>
        </div>
        <p className="text-[11px] text-slate-500 font-medium -mt-2">
          {t('skillsCategoriesSub') || "Select all services you can provide. Employers filter by these categories."}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SKILL_CATEGORIES.map(skill => {
            const isSelected = selectedSkills.includes(skill.id);
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.id)}
                className={`p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative ${
                  isSelected 
                    ? 'bg-blue-50 border-[#1A73E8] text-[#1A73E8] ring-1 ring-[#1A73E8]/30 scale-[1.02]' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                {isSelected && (
                  <CheckCircle2 size={13} className="absolute top-2 right-2 text-[#1A73E8]" />
                )}
                <span className="text-xl">{skill.icon}</span>
                <p className="text-[10.5px] font-black mt-1.5 leading-tight">{t(skill.key) || skill.defaultLabel}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🌐 LANGUAGE SKILLS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Languages size={15} className="text-[#1A73E8]" />
            <span>{t('languagesSpokenTitle') || "Languages Spoken"}</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-bold">{languages.length} selected</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map(lang => {
            const isSelected = languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`py-1.5 px-3.5 rounded-full text-[10.5px] font-black border transition-all cursor-pointer active:scale-95 ${
                  isSelected 
                    ? 'bg-[#1A73E8] border-[#1A73E8] text-white shadow-sm' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {isSelected && '✓ '}{lang}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🪪 AADHAAR ID VERIFICATION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileText size={15} className="text-[#1A73E8]" />
            <span>{t('aadhaarVerificationTitle') || "Aadhaar ID Verification"}</span>
          </h3>
          {aadhaarFrontUploaded && aadhaarBackUploaded
            ? <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1"><CheckCircle2 size={10} /> {t('uploadedBadge') || 'Submitted'}</span>
            : <span className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1"><Lock size={10} /> {t('requiredToApplyBadge') || 'Required to Apply'}</span>
          }
        </div>

        {!aadhaarFrontUploaded || !aadhaarBackUploaded ? (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-amber-900">
            <ShieldAlert size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium leading-relaxed">
              {t('aadhaarNoticeDesc') || "Upload both sides of your Aadhaar card. This is used only for identity verification and is never shared with employers."}
            </p>
          </div>
        ) : null}

        <div className="space-y-2.5">
          {/* Aadhaar Front */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${aadhaarFrontUploaded ? 'border-emerald-300 bg-emerald-50/60' : 'border-dashed border-slate-200 bg-slate-50 hover:border-blue-300'}`}>
            <div className={`p-2.5 rounded-xl shrink-0 ${aadhaarFrontUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              <FileText size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900">{t('aadhaarFrontLabel') || "Aadhaar — Front"}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{t('aadhaarFrontDesc') || "Name, photo & DOB · JPG · PNG · PDF · Max 5MB"}</p>
            </div>
            {aadhaarFrontUploaded ? (
              <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1.5 rounded-xl shrink-0">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-800">{t('uploadedBadge') || "Uploaded"}</span>
                <button onClick={() => setAadhaarFrontUploaded(false)} className="text-emerald-600 hover:text-red-500 ml-1 cursor-pointer">✕</button>
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

          {/* Aadhaar Back */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${aadhaarBackUploaded ? 'border-emerald-300 bg-emerald-50/60' : 'border-dashed border-slate-200 bg-slate-50 hover:border-blue-300'}`}>
            <div className={`p-2.5 rounded-xl shrink-0 ${aadhaarBackUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              <FileText size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900">{t('aadhaarBackLabel') || "Aadhaar — Back"}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{t('aadhaarBackDesc') || "Aadhaar number & address · JPG · PNG · PDF · Max 5MB"}</p>
            </div>
            {aadhaarBackUploaded ? (
              <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1.5 rounded-xl shrink-0">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-800">{t('uploadedBadge') || "Uploaded"}</span>
                <button onClick={() => setAadhaarBackUploaded(false)} className="text-emerald-600 hover:text-red-500 ml-1 cursor-pointer">✕</button>
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
        </div>

        {aadhaarFrontUploaded && aadhaarBackUploaded && profilePhoto && (
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-emerald-900">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-black">{t('allDocsSubmittedTitle') || "All Documents Submitted — Pending Admin Review"}</p>
              <p className="text-[10.5px] font-medium">{t('allDocsSubmittedDesc') || "Sevikaa Admin will verify your Aadhaar within 24–48 hours. You'll receive an SMS once you're cleared to apply."}</p>
            </div>
          </div>
        )}
      </div>

      {/* 🎥 60-SECOND INTRO VIDEO (OPTIONAL) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Video size={15} className="text-[#1A73E8]" />
            <span>{t('videoIntroTitle') || "60-Second Video Intro (Optional)"}</span>
          </h3>
          {videoUploaded ? (
            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={10} /> {t('uploadedBadge') || "Uploaded"}
            </span>
          ) : (
            <span className="bg-blue-50 text-[#1A73E8] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200">
              {t('videoBoostBadge') || "Boosts Applications +80%"}
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-500 font-medium">
          {t('videoIntroDesc') || "Upload a 30–60 second introduction video introducing your work experience and cooking/cleaning skills."}
        </p>

        <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${videoUploaded ? 'border-emerald-300 bg-emerald-50/60' : 'border-dashed border-slate-200 bg-slate-50 hover:border-blue-300'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${videoUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              <Video size={16} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">{t('videoIntroTitle') || "Worker Intro Video"}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{t('videoSpecs') || "MP4 · WebM · Max 50MB"}</p>
            </div>
          </div>

          {videoUploaded ? (
            <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1.5 rounded-xl shrink-0">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-800">{t('uploadedBadge') || "Uploaded"}</span>
              <button onClick={() => setVideoUploaded(false)} className="text-emerald-600 hover:text-red-500 ml-1 cursor-pointer">✕</button>
            </div>
          ) : (
            <label className="cursor-pointer shrink-0">
              <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoChange} />
              <div className="py-2 px-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-[10.5px] font-black flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap">
                <Upload size={11} /><span>{t('uploadVideoBtn') || "Upload Video"}</span>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* DISCRETE DANGER ZONE CARD */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
        <button
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900">{t('accountPrivacyTitle') || "Account Privacy & Danger Zone"}</h4>
              <p className="text-[10px] text-slate-400 font-semibold">{t('accountPrivacySub') || "Self-service account deletion & DPDP compliance"}</p>
            </div>
          </div>
          {showDangerZone ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        {showDangerZone && (
          <div className="p-5 border-t border-slate-100 bg-red-50/20 space-y-3">
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {t('dangerZoneDesc') || "If you wish to remove your candidate profile from Sevikaa's active society hiring feeds, you can submit a deletion request."}
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-600" />
                <h3 className="text-sm font-black text-slate-900">{t('requestDeletionModalTitle') || "Request Account Deletion"}</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              {t('requestDeletionModalSub') || "Please state your reason for deleting your account."}
            </p>

            <div className="space-y-2 text-xs font-bold text-slate-700">
              <label className="text-[10px] text-slate-400 uppercase">{t('reasonLabel') || "Reason for Leaving"}</label>
              <select 
                value={deletionReason} 
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="Moving to another city">{t('reasonMoving') || "Moving to another city"}</option>
                <option value="Hired full-time elsewhere">{t('reasonHiredFullTime') || "Hired full-time elsewhere"}</option>
                <option value="Taking a break from work">{t('reasonTakingBreak') || "Taking a break from work"}</option>
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
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                {t('cancelBtn') || "Cancel"}
              </button>
              <button 
                onClick={onSubmitDeletionRequest}
                disabled={saveLoading}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
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
