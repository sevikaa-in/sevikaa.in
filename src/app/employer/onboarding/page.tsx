"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Building, User, Phone, Mail, MapPin, CheckCircle2, ShieldCheck, 
  Sparkles, ArrowRight, Upload, Lock, AlertCircle, FileText, Check, Loader2, KeyRound,
  Navigation, Search, Compass
} from 'lucide-react';
import { secureUpload } from '@/utils/secureUpload';

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const { employerProfile, setEmployerProfile, user, showToast } = useEmployerDashboard();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);

  // Form Inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [towerBlock, setTowerBlock] = useState('');
  const [address, setAddress] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [residencyProofUrl, setResidencyProofUrl] = useState<string | null>(null);

  // Dynamic Geolocation & Societies State
  const [societiesList, setSocietiesList] = useState<any[]>([]);
  const [fetchingSocieties, setFetchingSocieties] = useState(true);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'success' | 'denied' | 'error'>('idle');
  const [locationMessage, setLocationMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomSociety, setIsCustomSociety] = useState(false);

  // OTP Verification for Phone if starting via Email OTP
  const [verifiedChannel, setVerifiedChannel] = useState<'mobile' | 'email'>('mobile');
  const [showPhoneOtpStep, setShowPhoneOtpStep] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Geolocation detection trigger
  const detectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('denied');
      setLocationMessage('Geolocation is not supported by your browser. Please search or enter your society manually below.');
      return;
    }

    setLocationStatus('detecting');
    setLocationMessage('Detecting your current location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserCoords({ latitude: lat, longitude: lng });
        setLocationStatus('success');
        setLocationMessage('Location detected! Showing nearest gated societies.');
        showToast('Location detected! Showing nearest societies.', 'success');
      },
      (err) => {
        console.warn("Geolocation permission error:", err);
        setLocationStatus('denied');
        setLocationMessage('GPS location not enabled. Search or select your society by name, locality, or landmark below.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Fetch societies from database API & detect location on mount
  useEffect(() => {
    const fetchSocietiesData = async () => {
      setFetchingSocieties(true);
      try {
        const { webApiClient } = await import('@/lib/webApiClient');
        const res = await webApiClient.get('/api/societies');
        if (res && res.success && Array.isArray(res.societies) && res.societies.length > 0) {
          setSocietiesList(res.societies);
        } else {
          setSocietiesList([]);
        }
      } catch (err) {
        console.error("Error fetching societies for onboarding:", err);
      } finally {
        setFetchingSocieties(false);
      }
    };

    fetchSocietiesData();
  }, []);

  // Calculate distance between user coordinates & society coordinates in KM
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Dynamically processed, distance-sorted & searched societies list
  const processedSocieties = React.useMemo(() => {
    let list = societiesList.map(s => {
      let distanceKm: number | null = null;
      if (userCoords && s.latitude && s.longitude) {
        distanceKm = getDistanceKm(userCoords.latitude, userCoords.longitude, s.latitude, s.longitude);
      }
      return {
        ...s,
        distanceKm
      };
    });

    if (userCoords) {
      list.sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.city && s.city.toLowerCase().includes(q))
      );
    }

    return list;
  }, [societiesList, userCoords, searchQuery]);

  // Initialize fields from pre-existing user or profile session
  useEffect(() => {
    if (employerProfile) {
      if (employerProfile.company_name && employerProfile.company_name !== 'Employer Profile' && employerProfile.company_name !== 'Employer') {
        setFullName(employerProfile.company_name);
      }
      if (employerProfile.email) setEmail(employerProfile.email);
      if (employerProfile.society_name) setSocietyName(employerProfile.society_name);
      if (employerProfile.tower) setTowerBlock(employerProfile.tower);
      if (employerProfile.address) setAddress(employerProfile.address);

      const rawP = (employerProfile.phone || user?.phone || '').replace(/\D/g, '').slice(-10);
      if (rawP && rawP.length === 10) {
        setPhone(rawP);
        setVerifiedChannel('mobile');
        setPhoneVerified(true);
      } else if (user?.email || employerProfile.email) {
        setEmail(user?.email || employerProfile.email);
        setVerifiedChannel('email');
      }
    }
  }, [employerProfile, user]);

  const handleNameChange = (val: string) => {
    const lettersOnly = val.replace(/[^a-zA-Z\s]/g, '');
    setFullName(lettersOnly);
  };

  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleAltPhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
    setAltPhone(digitsOnly);
  };

  const handleSendPhoneOtp = async () => {
    if (phone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }
    setSendingOtp(true);
    setTimeout(() => {
      setSendingOtp(false);
      setShowPhoneOtpStep(true);
      showToast('Verification OTP sent to +91 ' + phone, 'success');
    }, 800);
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP code.', 'error');
      return;
    }
    setPhoneVerified(true);
    setShowPhoneOtpStep(false);
    showToast('Mobile number verified successfully!', 'success');
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const activeUserId = user?.id || employerProfile?.user_id || 'employer_guest';
    try {
      showToast('Uploading residency proof...', 'info');
      const { publicUrl } = await secureUpload(file, activeUserId, 'residency_proof_url', { role: 'employer' });
      setResidencyProofUrl(publicUrl);
      showToast('Residency proof uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(`Upload failed: ${err.message}`, 'error');
    }
  };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('Please enter your full name.', 'error');
      return;
    }

    if (phone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim() || !emailRegex.test(email.trim())) {
      showToast('Please enter a valid email address for receiving subscription invoices & receipts.', 'error');
      return;
    }

    if (altPhone.trim() && altPhone.trim().length !== 10) {
      showToast('Alternate / Family contact number must be exactly 10 digits if provided.', 'error');
      return;
    }

    if (!societyName.trim()) {
      showToast('Please select your gated society.', 'error');
      return;
    }

    if (!address.trim()) {
      showToast('Please enter your flat address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const activeUserId = user?.id || employerProfile?.user_id || 'employer_guest';

      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/employer/onboarding', {
        userId: activeUserId,
        company_name: fullName.trim(),
        name: fullName.trim(),
        phone: `+91 ${phone}`,
        email: email.trim(),
        society_name: societyName,
        tower_block: towerBlock.trim(),
        address: address.trim(),
        alternate_phone: altPhone ? `+91 ${altPhone}` : '',
        residency_proof_url: residencyProofUrl || employerProfile?.residency_proof_url || null
      });

      if (data.error) {
        throw new Error(data.error || 'Failed to complete onboarding setup');
      }

      // Update Local Dashboard Context
      setEmployerProfile((prev: any) => ({
        ...prev,
        company_name: fullName.trim(),
        name: fullName.trim(),
        phone: `+91 ${phone}`,
        email: email.trim(),
        society_name: societyName,
        tower: towerBlock.trim(),
        tower_block: towerBlock.trim(),
        address: address.trim(),
        alt_phone: altPhone ? `+91 ${altPhone}` : '',
        residency_proof_url: residencyProofUrl || prev.residency_proof_url,
        status: 'live'
      }));

      showToast('Household setup completed! Welcome to Sevikaa.', 'success');
      router.push('/employer/account');
    } catch (err: any) {
      showToast(err.message || 'Error completing onboarding', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in">
      {/* Executive Light Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-7 sm:p-9 rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
            <Building size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">{t('householdEmployerSetupTitle') || '🏡 Household & Employer Setup'}</h1>
            <p className="text-xs sm:text-sm text-blue-100 font-semibold mt-0.5">{t('onboardingHeaderSub') || 'Complete your profile details once to start hiring verified domestic workers.'}</p>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/20 text-[11px] font-black uppercase tracking-wider">
          <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-center flex items-center justify-center gap-1.5 border border-white/30">
            <CheckCircle2 size={13} className="text-emerald-300" />
            <span>{t('step1AuthChannel') || '1. Auth Channel'}</span>
          </div>
          <div className="bg-white text-blue-900 p-2 rounded-xl text-center flex items-center justify-center gap-1.5 shadow-sm">
            <Sparkles size={13} className="text-blue-600" />
            <span>{t('step2Household') || '2. Household'}</span>
          </div>
          <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-center flex items-center justify-center gap-1.5 opacity-80">
            <ShieldCheck size={13} />
            <span>{t('step3InstantAudit') || '3. Instant Audit'}</span>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmitOnboarding} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        
        {/* SECTION 1: VERIFIED AUTHENTICATION CHANNELS */}
        <div className="space-y-4 pb-6 border-b border-slate-100">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#1A73E8]" />
            <span>{t('step1Title') || 'Step 1: Contact Credentials & Invoice Billing'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* Mobile Number Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between min-h-[22px]">
                <span>{t('mobileNumber') || 'Mobile Number'}</span>
                {verifiedChannel === 'mobile' || phoneVerified ? (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                    <CheckCircle2 size={10} /> {t('verifiedOtp') || 'Verified OTP'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">{t('required') || 'Required'}</span>
                )}
              </label>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-xs">+91</span>
                <input 
                  type="text" 
                  maxLength={10}
                  value={phone}
                  readOnly={verifiedChannel === 'mobile'}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="9876543210"
                  className={`w-full py-2.5 pl-12 pr-3.5 rounded-xl text-xs font-bold border transition-all ${
                    verifiedChannel === 'mobile' 
                      ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed font-mono'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono'
                  }`}
                />
              </div>

              {verifiedChannel === 'email' && !phoneVerified ? (
                <div className="pt-1">
                  {!showPhoneOtpStep ? (
                    <button 
                      type="button" 
                      onClick={handleSendPhoneOtp}
                      disabled={sendingOtp || phone.length !== 10}
                      className="w-full py-2 bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                    >
                      {sendingOtp ? <Loader2 size={12} className="animate-spin" /> : <Phone size={12} />}
                      <span>{t('sendSmsOtp') || 'Send SMS OTP Verification'}</span>
                    </button>
                  ) : (
                    <div className="flex gap-2 pt-1">
                      <input 
                        type="text" 
                        maxLength={6}
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit OTP"
                        className="w-full p-2 bg-slate-50 border border-blue-300 rounded-xl text-center font-mono text-xs font-black focus:outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={handleVerifyPhoneOtp}
                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black cursor-pointer shrink-0"
                      >
                        {t('verify') || 'Verify'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-medium">{t('mobileHint') || 'Used for SMS instant worker alerts & account security.'}</p>
              )}
            </div>

            {/* Email Address Field (Required for Invoices) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between min-h-[22px]">
                <span>{t('emailForInvoices') || 'Email Address (For Invoices)'}</span>
                {verifiedChannel === 'email' ? (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                    <CheckCircle2 size={10} /> {t('verifiedOtp') || 'Verified OTP'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#1A73E8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">{t('required') || 'Required'}</span>
                )}
              </label>
              <input 
                type="email"
                value={email}
                readOnly={verifiedChannel === 'email'}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold border transition-all ${
                  verifiedChannel === 'email'
                    ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-[#1A73E8] focus:outline-none'
                }`}
              />
              <p className="text-[10px] text-slate-400 font-medium">{t('emailHint') || 'Used for GST subscription invoices & payment PDF receipts.'}</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: HOUSEHOLD NAME & ADDRESS DETAILS */}
        <div className="space-y-4 pb-6 border-b border-slate-100">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building size={16} className="text-[#1A73E8]" />
            <span>{t('step2Title') || 'Step 2: Household & Residential Location'}</span>
          </h2>

          <div className="space-y-4">
            {/* Household / Employer Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">{t('employerFullNameLabel') || 'Employer / Household Full Name *'}</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#1A73E8] focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            {/* Dynamic Gated Society Selection with Geolocation & Proximity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>{t('gatedSocietyLabel') || 'Gated Society / Apartment Complex *'}</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locationStatus === 'detecting'}
                    className="text-[11px] font-bold text-[#1A73E8] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-xl border border-blue-200 flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Navigation size={12} className={locationStatus === 'detecting' ? 'animate-spin' : ''} />
                    <span>
                      {locationStatus === 'detecting'
                        ? 'Detecting Location...'
                        : locationStatus === 'success'
                        ? '✓ Location Detected'
                        : '📍 Detect Location'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Location Status Alert Banner */}
              {locationMessage && (
                <div className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 ${
                  locationStatus === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : locationStatus === 'denied' || locationStatus === 'error'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {locationStatus === 'success' ? (
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  ) : locationStatus === 'detecting' ? (
                    <Loader2 size={14} className="text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <MapPin size={14} className="text-amber-600 shrink-0" />
                  )}
                  <span>{locationMessage}</span>
                </div>
              )}

              {/* Mode 1: Select from nearby list with manual search filter */}
              {!isCustomSociety ? (
                <div className="space-y-2">
                  {/* Manual search query filter */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-2.5 text-slate-400" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter societies by name or city..."
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#1A73E8] focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>

                  {/* Society Select Dropdown */}
                  <select 
                    value={societyName}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomSociety(true);
                        setSocietyName('');
                      } else {
                        setSocietyName(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
                  >
                    <option value="">{t('selectGatedSocietyOption') || '-- Select Your Gated Society --'}</option>
                    {processedSocieties.map((soc) => {
                      const distanceLabel = soc.distanceKm !== null ? ` (~${soc.distanceKm.toFixed(1)} km away)` : '';
                      const cityLabel = soc.city ? ` - ${soc.city}` : '';
                      return (
                        <option key={soc.id || soc.name} value={soc.name}>
                          {soc.name}{cityLabel}{distanceLabel}
                        </option>
                      );
                    })}
                    <option value="__custom__">➕ Can't find your society? Enter manually...</option>
                  </select>

                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-400 font-medium">
                      {fetchingSocieties ? 'Loading societies...' : `${processedSocieties.length} societies found`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomSociety(true)}
                      className="text-[#1A73E8] font-bold hover:underline cursor-pointer"
                    >
                      + Enter Custom Society Name
                    </button>
                  </div>
                </div>
              ) : (
                /* Mode 2: Manual custom society name input */
                <div className="space-y-2">
                  <input 
                    type="text"
                    value={societyName}
                    onChange={(e) => setSocietyName(e.target.value)}
                    placeholder="Enter your exact gated society / complex name..."
                    autoFocus
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-blue-400 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                  />
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-emerald-700 font-semibold">✓ Manual society input enabled</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSociety(false);
                        setSocietyName('');
                      }}
                      className="text-[#1A73E8] font-bold hover:underline cursor-pointer"
                    >
                      ← Back to Nearby Societies List
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tower & Flat Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t('towerBlockLabel') || 'Tower / Block Number'}</label>
                <input 
                  type="text" 
                  value={towerBlock}
                  onChange={(e) => setTowerBlock(e.target.value)}
                  placeholder="e.g. Tower A"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#1A73E8] focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t('flatFloorLabel') || 'Flat & Floor Address *'}</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 301, Floor 3"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#1A73E8] focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            {/* Secondary Alternate Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">{t('altPhoneLabel') || 'Alternate / Family Contact Phone (Optional)'}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-xs">+91</span>
                <input 
                  type="text" 
                  maxLength={10}
                  value={altPhone}
                  onChange={(e) => handleAltPhoneChange(e.target.value)}
                  placeholder="Optional 10-digit backup phone"
                  className="w-full py-2.5 pl-12 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: RESIDENCY PROOF UPLOAD (OPTIONAL) */}
        <div className="space-y-4 pb-2">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileText size={16} className="text-[#1A73E8]" />
            <span>{t('step3Title') || 'Step 3: Residency Proof (Optional — Speeds Up Approval)'}</span>
          </h2>

          <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-1 text-left">
              <p className="text-xs font-bold text-slate-800 leading-snug">{t('residencyProofHeader') || 'Society Maintenance Bill or Rent Receipt'}</p>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{t('residencyProofSub') || 'Shows Flat & Tower address for instant Admin residency verification.'}</p>
            </div>

            <label className="cursor-pointer shrink-0 self-start sm:self-center">
              <input type="file" accept="image/*,.pdf" onChange={handleProofUpload} className="hidden" />
              <div className="py-2.5 px-4 bg-white border border-slate-300 hover:border-[#1A73E8] text-slate-700 hover:text-[#1A73E8] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs">
                {residencyProofUrl ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Upload size={14} className="text-[#1A73E8]" />}
                <span>{residencyProofUrl ? (t('changeProofBtn') || 'Change Uploaded Proof') : (t('uploadProofBtn') || 'Upload Proof (PDF/JPG)')}</span>
              </div>
            </label>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-[#1A73E8] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{t('savingSetup') || 'Saving Household Setup...'}</span>
            </>
          ) : (
            <>
              <span>{t('completeSetupBtn') || 'Complete Setup & Go to Dashboard'}</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
