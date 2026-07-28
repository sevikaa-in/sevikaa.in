"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Building2, MapPin, Users, Briefcase, ChevronRight, Phone, Calendar, Sparkles, UserCheck, Edit3, Check, Save
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
  const [activeTab, setActiveTab] = useState<'employers' | 'workers' | 'jobs'>('employers');
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editGateSecurity, setEditGateSecurity] = useState('MyGate');
  const [editTotalFlats, setEditTotalFlats] = useState('850');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (society) {
      setEditName(society.name || '');
      setEditCity(society.city || 'Bangalore');
      setEditArea(society.area || '');
      setEditPincode(society.pincode || '');
      setEditGateSecurity(society.gate_security || 'MyGate');
      setEditTotalFlats(society.total_flats ? String(society.total_flats) : '850');
      setEditLatitude(society.latitude ? String(society.latitude) : '');
      setEditLongitude(society.longitude ? String(society.longitude) : '');
      setIsEditing(false);
    }
  }, [society, isOpen]);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) return;
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditLatitude(pos.coords.latitude.toFixed(6));
        setEditLongitude(pos.coords.longitude.toFixed(6));
        setIsDetectingLocation(false);
      },
      () => {
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  if (!isOpen || !society || !mounted) return null;

  const matchingEmployers = employers.filter(e => 
    e.society_name?.toLowerCase() === society.name?.toLowerCase() ||
    e.billing_address?.toLowerCase().includes(society.name?.toLowerCase()) ||
    e.company_name?.toLowerCase().includes(society.name?.toLowerCase())
  );

  const matchingWorkers = workers.filter(w => 
    w.preferred_society_name?.toLowerCase() === society.name?.toLowerCase() ||
    w.preferred_society?.name?.toLowerCase() === society.name?.toLowerCase()
  );

  const matchingJobs = jobs.filter(j => 
    j.society_name?.toLowerCase() === society.name?.toLowerCase() ||
    j.society?.name?.toLowerCase() === society.name?.toLowerCase()
  );

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

  return createPortal(
    <div 
      className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-[9999] flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full sm:w-[680px] md:w-[760px] lg:w-[840px] h-screen max-h-screen bg-white shadow-2xl flex flex-col border-l border-slate-200/80 animate-slide-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A73E8] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#1A73E8]/20">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>{society.name}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-[#1A73E8] border border-blue-200/50">
                  {society.city || 'Bangalore'}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                <MapPin size={10} className="text-slate-400" />
                <span>{society.area || 'Bangalore Sector'} &bull; Pincode: <span className="font-mono text-slate-600">{society.pincode || '560001'}</span></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                isEditing 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Edit3 size={13} />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Society'}</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
              title="Close Drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Body - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          
          {/* Edit Society Form Card */}
          {isEditing && (
            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-4 animate-slide-down">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Edit3 size={14} className="text-amber-600" />
                  Edit Society Details
                </span>
                <span className="text-[9.5px] font-bold text-slate-400">ID: {society.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold">
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

                <div className="space-y-1">
                  <label className="text-[9.5px] text-slate-400 uppercase font-black">Gate Security App</label>
                  <select
                    value={editGateSecurity}
                    onChange={(e) => setEditGateSecurity(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
                  >
                    <option value="MyGate">MyGate</option>
                    <option value="ADDA">ADDA</option>
                    <option value="NoBrokerHood">NoBrokerHood</option>
                    <option value="Gatekeeper">Gatekeeper</option>
                    <option value="Physical Register">Physical Register</option>
                  </select>
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

          {/* Society 3-Column Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Available Workers</span>
                <span className="text-lg font-black text-slate-900">{matchingWorkers.length}</span>
              </div>
              <div className="p-2.5 bg-blue-50 text-[#1A73E8] rounded-xl">
                <Users size={18} />
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

          {/* Navigation Tabs */}
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
                onClick={() => setActiveTab('workers')}
                className={`flex-1 py-2 flex items-center justify-center gap-1 rounded-lg cursor-pointer transition-all ${
                  activeTab === 'workers' ? 'bg-white text-[#1A73E8] shadow-sm font-black' : 'hover:text-slate-900'
                }`}
              >
                <Users size={12} />
                <span>Workers ({matchingWorkers.length})</span>
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
                    <span>No employer residents registered for {society.name} yet.</span>
                  </div>
                ) : (
                  matchingEmployers.map((emp) => (
                    <div key={emp.id} className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800">{emp.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            emp.subscription_status === 'premium' ? 'bg-indigo-50 text-[#1A73E8]' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {emp.subscription_status || 'Free'} Employer
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-500">
                          <span>Household: {emp.company_name || 'Individual Household'}</span>
                          <span>&bull; Phone: {emp.phone || 'N/A'}</span>
                        </div>
                      </div>
                      <span className="text-[9.5px] font-bold text-slate-500 bg-white border border-slate-200/60 px-2 py-1 rounded-lg">
                        {emp.billing_address || 'Bangalore'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Workers Tab Content */}
            {activeTab === 'workers' && (
              <div className="space-y-3">
                {matchingWorkers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-bold flex flex-col items-center gap-1">
                    <Sparkles size={20} className="text-slate-300" />
                    <span>No worker candidates registered for {society.name} yet.</span>
                  </div>
                ) : (
                  matchingWorkers.map((w) => (
                    <div key={w.id} className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800">{w.name || w.full_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            w.status === 'live' || w.status === 'approved' ? 'bg-emerald-50 text-[#34A853]' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {w.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 text-[9px] font-bold text-slate-500">
                          <span>Skills: {w.skills?.join(', ') || 'Domestic Help'}</span>
                          <span>&bull; {w.age || '30'} yrs ({w.gender || 'Female'})</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-700">₹{w.expected_salary || '0'}/mo</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Jobs Tab Content */}
            {activeTab === 'jobs' && (
              <div className="space-y-3">
                {matchingJobs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-bold flex flex-col items-center gap-1">
                    <Sparkles size={20} className="text-slate-300" />
                    <span>No active job requisitions posted in {society.name} yet.</span>
                  </div>
                ) : (
                  matchingJobs.map((j) => (
                    <div key={j.id} className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-800 capitalize">{j.title || `${j.category} needed`}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          j.status === 'live' || j.status === 'approved' ? 'bg-emerald-50 text-[#34A853]' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {j.status}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-600 font-semibold line-clamp-2 leading-relaxed">
                        {j.description}
                      </p>
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 pt-1.5 border-t border-slate-100">
                        <span>Salary: ₹{j.salary_offered || j.salary_range_min || 'N/A'}/mo</span>
                        <span>Employer: {j.employer || 'Resident'}</span>
                      </div>
                    </div>
                  ))
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
