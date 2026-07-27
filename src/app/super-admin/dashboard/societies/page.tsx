"use client";

import React, { useState } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { MapPin, Search, PlusCircle, Building2, Users, Briefcase, Check, ChevronRight, UserCheck } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { SocietyDetailModal } from '../../../../components/admin/dashboard/SocietyDetailModal';

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

  // New society form state
  const [name, setName] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [gatePhone, setGatePhone] = useState('');
  const [totalFlats, setTotalFlats] = useState('');
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
            const registeredEmployers = employersList?.filter(e => 
              e.society_name?.toLowerCase() === soc.name?.toLowerCase() ||
              e.billing_address?.toLowerCase().includes(soc.name?.toLowerCase()) ||
              e.company_name?.toLowerCase().includes(soc.name?.toLowerCase())
            ).length || 0;

            const registeredWorkers = workersList?.filter(w => 
              w.preferred_society_name?.toLowerCase() === soc.name?.toLowerCase() ||
              w.preferred_society?.name?.toLowerCase() === soc.name?.toLowerCase()
            ).length || 0;

            const activeJobs = pendingJobsList?.filter(j => 
              j.society_name?.toLowerCase() === soc.name?.toLowerCase() ||
              j.society?.name?.toLowerCase() === soc.name?.toLowerCase()
            ).length || 0;

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

                <div className="pt-2 border-t border-slate-50 grid grid-cols-3 gap-1.5 text-[8.5px] font-bold text-slate-600">
                  <div className="bg-slate-50 p-1.5 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-slate-400 flex items-center gap-0.5"><UserCheck size={9} /> Employers</span>
                    <span className="font-black text-slate-800 text-[10px] mt-0.5">{registeredEmployers}</span>
                  </div>

                  <div className="bg-slate-50 p-1.5 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-slate-400 flex items-center gap-0.5"><Users size={9} /> Workers</span>
                    <span className="font-black text-slate-800 text-[10px] mt-0.5">{registeredWorkers}</span>
                  </div>

                  <div className="bg-slate-50 p-1.5 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-slate-400 flex items-center gap-0.5"><Briefcase size={9} /> Jobs</span>
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
