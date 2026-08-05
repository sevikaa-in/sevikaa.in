"use client";

import React, { useState } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { MapPin, Search, PlusCircle, Building2, Users, Briefcase, Check, ChevronRight, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { SocietyDetailModal } from '@/components/admin/dashboard/SocietyDetailModal';

export default function SocietiesPage() {
  const {
    societiesList,
    setSocietiesList,
    employersList,
    workersList,
    pendingJobsList,
    showToast
  } = useSuperAdminDashboard();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSoc, setSelectedSoc] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Real Database Pending Requests State
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [relocationRequests, setRelocationRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  // Fetch pending society onboarding requests & relocation requests from Supabase
  React.useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      try {
        const res = await fetch('/api/societies');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success && data.societies) {
            setPendingRequests(data.societies.filter((s: any) => s.status === 'pending_verification'));
          }
        }
      } catch (err) {
        console.error("Error fetching pending society requests:", err);
      }

      try {
        const relRes = await fetch('/api/admin/society-relocations');
        if (relRes.ok && isMounted) {
          const relData = await relRes.json();
          if (relData.success && relData.requests) {
            setRelocationRequests(relData.requests);
          }
        }
      } catch (relErr) {
        console.error("Error fetching relocation requests:", relErr);
      } finally {
        if (isMounted) setLoadingRequests(false);
      }
    };

    loadRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleApproveRelocation = async (reqItem: any) => {
    try {
      const res = await fetch('/api/admin/society-relocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reqItem.id,
          employerId: reqItem.employer_id,
          targetSociety: reqItem.target_society,
          action: 'approve'
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Approval failed');

      setRelocationRequests(prev => prev.filter(r => r.id !== reqItem.id));
      showToast(`Society transfer approved! Employer moved to "${reqItem.target_society}"`, 'success');
    } catch (err: any) {
      showToast(`Error approving relocation: ${err.message}`, 'error');
    }
  };

  const handleRejectRelocation = async (reqItem: any) => {
    try {
      const res = await fetch('/api/admin/society-relocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reqItem.id,
          employerId: reqItem.employer_id,
          action: 'reject'
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Rejection failed');

      setRelocationRequests(prev => prev.filter(r => r.id !== reqItem.id));
      showToast('Relocation request rejected.', 'info');
    } catch (err: any) {
      showToast(`Error rejecting relocation: ${err.message}`, 'error');
    }
  };

  const handleApproveRequest = async (reqItem: any) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    try {
      if (!isPlaceholder && reqItem.id && !reqItem.id.toString().startsWith('soc_req_')) {
        const { error } = await supabase
          .from('societies')
          .update({ status: 'active' })
          .eq('id', reqItem.id);
        
        if (error) throw error;
      }

      const newActiveSoc = {
        id: reqItem.id,
        name: reqItem.name,
        city: reqItem.city || 'Bangalore',
        area: reqItem.area || 'General Sector',
        pincode: reqItem.pincode || '560087',
        gate_security: reqItem.gate_security || 'Physical Gate Security',
        total_flats: reqItem.total_flats || 850,
        workers_count: 0,
        active_jobs: 0
      };

      setSocietiesList(prev => [newActiveSoc, ...prev.filter(s => s.id !== reqItem.id)]);
      setPendingRequests(prev => prev.filter(r => r.id !== reqItem.id));
      showToast(`Approved & Published "${reqItem.name}" live platform-wide!`, 'success');
    } catch (err: any) {
      showToast(`Approval failed: ${err.message}`, 'error');
    }
  };

  const handleRejectRequest = async (reqId: string, name: string) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    try {
      if (!isPlaceholder && reqId && !reqId.toString().startsWith('soc_req_')) {
        await supabase
          .from('societies')
          .update({ status: 'rejected' })
          .eq('id', reqId);
      }
      setPendingRequests(prev => prev.filter(r => r.id !== reqId));
      showToast(`Rejected request for "${name}".`, 'info');
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`, 'error');
    }
  };

  // New society form state
  const [name, setName] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [gatePhone, setGatePhone] = useState('');
  const [totalFlats, setTotalFlats] = useState('');
  const [gateSecurity, setGateSecurity] = useState('MyGate');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setIsDetectingLocation(false);
        showToast(`GPS coordinates captured! (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`, 'success');
      },
      (err) => {
        setIsDetectingLocation(false);
        showToast('Could not fetch GPS position. Enter coordinates manually.', 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const filtered = societiesList.filter((soc) => {
    const matchesSearch = soc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          soc.area?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'all' || soc.city?.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const handleAddSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ||
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    const newSoc = {
      id: `s_${Date.now()}`,
      name: name.trim(),
      city: city.trim(),
      area: area.trim() || 'General Sector',
      pincode: pincode.trim() || '560001',
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      workers_count: 0,
      active_jobs: 0,
      created_at: new Date().toISOString()
    };

    if (!isPlaceholder) {
      try {
        const { data, error } = await supabase
          .from('societies')
          .insert([{ 
            name: newSoc.name, 
            city: newSoc.city, 
            area: newSoc.area, 
            pincode: newSoc.pincode,
            latitude: newSoc.latitude,
            longitude: newSoc.longitude
          }])
          .select()
          .single();
        if (error) throw error;
        if (data) newSoc.id = data.id;
        showToast(`Society "${newSoc.name}" registered successfully with GPS coordinates!`, 'success');
      } catch (err: any) {
        showToast(`Failed to add society: ${err.message}`, 'error');
        return;
      }
    } else {
      showToast(`Society "${newSoc.name}" added to platform!`, 'success');
    }

    setSocietiesList(prev => [newSoc, ...prev]);
    setName('');
    setArea('');
    setPincode('');
    setGatePhone('');
    setTotalFlats('');
    setLatitude('');
    setLongitude('');
    setIsAdding(false);
  };

  const handleUpdateSociety = async (updated: any) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ||
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    try {
      if (!isPlaceholder) {
        const { error } = await supabase
          .from('societies')
          .update({
            name: updated.name,
            city: updated.city,
            area: updated.area,
            pincode: updated.pincode,
            latitude: updated.latitude ? parseFloat(updated.latitude) : null,
            longitude: updated.longitude ? parseFloat(updated.longitude) : null
          })
          .eq('id', updated.id);
        if (error) throw error;
      }
      setSocietiesList(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelectedSoc(updated);
      showToast(`Society "${updated.name}" updated successfully!`, 'success');
    } catch (err: any) {
      showToast(`Failed to update society: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Gated Community &amp; Societies Catalog</h3>
          <p className="text-[10px] text-slate-400 font-bold px-1 mt-0.5">
            Registered residential societies for Employer profiles, Worker matching &amp; Job requisitions.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md shadow-[#1A73E8]/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <PlusCircle size={15} />
          <span>{isAdding ? 'Close Form' : 'Add New Society'}</span>
        </button>
      </div>

      {/* Add Society Form Card */}
      {isAdding && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
            <Building2 size={16} className="text-[#1A73E8]" />
            <h4 className="text-xs font-black text-slate-800">Register New Residential Society</h4>
          </div>

          <form onSubmit={handleAddSociety} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[9.5px] text-slate-400 uppercase font-black">Society Name *</label>
              <input
                type="text"
                placeholder="e.g. Prestige Ferns Residency"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9.5px] text-slate-400 uppercase font-black">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
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
                placeholder="e.g. HSR Layout Sector 2"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9.5px] text-slate-400 uppercase font-black">Pincode</label>
              <input
                type="text"
                placeholder="e.g. 560102"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[9.5px] text-slate-400 uppercase font-black">Security Gate Desk Contact (Optional)</label>
              <input
                type="text"
                placeholder="e.g. +91 9876543210 (Main Gate Security)"
                value={gatePhone}
                onChange={(e) => setGatePhone(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9.5px] text-slate-400 uppercase font-black">Est. Total Household Units</label>
              <input
                type="number"
                placeholder="e.g. 1200"
                value={totalFlats}
                onChange={(e) => setTotalFlats(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9.5px] text-slate-400 uppercase font-black">Gate Security Type</label>
              <select
                value={gateSecurity}
                onChange={(e) => setGateSecurity(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
              >
                <option value="Physical Security">Physical Security</option>
                <option value="Physical Register">Physical Register</option>
              </select>
            </div>

            {/* GPS Geolocation Coordinates */}
            <div className="space-y-1 sm:col-span-3">
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
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
                />
                <input
                  type="text"
                  placeholder="Longitude e.g. 77.6105"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="sm:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 bg-[#34A853] hover:bg-[#2b8a43] text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Check size={14} strokeWidth={3} />
                Save &amp; Publish Society
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 🔔 PENDING SOCIETY ONBOARDING REQUESTS (REAL SUPABASE DATABASE QUEUE) */}
      <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <span>🔔 Pending Society Onboarding Requests</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                {pendingRequests.length} Pending Verification
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Review public &amp; employer requests for new gated societies. Call or WhatsApp the requester to verify RWA gate desk details.
            </p>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-xl">🎉</span>
            <p className="text-xs font-bold text-slate-700">All society onboarding requests have been verified!</p>
            <p className="text-[11px] text-slate-400">New requests submitted from the public directory or employer portal will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map(req => {
              const reqPhone = req.requester_phone || req.phone || '+919876543210';
              const reqName = req.requester_name || req.name || 'Resident Requester';
              const reqRole = req.requester_role || 'Employer / Resident Owner';
              const socName = req.name || req.societyName || 'New Gated Community';
              const locality = [req.area, req.city, req.pincode].filter(Boolean).join(', ') || req.locality || 'Bengaluru';
              const mapUrl = req.area?.startsWith('http') ? req.area : `https://maps.google.com/?q=${encodeURIComponent(socName + ' ' + locality)}`;

              return (
                <div key={req.id} className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/40 via-white to-slate-50 border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-sm sm:text-base">{socName}</span>
                      {req.requester_flat && (
                        <span className="px-2 py-0.5 bg-blue-50 text-[#1A73E8] text-[9.5px] font-black rounded-full border border-blue-200">
                          {req.requester_flat}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9.5px] font-bold rounded-full border border-emerald-200">
                        🛡️ {req.gate_security || 'MyGate'}
                      </span>
                      {req.total_flats && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9.5px] font-bold rounded-full">
                          🏢 {req.total_flats} Units
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 font-semibold">{locality}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium flex-wrap pt-0.5">
                      <span>👤 Requester: <strong className="text-slate-900">{reqName}</strong> ({reqRole})</span>
                      <span>📱 Phone: <strong className="text-slate-900">{reqPhone}</strong></span>
                    </div>
                  </div>

                  {/* Direct Staff Contact & Approval Controls */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap pt-2 md:pt-0">
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-blue-50 text-[#1A73E8] hover:bg-blue-100 rounded-xl text-[10.5px] font-bold border border-blue-200 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <span>📍 Google Maps</span>
                    </a>
                    <a
                      href={`tel:${reqPhone}`}
                      className="py-2 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <span>📞 Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${reqPhone.replace(/\+/g, '')}?text=Namaste%20${encodeURIComponent(reqName.split(' ')[0])},%20this%20is%20Sevikaa%20Admin%20regarding%20your%20request%20to%20onboard%20${encodeURIComponent(socName)}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <span>💬 WhatsApp</span>
                    </a>
                    <button
                      onClick={() => handleApproveRequest(req)}
                      className="py-2 px-3.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-[10.5px] font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1"
                    >
                      <span>✅ Approve &amp; Publish</span>
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id, socName)}
                      className="py-2 px-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer"
                    >
                      <span>❌ Decline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🔄 EMPLOYER SOCIETY RELOCATION REQUESTS QUEUE */}
      <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-blue-100 pb-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <span>🔄 Employer Society Relocation Requests</span>
              <span className="px-2 py-0.5 bg-blue-50 text-[#1A73E8] text-[10px] font-bold rounded-full border border-blue-200">
                {relocationRequests.length} Pending Relocations
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Review and approve society transfer requests submitted by registered household employers. Inspect residency proof before approving.
            </p>
          </div>
        </div>

        {relocationRequests.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-xl">✨</span>
            <p className="text-xs font-bold text-slate-700">No pending society relocation requests</p>
            <p className="text-[11px] text-slate-400">When an employer requests a society transfer from their account, it will appear here for 1-click verification.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {relocationRequests.map((rel: any) => {
              const empName = rel.employer_name || 'Employer Household';
              const empPhone = rel.employer_phone || 'N/A';
              const curSoc = rel.current_society || 'Current Society';
              const tarSoc = rel.target_society || 'Target Society';
              const reason = rel.reason || 'Moved to new gated community';
              const proofUrl = rel.residency_proof_url;

              return (
                <div key={rel.id} className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/40 via-white to-slate-50 border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-sm">{empName}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full border border-slate-200">
                        📱 {empPhone}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold flex-wrap pt-0.5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                        🏠 {curSoc}
                      </span>
                      <span className="text-blue-600 font-black">➔</span>
                      <span className="px-2.5 py-1 bg-blue-50 text-[#1A73E8] rounded-lg border border-blue-200 font-extrabold">
                        🏢 {tarSoc}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium">
                      Reason: <span className="text-slate-700 font-semibold">{reason}</span>
                    </p>
                  </div>

                  {/* Actions & Proof Inspection */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap pt-2 md:pt-0">
                    {proofUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({ url: proofUrl, title: `${empName} - Residence Proof (${tarSoc})` })}
                        className="py-2 px-3 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-[10.5px] font-bold border border-purple-200 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <span>📄 Inspect Proof</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic font-medium px-2 py-1 bg-slate-50 rounded-lg">No Proof Attached</span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleApproveRelocation(rel)}
                      className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10.5px] font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                    >
                      <Check size={13} strokeWidth={3} />
                      <span>Approve Transfer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRejectRelocation(rel)}
                      className="py-2 px-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer"
                    >
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Preview Lightbox Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">{previewDoc.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl bg-slate-900 flex items-center justify-center p-2">
              {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewDoc.url} className="w-full h-[60vh] rounded-xl" />
              ) : (
                <img src={previewDoc.url} alt="Residency Proof" className="max-w-full max-h-[60vh] object-contain rounded-xl" />
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search society by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase">City:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Cities</option>
            <option value="bangalore">Bangalore</option>
            <option value="mumbai">Mumbai</option>
            <option value="delhi ncr">Delhi NCR</option>
          </select>
          <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2.5 py-1 rounded-full uppercase ml-1">
            {filtered.length} Total
          </span>
        </div>
      </div>

      {/* Societies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-100 text-center text-xs text-slate-400 font-bold">
            No societies found matching your search query.
          </div>
        ) : (
          filtered.map((soc) => {
            const matchedEmpCount = employersList?.filter((e: any) => {
              if (!e) return false;
              if (e.society_id && soc.id && e.society_id === soc.id) return true;
              
              const empLoc = (e.society_name || e.billing_address || e.company_name || '').toLowerCase();
              const targetSoc = (soc.name || '').toLowerCase();
              if (!empLoc || !targetSoc) return false;

              if (empLoc.includes(targetSoc) || targetSoc.includes(empLoc)) return true;

              const tokens = targetSoc.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((t: string) => t.length > 2 && t !== 'bangalore' && t !== 'bengaluru');
              return tokens.length > 0 && tokens.some((t: string) => empLoc.includes(t));
            }).length || 0;

            const jobsInSoc = pendingJobsList?.filter((j: any) => 
              j.society_id === soc.id ||
              (j.society_name && soc.name && (
                j.society_name.toLowerCase().includes(soc.name.toLowerCase()) ||
                soc.name.toLowerCase().includes(j.society_name.toLowerCase())
              ))
            ) || [];

            const activeJobs = jobsInSoc.length;
            // Every job posted in a society belongs to an employer registered in that society
            const registeredEmployers = Math.max(matchedEmpCount, jobsInSoc.length > 0 ? jobsInSoc.length : 0);

            return (
              <div 
                key={soc.id}
                onClick={() => {
                  setSelectedSoc(soc);
                  setIsModalOpen(true);
                }}
                className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-[#1A73E8]/40 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-900 group-hover:text-[#1A73E8] transition-colors flex items-center gap-1">
                      <span>{soc.name}</span>
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1A73E8]" />
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <MapPin size={10} className="text-slate-400" />
                      <span>{soc.area || 'Bangalore Sector'} &bull; {soc.city || 'Bangalore'}</span>
                    </p>
                  </div>
                  <span className="bg-blue-50 text-[#1A73E8] p-1.5 rounded-xl shrink-0 group-hover:bg-[#1A73E8] group-hover:text-white transition-colors">
                    <Building2 size={14} />
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-50 grid grid-cols-2 gap-1.5 text-[8.5px] font-bold text-slate-600">
                  <div className="bg-slate-50 p-1.5 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-slate-400 flex items-center gap-0.5"><UserCheck size={9} /> Employers</span>
                    <span className="font-black text-slate-800 text-[10px] mt-0.5">{registeredEmployers}</span>
                  </div>

                  <div className="bg-slate-50 p-1.5 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-slate-400 flex items-center gap-0.5"><Briefcase size={9} /> Open Jobs</span>
                    <span className="font-black text-slate-800 text-[10px] mt-0.5">{activeJobs}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <SocietyDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        society={selectedSoc}
        employers={employersList}
        workers={workersList}
        jobs={pendingJobsList}
        onUpdateSociety={handleUpdateSociety}
      />
    </div>
  );
}
