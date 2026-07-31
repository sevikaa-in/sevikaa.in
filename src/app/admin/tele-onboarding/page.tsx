"use client";

import React, { useState, useEffect } from 'react';
import { useAdminDashboard } from '../layout';
import { 
  PhoneCall, Users, ShieldCheck, Search, RefreshCw, MessageSquare, 
  ArrowRight, CheckCircle2, UserCheck, AlertTriangle, Building, MapPin, 
  FileText, ShieldAlert, Sparkles, X, Loader2, Save, Repeat, Home,
  ChevronLeft, ChevronRight, Clock, Briefcase
} from 'lucide-react';

export default function TeleOnboardingPage() {
  const { showToast } = useAdminDashboard();

  const [activeTab, setActiveTab] = useState<'workers' | 'employers'>('workers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // PAGINATION STATES
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [employersList, setEmployersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states for editing lead inside Right Slide-Over Sheet
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('Female');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editSalary, setEditSalary] = useState('');
  const [editExperience, setEditExperience] = useState('0');
  const [editShiftSlot, setEditShiftSlot] = useState('Full Day (8–12 Hours)');
  const [editBio, setEditBio] = useState('');
  const [editSociety, setEditSociety] = useState('');
  const [editSecondarySociety, setEditSecondarySociety] = useState('');
  const [editTower, setEditTower] = useState('');
  const [editFlat, setEditFlat] = useState('');
  const [editLanguages, setEditLanguages] = useState<string[]>(['Hindi']);

  // Employer specific account fields
  const [editAlternatePhone, setEditAlternatePhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editGstin, setEditGstin] = useState('');
  const [editVerificationReq, setEditVerificationReq] = useState('Aadhaar Card + Police Background Audit Required (Recommended)');

  // Action states
  const [savingLead, setSavingLead] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string; type: 'image' | 'video' } | null>(null);

  // Master Societies List for searchable scrollable assignment
  const [allSocieties, setAllSocieties] = useState<any[]>([]);
  const [showPrimarySocietyMenu, setShowPrimarySocietyMenu] = useState(false);
  const [showSecondarySocietyMenu, setShowSecondarySocietyMenu] = useState(false);

  // Fetch societies list
  useEffect(() => {
    const fetchSocietiesList = async () => {
      try {
        const res = await fetch('/api/societies');
        const data = await res.json();
        if (data.success && Array.isArray(data.societies)) {
          setAllSocieties(data.societies);
        }
      } catch (e) {
        console.warn("Societies fetch notice:", e);
      }
    };
    fetchSocietiesList();
  }, []);

  // Fetch paginated leads directly
  const fetchPaginatedLeads = async (targetPage = page, targetTab = activeTab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/data?tab=tele-onboarding&page=${targetPage}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        setWorkersList(data.workers || []);
        setEmployersList(data.employers || []);
      }
    } catch (err) {
      console.warn("Failed fetching paginated leads", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaginatedLeads(page, activeTab);
  }, [page, activeTab]);

  // Filter worker leads (Includes both incomplete & verified candidates)
  const workerLeads = workersList.filter(w => {
    const matchesSearch = (w.name || w.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (w.phone || '').includes(searchTerm);
    return matchesSearch;
  }).sort((a, b) => {
    const aIncomplete = !a.skills || a.skills.length === 0 || a.status === 'pending_review' || a.status === 'incomplete';
    const bIncomplete = !b.skills || b.skills.length === 0 || b.status === 'pending_review' || b.status === 'incomplete';
    if (aIncomplete && !bIncomplete) return -1;
    if (!aIncomplete && bIncomplete) return 1;
    return 0;
  });

  // Filter employer leads (Includes both incomplete & verified employers)
  const employerLeads = employersList.filter(e => {
    const matchesSearch = (e.company_name || e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.phone || '').includes(searchTerm);
    return matchesSearch;
  }).sort((a, b) => {
    const aIncomplete = !a.society_name || !a.address || a.status === 'pending_review' || a.status === 'incomplete';
    const bIncomplete = !b.society_name || !b.address || b.status === 'pending_review' || b.status === 'incomplete';
    if (aIncomplete && !bIncomplete) return -1;
    if (!aIncomplete && bIncomplete) return 1;
    return 0;
  });

  const currentLeads = activeTab === 'workers' ? workerLeads : employerLeads;

  // Format clean phone numbers (strip duplicate country code)
  const formatPhone = (p?: string) => {
    if (!p) return 'N/A';
    const cleaned = p.replace(/\D/g, '').slice(-10);
    return cleaned ? `+91 ${cleaned}` : 'N/A';
  };

  // Open Right Slide-Over Sheet for a selected lead
  const handleOpenLeadSheet = (lead: any) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
    setEditPhone(lead.phone || '');
    setEditEmail(lead.email || '');

    if (activeTab === 'workers') {
      const candidateRawName = lead.full_name || lead.profile_name || lead.name || '';
      const isFallbackName = !candidateRawName || candidateRawName.startsWith('Candidate ') || candidateRawName === 'Registered Candidate' || candidateRawName === 'Worker Candidate' || candidateRawName === 'Verified Worker';
      setEditName(isFallbackName ? '' : candidateRawName);
      setEditAge(lead.age ? String(lead.age) : '20');
      setEditGender(lead.gender || 'Female');
      setEditSkills(Array.isArray(lead.skills) ? lead.skills : []);
      setEditSalary(lead.expected_salary ? String(lead.expected_salary) : '20000');
      setEditExperience(lead.experience_years ? String(lead.experience_years) : '0');
      setEditShiftSlot(lead.work_timing || lead.shift_slot || 'Full Day (8–12 Hours)');
      setEditBio(lead.bio || '');
      setEditSociety(lead.primary_gated_society || '');
      setEditSecondarySociety(lead.secondary_gated_society || '');

      const parsedLangs = Array.isArray(lead.languages_spoken) 
        ? lead.languages_spoken 
        : (typeof lead.languages_spoken === 'string' ? lead.languages_spoken.split(',').map((s: string) => s.trim()) : ['Hindi']);
      setEditLanguages(parsedLangs.length > 0 ? parsedLangs : ['Hindi']);
    } else {
      const employerRawName = lead.company_name || lead.profile_name || lead.name || '';
      const isFallbackEmp = !employerRawName || employerRawName === 'Employer' || employerRawName === 'Household Owner';
      setEditName(isFallbackEmp ? '' : employerRawName);
      setEditSociety(lead.society_name || '');
      setEditTower(lead.tower_block || '');
      setEditFlat(lead.address || '');
      setEditAlternatePhone(lead.alternate_phone || '');
      setEditCity(lead.city || '');
      setEditState(lead.state || '');
      setEditPincode(lead.pincode || '');
      setEditGstin(lead.gstin || '');
      setEditVerificationReq(lead.verification_requirement || 'Aadhaar Card + Police Background Audit Required (Recommended)');
    }
  };

  // Save Lead Updates
  const handleSaveLead = async () => {
    if (!selectedLead) return;
    setSavingLead(true);
    try {
      if (activeTab === 'workers') {
        const res = await fetch('/api/admin/worker/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedLead.id,
            full_name: editName,
            age: editAge ? Number(editAge) : null,
            gender: editGender,
            skills: editSkills,
            expected_salary: editSalary ? Number(editSalary) : null,
            experience_years: editExperience ? Number(editExperience) : 0,
            work_timing: editShiftSlot,
            bio: editBio,
            languages_spoken: editLanguages,
            primary_gated_society: editSociety,
            secondary_gated_society: editSecondarySociety,
            status: 'admin_interview'
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to save worker lead');
        showToast("Worker candidate profile saved & updated!", "success");
      } else {
        const res = await fetch('/api/admin/employer/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedLead.id,
            company_name: editName,
            society_name: editSociety,
            tower_block: editTower,
            address: editFlat,
            alternate_phone: editAlternatePhone,
            city: editCity,
            state: editState,
            pincode: editPincode,
            gstin: editGstin,
            verification_requirement: editVerificationReq,
            status: selectedLead.status || 'pending_review'
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to save employer lead');
        showToast("Employer details & uploaded verification documents saved successfully!", "success");
      }
      setIsSheetOpen(false);
      fetchPaginatedLeads(page, activeTab);
    } catch (err: any) {
      showToast(err.message || 'Error saving lead', 'error');
    } finally {
      setSavingLead(false);
    }
  };

  // Switch Role (Worker <-> Employer)
  const handleSwitchUserRole = async () => {
    if (!selectedLead) return;
    const targetRole = activeTab === 'workers' ? 'employer' : 'worker';
    const confirmMsg = `Are you sure you want to switch ${selectedLead.name || selectedLead.phone} from ${activeTab === 'workers' ? 'Worker' : 'Employer'} to ${targetRole.toUpperCase()}?`;
    if (!confirm(confirmMsg)) return;

    setSwitchingRole(true);
    try {
      const res = await fetch('/api/admin/user/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedLead.id, targetRole })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed switching role');

      showToast(`Successfully switched user to ${targetRole.toUpperCase()}!`, "success");
      setIsSheetOpen(false);
      fetchPaginatedLeads(page, activeTab);
    } catch (err: any) {
      showToast(err.message || 'Error switching role', 'error');
    } finally {
      setSwitchingRole(false);
    }
  };

  // Send 1-Click Upload SMS Link
  const handleSendUploadSms = async () => {
    if (!selectedLead?.phone) return;
    try {
      const res = await fetch('/api/admin/worker/send-upload-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedLead.id, phone: selectedLead.phone })
      });
      const data = await res.json();
      if (data.success) {
        setSmsSent(true);
        showToast(`1-Click Document Upload Link sent to ${formatPhone(selectedLead.phone)}!`, 'success');
        setTimeout(() => setSmsSent(false), 4000);
      }
    } catch (err: any) {
      showToast('Failed to send SMS link', 'error');
    }
  };

  // Direct WhatsApp File Upload
  const handleAdminDirectUpload = async (assetType: string, file: File) => {
    if (!selectedLead) return;
    setUploadingAsset(assetType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', selectedLead.id);
      formData.append('assetType', assetType);

      const res = await fetch('/api/admin/worker/upload-asset', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.publicUrl) {
        selectedLead[assetType] = data.publicUrl;
        showToast("Document uploaded successfully from WhatsApp!", "success");
      }
    } catch (err) {
      showToast("Error uploading file", "error");
    } finally {
      setUploadingAsset(null);
    }
  };

  const masterServices = [
    { label: 'Cook / Chef', icon: '🍳' },
    { label: 'Housekeeping / Maid', icon: '🧹' },
    { label: 'Childcare / Nanny', icon: '👶' },
    { label: 'Elder Care', icon: '👵' },
    { label: 'Family Driver', icon: '🚘' },
    { label: 'Pet Care', icon: '🐶' },
    { label: 'All Rounder / Multi-tasker', icon: '🛠️' },
    { label: 'Laundry & Ironing', icon: '👕' },
    { label: 'Gardener', icon: '🪴' },
    { label: 'Security Guard', icon: '🛡️' },
  ];

  const masterLanguages = [
    'Hindi', 'English', 'Hinglish', 'Kannada', 'Tamil', 'Telugu', 
    'Assamese', 'Nepali', 'Bengali', 'Marathi', 'Malayalam', 'Odia', 'Gujarati', 'Punjabi'
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl pb-16">
      
      {/* 👑 HEADER BANNER */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <PhoneCall className="text-[#1A73E8]" size={22} />
              <span>Telephonic Onboarding &amp; Lead Conversion Hub</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Call freshly registered OTP leads, complete their profiles over phone, switch roles, or dispatch 1-Click SMS links.
            </p>
          </div>
          <button
            onClick={() => fetchPaginatedLeads(page, activeTab)}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Leads
          </button>
        </div>

        {/* Category Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('workers'); setPage(1); }}
              className={`py-2 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'workers'
                  ? 'bg-[#1A73E8] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users size={15} />
              <span>👷 Worker Candidates ({workerLeads.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('employers'); setPage(1); }}
              className={`py-2 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'employers'
                  ? 'bg-[#34A853] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building size={15} />
              <span>🏡 Household Employers ({employerLeads.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 text-slate-400" size={14} />
            <input
              type="text"
              placeholder={`Search ${activeTab} leads...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#1A73E8]"
            />
          </div>
        </div>
      </div>

      {/* PAGINATED LEADS GRID */}
      {loading ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center space-y-3 shadow-2xs">
          <Loader2 size={32} className="text-[#1A73E8] animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">Fetching Paginated Leads...</h4>
        </div>
      ) : currentLeads.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center space-y-3 shadow-2xs">
          <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">Zero Pending Dropped Leads on Page {page}!</h4>
          <p className="text-xs text-slate-400 font-medium">All registered {activeTab} leads on this page have completed setup or been activated.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => handleOpenLeadSheet(lead)}
                className="bg-white p-5 rounded-3xl border border-slate-200/90 hover:border-[#1A73E8] shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer group relative"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    {(lead.status === 'approved' || lead.status === 'active' || lead.status === 'live' || lead.status === 'completed') ? (
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block">
                        ✓ Verified Lead
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 inline-block">
                        ⚡ Incomplete Lead (OTP Verified)
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#1A73E8] transition-colors">
                      {lead.company_name || lead.name || lead.full_name || 'Registered Lead'}
                    </h4>
                    <p className="text-xs font-mono font-bold text-[#1A73E8]">
                      {formatPhone(lead.phone)}
                    </p>
                  </div>

                  <a
                    href={`tel:${lead.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xs transition-transform active:scale-95 flex items-center gap-1 text-xs font-bold"
                  >
                    <PhoneCall size={13} /> Call
                  </a>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold border-t border-slate-100 pt-2.5">
                  <span className="truncate max-w-[150px]">
                    Society: {lead.primary_gated_society || lead.society_name || 'Not logged'}
                  </span>
                  <span className="text-[#1A73E8] font-bold group-hover:translate-x-0.5 transition-transform">
                    Start Tele-Interview ➔
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION CONTROLS FOOTER */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-semibold text-slate-600">
              Showing Page <span className="font-bold text-slate-900">{page}</span> ({currentLeads.length} leads loaded)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} /> Previous Page
              </button>

              <button
                disabled={currentLeads.length < limit || loading}
                onClick={() => setPage(p => p + 1)}
                className="py-2 px-3 bg-[#1A73E8] hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                Next Page <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👑 RIGHT-SIDE OVERLAY SHEET */}
      {isSheetOpen && selectedLead && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-fade-in">
          {/* Soft Backdrop */}
          <div 
            onClick={() => setIsSheetOpen(false)} 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity cursor-pointer" 
          />

          {/* Right-Side Overlay Sheet Content */}
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 p-6 sm:p-7 space-y-5 flex flex-col justify-between overflow-y-auto z-10 animate-slide-in-right">
            
            <div className="space-y-5">
              {/* Sheet Top Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Active Telephonic Onboarding Interview</span>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>{editName || selectedLead.company_name || selectedLead.full_name || selectedLead.profile_name || 'Unnamed Lead'}</span>
                    <span className="text-xs font-mono font-bold text-[#1A73E8] bg-blue-50 px-2.5 py-0.5 rounded-xl border border-blue-200">
                      {formatPhone(editPhone)}
                    </span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={switchingRole}
                    onClick={handleSwitchUserRole}
                    className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Repeat size={13} className={switchingRole ? 'animate-spin' : ''} />
                    <span>Switch Role to {activeTab === 'workers' ? 'Employer 🏡' : 'Worker 👷'}</span>
                  </button>

                  <button
                    onClick={() => setIsSheetOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Quick Action Dialing & SMS Bar */}
              <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                <a
                  href={`tel:${editPhone}`}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <PhoneCall size={14} /> <span>Call Lead Now ({formatPhone(editPhone)})</span>
                </a>

                <button
                  type="button"
                  onClick={handleSendUploadSms}
                  className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>{smsSent ? 'SMS Upload Link Sent ✓' : 'Send 1-Click Upload SMS Link'}</span>
                </button>
              </div>

              {/* FORM INPUTS & VERIFICATION VAULT */}
              {activeTab === 'workers' ? (
                /* WORKER CANDIDATE PROFILE FORM MATCHING USER SCREENSHOTS */
                <div className="space-y-5 text-xs font-medium text-slate-700">
                  
                  {/* 1. Full Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter Full Name (e.g. Pooja Sharma)"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8]"
                    />
                  </div>

                  {/* 2. Primary Mobile & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Primary Mobile Number</label>
                      <input
                        type="text"
                        disabled
                        value={formatPhone(editPhone)}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Primary Email Address (Optional)</label>
                      <input
                        type="text"
                        disabled
                        value={editEmail || 'Not provided'}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* 3. Gender & Age */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Gender</label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8]"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Age (Years)</label>
                      <input
                        type="number"
                        value={editAge}
                        onChange={(e) => setEditAge(e.target.value)}
                        placeholder="20"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8]"
                      />
                    </div>
                  </div>

                  {/* 4. Expected Salary & Total Experience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Expected Salary (₹/month)</label>
                      <input
                        type="number"
                        value={editSalary}
                        onChange={(e) => setEditSalary(e.target.value)}
                        placeholder="e.g. 20000"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Total Experience</label>
                      <select
                        value={editExperience}
                        onChange={(e) => setEditExperience(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8]"
                      >
                        <option value="0">0 Years (Fresher)</option>
                        <option value="1">1 Year</option>
                        <option value="2">2 Years</option>
                        <option value="3">3 Years</option>
                        <option value="5">5+ Years</option>
                        <option value="10">10+ Years (Senior Expert)</option>
                      </select>
                    </div>
                  </div>

                  {/* 5. Preferred Shift Slot */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                      <Clock size={12} className="text-[#1A73E8]" />
                      <span>Preferred Shift Slot</span>
                    </label>
                    <select
                      value={editShiftSlot}
                      onChange={(e) => setEditShiftSlot(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8]"
                    >
                      <option value="Full Day (8–12 Hours)">Full Day (8–12 Hours)</option>
                      <option value="Part Time (2–4 Hours)">Part Time (2–4 Hours)</option>
                      <option value="Live-In (24 Hours)">Live-In (24 Hours)</option>
                      <option value="Morning Shift (6 AM – 12 PM)">Morning Shift (6 AM – 12 PM)</option>
                      <option value="Evening Shift (4 PM – 9 PM)">Evening Shift (4 PM – 9 PM)</option>
                    </select>
                  </div>

                  {/* 6. About Me / Bio */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">About Me / Bio</label>
                    <textarea
                      rows={2}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Write a brief introduction about experience, punctuality, and work ethic..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8] leading-relaxed"
                    />
                  </div>

                  {/* 7. Primary & Secondary Gated Societies (Both Searchable & Scrollable Dropdowns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Primary Society */}
                    <div className="space-y-1 relative">
                      <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                        <span>Primary Gated Society</span>
                        {editSociety && <span className="text-[9px] text-[#1A73E8] font-bold">Assigned ✓</span>}
                      </label>
                      <input
                        type="text"
                        value={editSociety}
                        onFocus={() => setShowPrimarySocietyMenu(true)}
                        onChange={(e) => {
                          setEditSociety(e.target.value);
                          setShowPrimarySocietyMenu(true);
                        }}
                        placeholder="Search primary society..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8]"
                      />

                      {showPrimarySocietyMenu && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-up">
                          <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-[10px] font-bold text-slate-500">
                            <span>Primary Society ({allSocieties.length} Total)</span>
                            <button type="button" onClick={() => setShowPrimarySocietyMenu(false)} className="text-slate-400 hover:text-slate-700">✕ Close</button>
                          </div>

                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 text-xs">
                            {allSocieties
                              .filter(s => (s.name || '').toLowerCase().includes(editSociety.toLowerCase()) || (s.locality || '').toLowerCase().includes(editSociety.toLowerCase()))
                              .slice(0, 50)
                              .map((soc, idx) => (
                                <button
                                  key={soc.id || idx}
                                  type="button"
                                  onClick={() => {
                                    setEditSociety(soc.name);
                                    setShowPrimarySocietyMenu(false);
                                  }}
                                  className="w-full p-2.5 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group cursor-pointer"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800 group-hover:text-[#1A73E8] block">{soc.name}</span>
                                    <span className="text-[10px] text-slate-400">{soc.locality || soc.city || 'Gated Society'}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#1A73E8]">Assign ➔</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Secondary Society */}
                    <div className="space-y-1 relative">
                      <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                        <span>Secondary Gated Society</span>
                        {editSecondarySociety && <span className="text-[9px] text-[#1A73E8] font-bold">Assigned ✓</span>}
                      </label>
                      <input
                        type="text"
                        value={editSecondarySociety}
                        onFocus={() => setShowSecondarySocietyMenu(true)}
                        onChange={(e) => {
                          setEditSecondarySociety(e.target.value);
                          setShowSecondarySocietyMenu(true);
                        }}
                        placeholder="Search secondary society..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8]"
                      />

                      {showSecondarySocietyMenu && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-up">
                          <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-[10px] font-bold text-slate-500">
                            <span>Secondary Society ({allSocieties.length} Total)</span>
                            <button type="button" onClick={() => setShowSecondarySocietyMenu(false)} className="text-slate-400 hover:text-slate-700">✕ Close</button>
                          </div>

                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 text-xs">
                            {allSocieties
                              .filter(s => (s.name || '').toLowerCase().includes(editSecondarySociety.toLowerCase()) || (s.locality || '').toLowerCase().includes(editSecondarySociety.toLowerCase()))
                              .slice(0, 50)
                              .map((soc, idx) => (
                                <button
                                  key={soc.id || idx}
                                  type="button"
                                  onClick={() => {
                                    setEditSecondarySociety(soc.name);
                                    setShowSecondarySocietyMenu(false);
                                  }}
                                  className="w-full p-2.5 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group cursor-pointer"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800 group-hover:text-[#1A73E8] block">{soc.name}</span>
                                    <span className="text-[10px] text-slate-400">{soc.locality || soc.city || 'Gated Society'}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#1A73E8]">Assign ➔</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 8. Work Services (Skills) Chips with Icons */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                      <Briefcase size={12} className="text-[#1A73E8]" />
                      <span>Work Services (Select All That Apply)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {masterServices.map(svc => {
                        const isSelected = editSkills.includes(svc.label);
                        return (
                          <button
                            key={svc.label}
                            type="button"
                            onClick={() => {
                              if (isSelected) setEditSkills(editSkills.filter(s => s !== svc.label));
                              else setEditSkills([...editSkills, svc.label]);
                            }}
                            className={`px-3 py-2 rounded-2xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 text-[#1A73E8] border-2 border-[#1A73E8] shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{svc.icon}</span>
                            <span>{svc.label}</span>
                            {isSelected && <CheckCircle2 size={13} className="text-[#1A73E8] ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 9. Spoken Languages Chips */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Spoken Languages</label>
                    <div className="flex flex-wrap gap-1.5">
                      {masterLanguages.map(lang => {
                        const isSelected = editLanguages.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              if (isSelected) setEditLanguages(editLanguages.filter(l => l !== lang));
                              else setEditLanguages([...editLanguages, lang]);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1A73E8] text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}{lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 10. Worker Verification Vault (3 Documents + 1 Intro Video) */}
                  <div className="bg-[#F8F9FA] p-4 rounded-2xl border border-slate-200/80 space-y-3 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-700 tracking-wider">📁 Candidate Verification Assets (3 Documents &amp; 1 Intro Video)</span>
                      <span className="text-[9.5px] font-bold text-[#1A73E8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {([selectedLead.profile_picture_url, selectedLead.aadhaar_front_url, selectedLead.aadhaar_back_url, selectedLead.video_url].filter(Boolean).length)} / 4 Uploaded
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* 1. Selfie */}
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between text-center space-y-2 relative overflow-hidden group">
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">Selfie Photo</span>
                        {selectedLead.profile_picture_url ? (
                          <div 
                            onClick={() => setPreviewMedia({ url: selectedLead.profile_picture_url, title: `${editName || 'Candidate'} - Selfie Photo`, type: 'image' })}
                            className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                          >
                            <img src={selectedLead.profile_picture_url} alt="Selfie" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                              <FileText size={12} /> Inspect
                            </div>
                          </div>
                        ) : (
                          <div className="h-16 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-[9.5px] font-medium text-slate-400 italic">Not Uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* 2. Aadhaar Front */}
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between text-center space-y-2 relative overflow-hidden group">
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">Aadhaar Front</span>
                        {selectedLead.aadhaar_front_url ? (
                          <div 
                            onClick={() => setPreviewMedia({ url: selectedLead.aadhaar_front_url, title: `${editName || 'Candidate'} - Aadhaar Front Card`, type: 'image' })}
                            className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                          >
                            <img src={selectedLead.aadhaar_front_url} alt="Aadhaar Front" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                              <FileText size={12} /> Inspect
                            </div>
                          </div>
                        ) : (
                          <div className="h-16 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-[9.5px] font-medium text-slate-400 italic">Not Uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* 3. Aadhaar Back */}
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between text-center space-y-2 relative overflow-hidden group">
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">Aadhaar Back</span>
                        {selectedLead.aadhaar_back_url ? (
                          <div 
                            onClick={() => setPreviewMedia({ url: selectedLead.aadhaar_back_url, title: `${editName || 'Candidate'} - Aadhaar Back Card`, type: 'image' })}
                            className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                          >
                            <img src={selectedLead.aadhaar_back_url} alt="Aadhaar Back" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                              <FileText size={12} /> Inspect
                            </div>
                          </div>
                        ) : (
                          <div className="h-16 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-[9.5px] font-medium text-slate-400 italic">Not Uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* 4. Intro Video */}
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between text-center space-y-2 relative overflow-hidden group">
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">15s Intro Video</span>
                        {selectedLead.video_url ? (
                          <div 
                            onClick={() => setPreviewMedia({ url: selectedLead.video_url, title: `${editName || 'Candidate'} - 15s Intro Video`, type: 'video' })}
                            className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex flex-col items-center justify-center text-white space-y-1 shadow-2xs"
                          >
                            <span className="w-8 h-8 rounded-full bg-[#1A73E8] flex items-center justify-center font-bold text-xs shadow-md">▶</span>
                            <span className="text-[9px] font-bold text-blue-200">Play Video</span>
                          </div>
                        ) : (
                          <div className="h-16 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-[9.5px] font-medium text-slate-400 italic">Not Uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Direct Upload */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">💬 WhatsApp Direct Photo &amp; Video Reception</span>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Attach files received on official WhatsApp (+91 7096093039):
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'profile_picture_url' ? 'Uploading...' : '+ Selfie'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleAdminDirectUpload('profile_picture_url', e.target.files[0])} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'aadhaar_front_url' ? 'Uploading...' : '+ Aadhaar Front'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleAdminDirectUpload('aadhaar_front_url', e.target.files[0])} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'aadhaar_back_url' ? 'Uploading...' : '+ Aadhaar Back'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleAdminDirectUpload('aadhaar_back_url', e.target.files[0])} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-blue-50 text-[#1A73E8] rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'video_url' ? 'Uploading...' : '🎥 + Intro Video'}</span>
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files && handleAdminDirectUpload('video_url', e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* EMPLOYER HOUSEHOLD PROFILE FORM */
                <div className="space-y-5 text-xs font-medium text-slate-700">
                  
                  {/* Employer Name, Mobile & Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Employer Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Sharma House"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#34A853]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Primary 10-Digit Mobile</label>
                      <input
                        type="text"
                        disabled
                        value={formatPhone(editPhone)}
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Alternate / Family Contact Phone (Optional)</label>
                      <input
                        type="text"
                        value={editAlternatePhone}
                        onChange={(e) => setEditAlternatePhone(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#34A853]"
                      />
                    </div>
                  </div>

                  {/* Gated Society & Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1 relative">
                      <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                        <span>Gated Society Name</span>
                        {editSociety && <span className="text-[9px] text-[#34A853] font-bold">Assigned ✓</span>}
                      </label>
                      <input
                        type="text"
                        value={editSociety}
                        onFocus={() => setShowPrimarySocietyMenu(true)}
                        onChange={(e) => {
                          setEditSociety(e.target.value);
                          setShowPrimarySocietyMenu(true);
                        }}
                        placeholder="Search or select society to assign..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#34A853]"
                      />

                      {showPrimarySocietyMenu && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-up">
                          <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60 text-[10px] font-bold text-emerald-900">
                            <span>Select Society ({allSocieties.length} Total)</span>
                            <button type="button" onClick={() => setShowPrimarySocietyMenu(false)} className="text-slate-400 hover:text-slate-700">✕ Close</button>
                          </div>

                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 text-xs">
                            {allSocieties
                              .filter(s => (s.name || '').toLowerCase().includes(editSociety.toLowerCase()) || (s.locality || '').toLowerCase().includes(editSociety.toLowerCase()))
                              .slice(0, 50)
                              .map((soc, idx) => (
                                <button
                                  key={soc.id || idx}
                                  type="button"
                                  onClick={() => {
                                    setEditSociety(soc.name);
                                    setShowPrimarySocietyMenu(false);
                                  }}
                                  className="w-full p-2.5 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between group cursor-pointer"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800 group-hover:text-[#34A853] block">{soc.name}</span>
                                    <span className="text-[10px] text-slate-400">{soc.locality || 'NCR'}, {soc.city || 'Noida'}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#34A853]">Assign ➔</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Tower / Building Block</label>
                      <input
                        type="text"
                        value={editTower}
                        onChange={(e) => setEditTower(e.target.value)}
                        placeholder="e.g. Tower 4 / Block B"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#34A853]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Flat / Apartment Door Number &amp; Address</label>
                    <input
                      type="text"
                      value={editFlat}
                      onChange={(e) => setEditFlat(e.target.value)}
                      placeholder="e.g. Flat 402, 4th Floor"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#34A853]"
                    />
                  </div>

                  {/* City, State, Pincode */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">City</label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="Kolkata"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#34A853]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">State</label>
                      <input
                        type="text"
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        placeholder="West Bengal"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#34A853]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Pincode</label>
                      <input
                        type="text"
                        value={editPincode}
                        onChange={(e) => setEditPincode(e.target.value)}
                        placeholder="700001"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#34A853]"
                      />
                    </div>
                  </div>

                  {/* Tax GSTIN & Verification Requirement */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">GSTIN / TAX ID (Optional for GST Business Invoice)</label>
                    <input
                      type="text"
                      value={editGstin}
                      onChange={(e) => setEditGstin(e.target.value)}
                      placeholder="e.g. 19AAAAA0000A1Z5"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#34A853]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold">Preferred Candidate Verification Requirement</label>
                    <select
                      value={editVerificationReq}
                      onChange={(e) => setEditVerificationReq(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#34A853]"
                    >
                      <option value="Aadhaar Card + Police Background Audit Required (Recommended)">Aadhaar Card + Police Background Audit Required (Recommended)</option>
                      <option value="Aadhaar Card Verification Only">Aadhaar Card Verification Only</option>
                      <option value="Full Police Background Audit + Previous Employer Verification">Full Police Background Audit + Previous Employer Verification</option>
                    </select>
                  </div>

                  {/* Employer Verification Vault (Selfie, Aadhaar Front, Aadhaar Back, Society Residency Proof) */}
                  <div className="bg-[#F8F9FA] p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-700 tracking-wider">📁 Employer Household Residency &amp; Verification Vault</span>
                      <span className="text-[9.5px] font-bold text-[#34A853] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {([selectedLead.avatar_url || selectedLead.profile_picture_url, selectedLead.aadhaar_front_url, selectedLead.aadhaar_back_url, selectedLead.residency_proof_url].filter(Boolean).length)} / 4 Uploaded
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* 1. Employer Selfie */}
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between text-center space-y-2 relative overflow-hidden group">
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">Selfie Photo</span>
                        {(selectedLead.avatar_url || selectedLead.profile_picture_url) ? (
                          <div 
                            onClick={() => setPreviewMedia({ url: selectedLead.avatar_url || selectedLead.profile_picture_url, title: `${editName || 'Employer'} - Selfie Photo`, type: 'image' })}
                            className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                          >
                            <img src={selectedLead.avatar_url || selectedLead.profile_picture_url} alt="Employer Selfie" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                              <FileText size={12} /> Inspect
                            </div>
                          </div>
                        ) : (
                          <div className="h-16 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-[9.5px] font-medium text-slate-400 italic">Not Uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* 2. Aadhaar Front */}
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between text-center space-y-2 relative overflow-hidden group">
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">Aadhaar Front</span>
                        {selectedLead.aadhaar_front_url ? (
                          <div 
                            onClick={() => setPreviewMedia({ url: selectedLead.aadhaar_front_url, title: `${editName || 'Employer'} - Aadhaar Front Card`, type: 'image' })}
                            className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                          >
                            <img src={selectedLead.aadhaar_front_url} alt="Aadhaar Front" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                              <FileText size={12} /> Inspect
                            </div>
                          </div>
                        ) : (
                          <div className="h-16 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-[9.5px] font-medium text-slate-400 italic">Not Uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* 3. Aadhaar Back */}
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between text-center space-y-2 relative overflow-hidden group">
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">Aadhaar Back</span>
                        {selectedLead.aadhaar_back_url ? (
                          <div 
                            onClick={() => setPreviewMedia({ url: selectedLead.aadhaar_back_url, title: `${editName || 'Employer'} - Aadhaar Back Card`, type: 'image' })}
                            className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                          >
                            <img src={selectedLead.aadhaar_back_url} alt="Aadhaar Back" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                              <FileText size={12} /> Inspect
                            </div>
                          </div>
                        ) : (
                          <div className="h-16 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-[9.5px] font-medium text-slate-400 italic">Not Uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* 4. Society Residency Proof */}
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between text-center space-y-2 relative overflow-hidden group">
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">Residency Proof</span>
                        {selectedLead.residency_proof_url ? (
                          <div 
                            onClick={() => setPreviewMedia({ url: selectedLead.residency_proof_url, title: `${editName || 'Employer'} - Society Residency Proof`, type: 'image' })}
                            className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                          >
                            <img src={selectedLead.residency_proof_url} alt="Residency Proof" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                              <FileText size={12} /> Inspect
                            </div>
                          </div>
                        ) : (
                          <div className="h-16 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-[9.5px] font-medium text-slate-400 italic">Not Uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Direct Upload for Employer */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">💬 WhatsApp Direct Document Reception</span>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Attach residency proof, selfie, or Aadhaar received on official WhatsApp (+91 7096093039):
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'profile_picture_url' ? 'Uploading...' : '+ Selfie'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleAdminDirectUpload('profile_picture_url', e.target.files[0])} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'aadhaar_front_url' ? 'Uploading...' : '+ Aadhaar Front'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleAdminDirectUpload('aadhaar_front_url', e.target.files[0])} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'aadhaar_back_url' ? 'Uploading...' : '+ Aadhaar Back'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleAdminDirectUpload('aadhaar_back_url', e.target.files[0])} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'residency_proof_url' ? 'Uploading...' : '🏡 + Residency Proof'}</span>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files && handleAdminDirectUpload('residency_proof_url', e.target.files[0])} />
                      </label>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Sheet Bottom Save Bar */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={savingLead}
                onClick={handleSaveLead}
                className="py-3 px-6 bg-[#1A73E8] hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingLead ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Tele-Interview...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Telephonic Setup &amp; Documents</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MEDIA PREVIEW LIGHTBOX MODAL */}
      {previewMedia && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[110] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-2xl w-full shadow-2xl space-y-3 border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">{previewMedia.title}</h3>
              <button 
                onClick={() => setPreviewMedia(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-2 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-hidden">
              {previewMedia.type === 'video' ? (
                <video 
                  src={previewMedia.url} 
                  controls 
                  autoPlay 
                  className="max-h-[65vh] w-auto rounded-xl object-contain" 
                />
              ) : (
                <img 
                  src={previewMedia.url} 
                  alt={previewMedia.title} 
                  className="max-h-[65vh] w-auto rounded-xl object-contain" 
                />
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewMedia(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
