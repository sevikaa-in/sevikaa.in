"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Camera, Calendar, ClipboardCheck, ArrowLeft, ArrowRight,
  Shield, Check, User, IndianRupee, Upload, Video, AlertCircle, Clock, Search, ChevronDown 
} from 'lucide-react';

interface WorkerFunnelProps {
  onComplete: () => void;
  onCancel: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = [
  { id: 'early_morning', label: 'Early Morning (6 AM - 9 AM)' },
  { id: 'morning', label: 'Morning (9 AM - 12 PM)' },
  { id: 'afternoon', label: 'Afternoon (12 PM - 3 PM)' },
  { id: 'evening', label: 'Evening (3 PM - 6 PM)' },
  { id: 'night', label: 'Night (6 PM - 9 PM)' }
];

const getSavedDraft = () => {
  if (typeof window === 'undefined') return null;
  try {
    const str = sessionStorage.getItem('sevikaa_worker_onboarding_draft') || localStorage.getItem('sevikaa_worker_onboarding_draft');
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
};

export const WorkerFunnel: React.FC<WorkerFunnelProps> = ({ onComplete, onCancel }) => {
  const { t, language } = useLanguage();

  const [step, setStep] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    if (stepParam) {
      const parsed = parseInt(stepParam, 10);
      if (parsed >= 1 && parsed <= 5) return parsed;
    }
    const savedStep = sessionStorage.getItem('sevikaa_worker_onboarding_step') || localStorage.getItem('sevikaa_worker_onboarding_step');
    if (savedStep) {
      const parsed = parseInt(savedStep, 10);
      if (parsed >= 1 && parsed <= 5) return parsed;
    }
    return 1;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [societiesList, setSocietiesList] = useState<any[]>([]);

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const { webApiClient } = await import('@/lib/webApiClient');
        const data = await webApiClient.get('/api/societies');
        if (data && data.success && data.societies && data.societies.length > 0) {
          setSocietiesList(data.societies);
        } else {
          setError('Failed to load societies list. Please refresh or try again.');
        }
      } catch (err) {
        console.error("Error fetching societies:", err);
        setError('Unable to load societies list.');
      }
    };
    fetchSocieties();
  }, []);

  // Step 1 State: Selfie
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Step 2 State: Basic Details & Languages
  const [fullName, setFullName] = useState<string>(() => getSavedDraft()?.fullName || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(() => getSavedDraft()?.gender || '');
  const [age, setAge] = useState<string>(() => getSavedDraft()?.age ? String(getSavedDraft().age) : '');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() => Array.isArray(getSavedDraft()?.selectedLanguages) ? getSavedDraft().selectedLanguages : []);

  // Step 3 State: Skills & Experience
  const [skills, setSkills] = useState<string[]>(() => Array.isArray(getSavedDraft()?.skills) ? getSavedDraft().skills : []);
  const [experience, setExperience] = useState<string>(() => getSavedDraft()?.experience !== undefined && getSavedDraft()?.experience !== null ? String(getSavedDraft().experience) : '');
  const [selectedShifts, setSelectedShifts] = useState<string[]>(() => Array.isArray(getSavedDraft()?.selectedShifts) && getSavedDraft().selectedShifts.length > 0 ? getSavedDraft().selectedShifts : ['full_day']);

  // Step 4 State: Salary & Society Preferences
  const [expectedSalary, setExpectedSalary] = useState<string>(() => getSavedDraft()?.expectedSalary ? String(getSavedDraft().expectedSalary) : '');
  const [preferredSociety, setPreferredSociety] = useState<string>(() => getSavedDraft()?.preferredSociety || '');
  const [preferredAreasInput, setPreferredAreasInput] = useState('');
  const [preferredAreas, setPreferredAreas] = useState<string[]>(() => Array.isArray(getSavedDraft()?.preferredAreas) ? getSavedDraft().preferredAreas : []);
  const [societyDropdownOpen, setSocietyDropdownOpen] = useState(false);
  const [societySearch, setSocietySearch] = useState('');
  const societyDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (societyDropdownRef.current && !societyDropdownRef.current.contains(e.target as Node)) {
        setSocietyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper selectors
  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleSkill = (skillId: string) => {
    setSkills(prev => 
      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
    );
  };

  const toggleShift = (shiftId: string) => {
    setSelectedShifts(prev =>
      prev.includes(shiftId) ? prev.filter(s => s !== shiftId) : [...prev, shiftId]
    );
  };

  const handleAddArea = () => {
    const trimmed = preferredAreasInput.trim();
    if (trimmed && !preferredAreas.includes(trimmed)) {
      setPreferredAreas([...preferredAreas, trimmed]);
      setPreferredAreasInput('');
    }
  };

  // Web Camera Live Stream state & refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');

  // Restore cached draft selfie photo on mount if available
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cachedPhoto = sessionStorage.getItem('sevikaa_worker_draft_photo') || localStorage.getItem('sevikaa_worker_draft_photo');
      if (cachedPhoto) {
        setSelfiePreview(cachedPhoto);
      } else {
        const uStr = localStorage.getItem('sevikaa_user') || sessionStorage.getItem('sevikaa_user');
        if (uStr) {
          const uObj = JSON.parse(uStr);
          const existingPhoto = uObj.profile_picture_url || uObj.avatar_url || uObj.user_metadata?.avatar_url;
          if (existingPhoto) {
            setSelfiePreview(existingPhoto);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to restore cached worker photo:", e);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    stopCameraStream();
    setCameraError('');
    setSelfieFile(file);
    
    // Convert to Data URL so it persists in sessionStorage / localStorage across page refreshes
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setSelfiePreview(dataUrl);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sevikaa_worker_draft_photo', dataUrl);
          localStorage.setItem('sevikaa_worker_draft_photo', dataUrl);
        }
      } catch (e) {
        console.warn('Failed to cache draft photo to storage:', e);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = () => {
    stopCameraStream();
    setCameraError('');
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    setCameraError('');
    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Browser camera blocked. Tap below to use device camera or upload photo.');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' }, width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false
      });

      setStream(mediaStream);
    } catch (err: any) {
      console.warn("Camera permission notice:", err);
      setCameraError('Browser camera blocked. Tap below to use device camera or upload photo.');
    }
  };

  // Sync mediaStream to video element when video component mounts
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn("Video play notice:", e));
    }
  }, [stream]);

  const captureSelfie = () => {
    if (videoRef.current && stream) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 640;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
            handleFileSelect(file);
          }
        }, 'image/jpeg');
      }
    }
  };

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleRetake = () => {
    stopCameraStream();
    setCameraError('');
    setSelfieFile(null);
    setSelfiePreview(null);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('sevikaa_worker_draft_photo');
        localStorage.removeItem('sevikaa_worker_draft_photo');
      }
    } catch (e) {}
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Listen for browser Back/Forward navigation (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const stepParam = urlParams.get('step');
      if (stepParam) {
        const parsed = parseInt(stepParam, 10);
        if (parsed >= 1 && parsed <= 5) {
          setStep(parsed);
          sessionStorage.setItem('sevikaa_worker_onboarding_step', String(parsed));
          localStorage.setItem('sevikaa_worker_onboarding_step', String(parsed));
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Save current step & draft input fields to sessionStorage & localStorage on every update
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.setItem('sevikaa_worker_onboarding_step', String(step));
      localStorage.setItem('sevikaa_worker_onboarding_step', String(step));

      const draft = {
        step,
        fullName,
        gender,
        age,
        selectedLanguages,
        skills,
        experience,
        selectedShifts,
        expectedSalary,
        preferredSociety,
        preferredAreas
      };
      sessionStorage.setItem('sevikaa_worker_onboarding_draft', JSON.stringify(draft));
      localStorage.setItem('sevikaa_worker_onboarding_draft', JSON.stringify(draft));

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('step') !== String(step)) {
        window.history.replaceState({ step }, '', `?role=worker&step=${step}`);
      }
    } catch (e) {
      console.warn("Failed to save worker onboarding progress:", e);
    }
  }, [step, fullName, gender, age, selectedLanguages, skills, experience, selectedShifts, expectedSalary, preferredSociety, preferredAreas]);

  // Form Validations per step
  const validateStep = () => {
    setError('');
    if (step === 1 && !selfieFile && !selfiePreview) {
      setError('Please upload or capture a profile selfie');
      return false;
    }
    if (step === 2) {
      if (!fullName.trim()) return setError('Please enter your full name'), false;
      if (!gender) return setError('Please select your gender (female, male, or other)'), false;
      if (!age || isNaN(parseInt(age)) || parseInt(age) < 18 || parseInt(age) > 80) return setError('Please enter a valid age between 18 and 80'), false;
      if (selectedLanguages.length === 0) return setError('Please select at least one language you speak'), false;
    }
    if (step === 3) {
      if (skills.length === 0) return setError('Please select at least one job category'), false;
      if (experience === '' || isNaN(parseInt(experience)) || parseInt(experience) < 0) return setError('Please enter your experience in years'), false;
      if (selectedShifts.length === 0) return setError('Please select at least one preferred shift timing'), false;
    }
    if (step === 4) {
      if (!expectedSalary || isNaN(parseInt(expectedSalary)) || parseInt(expectedSalary) <= 0) return setError('Please specify expected monthly salary'), false;
      if (!preferredSociety.trim()) return setError('Please select or specify your preferred apartment society'), false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      const nextStep = Math.min(step + 1, 5);
      setStep(nextStep);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sevikaa_worker_onboarding_step', String(nextStep));
        localStorage.setItem('sevikaa_worker_onboarding_step', String(nextStep));
        window.history.pushState({ step: nextStep }, '', `?role=worker&step=${nextStep}`);
      }
    }
  };

  const handleBack = () => {
    setError('');
    setSocietyDropdownOpen(false);
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sevikaa_worker_onboarding_step', String(prevStep));
        localStorage.setItem('sevikaa_worker_onboarding_step', String(prevStep));
        window.history.pushState({ step: prevStep }, '', `?role=worker&step=${prevStep}`);
      }
    } else {
      if (onCancel) onCancel();
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!validateStep()) return;
    setLoading(true);

    try {
      const SHIFT_LABEL_MAP: Record<string, string> = {
        full_day: 'Full Day (8–12 Hours)',
        early_morning: 'Early Morning (6 AM – 9 AM)',
        morning: 'Morning Shift (9 AM – 12 PM)',
        afternoon: 'Afternoon Shift (12 PM – 3 PM)',
        evening: 'Evening Shift (3 PM – 6 PM)',
        night: 'Night Shift (6 PM – 9 PM)',
        live_in: 'Live-In (24x7)',
        part_time: 'Part-Time Flexible'
      };
      const formattedShiftString = selectedShifts.map((s: string) => SHIFT_LABEL_MAP[s] || s).join(', ');

      let photoDataUrl: string | undefined = undefined;
      if (selfieFile) {
        photoDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selfieFile);
        }).catch(() => undefined);
      } else if (selfiePreview) {
        photoDataUrl = selfiePreview;
      }

      // PART 1: Web Dedicated Onboarding API submit via fetch with credentials: 'same-origin'
      const res = await fetch('/api/worker/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-platform': 'web'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          full_name: fullName.trim(),
          gender,
          age: parseInt(age, 10),
          experience_years: parseInt(experience, 10) || 0,
          expected_salary: parseInt(expectedSalary, 10),
          skills,
          languages_spoken: selectedLanguages,
          primary_gated_society: preferredSociety,
          preferred_shift: formattedShiftString,
          profile_picture_url: photoDataUrl,
          avatar_url: photoDataUrl
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.hasCompletedProfile || data.message?.includes('already completed')) {
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('sevikaa_worker_draft_photo');
              localStorage.removeItem('sevikaa_worker_draft_photo');
            }
          } catch (e) {}
          setLoading(false);
          onComplete();
          return;
        }
        setLoading(false);
        if (res.status === 401) {
          setError(data.message || 'Onboarding session expired. Please verify OTP again.');
          setTimeout(() => {
            if (onCancel) onCancel();
          }, 2500);
          return;
        }
        setError(data.message || data.error || 'Failed to complete worker onboarding. Please check your entries.');
        return;
      }

      try {
        if (typeof window !== 'undefined') {
          const completedProfileCache = {
            name: fullName.trim(),
            gender: gender,
            age: parseInt(age, 10) || 28,
            experience: experience.trim() || '0',
            expectedSalary: expectedSalary.trim() || '15000',
            skills: skills,
            languages: selectedLanguages,
            society: preferredSociety,
            preferredShift: formattedShiftString,
            profile_picture_url: photoDataUrl || null,
            avatar_url: photoDataUrl || null
          };
          localStorage.setItem('sevikaa_worker_profile_cache', JSON.stringify(completedProfileCache));
          sessionStorage.removeItem('sevikaa_worker_draft_photo');
          localStorage.removeItem('sevikaa_worker_draft_photo');
          sessionStorage.removeItem('sevikaa_worker_onboarding_step');
          localStorage.removeItem('sevikaa_worker_onboarding_step');
          sessionStorage.removeItem('sevikaa_worker_onboarding_draft');
          localStorage.removeItem('sevikaa_worker_onboarding_draft');
        }
      } catch (e) {}

      // Establish normal session token
      if (data.access_token || data.token) {
        const token = data.access_token || data.token;
        const { setInMemoryAccessToken } = await import('@/lib/webApiClient');
        setInMemoryAccessToken(token);
      }

      setLoading(false);
      onComplete();

    } catch (err: any) {
      console.error("Worker onboarding submission failure:", err);
      setLoading(false);
      setError(err?.message || 'Network error occurred while completing onboarding. Please retry.');
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-8">
      {/* Header Stepper */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#1A73E8] uppercase tracking-wider">
            Worker Onboarding • Step {step} of 5
          </span>
          <span className="text-xs font-bold text-gray-400">
            {Math.round((step / 5) * 100)}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#1A73E8] transition-all duration-300 ease-out" 
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold animate-in fade-in duration-200">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: SELFIE */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-[#202124]">Profile Photo</h2>
            <p className="text-xs text-gray-500 font-medium">Take a clear front-facing photo for your Verified Passport ID badge.</p>
          </div>

          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 space-y-4">
            {selfiePreview ? (
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-[#1A73E8] shadow-lg">
                <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
              </div>
            ) : stream ? (
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-[#1A73E8] shadow-lg">
                <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay playsInline muted />
              </div>
            ) : (
              <div className="w-48 h-48 rounded-full bg-blue-50 border-4 border-dashed border-[#1A73E8]/30 flex flex-col items-center justify-center text-[#1A73E8]">
                <Camera size={48} />
                <span className="text-xs font-bold mt-2">Front Camera</span>
              </div>
            )}

            {cameraError && (
              <p className="text-xs text-amber-600 font-bold text-center px-4 leading-relaxed">{cameraError}</p>
            )}

            {/* Hidden native inputs for maximum device compatibility */}
            <input
              ref={nativeCameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = '';
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = '';
              }}
            />

            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
              {stream ? (
                <>
                  <button
                    type="button"
                    onClick={captureSelfie}
                    className="flex-1 py-3 px-4 bg-[#1A73E8] text-white rounded-2xl font-bold text-xs hover:bg-[#155cb4] active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Camera size={16} />
                    Capture 📸
                  </button>
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="py-3 px-4 bg-gray-200 text-gray-700 rounded-2xl font-bold text-xs hover:bg-gray-300 active:scale-95 transition-all cursor-pointer"
                  >
                    Cancel ❌
                  </button>
                </>
              ) : selfiePreview ? (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-xs hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
                >
                  Retake Photo 🔄
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 py-3 px-4 bg-[#1A73E8] text-white rounded-2xl font-bold text-xs hover:bg-[#155cb4] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Camera size={16} />
                    Open Camera
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadPhoto}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-xs hover:bg-gray-200 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-gray-200"
                  >
                    <Upload size={16} />
                    Upload Photo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: BASIC DETAILS */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-[#202124]">Personal Details</h2>
            <p className="text-xs text-gray-500 font-medium">Enter your name, gender, age, and spoken languages.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="As per official ID (e.g., Sunita Devi)"
                className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'female', label: 'Female' },
                  { id: 'male', label: 'Male' },
                  { id: 'other', label: 'Other' }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(g.id as any)}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      gender === g.id
                        ? 'bg-blue-50 border-[#1A73E8] text-[#1A73E8]'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Age (Years)</label>
              <input
                type="number"
                min="18"
                max="80"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age between 18 and 80"
                className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Languages Spoken</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Hindi', 'English', 'Kannada', 'Tamil', 'Telugu', 'Bengali', 'Marathi'].map(lang => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-[#1A73E8] text-[#1A73E8]'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {isSelected ? '✓ ' : ''}{lang}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: SKILLS & EXPERIENCE */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-[#202124]">Skills & Experience</h2>
            <p className="text-xs text-gray-500 font-medium">Select primary work category and years of experience.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Work Category</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'cook', title: '🍳 Home Cook', desc: 'North & South Indian Thali, Jain Meals' },
                  { id: 'maid', title: '🧹 Housekeeper / Maid', desc: 'Mopping, Dusting, Utensils & Laundry' },
                  { id: 'nanny', title: '👶 Baby Nanny / Caregiver', desc: 'Infant Feeding, Child Hygiene & Care' }
                ].map((role) => {
                  const isSelected = skills.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleSkill(role.id)}
                      className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 border-[#1A73E8] text-[#1A73E8]'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-bold text-xs">{role.title}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{role.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Total Experience (Years)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="E.g., 3"
                className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SALARY & SOCIETY */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-[#202124]">Salary & Location</h2>
            <p className="text-xs text-gray-500 font-medium">Specify your expected salary and primary society preference.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Expected Monthly Salary (₹)</label>
              <input
                type="number"
                min="1000"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="E.g., 15000"
                className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 focus:outline-none transition-all"
              />
            </div>

            <div className="relative" ref={societyDropdownRef}>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Primary Gated Society</label>
              <button
                type="button"
                onClick={() => setSocietyDropdownOpen(!societyDropdownOpen)}
                className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-[#202124] flex items-center justify-between hover:bg-white focus:border-[#1A73E8] focus:outline-none transition-all cursor-pointer"
              >
                <span className="truncate">
                  {societiesList.find(s => s.id === preferredSociety || s.name === preferredSociety)?.name || preferredSociety || '-- Select Society --'}
                </span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${societyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {societyDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col p-2 space-y-2">
                  <input
                    type="text"
                    value={societySearch}
                    onChange={(e) => setSocietySearch(e.target.value)}
                    placeholder="Search society..."
                    autoFocus
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {societiesList.filter(s => s.name?.toLowerCase().includes(societySearch.toLowerCase().trim())).map((s) => (
                      <button
                        key={s.id || s.name}
                        type="button"
                        onClick={() => {
                          setPreferredSociety(s.name || s.id);
                          setSocietyDropdownOpen(false);
                          setSocietySearch('');
                        }}
                        className="w-full py-2.5 px-3.5 rounded-xl text-xs font-extrabold text-left text-slate-900 bg-white hover:bg-blue-50 hover:text-[#1A73E8] transition-colors cursor-pointer"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & SUBMIT */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-[#202124]">Review & Submit</h2>
            <p className="text-xs text-gray-500 font-medium">Verify your details before completing registration.</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-5 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-400 font-bold">Full Name</span>
              <span className="font-bold text-[#202124]">{fullName || 'Not specified'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-400 font-bold">Gender / Age</span>
              <span className="font-bold text-[#202124]">{gender || '--'}, {age || '--'} yrs</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-400 font-bold">Languages</span>
              <span className="font-bold text-[#202124]">{selectedLanguages.join(', ') || 'None'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-400 font-bold">Category</span>
              <span className="font-bold text-[#202124]">{skills.join(', ') || 'None'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-400 font-bold">Experience</span>
              <span className="font-bold text-[#202124]">{experience || '0'} years</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400 font-bold">Expected Salary</span>
              <span className="font-bold text-[#1A73E8]">₹{expectedSalary || '0'} / month</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] text-[#1A73E8] font-medium leading-relaxed flex gap-2">
            <Shield className="shrink-0 text-[#1A73E8]" size={16} />
            <span>Your information will be securely submitted to Sevikaa Onboarding API.</span>
          </div>
        </div>
      )}

      {/* Stepper Controls */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer disabled:opacity-50"
          >
            Back
          </button>
        )}

        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3 px-4 bg-[#1A73E8] text-white rounded-2xl font-bold text-xs hover:bg-[#155cb4] active:scale-95 transition-all shadow-md cursor-pointer"
          >
            Next Step →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3.5 px-4 bg-[#1A73E8] text-white rounded-2xl font-bold text-xs hover:bg-[#155cb4] active:scale-95 transition-all shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting...' : 'Complete Onboarding 🚀'}
          </button>
        )}
      </div>
    </div>
  );
};
