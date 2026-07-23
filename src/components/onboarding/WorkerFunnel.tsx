"use client";

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { 
  Camera, Calendar, ClipboardCheck, ArrowLeft, ArrowRight,
  Shield, Check, User, DollarSign, Upload, Video, AlertCircle 
} from 'lucide-react';

interface WorkerFunnelProps {
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

const MOCK_SOCIETIES = [
  { id: '1', name: 'Prestige Shantiniketan, Whitefield' },
  { id: '2', name: 'Brigade Gateway, Rajajinagar' },
  { id: '3', name: 'Sobha Clovelly, Padmanabhanagar' },
  { id: '4', name: 'DLF New Heights, Bannerghatta Road' },
  { id: '5', name: 'L&T South City, JP Nagar' }
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = [
  { id: 'early_morning', label: 'Early Morning (6 AM - 9 AM)' },
  { id: 'morning', label: 'Morning (9 AM - 12 PM)' },
  { id: 'afternoon', label: 'Afternoon (12 PM - 3 PM)' },
  { id: 'evening', label: 'Evening (3 PM - 6 PM)' },
  { id: 'night', label: 'Night (6 PM - 9 PM)' }
];

export const WorkerFunnel: React.FC<WorkerFunnelProps> = ({ userId, onComplete, onCancel }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 State: Selfie
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Step 2 State: Basic Details & Languages
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [age, setAge] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Step 3 State: Skills & Availability Grid
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState<Record<string, string[]>>({}); // day -> slots[]
  const [fullDay, setFullDay] = useState(false);
  const [liveIn, setLiveIn] = useState(false);

  // Step 4 State: Salary & Society Preferences
  const [expectedSalary, setExpectedSalary] = useState('12000');
  const [preferredSociety, setPreferredSociety] = useState('');
  const [preferredAreasInput, setPreferredAreasInput] = useState('');
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);

  // Step 5 State: Documents & Video Intro
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Helper selectors
  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleSkill = (skill: string) => {
    setSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleAvailabilityCell = (day: string, slotId: string) => {
    setAvailability(prev => {
      const daySlots = prev[day] || [];
      const updated = daySlots.includes(slotId) 
        ? daySlots.filter(s => s !== slotId) 
        : [...daySlots, slotId];
      return { ...prev, [day]: updated };
    });
  };

  const handleAddArea = () => {
    if (preferredAreasInput.trim() && !preferredAreas.includes(preferredAreasInput.trim())) {
      setPreferredAreas([...preferredAreas, preferredAreasInput.trim()]);
      setPreferredAreasInput('');
    }
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  // Form Validations per step
  const validateStep = () => {
    setError('');
    if (step === 1 && !selfieFile) {
      setError('Please upload or capture a profile selfie');
      return false;
    }
    if (step === 2) {
      if (!fullName.trim()) return setError('Please enter your full name'), false;
      if (!gender) return setError('Please select your gender'), false;
      if (!age || parseInt(age) < 18 || parseInt(age) > 80) return setError('Please enter a valid age between 18 and 80'), false;
      if (selectedLanguages.length === 0) return setError('Please select at least one language you speak'), false;
    }
    if (step === 3) {
      if (skills.length === 0) return setError('Please select at least one job category'), false;
      if (!experience || parseInt(experience) < 0) return setError('Please enter your experience in years'), false;
      // Availability check
      const hasSlot = Object.values(availability).some(slots => slots.length > 0) || fullDay || liveIn;
      if (!hasSlot) return setError('Please designate at least one availability slot or choose live-in/full-day'), false;
    }
    if (step === 4) {
      if (!expectedSalary || parseInt(expectedSalary) <= 0) return setError('Please specify expected salary'), false;
      if (!preferredSociety) return setError('Please select your preferred apartment society'), false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        // Mock API upload database insert delay
        setTimeout(async () => {
          setLoading(false);
          onComplete();
        }, 1500);
        return;
      }

      // Live Supabase inserts
      // 1. Update profiles table: role to worker
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ role: 'worker', status: 'pending_review' })
        .eq('id', userId);

      if (profileErr) throw profileErr;

      // 2. Upload storage documents if present
      let profilePicUrl = '';
      let aadhaarFrontUrl = '';
      let videoUrl = '';

      if (selfieFile) {
        const { data: selfieData, error: selfieErr } = await supabase.storage
          .from('worker-selfies')
          .upload(`${userId}/selfie-${Date.now()}.png`, selfieFile);
        if (selfieErr) throw selfieErr;
        profilePicUrl = selfieData.path;
      }

      if (aadhaarFrontFile) {
        const { data: docData, error: docErr } = await supabase.storage
          .from('worker-documents')
          .upload(`${userId}/aadhaar-front.png`, aadhaarFrontFile);
        if (docErr) throw docErr;
        aadhaarFrontUrl = docData.path;
      }

      if (videoFile) {
        const { data: vidData, error: vidErr } = await supabase.storage
          .from('worker-videos')
          .upload(`${userId}/intro-video.mp4`, videoFile);
        if (vidErr) throw vidErr;
        videoUrl = vidData.path;
      }

      // 3. Insert into worker_profiles
      const { error: workerErr } = await supabase
        .from('worker_profiles')
        .insert({
          user_id: userId,
          full_name: fullName,
          gender,
          age: parseInt(age),
          languages_spoken: selectedLanguages,
          skills,
          expected_salary: parseInt(expectedSalary),
          preferred_society_id: preferredSociety,
          preferred_areas: preferredAreas.length > 0 ? preferredAreas : [MOCK_SOCIETIES.find(s => s.id === preferredSociety)?.name || ''],
          profile_picture_url: profilePicUrl,
          video_url: videoUrl,
          availability_slots: {
            weekly_grid: availability,
            full_day: fullDay,
            live_in: liveIn
          }
        });

      if (workerErr) throw workerErr;

      setLoading(false);
      onComplete();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Onboarding submission failed. Check connections.');
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-8">
      {/* Funnel Progress Indicator */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {step === 1 ? 'STEP 1 OF 5 • SELFIE' : (
              <>
                Step {step} of 5: {step === 2 && 'Personal info'}
                {step === 3 && 'Availability'}
                {step === 4 && 'Preferences'}
                {step === 5 && 'Verification'}
              </>
            )}
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-[#1A73E8]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        {step === 1 && (
          <p className="text-[10px] text-left text-gray-400 font-extrabold tracking-tight">
            Let's verify your identity to keep Sevikaa safe and trusted.
          </p>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        {error && (
          <div className="mb-4 p-3 bg-[#EA4335]/5 border border-[#EA4335]/20 rounded-2xl text-xs text-[#EA4335] text-center font-medium flex items-center justify-center gap-1.5">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Selfie upload */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-[#1A73E8]/10 rounded-full flex items-center justify-center mb-2 text-[#1A73E8]">
                <Camera size={24} />
              </div>
              <h2 className="text-lg font-bold text-[#202124]">Take Your Selfie</h2>
              <p className="text-xs text-gray-500 mt-1">
                Take a clear photo of your face to verify your identity. This helps create a safer and more trusted community for workers and families.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-6 bg-gray-50 hover:bg-gray-100/50 transition-all cursor-pointer relative min-h-[220px]">
              {selfiePreview ? (
                <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-md">
                  <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
                  <label htmlFor="selfie-file" className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={20} />
                  </label>
                </div>
              ) : (
                <label htmlFor="selfie-file" className="flex flex-col items-center justify-center cursor-pointer w-full h-full py-6">
                  <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-sm mb-3">
                    <Camera size={28} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">📷 Take a Photo or Upload a Selfie</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG or JPEG • Max 5 MB</span>
                  <span className="text-[10px] text-[#EA4335] mt-2 font-bold bg-[#EA4335]/5 px-2.5 py-0.5 rounded-full">
                    Make sure your face is clearly visible.
                  </span>
                </label>
              )}
              <input
                id="selfie-file"
                type="file"
                accept="image/*"
                onChange={handleSelfieChange}
                className="hidden"
              />
            </div>
            
            <div className="p-3 bg-[#1A73E8]/5 rounded-2xl text-[10px] text-gray-500 font-bold leading-relaxed flex gap-2">
              <Shield className="text-[#1A73E8] shrink-0 mt-0.5" size={16} />
              <span>🛡️ Your privacy matters. Your selfie is securely encrypted, used only for identity verification, and is never shared publicly without your consent.</span>
            </div>
          </div>
        )}

        {/* STEP 2: Basic Details & Languages */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#202124] mb-3">{t('basicDetails')}</h2>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('fullName')}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('gender')}</label>
              <div className="grid grid-cols-3 gap-2">
                {['male', 'female', 'other'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g as any)}
                    className={`py-3 rounded-xl border-2 transition-all font-bold text-sm capitalize ${
                      gender === g 
                        ? 'border-[#1A73E8] bg-[#1A73E8]/5 text-[#1A73E8]' 
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    {t(g)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('age')}</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter age (18 - 80)"
                className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('languagesTitle')}</label>
              <div className="flex flex-wrap gap-2">
                {['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Assamese', 'Nepali'].map((lang) => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`py-2 px-4 rounded-full border text-xs font-bold transition-all ${
                        isSelected 
                          ? 'border-[#1A73E8] bg-[#1A73E8] text-white shadow-sm' 
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Skills & Availability Grid */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#202124]">{t('skillsTitle')}</h2>

            <div className="grid grid-cols-3 gap-2">
              {['maid', 'cook', 'nanny'].map((cat) => {
                const isSelected = skills.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleSkill(cat)}
                    className={`p-3 rounded-xl border-2 transition-all font-bold text-xs flex flex-col items-center gap-1.5 capitalize ${
                      isSelected 
                        ? 'border-[#1A73E8] bg-[#1A73E8]/5 text-[#1A73E8]' 
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="text-lg">
                      {cat === 'maid' && '🧹'}
                      {cat === 'cook' && '🍳'}
                      {cat === 'nanny' && '👶'}
                    </span>
                    <span>{t(cat).split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('experienceTitle')}</label>
              <input
                type="number"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Experience in years"
                className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Availability Grid</span>
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1 text-[11px] font-bold text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={fullDay} onChange={(e) => setFullDay(e.target.checked)} className="rounded" />
                    <span>Full Day</span>
                  </label>
                  <label className="flex items-center gap-1 text-[11px] font-bold text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={liveIn} onChange={(e) => setLiveIn(e.target.checked)} className="rounded" />
                    <span>Live-in</span>
                  </label>
                </div>
              </div>

              {/* Mobile Friendly Interactive Weekly Slot Grid */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 text-[10px] w-full max-w-full">
                <div className="grid grid-cols-8 bg-gray-100 border-b border-gray-200 text-center py-1 font-bold text-gray-500">
                  <div>Slot</div>
                  {DAYS.map(d => <div key={d}>{d}</div>)}
                </div>
                {SLOTS.map((slot) => (
                  <div key={slot.id} className="grid grid-cols-8 border-b border-gray-200 items-center last:border-0 min-h-[38px] text-center">
                    <div className="font-bold text-gray-400 py-1 border-r border-gray-200 truncate px-0.5 leading-tight" title={slot.label}>
                      {slot.label.split(' ')[0]}
                    </div>
                    {DAYS.map((day) => {
                      const isSelected = availability[day]?.includes(slot.id);
                      return (
                        <div
                          key={day}
                          onClick={() => toggleAvailabilityCell(day, slot.id)}
                          className={`h-full border-r border-gray-200 last:border-r-0 flex items-center justify-center cursor-pointer transition-all active:scale-90 select-none ${
                            isSelected ? 'bg-[#34A853] text-white' : 'hover:bg-gray-100'
                          }`}
                        >
                          {isSelected && <Check size={10} strokeWidth={4} />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 text-center font-medium">Tap cells to toggle your weekly schedule slots</p>
            </div>
          </div>
        )}

        {/* STEP 4: Expected Salary & Society preferences */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#202124]">{t('salaryTitle')}</h2>

            <div className="relative">
              <input
                type="number"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                className="w-full py-4 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8]"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <DollarSign size={20} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('societyTitle')}</label>
              <select
                value={preferredSociety}
                onChange={(e) => setPreferredSociety(e.target.value)}
                className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8]"
              >
                <option value="">-- Choose Society --</option>
                {MOCK_SOCIETIES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t('areasTitle')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={preferredAreasInput}
                  onChange={(e) => setPreferredAreasInput(e.target.value)}
                  placeholder="E.g., Whitefield, JP Nagar"
                  className="flex-1 py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8]"
                />
                <button
                  type="button"
                  onClick={handleAddArea}
                  className="px-4 py-3 bg-[#1A73E8] text-white rounded-2xl font-bold text-sm hover:bg-[#1A73E8]/90"
                >
                  Add
                </button>
              </div>

              {preferredAreas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {preferredAreas.map(area => (
                    <span key={area} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full flex items-center gap-1">
                      <span>{area}</span>
                      <button type="button" onClick={() => setPreferredAreas(preferredAreas.filter(a => a !== area))} className="text-gray-400 hover:text-gray-600 font-bold ml-1">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: Verification documents & Video intro */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[#202124]">{t('documentsTitle')}</h2>

            {/* Aadhaar Uploads */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center p-4 border border-gray-200 rounded-2xl bg-gray-50 text-center relative cursor-pointer active:scale-95 transition-all">
                <label htmlFor="aadhaar-front" className="cursor-pointer flex flex-col items-center">
                  <Upload size={20} className={aadhaarFrontFile ? 'text-[#34A853]' : 'text-gray-400'} />
                  <span className="text-xs font-bold text-gray-700 mt-2">Front Side</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[120px]">
                    {aadhaarFrontFile ? aadhaarFrontFile.name : 'Aadhaar Front'}
                  </span>
                </label>
                <input id="aadhaar-front" type="file" accept="image/*" onChange={(e) => e.target.files && setAadhaarFrontFile(e.target.files[0])} className="hidden" />
              </div>

              <div className="flex flex-col items-center p-4 border border-gray-200 rounded-2xl bg-gray-50 text-center relative cursor-pointer active:scale-95 transition-all">
                <label htmlFor="aadhaar-back" className="cursor-pointer flex flex-col items-center">
                  <Upload size={20} className={aadhaarBackFile ? 'text-[#34A853]' : 'text-gray-400'} />
                  <span className="text-xs font-bold text-gray-700 mt-2">Back Side</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[120px]">
                    {aadhaarBackFile ? aadhaarBackFile.name : 'Aadhaar Back'}
                  </span>
                </label>
                <input id="aadhaar-back" type="file" accept="image/*" onChange={(e) => e.target.files && setAadhaarBackFile(e.target.files[0])} className="hidden" />
              </div>
            </div>

            {/* Video Intro */}
            <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50 flex items-center justify-between gap-3 relative cursor-pointer active:scale-95 transition-all">
              <label htmlFor="video-intro" className="cursor-pointer flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-50 text-[#EA4335] rounded-xl">
                    <Video size={20} />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-bold text-gray-700">{t('videoTitle')}</span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">
                      {videoFile ? videoFile.name : t('videoSub').split(' ').slice(0, 5).join(' ') + '...'}
                    </span>
                  </div>
                </div>
                <Upload size={16} className="text-gray-400" />
              </label>
              <input id="video-intro" type="file" accept="video/*" onChange={(e) => e.target.files && setVideoFile(e.target.files[0])} className="hidden" />
            </div>

            <div className="p-3 bg-[#1A73E8]/5 rounded-2xl text-[11px] text-gray-500 font-medium leading-relaxed flex gap-2">
              <Shield className="text-[#1A73E8] shrink-0" size={16} />
              <span>Identity documents are safely stored in private Supabase buckets, fully shielded from public access.</span>
            </div>
          </div>
        )}

        {/* Funnel Navigation Footer */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={loading}
              className="py-3 px-4 border border-gray-200 hover:bg-gray-50 active:scale-95 text-gray-700 font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-1"
            >
              <ArrowLeft size={16} />
              <span>{t('back')}</span>
            </button>
          ) : (
            <button
              onClick={onCancel}
              disabled={loading}
              className="py-3 px-4 border border-gray-200 hover:bg-gray-50 active:scale-95 text-gray-700 font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-1"
            >
              <ArrowLeft size={16} />
              <span>{t('back')}</span>
            </button>
          )}
          
          <button
            onClick={step === 5 ? handleSubmit : handleNext}
            disabled={loading}
            className={`flex-1 py-3 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 text-sm min-h-[46px] ${
              step === 5 ? 'bg-[#34A853] hover:bg-[#34A853]/90' : 'bg-[#1A73E8] hover:bg-[#1A73E8]/90'
            }`}
          >
            {loading ? (
              <span>{t('loading')}</span>
            ) : (
              <>
                <span>{step === 5 ? t('submit') : t('next')}</span>
                {step < 5 && <ArrowRight size={16} />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
