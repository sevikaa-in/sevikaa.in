"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Building2, MapPin, Briefcase, Sparkles, UserCheck, Edit3, Check, Save, ChevronDown
} from 'lucide-react';

interface SocietyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  society: any;
  employers: any[];
  workers: any[];
  jobs: any[];
  onUpdateSociety?: (updated: any) => Promise<void>;
}

const safeString = (val: any, fallback: string = ''): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (typeof val === 'object') {
    if (typeof val.name === 'string') return val.name;
    if (typeof val.company_name === 'string') return val.company_name;
    if (typeof val.title === 'string') return val.title;
    if (typeof val.email === 'string') return val.email;
  }
  return fallback;
};

export const SocietyDetailModal: React.FC<SocietyDetailModalProps> = ({
  isOpen,
  onClose,
  society,
  employers,
  workers,
  jobs,
  onUpdateSociety
}) => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'employers' | 'jobs'>('employers');
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editGateSecurity, setEditGateSecurity] = useState('Physical Gate Security');
  const [editTotalFlats, setEditTotalFlats] = useState('850');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isGateDropdownOpen, setIsGateDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (society) {
      setEditName(safeString(society.name, ''));
      setEditCity(safeString(society.city, 'Bangalore'));
      setEditArea(safeString(society.area, ''));
      setEditPincode(safeString(society.pincode, ''));
      setEditGateSecurity(safeString(society.gate_security, 'Physical Gate Security'));
      setEditTotalFlats(society.total_flats ? String(society.total_flats) : '850');
      setEditLatitude(society.latitude ? String(society.latitude) : '');
      setEditLongitude(society.longitude ? String(society.longitude) : '');
      setIsEditing(false);
    }
  }, [society, isOpen]);

  // ALL HOOKS AT TOP LEVEL
  const targetSocName = useMemo(() => safeString(society?.name, '').toLowerCase().trim(), [society?.name]);
  
  const targetSocTokens = useMemo(() => {
    return targetSocName
      ? targetSocName.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((t: string) => t.length > 2 && !['bangalore', 'bengaluru', 'mumbai', 'delhi'].includes(t))
      : [];
  }, [targetSocName]);

  const matchingJobs = useMemo(() => {
    if (!society || !jobs) return [];
    return jobs.filter((j: any) => {
      if (!j) return false;
      if (j.society_id && society.id && j.society_id === society.id) return true;
      const jobLoc = safeString(j.society_name || j.society?.name || j.location || j.address, '').toLowerCase();
      if (!targetSocName || !jobLoc) return false;
      if (jobLoc.includes(targetSocName) || targetSocName.includes(jobLoc)) return true;
      return targetSocTokens.length > 0 && targetSocTokens.some((t: string) => jobLoc.includes(t));
    });
  }, [jobs, society, targetSocName, targetSocTokens]);

  const matchingEmployers = useMemo(() => {
    if (!society) return [];
    
    // 1. Direct employers matching society name or ID
    const direct = (employers || []).filter((e: any) => {
      if (!e || !society) return false;
      if (e.society_id && society.id && e.society_id === society.id) return true;
      const empLoc = safeString(e.society_name || e.billing_address || e.company_name || e.address || e.tower, '').toLowerCase();
      if (!targetSocName || !empLoc) return false;
      if (empLoc.includes(targetSocName) || targetSocName.includes(empLoc)) return true;
      return targetSocTokens.length > 0 && targetSocTokens.some((t: string) => empLoc.includes(t));
    });

    // 2. Derive employers from matching jobs posted in this society
    const derived = (matchingJobs || []).map((j: any) => {
      // employer object is the joined profiles row with nested employer_profiles
      const empProfileObj = Array.isArray(j.employer?.employer_profiles) 
        ? j.employer?.employer_profiles[0] 
        : j.employer?.employer_profiles;
      
      const empName = safeString(
        j.employer_name ||
        j.employerName ||
        j.posted_by ||
        empProfileObj?.company_name ||
        empProfileObj?.name ||
        j.employer?.email?.split('@')[0],
        'Resident Household Employer'
      );
      const empPhone = safeString(j.employer_phone || j.phone || j.employer?.phone || empProfileObj?.phone, '+91 9876543210');
      const empEmail = safeString(j.employer_email || j.email || j.employer?.email, 'employer@sevikaa.in');
      const empCompany = safeString(empProfileObj?.company_name || empProfileObj?.name, 'Individual Household');
      const empSub = safeString(empProfileObj?.subscription_status, 'free');
      const empId = j.employer_id || j.user_id || j.employer?.id || `emp-${j.id}`;

      return {
        id: empId,
        name: empName,
        phone: empPhone,
        email: empEmail,
        company_name: empCompany,
        society_name: safeString(j.society_name, society.name),
        billing_address: safeString(j.tower || j.address, society.name || 'Bengaluru'),
        subscription_status: empSub,
        created_at: j.created_at || new Date().toISOString()
      };
    });

    // Deduplicate combined results by ID or Name
    const combined = [...direct];
    derived.forEach((dEmp: any) => {
      const exists = combined.some((e: any) => 
        (e.id && dEmp.id && e.id === dEmp.id) ||
        (e.name && dEmp.name && safeString(e.name).toLowerCase() === safeString(dEmp.name).toLowerCase())
      );
      if (!exists) {
        combined.push(dEmp);
      }
    });

    return combined;
  }, [employers, matchingJobs, society, targetSocName, targetSocTokens]);

  const fallbackAddressGeocode = async () => {
    try {
      const query = [editName, editArea, editCity, 'India'].filter(Boolean).join(', ');
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setEditLatitude(Number(data[0].lat).toFixed(6));
        setEditLongitude(Number(data[0].lon).toFixed(6));
      }
    } catch (e) {
      console.error("Geocoding error:", e);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleDetectGPS = async () => {
    setIsDetectingLocation(true);

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setEditLatitude(pos.coords.latitude.toFixed(6));
          setEditLongitude(pos.coords.longitude.toFixed(6));
          setIsDetectingLocation(false);
        },
        async () => {
          await fallbackAddressGeocode();
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      await fallbackAddressGeocode();
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    const updated = {
      ...society,
      name: editName.trim(),
      city: editCity.trim(),
      area: editArea.trim(),
      pincode: editPincode.trim(),
      gate_security: editGateSecurity,
      total_flats: parseInt(editTotalFlats) || 850,
      latitude: editLatitude ? parseFloat(editLatitude) : null,
      longitude: editLongitude ? parseFloat(editLongitude) : null
    };
    if (onUpdateSociety) {
      await onUpdateSociety(updated);
    }
    setSaving(false);
    setIsEditing(false);
  };

  if (!isOpen || !society || !mounted) return null;

  const socTitle = safeString(society.name, 'Gated Community');
  const socCity = safeString(society.city, 'Bangalore');
  const socArea = safeString(society.area, 'Bangalore Sector');
  const socPincode = safeString(society.pincode, '560001');

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl border-l border-slate-100 animate-in slide-in-from-right duration-300 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-[#1A73E8] text-white shadow-sm shrink-0">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900 truncate">{socTitle}</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-[#1A73E8] border border-blue-200">
                  {socCity}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-slate-400 shrink-0" />
                <span>{socArea} &bull; Pincode: {socPincode}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isEditing 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Edit3 size={13} />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Society'}</span>
            </button>

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30">
          
          {/* Edit Form Drawer */}
          {isEditing && (
            <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200/80 space-y-4 animate-fade-in shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <Edit3 size={14} className="text-amber-600" />
                  <span>Edit Society Details</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">ID: {safeString(society.id)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9.5px] text-slate-400 uppercase font-black">Society Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] text-slate-400 uppercase font-black">City</label>
                  <select
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
                  >
                    <option value="Bangalore">Bangalore</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] text-slate-400 uppercase font-black">Area / Sector</label>
                  <input
                    type="text"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] text-slate-400 uppercase font-black">Pincode</label>
                  <input
                    type="text"
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 relative">
                  <label className="text-[9.5px] text-slate-400 uppercase font-black">Gate Security Type</label>
                  <button
                    type="button"
                    onClick={() => setIsGateDropdownOpen(!isGateDropdownOpen)}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                  >
                    <span>{editGateSecurity || 'Physical Gate Security'}</span>
                    <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isGateDropdownOpen ? 'rotate-180 text-[#1A73E8]' : ''}`} />
                  </button>

                  {isGateDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {[
                        { label: 'Physical Gate Security', val: 'Physical Gate Security' },
                        { label: 'Physical Paper Register', val: 'Physical Paper Register' }
                      ].map((opt) => {
                        const isSelected = editGateSecurity === opt.val;
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => {
                              setEditGateSecurity(opt.val);
                              setIsGateDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[#1A73E8]/10 text-[#1A73E8] font-black'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check size={14} className="text-[#1A73E8]" strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] text-slate-400 uppercase font-black">Est Total Units</label>
                  <input
                    type="number"
                    value={editTotalFlats}
                    onChange={(e) => setEditTotalFlats(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                  />
                </div>

                {/* GPS Geolocation Coordinates */}
                <div className="space-y-1 sm:col-span-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[9.5px] text-slate-400 uppercase font-black">GPS Geo Coordinates (Latitude / Longitude)</label>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={isDetectingLocation}
                      className="text-[9.5px] font-black text-[#1A73E8] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <MapPin size={10} />
                      <span>{isDetectingLocation ? 'Detecting...' : '📍 Auto-Detect GPS Location'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Latitude e.g. 12.8720"
                      value={editLatitude}
                      onChange={(e) => setEditLatitude(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Longitude e.g. 77.6105"
                      value={editLongitude}
                      onChange={(e) => setEditLongitude(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="py-1.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="py-1.5 px-5 bg-[#34A853] hover:bg-[#2b8a43] text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{saving ? 'Saving...' : 'Save Society Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Society 2-Column Focused Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Resident Employers</span>
                <span className="text-lg font-black text-slate-900">{matchingEmployers.length}</span>
              </div>
              <div className="p-2.5 bg-indigo-50 text-[#1A73E8] rounded-xl">
                <UserCheck size={18} />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Active Job Postings</span>
                <span className="text-lg font-black text-slate-900">{matchingJobs.length}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 text-[#34A853] rounded-xl">
                <Briefcase size={18} />
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Employers & Jobs) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold text-slate-600">
              <button
                onClick={() => setActiveTab('employers')}
                className={`flex-1 py-2 flex items-center justify-center gap-1 rounded-lg cursor-pointer transition-all ${
                  activeTab === 'employers' ? 'bg-white text-[#1A73E8] shadow-sm font-black' : 'hover:text-slate-900'
                }`}
              >
                <UserCheck size={12} />
                <span>Employers ({matchingEmployers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('jobs')}
                className={`flex-1 py-2 flex items-center justify-center gap-1 rounded-lg cursor-pointer transition-all ${
                  activeTab === 'jobs' ? 'bg-white text-[#1A73E8] shadow-sm font-black' : 'hover:text-slate-900'
                }`}
              >
                <Briefcase size={12} />
                <span>Jobs ({matchingJobs.length})</span>
              </button>
            </div>

            {/* Employers Tab Content */}
            {activeTab === 'employers' && (
              <div className="space-y-3">
                {matchingEmployers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-bold flex flex-col items-center gap-1">
                    <Sparkles size={20} className="text-slate-300" />
                    <span>No employer residents registered for {socTitle} yet.</span>
                  </div>
                ) : (
                  matchingEmployers.map((emp: any, idx: number) => {
                    const empName = safeString(emp.name || emp.employer_profiles?.name || emp.email, 'Resident Household Employer');
                    const empCompany = safeString(emp.company_name || emp.employer_profiles?.company_name, 'Individual Household');
                    const empPhone = safeString(emp.phone, 'N/A');
                    const empSub = safeString(emp.subscription_status, 'Free');
                    const empAddress = safeString(emp.billing_address || emp.tower || emp.address, socTitle);

                    return (
                      <div key={typeof emp.id === 'string' || typeof emp.id === 'number' ? emp.id : `emp-item-${idx}`} className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800">{empName}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              empSub === 'premium' ? 'bg-indigo-50 text-[#1A73E8]' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {empSub} Employer
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-500">
                            <span>Household: {empCompany}</span>
                            <span>&bull; Phone: {empPhone}</span>
                          </div>
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-500 bg-white border border-slate-200/60 px-2 py-1 rounded-lg">
                          {empAddress}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Jobs Tab Content */}
            {activeTab === 'jobs' && (
              <div className="space-y-3">
                {matchingJobs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-bold flex flex-col items-center gap-1">
                    <Sparkles size={20} className="text-slate-300" />
                    <span>No active job requisitions posted in {socTitle} yet.</span>
                  </div>
                ) : (
                  matchingJobs.map((j: any, idx: number) => {
                    const jobTitle = safeString(j.title || j.category, 'Domestic Help Requisition');
                    const jobDesc = safeString(j.description, 'Active job requisition posted for resident household.');
                    const jobStatus = safeString(j.status, 'live');
                    const jobSalary = safeString(j.salary_offered || j.salary_range_min, 'N/A');
                    const jobEmployer = safeString(j.employer || j.employer_name, 'Resident Household');

                    return (
                      <div key={typeof j.id === 'string' || typeof j.id === 'number' ? j.id : `job-item-${idx}`} className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-800 capitalize">{jobTitle}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            jobStatus === 'live' || jobStatus === 'approved' ? 'bg-emerald-50 text-[#34A853]' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {jobStatus}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-semibold line-clamp-2 leading-relaxed">
                          {jobDesc}
                        </p>
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 pt-1.5 border-t border-slate-100">
                          <span>Salary: ₹{jobSalary}/mo</span>
                          <span>Employer: {jobEmployer}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-white shrink-0 shadow-lg">
          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md shadow-[#1A73E8]/20"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
