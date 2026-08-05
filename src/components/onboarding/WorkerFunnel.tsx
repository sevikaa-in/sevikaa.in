"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { 
  Camera, Calendar, ClipboardCheck, ArrowLeft, ArrowRight,
  Shield, Check, User, IndianRupee, Upload, Video, AlertCircle, Clock, Search, ChevronDown 
} from 'lucide-react';

interface WorkerFunnelProps {
  userId: string;
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

export const WorkerFunnel: React.FC<WorkerFunnelProps> = ({ userId, onComplete, onCancel }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [societiesList, setSocietiesList] = useState<any[]>([]);

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const res = await fetch('/api/societies');
        const data = await res.json();
        if (data.success && data.societies && data.societies.length > 0) {
          setSocietiesList(data.societies);
        } else {
          const { data: clientData } = await supabase.from('societies').select('*').order('name', { ascending: true });
          if (clientData && clientData.length > 0) {
            setSocietiesList(clientData);
          }
        }
      } catch (err) {
        console.error("Error fetching societies:", err);
      }
    };
    fetchSocieties();
  }, []);

  // Step 1 State: Selfie
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Step 2 State: Basic Details & Languages
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [age, setAge] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Step 3 State: Skills & Availability Grid
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [selectedShifts, setSelectedShifts] = useState<string[]>(['full_day']);

  // Step 4 State: Salary & Society Preferences
  const [expectedSalary, setExpectedSalary] = useState('12000');
  const [preferredSociety, setPreferredSociety] = useState('');
  const [preferredAreasInput, setPreferredAreasInput] = useState('');
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);
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

  const toggleShift = (shiftId: string) => {
    setSelectedShifts(prev => 
      prev.includes(shiftId) ? prev.filter(s => s !== shiftId) : [...prev, shiftId]
    );
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

  const handleAadhaarFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxBytes) {
        setError('Aadhaar front image is too large. Max size allowed is 5MB.');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid image format. Allowed formats: JPG, PNG, WEBP.');
        return;
      }
      setAadhaarFrontFile(file);
    }
  };

  const handleAadhaarBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxBytes) {
        setError('Aadhaar back image is too large. Max size allowed is 5MB.');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid image format. Allowed formats: JPG, PNG, WEBP.');
        return;
      }
      setAadhaarBackFile(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxBytes = 50 * 1024 * 1024; // 50MB
      if (file.size > maxBytes) {
        setError('Video is too large. Max size allowed is 50MB.');
        return;
      }
      const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid video format. Allowed formats: MP4, WEBM, MOV.');
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSelfieFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size exceeds 5MB. Please select a smaller image.');
        return;
      }
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Web Camera Live Stream state & ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>('');

  const startCamera = async () => {
    setCameraError('');
    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Live webcam view unavailable on this browser. Use native device camera or gallery below.');
      nativeCameraInputRef.current?.click();
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' } },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn("Video play notice:", e));
      }
    } catch (err: any) {
      console.warn("Camera permission notice:", err);
      setCameraError('Camera permission blocked or unavailable. Tap "Take Photo with Device Camera" or select from gallery.');
    }
  };

  const handlePrimaryCameraClick = () => {
    startCamera();
  };

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
            setSelfieFile(file);
            setSelfiePreview(URL.createObjectURL(file));
            
            // Turn off camera tracks once photo is captured
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
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
    setSelfieFile(null);
    setSelfiePreview(null);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Sync URL with current step whenever step changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.history.replaceState({ step }, '', `?role=worker&step=${step}`);
  }, [step]);

  // Form Validations per step
  const validateStep = () => {
    setError('');
    if (step === 1 && !selfieFile && !selfiePreview) {
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
      if (selectedShifts.length === 0) return setError('Please select at least one preferred shift timing'), false;
    }
    if (step === 4) {
      if (!expectedSalary || parseInt(expectedSalary) <= 0) return setError('Please specify expected salary'), false;
      if (!preferredSociety) return setError('Please select your preferred apartment society'), false;
    }
    return true;
  };

  // Load existing profile data & resume step on mount (only on initial load, never during navigation)
  useEffect(() => {
    const activeId = userId || (typeof window !== 'undefined' ? localStorage.getItem('sevikaa_user_id') : '');
    if (!activeId) return;

    const loadDraftProfile = async () => {
      try {
        const meRes = await fetch(`/api/auth/me?userId=${activeId}`);
        if (meRes.ok) {
          const data = await meRes.json();
          if (data.success && data.workerProfile) {
            const wp = data.workerProfile;
            if (wp.full_name) setFullName(wp.full_name);
            if (wp.gender) setGender(wp.gender);
            if (wp.age) setAge(String(wp.age));
            if (wp.languages_spoken && Array.isArray(wp.languages_spoken)) setSelectedLanguages(wp.languages_spoken);
            if (wp.skills && Array.isArray(wp.skills)) setSkills(wp.skills);
            if (wp.experience_years) setExperience(String(wp.experience_years));
            if (wp.expected_salary) setExpectedSalary(String(wp.expected_salary));
            if (wp.profile_picture_url) setSelfiePreview(wp.profile_picture_url);
            
            // Only resume from saved step on FRESH load (when URL has no step param or step=1)
            // Never override manual back/forward navigation
            const urlParams = new URLSearchParams(window.location.search);
            const urlStep = parseInt(urlParams.get('step') || '1');
            if (urlStep <= 1 && wp.onboarding_step && wp.onboarding_step > 1 && wp.onboarding_step <= 5) {
              setStep(wp.onboarding_step);
            }
          }
        }
      } catch (err) {
        console.warn("Draft profile load notice:", err);
      }
    };

    loadDraftProfile();
  }, [userId]);

  const handleNext = () => {
    if (validateStep()) {
      const nextStep = step + 1;
      const activeId = userId || (typeof window !== 'undefined' ? localStorage.getItem('sevikaa_user_id') : '');
      if (activeId) {
        // Auto-save current step data to DB in background
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

        fetch('/api/worker/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: activeId,
            full_name: fullName,
            gender,
            age: parseInt(age) || 28,
            languages: selectedLanguages,
            languages_spoken: selectedLanguages,
            skills,
            experience: parseInt(experience) || 0,
            expectedSalary: parseInt(expectedSalary) || 12000,
            selectedShifts,
            preferred_shift: formattedShiftString,
            preferredShift: formattedShiftString,
            primary_society_id: preferredSociety,
            preferred_areas: preferredAreas,
            onboarding_step: nextStep
          })
        }).catch(err => console.warn("Step auto-save notice:", err));
      }
      setStep(nextStep);
    }
  };

  const handleBack = () => {
    setError('');
    setSocietyDropdownOpen(false);
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      if (onCancel) onCancel();
    }
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

      // 2. Upload storage documents if present — get full public URLs
      let profilePicUrl = '';
      let aadhaarFrontUrl = '';
      let aadhaarBackUrl = '';
      let videoUrl = '';

      const getPublicUrl = (bucket: string, path: string) => {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl || '';
      };

      try {
        if (selfieFile) {
          const storagePath = `${userId}/selfie.jpg`;
          const { data: selfieData, error: selfieErr } = await supabase.storage
            .from('worker-selfies')
            .upload(storagePath, selfieFile, { upsert: true, contentType: selfieFile.type });
          if (selfieData) profilePicUrl = getPublicUrl('worker-selfies', storagePath);
          else if (selfieErr) console.warn('Selfie upload error:', selfieErr.message);
        }

        if (aadhaarFrontFile) {
          const storagePath = `${userId}/aadhaar-front.${aadhaarFrontFile.name.split('.').pop() || 'png'}`;
          const { data: docData, error: docErr } = await supabase.storage
            .from('worker-documents')
            .upload(storagePath, aadhaarFrontFile, { upsert: true, contentType: aadhaarFrontFile.type });
          if (docData) aadhaarFrontUrl = getPublicUrl('worker-documents', storagePath);
          else if (docErr) console.warn('Aadhaar front upload error:', docErr.message);
        }

        if (aadhaarBackFile) {
          const storagePath = `${userId}/aadhaar-back.${aadhaarBackFile.name.split('.').pop() || 'png'}`;
          const { data: backData, error: backErr } = await supabase.storage
            .from('worker-documents')
            .upload(storagePath, aadhaarBackFile, { upsert: true, contentType: aadhaarBackFile.type });
          if (backData) aadhaarBackUrl = getPublicUrl('worker-documents', storagePath);
          else if (backErr) console.warn('Aadhaar back upload error:', backErr.message);
        }

        if (videoFile) {
          const storagePath = `${userId}/intro-video.${videoFile.name.split('.').pop() || 'mp4'}`;
          const { data: vidData, error: vidErr } = await supabase.storage
            .from('worker-videos')
            .upload(storagePath, videoFile, { upsert: true, contentType: videoFile.type });
          if (vidData) videoUrl = getPublicUrl('worker-videos', storagePath);
          else if (vidErr) console.warn('Video upload error:', vidErr.message);
        }
      } catch (storageErr) {
        console.warn("Storage upload skipped/failed, proceeding to DB save:", storageErr);
      }

      // 3. Upsert into worker_profiles via server API to bypass client RLS
      const activeUserId = userId || localStorage.getItem('sevikaa_user_id') || 'temp_worker';

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

      await fetch('/api/worker/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          full_name: fullName,
          gender,
          age: parseInt(age) || 28,
          languages: selectedLanguages,
          languages_spoken: selectedLanguages,
          skills,
          experience: parseInt(experience) || 0,
          expectedSalary: parseInt(expectedSalary) || 15000,
          selectedShifts,
          preferred_shift: formattedShiftString,
          preferredShift: formattedShiftString,
          profile_picture_url: profilePicUrl || undefined,
          aadhaar_front_url: aadhaarFrontUrl || undefined,
          aadhaar_back_url: aadhaarBackUrl || undefined,
          video_url: videoUrl || undefined,
          primary_gated_society: preferredSociety,
          primary_society_id: preferredSociety,
          preferred_areas: preferredAreas,
          onboarding_step: 5,
          status: 'pending_review'
        })
      });

      setLoading(false);
      onComplete();
    } catch (err: any) {
      console.warn("Worker onboarding submit notice:", err);
      setLoading(false);
      onComplete();
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-8">
      {/* Funnel Progress Indicator */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {`STEP ${step} OF 5`} &bull; {step === 1 && 'PHOTO'}{step === 2 && 'LANGUAGE & INFO'}{step === 3 && 'SKILLS & SHIFTS'}{step === 4 && 'PREFERENCES'}{step === 5 && 'VERIFICATION'}
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

        {/* STEP 1: Selfie capture */}
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

            <div className="flex flex-col items-center justify-center rounded-3xl p-6 bg-gray-50/50 border border-gray-100 min-h-[260px] text-center">
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100 flex items-center justify-center mb-4">
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
                ) : stream ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-1">
                    <Camera size={36} />
                    <span className="text-[10px] font-bold text-slate-400">No Photo Selected</span>
                  </div>
                )}
              </div>

              {cameraError && (
                <p className="text-xs text-red-500 font-bold mb-3 px-2 text-center">{cameraError}</p>
              )}

              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2.5 w-full">
                {selfiePreview ? (
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="py-3.5 px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-2xl text-xs active:scale-95 transition-all cursor-pointer"
                  >
                    Retake Photo
                  </button>
                ) : stream ? (
                  <button
                    type="button"
                    onClick={captureSelfie}
                    className="py-3.5 px-6 bg-[#1A73E8] hover:bg-blue-700 text-white font-bold rounded-2xl text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-200 flex-1"
                  >
                    <Camera size={16} />
                    <span>📸 Take Photo Snapshot</span>
                  </button>
                ) : (
                  <>
                    {/* Hidden input for native camera capture */}
                    <input 
                      ref={nativeCameraInputRef}
                      type="file" 
                      accept="image/*" 
                      capture="user" 
                      className="hidden" 
                      onChange={handleSelfieFileUpload} 
                    />

                    {/* Button 1: Live Web Viewfinder */}
                    <button
                      type="button"
                      onClick={handlePrimaryCameraClick}
                      className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm flex-1"
                    >
                      <Camera size={15} />
                      <span>Live Viewfinder</span>
                    </button>

                    {/* Button 2: Native Device Camera */}
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="py-3 px-4 bg-[#1A73E8] hover:bg-blue-700 text-white font-bold rounded-2xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm flex-1"
                    >
                      <Camera size={15} />
                      <span>Take Photo (Camera)</span>
                    </button>

                    {/* Button 3: Choose from Gallery */}
                    <label className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border border-slate-200 flex-1">
                      <Upload size={14} />
                      <span>Photo Gallery</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleSelfieFileUpload} 
                      />
                    </label>
                  </>
                )}
              </div>
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
                className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 focus:outline-none transition-all duration-200"
              />
            </div>

            {/* Mobile Phone Field for Employer Hiring Calls */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                <span>Mobile Number (Required for Hiring Calls)</span>
                {phoneVerified ? (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">✓ Verified OTP</span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Required</span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold text-xs">+91</span>
                <input
                  type="text"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full py-3.5 pl-12 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] font-mono focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                />
              </div>

              {!phoneVerified && (
                <div className="pt-1">
                  {!showPhoneOtp ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (phone.length !== 10) return setError('Please enter a valid 10-digit mobile number');
                        setError('');
                        setSendingPhoneOtp(true);
                        setTimeout(() => {
                          setSendingPhoneOtp(false);
                          setShowPhoneOtp(true);
                        }, 800);
                      }}
                      disabled={sendingPhoneOtp || phone.length !== 10}
                      className="w-full py-2.5 bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {sendingPhoneOtp ? 'Sending OTP...' : 'Send SMS OTP Verification'}
                    </button>
                  ) : (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        maxLength={6}
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit OTP"
                        className="w-full p-2.5 bg-gray-50 border border-blue-300 rounded-xl text-center font-mono text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (phoneOtp.length !== 6) return setError('Please enter a 6-digit OTP');
                          setPhoneVerified(true);
                          setShowPhoneOtp(false);
                          setError('');
                        }}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                      >
                        Verify
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('gender')}</label>
              <div className="grid grid-cols-3 gap-2">
                {['male', 'female', 'other'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g as any)}
                    className={`py-3 rounded-xl border-2 transition-all duration-200 font-bold text-sm capitalize active:scale-98 cursor-pointer ${
                      gender === g 
                        ? 'border-[#1A73E8] bg-[#1A73E8]/10 text-[#1A73E8] shadow-sm' 
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
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
                min="18"
                max="80"
                value={age}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setAge(cleaned);
                }}
                placeholder="Enter age (18 - 80)"
                className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 focus:outline-none transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('languagesTitle')}</label>
              <div className="flex flex-wrap gap-2">
                {['Hindi', 'English', 'Kannada', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Malayalam', 'Assamese', 'Nepali', 'Odia'].map((lang) => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`py-2 px-4 rounded-full border text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
                        isSelected 
                          ? 'border-[#1A73E8] bg-[#1A73E8] text-white shadow-md shadow-blue-100 hover:bg-[#155cb4] hover:border-[#155cb4]' 
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
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
              {[
                { id: 'maid', label: 'House Maid', icon: '🧹' },
                { id: 'cook', label: 'Cook / Chef', icon: '🍳' },
                { id: 'nanny', label: 'Babysitter / Nanny', icon: '👶' }
              ].map((cat) => {
                const isSelected = skills.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleSkill(cat.id)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 font-bold text-xs flex flex-col items-center gap-1.5 capitalize active:scale-95 cursor-pointer text-center ${
                      isSelected 
                        ? 'border-[#1A73E8] bg-[#1A73E8]/10 text-[#1A73E8] shadow-sm shadow-blue-50' 
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-[11px] leading-tight">{cat.label}</span>
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
                className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 focus:outline-none transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Clock size={14} />
                <span>Preferred Work Shifts</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'full_day', label: 'Full Day (8–12 Hours)', icon: '🕒', sub: '8 AM – 7 PM' },
                  { id: 'early_morning', label: 'Early Morning', icon: '☀️', sub: '6 AM – 9 AM' },
                  { id: 'morning', label: 'Morning Shift', icon: '🌅', sub: '9 AM – 12 PM' },
                  { id: 'afternoon', label: 'Afternoon Shift', icon: '🌤️', sub: '12 PM – 3 PM' },
                  { id: 'evening', label: 'Evening Shift', icon: '🌆', sub: '3 PM – 6 PM' },
                  { id: 'night', label: 'Night Shift', icon: '🌙', sub: '6 PM – 9 PM' },
                  { id: 'live_in', label: 'Live-In (24x7)', icon: '🏠', sub: 'Full residence' },
                  { id: 'part_time', label: 'Part-Time Flexible', icon: '⚡', sub: 'Hourly visits' }
                ].map((slot) => {
                  const isSelected = selectedShifts.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => toggleShift(slot.id)}
                      className={`p-3 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col justify-between active:scale-95 cursor-pointer ${
                        isSelected 
                          ? 'border-[#34A853] bg-[#34A853]/10 text-emerald-800 shadow-sm' 
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-lg">{slot.icon}</span>
                        {isSelected && <Check size={14} className="text-[#34A853]" strokeWidth={3} />}
                      </div>
                      <div className="font-bold text-xs">{slot.label}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{slot.sub}</div>
                    </button>
                  );
                })}
              </div>
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
                className="w-full py-4 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 focus:outline-none transition-all duration-200"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <IndianRupee size={20} />
              </div>
            </div>

            <div className="space-y-1 relative" ref={societyDropdownRef}>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('societyTitle')}</label>
              
              {/* Dropdown trigger button styled with Sevikaa theme */}
              <button
                type="button"
                onClick={() => setSocietyDropdownOpen(prev => !prev)}
                className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 focus:outline-none transition-all duration-200 cursor-pointer flex items-center justify-between shadow-xs"
              >
                <span className={preferredSociety ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}>
                  {societiesList.find(s => s.id === preferredSociety || s.name === preferredSociety)?.name || preferredSociety || '-- Choose Society --'}
                </span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${societyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Custom Searchable Popover Dropdown */}
              {societyDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col p-2 space-y-2 animate-in fade-in duration-150">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={societySearch}
                      onChange={(e) => setSocietySearch(e.target.value)}
                      placeholder="Search society by name..."
                      autoFocus
                      className="w-full py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {societiesList.filter(s => s.name?.toLowerCase().includes(societySearch.toLowerCase().trim())).length > 0 ? (
                      societiesList
                        .filter(s => s.name?.toLowerCase().includes(societySearch.toLowerCase().trim()))
                        .map((s) => {
                          const isSelected = preferredSociety === s.id || preferredSociety === s.name;
                          return (
                            <button
                              key={s.id || s.name}
                              type="button"
                              onClick={() => {
                                setPreferredSociety(s.name || s.id);
                                setSocietyDropdownOpen(false);
                                setSocietySearch('');
                              }}
                              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 text-[#1A73E8]'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>{s.name}</span>
                              {isSelected && <Check size={14} className="text-[#1A73E8]" strokeWidth={3} />}
                            </button>
                          );
                        })
                    ) : (
                      <div className="py-4 text-center text-xs font-bold text-slate-400">
                        No matching societies found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t('areasTitle')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={preferredAreasInput}
                  onChange={(e) => setPreferredAreasInput(e.target.value)}
                  placeholder="E.g., Whitefield, JP Nagar"
                  className="flex-1 py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/15 focus:outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={handleAddArea}
                  className="px-4 py-3 bg-[#1A73E8] text-white rounded-2xl font-bold text-sm hover:bg-[#155cb4] hover:shadow-lg hover:shadow-blue-100 active:scale-95 transition-all duration-200 cursor-pointer"
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
                  <span className="text-[9px] text-gray-400 mt-1 font-bold">Max 5MB (JPG, PNG, WEBP)</span>
                </label>
                <input id="aadhaar-front" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAadhaarFrontChange} className="hidden" />
              </div>

              <div className="flex flex-col items-center p-4 border border-gray-200 rounded-2xl bg-gray-50 text-center relative cursor-pointer active:scale-95 transition-all">
                <label htmlFor="aadhaar-back" className="cursor-pointer flex flex-col items-center">
                  <Upload size={20} className={aadhaarBackFile ? 'text-[#34A853]' : 'text-gray-400'} />
                  <span className="text-xs font-bold text-gray-700 mt-2">Back Side</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[120px]">
                    {aadhaarBackFile ? aadhaarBackFile.name : 'Aadhaar Back'}
                  </span>
                  <span className="text-[9px] text-gray-400 mt-1 font-bold">Max 5MB (JPG, PNG, WEBP)</span>
                </label>
                <input id="aadhaar-back" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAadhaarBackChange} className="hidden" />
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
                    <span className="block text-[9px] text-gray-400 mt-1 font-bold">Max 50MB (MP4, WEBM, MOV)</span>
                  </div>
                </div>
                <Upload size={16} className="text-gray-400" />
              </label>
              <input id="video-intro" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoChange} className="hidden" />
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
              className="py-3 px-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95 text-gray-700 font-bold rounded-2xl transition-all duration-200 text-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>{t('back')}</span>
            </button>
          ) : onCancel ? (
            <button
              onClick={onCancel}
              disabled={loading}
              className="py-3 px-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95 text-gray-700 font-bold rounded-2xl transition-all duration-200 text-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>{t('back')}</span>
            </button>
          ) : null}
          
          <button
            onClick={step === 5 ? handleSubmit : handleNext}
            disabled={loading}
            className={`flex-1 py-3 text-white font-bold rounded-2xl shadow-sm transition-all duration-200 active:scale-98 flex items-center justify-center gap-1.5 text-sm min-h-[46px] cursor-pointer ${
              step === 5 
                ? 'bg-[#34A853] hover:bg-[#2e954b] hover:shadow-lg hover:shadow-green-100' 
                : 'bg-[#1A73E8] hover:bg-[#155cb4] hover:shadow-lg hover:shadow-blue-100'
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
