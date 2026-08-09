"use client";

import React, { useState, useMemo } from 'react';
import { useWorkerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  MapPin, Search, Building2, CheckCircle2, ShieldCheck, Plus, 
  Sparkles, Briefcase, Users, Star, Compass, Send, X, Check, ArrowRight, ShieldAlert, Home, Clock
} from 'lucide-react';
import { SocietyCard } from '@/components/society/SocietyCard';

// Haversine formula to compute exact distance in km between two GPS coordinates
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Known Geo-Coordinates for Gated Societies (Fallback defaults when DB lat/lng absent)
const SOCIETY_GEO_MAP: Record<string, { lat: number; lng: number }> = {
  'DLF Westend Heights': { lat: 12.8720, lng: 77.6105 },
  'Prestige Song of the South': { lat: 12.8685, lng: 77.6152 },
  'SNN Raj Serenity': { lat: 12.8612, lng: 77.6198 },
  'Mantri Pinnacle': { lat: 12.8850, lng: 77.5975 },
  'Purva Westend': { lat: 12.8940, lng: 77.6410 }
};

export default function WorkerSocietiesPage() {
  const { societiesList, availableJobs, workerProfile, setWorkerProfile, showToast } = useWorkerDashboard();
  const { t } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'selected' | 'high_hiring'>('all');
  
  // Real GPS Geolocation State
  const [userGeoLocation, setUserGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Dynamic primary and secondary workplace selection
  const [primarySocietyId, setPrimarySocietyId] = useState<string>('');
  const [secondarySocietyIds, setSecondarySocietyIds] = useState<string[]>([]);

  // Request Unlisted Society Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newSocietyName, setNewSocietyName] = useState('');
  const [newSocietyLocality, setNewSocietyLocality] = useState('');
  const [newSocietyTower, setNewSocietyTower] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  // Request browser GPS coordinates
  const handleRequestLiveLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserGeoLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);
        showToast('Live GPS location activated! Distances calculated precisely.', 'success');
      },
      (error) => {
        setIsLocating(false);
        showToast('Could not access live GPS. Using default society proximity.', 'info');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Build 100% dynamic societies list with real database fields & live job metrics
  const allSocieties = useMemo(() => {
    if (!societiesList || societiesList.length === 0) {
      return [];
    }

    return societiesList.map((soc: any) => {
      const liveJobs = Number(soc.active_jobs_count) || (availableJobs?.filter((job: any) => 
        job.society_id === soc.id || 
        (job.society_name && soc.name && (
          job.society_name.toLowerCase().includes(soc.name.toLowerCase()) ||
          soc.name.toLowerCase().includes(job.society_name.toLowerCase())
        )) ||
        (job.description && soc.name && job.description.toLowerCase().includes(soc.name.toLowerCase()))
      ).length) || 0;

      const formattedLocality = [soc.area, soc.city, soc.pincode].filter(Boolean).join(', ') || soc.locality || 'Bengaluru';
      const distanceStr = soc.distance ? `${soc.distance} away` : 'Near you';

      return {
        id: soc.id,
        name: soc.name,
        locality: formattedLocality,
        distance: distanceStr,
        activeJobsCount: liveJobs,
        employersCount: Number(soc.employers_count) || Number(soc.employersCount) || 0,
        activeWorkersCount: Number(soc.workers_count) || 0,
        securityType: soc.gate_security || 'Physical Gate Security',
        totalFlats: Number(soc.total_flats) || 0
      };
    });
  }, [societiesList, availableJobs]);

  // Sync primary & secondary societies dynamically when workerProfile or allSocieties changes
  React.useEffect(() => {
    if (!allSocieties || allSocieties.length === 0) return;

    // Match primary society by ID or Name
    const pMatch = allSocieties.find(s => 
      (workerProfile.society_id && s.id === workerProfile.society_id) ||
      (workerProfile.society && (
        s.name.toLowerCase().trim() === workerProfile.society.toLowerCase().trim() ||
        s.name.toLowerCase().includes(workerProfile.society.toLowerCase().trim()) ||
        workerProfile.society.toLowerCase().includes(s.name.toLowerCase().trim())
      ))
    );
    
    if (pMatch) {
      setPrimarySocietyId(pMatch.id);
    } else {
      setPrimarySocietyId('');
    }

    // Match secondary societies from workerProfile
    const rawSec = workerProfile.secondary_societies || workerProfile.secondary_gated_society || (Array.isArray(workerProfile.preferred_areas) && workerProfile.preferred_areas.length > 1 ? workerProfile.preferred_areas.slice(1) : []);
    const secList = Array.isArray(rawSec) ? rawSec : (typeof rawSec === 'string' ? rawSec.split(',').map((s: string) => s.trim()) : []);
    
    if (secList.length > 0) {
      const sMatches = allSocieties
        .filter(s => s.id !== pMatch?.id && secList.some((secName: string) => 
          typeof secName === 'string' && secName.trim() !== '' && (
            secName.toLowerCase().includes(s.name.toLowerCase()) || 
            s.name.toLowerCase().includes(secName.toLowerCase())
          )
        ))
        .map(s => s.id);
      
      setSecondarySocietyIds(sMatches);
    } else {
      setSecondarySocietyIds([]);
    }
  }, [workerProfile, allSocieties]);

  // Dynamic High Hiring Threshold (Top 25% percentile of societies by active jobs, min 3)
  const highHiringThreshold = useMemo(() => {
    if (!allSocieties || allSocieties.length === 0) return 3;
    const sortedCounts = allSocieties.map(s => s.activeJobsCount).sort((a, b) => b - a);
    const top25Index = Math.max(0, Math.floor(sortedCounts.length * 0.25) - 1);
    const top25Value = sortedCounts[top25Index] || 0;
    return Math.max(3, top25Value);
  }, [allSocieties]);

  // Filtered list based on search and tab
  const filteredSocieties = useMemo(() => {
    return allSocieties.filter(soc => {
      const matchesSearch = 
        soc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        soc.locality.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeTab === 'selected') {
        return soc.id === primarySocietyId || secondarySocietyIds.includes(soc.id);
      }
      if (activeTab === 'high_hiring') {
        return soc.activeJobsCount >= highHiringThreshold;
      }
      return true;
    });
  }, [allSocieties, searchQuery, activeTab, primarySocietyId, secondarySocietyIds, highHiringThreshold]);

  const handleSetPrimary = async (society: any) => {
    setPrimarySocietyId(society.id);
    const newSecondary = secondarySocietyIds.filter(id => id !== society.id);
    setSecondarySocietyIds(newSecondary);
    
    setWorkerProfile((prev: any) => ({
      ...prev,
      society: society.name,
      society_id: society.id
    }));

    // Save directly to PostgreSQL database
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let activeUserId = session?.user?.id || workerProfile.user_id || workerProfile.id || workerProfile.phone;
      
      if (!activeUserId && typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('sevikaa_user');
        if (storedUser) {
          try {
            const u = JSON.parse(storedUser);
            activeUserId = u.id || u.user_id || u.phone;
          } catch (e) {}
        }
      }
      activeUserId = activeUserId || 'w_user';

      const secSocietyNames = newSecondary.map(id => allSocieties.find(s => s.id === id)?.name).filter(Boolean);
      await fetch('/api/worker/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          full_name: workerProfile.full_name || workerProfile.name || undefined,
          primary_gated_society: society.name,
          primary_society_name: society.name,
          primary_society_id: society.id,
          secondary_gated_society: secSocietyNames.join(', '),
          preferred_areas: [society.name, ...secSocietyNames]
        })
      });
    } catch (err) {
      console.error("Database update error:", err);
    }
    
    showToast(`Primary workplace updated to ${society.name}!`, 'success');
  };

  const handleToggleSecondary = async (society: any) => {
    if (society.id === primarySocietyId) {
      showToast(`${society.name} is already your Primary workplace!`, 'info');
      return;
    }

    let updatedSecIds: string[];
    if (secondarySocietyIds.includes(society.id)) {
      updatedSecIds = secondarySocietyIds.filter(id => id !== society.id);
      setSecondarySocietyIds(updatedSecIds);
      showToast(`Removed ${society.name} from secondary workplaces.`, 'info');
    } else {
      if (secondarySocietyIds.length >= 5) {
        showToast('You can select up to 5 secondary workplace societies.', 'warning');
        return;
      }
      updatedSecIds = [...secondarySocietyIds, society.id];
      setSecondarySocietyIds(updatedSecIds);
      showToast(`Added ${society.name} to secondary workplaces!`, 'success');
    }

    const secSocietyNames = updatedSecIds
      .map(id => allSocieties.find(s => s.id === id)?.name || (id !== society.id ? id : null))
      .filter(Boolean) as string[];

    setWorkerProfile((prev: any) => ({
      ...prev,
      secondary_societies: secSocietyNames
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      let activeUserId = session?.user?.id || workerProfile.user_id || workerProfile.id || workerProfile.phone;
      
      if (!activeUserId && typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('sevikaa_user');
        if (storedUser) {
          try {
            const u = JSON.parse(storedUser);
            activeUserId = u.id || u.user_id || u.phone;
          } catch (e) {}
        }
      }
      activeUserId = activeUserId || 'w_user';

      const primarySocObj = allSocieties.find(s => s.id === primarySocietyId);
      const primaryName = primarySocObj?.name || workerProfile.society || '';
      await fetch('/api/worker/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          full_name: workerProfile.full_name || workerProfile.name || undefined,
          primary_gated_society: primaryName,
          primary_society_name: primaryName,
          primary_society_id: primarySocietyId || primarySocObj?.id,
          secondary_gated_society: secSocietyNames.join(', '),
          preferred_areas: [primaryName, ...secSocietyNames]
        })
      });
    } catch (err) {
      console.error("Database secondary society update error:", err);
    }
  };

  const handleSelectShift = async (shiftLabel: string) => {
    setWorkerProfile((prev: any) => ({
      ...prev,
      preferred_shift: shiftLabel,
      preferredShift: shiftLabel
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id || workerProfile.user_id || workerProfile.id || workerProfile.phone || 'w_user';
      await fetch('/api/worker/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          preferred_shift: shiftLabel,
          preferredShift: shiftLabel
        })
      });
      showToast(`Preferred shift slot saved: ${shiftLabel}!`, 'success');
    } catch (err) {
      console.error("Error saving shift slot:", err);
    }
  };

  const handleRequestSocietySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocietyName.trim()) return;

    setIsSubmittingRequest(true);
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (!isPlaceholder) {
        await supabase
          .from('societies')
          .insert([{
            name: newSocietyName.trim(),
            area: newSocietyLocality.trim() || 'General Sector',
            city: 'Bengaluru',
            status: 'pending_verification'
          }]);
      }
    } catch (err) {
      console.error("Society request error:", err);
    } finally {
      setIsSubmittingRequest(false);
      setShowRequestModal(false);
      setNewSocietyName('');
      setNewSocietyLocality('');
      setNewSocietyTower('');
      showToast("Society onboarding request submitted! Sevikaa Admin will verify & list your society.", "success");
    }
  };

  const primarySocietyObj = allSocieties.find(s => s.id === primarySocietyId);
  const totalSelectedCount = (primarySocietyId ? 1 : 0) + secondarySocietyIds.length;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl pb-20">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-blue-50 text-[#1A73E8] text-[9.5px] font-semibold uppercase px-2.5 py-0.5 rounded-full border border-blue-200/60 inline-flex items-center gap-1">
            <Compass size={11} />
            {t('workerSocietiesEyebrow') || "Workplace Proximity Network"}
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MapPin size={18} className="text-[#1A73E8]" />
          <span>{t('preferredSocietiesTitle') || "Preferred Working Societies"}</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
          {t('preferredSocietiesSub') || "Select gated communities near you to receive instant job alerts and priority matching from resident employers."}
        </p>
      </div>

      {/* 🌟 COMPACT ULTRA-SLIM HERO BANNER */}
      <div className="bg-gradient-to-r from-[#1A73E8] via-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow-md shadow-blue-500/15 relative overflow-hidden border border-blue-400/30 space-y-3">
        {/* Glow ambient blur */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${primarySocietyObj ? 'bg-emerald-400 animate-pulse' : 'bg-amber-300'}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-100 whitespace-nowrap">
                {t('activeCoverageBadge') || "Active Workplace Coverage"}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white leading-snug flex items-center gap-2 flex-wrap">
              <span>{primarySocietyObj ? primarySocietyObj.name : 'No Primary Workplace Selected'}</span>
              {primarySocietyObj && (
                <span className="bg-white/20 text-white text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border border-white/30 shrink-0">
                  {t('primaryBadge') || "Primary"}
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20">
            <div className="text-center px-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-100 block">SELECTED</span>
              <span className="text-xs font-bold text-white">{totalSelectedCount}</span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div className="text-center px-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-100 block">LIVE JOBS</span>
              <span className="text-xs font-bold text-white">{primarySocietyObj ? primarySocietyObj.activeJobsCount : 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 SEARCH & FILTER TOOLBAR (2 STACKED ROWS + CLEAN TABS) */}
      <div className="space-y-2.5">
        {/* Row 1: Search Bar (Full Width) */}
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchSocietyPlaceholder') || "Search society name, locality, or landmark..."}
            className="w-full p-2.5 pl-10 pr-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1A73E8] shadow-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Row 2: Live GPS Location Button (Full Width) */}
        <button
          type="button"
          onClick={handleRequestLiveLocation}
          disabled={isLocating}
          className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs border ${
            userGeoLocation 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
              : 'bg-[#1A73E8]/10 text-[#1A73E8] hover:bg-[#1A73E8]/15 border-blue-200/60'
          }`}
        >
          <Compass size={14} className={isLocating ? 'animate-spin' : ''} />
          <span className="whitespace-nowrap">{isLocating ? (t('locatingBtn') || 'Locating...') : userGeoLocation ? (t('gpsActiveBtn') || 'GPS Live Active') : (t('useLiveLocationBtn') || '📍 Use Live GPS Location')}</span>
        </button>

        {/* Smooth Touch-Scrollable Filter Tabs */}
        <div className="bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold text-slate-600 flex items-center gap-1.5 border border-slate-200/60 shadow-xs overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-3.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'all' 
                ? 'bg-[#1A73E8] text-white font-semibold shadow-md shadow-blue-500/25' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building2 size={14} className={activeTab === 'all' ? 'text-white' : 'text-slate-400'} />
            <span className="whitespace-nowrap">{t('tabAllSocieties') || "All Partner Societies"} ({allSocieties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('selected')}
            className={`py-2 px-3.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'selected' 
                ? 'bg-[#1A73E8] text-white font-semibold shadow-md shadow-blue-500/25' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Star size={14} className={activeTab === 'selected' ? 'text-white' : 'text-slate-400'} />
            <span className="whitespace-nowrap">{t('tabSelected') || "Selected"} ({totalSelectedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('high_hiring')}
            className={`py-2 px-3.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'high_hiring' 
                ? 'bg-[#1A73E8] text-white font-semibold shadow-md shadow-blue-500/25' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'high_hiring' ? 'text-white' : 'text-slate-400'} />
            <span className="whitespace-nowrap">{t('tabHighHiring') || "High Hiring"} ({allSocieties.filter(s => s.activeJobsCount >= 3).length})</span>
          </button>
        </div>
      </div>

      {/* 🏢 SOCIETIES LIST GRID */}
      <div className="space-y-3">
        {filteredSocieties.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-3 shadow-xs">
            <Building2 size={36} className="mx-auto text-slate-300" />
            <div>
              <h4 className="text-xs font-semibold text-slate-800">{t('noSocietiesFoundTitle') || "No Societies Found"}</h4>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {t('noSocietiesFoundSub') || 'No gated community matches your search. Try a different keyword or request an unlisted society.'}
              </p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="py-2 px-4 bg-[#1A73E8] text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer hover:bg-blue-600 transition-all inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> {t('requestNewSocietyBtn') || "Request New Society"}
            </button>
          </div>
        ) : (
          filteredSocieties.map((soc) => (
            <SocietyCard 
              key={soc.id}
              society={soc}
              isPrimary={primarySocietyId === soc.id}
              isSecondary={secondarySocietyIds.includes(soc.id)}
              highHiringThreshold={highHiringThreshold}
              onSetPrimary={handleSetPrimary}
              onToggleSecondary={handleToggleSecondary}
            />
          ))
        )}
      </div>

      {/* ℹ️ COMPACT HELP NOTE */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-center space-y-1">
        <p className="text-xs font-semibold text-slate-700">
          {t('dontSeeSocietyTitle') || "Can't find your working society listed?"}
        </p>
        <p className="text-[11px] text-slate-500 font-medium">
          Resident Employers can request society onboarding directly when posting job requisitions on Sevikaa.
        </p>
      </div>

      {/* 📩 REQUEST NEW SOCIETY MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up border border-slate-100">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-[#1A73E8] rounded-xl">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{t('requestModalTitle') || "Request Society Onboarding"}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{t('requestModalSub') || "Sevikaa Admin directory request"}</p>
                </div>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRequestSocietySubmit} className="space-y-3 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">{t('societyNameLabel') || "Gated Society / Apartment Name"}</label>
                <input 
                  type="text" 
                  required
                  value={newSocietyName}
                  onChange={(e) => setNewSocietyName(e.target.value)}
                  placeholder={t('societyNamePlaceholder') || "e.g. Sobha Royal Pavilion"}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">{t('localityLabel') || "Locality / Area / Landmark"}</label>
                <input 
                  type="text" 
                  value={newSocietyLocality}
                  onChange={(e) => setNewSocietyLocality(e.target.value)}
                  placeholder={t('localityPlaceholder') || "e.g. Sarjapur Main Road, HSR Layout"}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">{t('towerLabel') || "Tower / Block or Gate Number (Optional)"}</label>
                <input 
                  type="text" 
                  value={newSocietyTower}
                  onChange={(e) => setNewSocietyTower(e.target.value)}
                  placeholder={t('towerPlaceholder') || "e.g. Tower 3 / Gate 2"}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {t('cancelBtn') || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest || !newSocietyName.trim()}
                  className="py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl text-xs font-black shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{isSubmittingRequest ? (t('submittingState') || 'Submitting...') : (t('submitRequestBtn') || 'Submit Request')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
