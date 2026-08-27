"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdminDashboard } from '../layout';
import { 
  PhoneCall, Users, ShieldCheck, Search, RefreshCw, MessageSquare, 
  ArrowRight, CheckCircle2, UserCheck, AlertTriangle, Building, MapPin, 
  FileText, ShieldAlert, Sparkles, X, Loader2, Save, Repeat, Home,
  ChevronLeft, ChevronRight, Clock, Briefcase, Calendar, XCircle
} from 'lucide-react';
import { useAdminData, prefetchAdminData, invalidateAdminCache } from '@/hooks/useAdminData';
import { formatWorkerShift, ALL_SHIFT_OPTIONS, normalizeShiftOption } from '@/utils/formatWorkerShift';
import { resolveMediaUrl } from '@/utils/resolveMediaUrl';
import { usePrivateUrl } from '@/hooks/usePrivateUrl';
import { webApiClient } from '@/lib/webApiClient';

const getAdminId = () => {
  if (typeof window === 'undefined') return 'admin_default';
  let id = sessionStorage.getItem('sevikaa_admin_session_id');
  if (!id) {
    id = 'admin_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('sevikaa_admin_session_id', id);
  }
  return id;
};

const getAdminName = () => {
  if (typeof window === 'undefined') return 'Admin';
  let name = localStorage.getItem('admin_display_name') || sessionStorage.getItem('admin_display_name');
  if (!name) {
    try {
      const uStr = localStorage.getItem('sevikaa_user') || sessionStorage.getItem('sevikaa_user');
      if (uStr) {
        const u = JSON.parse(uStr);
        name = u.full_name || u.name || u.user_metadata?.full_name || u.email?.split('@')[0];
      }
    } catch (e) {}
  }
  if (!name) {
    name = 'Admin ' + getAdminId().slice(-4).toUpperCase();
  }
  return name;
};

const MediaPreviewImage: React.FC<{ url: string; title: string }> = ({ url, title }) => {
  const { url: signedUrl } = usePrivateUrl(url);
  const displayUrl = signedUrl || resolveMediaUrl('worker-documents', url);

  return (
    <img 
      src={displayUrl || undefined} 
      alt={title} 
      className="max-h-[70vh] w-auto rounded-xl object-contain" 
    />
  );
};

const MediaThumbnail: React.FC<{ url?: string; bucket: string; alt: string; className?: string }> = ({ url, bucket, alt, className = "w-full h-full object-cover" }) => {
  const { url: signedUrl } = usePrivateUrl(url);
  const displayUrl = signedUrl || resolveMediaUrl(bucket, url);

  if (!displayUrl) return null;

  return (
    <img 
      src={displayUrl} 
      alt={alt} 
      className={className} 
    />
  );
};

export default function TeleOnboardingPage() {
  const { showToast } = useAdminDashboard();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'workers' | 'employers' | 'interviews'>('workers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [interviewSubFilter, setInterviewSubFilter] = useState<'all' | 'today' | 'tomorrow'>('all');

  // MULTI-ADMIN LEAD LOCKS & SHARED CALL NOTES STATES
  const [activeLocks, setActiveLocks] = useState<Record<string, { admin_id: string; admin_name: string; expires_at: string }>>({});
  const [sharedNotes, setSharedNotes] = useState<any[]>([]);
  const [loadingSharedNotes, setLoadingSharedNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newCallOutcome, setNewCallOutcome] = useState('connected');
  const [addingNote, setAddingNote] = useState(false);

  // Poll active locks with smart frequency (8s when sheet is open, 25s when closed; paused when tab hidden)
  useEffect(() => {
    const pollLocks = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const data = await webApiClient.get('/api/admin/lead-lock');
        if (data && data.success && Array.isArray(data.locks)) {
          const map: Record<string, any> = {};
          data.locks.forEach((l: any) => { map[l.lead_id] = l; });
          setActiveLocks(map);
        }
      } catch (err) {
        console.warn("Poll locks error:", err);
      }
    };
    pollLocks();
    const interval = setInterval(pollLocks, isSheetOpen ? 8000 : 25000);
    return () => clearInterval(interval);
  }, [isSheetOpen]);

  // PAGINATION & SWR CACHING STATES
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [employersList, setEmployersList] = useState<any[]>([]);
  const [interviewsList, setInterviewsList] = useState<any[]>([]);

  // Current page cache key & Next page prefetch key
  const currentKey = `tele_onboarding_p${page}_l${limit}`;
  const nextKey = `tele_onboarding_p${page + 1}_l${limit}`;

  const fetchLeadsForPage = async (p: number) => {
    const { webApiClient } = await import('@/lib/webApiClient');
    return await webApiClient.get(`/api/admin/data?tab=tele-onboarding&page=${p}&limit=${limit}`);
  };

  const { data: pageData, loading, mutate: mutateCurrentPage } = useAdminData(
    currentKey,
    () => fetchLeadsForPage(page),
    {
      prefetchNextKey: nextKey,
      prefetchNextFetcher: () => fetchLeadsForPage(page + 1)
    }
  );

  useEffect(() => {
    if (pageData && pageData.success) {
      setWorkersList(pageData.workers || []);
      setEmployersList(pageData.employers || []);
      setInterviewsList(pageData.interviews || []);
    }
  }, [pageData]);

  const fetchPaginatedLeads = async (targetPage = page) => {
    invalidateAdminCache(`tele_onboarding_p${targetPage}`);
    mutateCurrentPage();
  };

  // Form states for editing lead inside Right Slide-Over Sheet
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editSalary, setEditSalary] = useState('');
  const [editExperience, setEditExperience] = useState('0');
  const [editShiftSlot, setEditShiftSlot] = useState('Full Day (8–12 Hours)');
  const [editBio, setEditBio] = useState('');
  const [editSociety, setEditSociety] = useState('');
  const [editSecondarySociety, setEditSecondarySociety] = useState('');
  const [editSecondarySocieties, setEditSecondarySocieties] = useState<string[]>([]);
  const [secondarySearchQuery, setSecondarySearchQuery] = useState('');
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
  const [docVerState, setDocVerState] = useState<{
    aadhaar_front: boolean;
    aadhaar_back: boolean;
    residency: boolean;
    video: boolean;
    police: boolean;
  }>({ aadhaar_front: false, aadhaar_back: false, residency: false, video: false, police: false });

  const [previewMedia, setPreviewMedia] = useState<{ 
    url: string; 
    title: string; 
    type: 'image' | 'video';
    docKey?: 'aadhaar_front' | 'aadhaar_back' | 'residency' | 'video' | 'police';
  } | null>(null);

  // Call Status & Notes (persisted in localStorage)
  const CALL_STATUS_OPTIONS = [
    { value: 'not_called',    label: 'Not Called',      color: 'bg-slate-100 text-slate-600 border-slate-200' },
    { value: 'no_answer',     label: 'No Answer',       color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { value: 'called_back',   label: 'Callback Set',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'completed',     label: 'Completed ✓',     color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'wrong_number',  label: 'Wrong Number ✕',  color: 'bg-red-50 text-red-700 border-red-200' },
  ];
  const [callStatuses, setCallStatuses] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('tele_call_statuses') || '{}'); } catch { return {}; }
  });
  const [callNotes, setCallNotes] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('tele_call_notes') || '{}'); } catch { return {}; }
  });
  const [callStatusFilter, setCallStatusFilter] = useState<string>('all');
  const [editCallNotes, setEditCallNotes] = useState('');
  const [hidePassedLeads, setHidePassedLeads] = useState(false);

  const getCallStatus = (leadId: string) => callStatuses[leadId] || 'not_called';
  const getCallStatusMeta = (val: string) => CALL_STATUS_OPTIONS.find(o => o.value === val) || CALL_STATUS_OPTIONS[0];

  const setCallStatus = async (leadId: string, status: string) => {
    const updated = { ...callStatuses, [leadId]: status };
    setCallStatuses(updated);
    localStorage.setItem('tele_call_statuses', JSON.stringify(updated));

    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      await webApiClient.post('/api/admin/interview/note', { id: leadId, status, note: callNotes[leadId] || '' });
    } catch (e) {
      console.warn("DB status save notice:", e);
    }
  };

  const saveCallNote = async (leadId: string, note: string) => {
    const updated = { ...callNotes, [leadId]: note };
    setCallNotes(updated);
    localStorage.setItem('tele_call_notes', JSON.stringify(updated));

    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      await webApiClient.post('/api/admin/interview/note', { id: leadId, note, status: callStatuses[leadId] || '' });
    } catch (e) {
      console.warn("DB note save notice:", e);
    }
  };
  // Heartbeat & Sheet Lock Effect
  useEffect(() => {
    if (!selectedLead || !isSheetOpen) return;

    const adminId = getAdminId();
    const adminName = getAdminName();

    const acquireLock = async () => {
      try {
        await webApiClient.post('/api/admin/lead-lock', { lead_id: selectedLead.id, admin_id: adminId, admin_name: adminName });
      } catch (e) {
        console.warn("Acquire lock notice:", e);
      }
    };

    const fetchSharedNotes = async () => {
      setLoadingSharedNotes(true);
      try {
        const data = await webApiClient.get(`/api/admin/tele-notes?lead_id=${selectedLead.id}`);
        if (data && data.success) {
          setSharedNotes(data.notes || []);
        }
      } catch (e) {
        console.warn("Fetch notes notice:", e);
      } finally {
        setLoadingSharedNotes(false);
      }
    };

    acquireLock();
    fetchSharedNotes();

    const heartbeatTimer = setInterval(acquireLock, 20000);

    return () => {
      clearInterval(heartbeatTimer);
      webApiClient.delete(`/api/admin/lead-lock?lead_id=${selectedLead.id}&admin_id=${adminId}`).catch(() => {});
    };
  }, [selectedLead, isSheetOpen]);

  const handleAddSharedNote = async () => {
    if (!selectedLead || !newNoteText.trim()) return;
    setAddingNote(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/admin/tele-notes', {
        lead_id: selectedLead.id,
        admin_name: getAdminName(),
        note_text: newNoteText.trim(),
        call_outcome: newCallOutcome
      });
      if (data && data.success && data.note) {
        setSharedNotes(prev => [data.note, ...prev]);
        setNewNoteText('');
        showToast("✓ Shared call note logged!", "success");
      }
    } catch (e) {
      console.warn("Add shared note notice:", e);
    } finally {
      setAddingNote(false);
    }
  };

  // Master Societies List for searchable scrollable assignment
  const [allSocieties, setAllSocieties] = useState<any[]>([]);
  const [showPrimarySocietyMenu, setShowPrimarySocietyMenu] = useState(false);
  const [showSecondarySocietyMenu, setShowSecondarySocietyMenu] = useState(false);

  // Fetch societies list
  useEffect(() => {
    invalidateAdminCache('tele_onboarding');
    const fetchSocietiesList = async () => {
      try {
        const { webApiClient } = await import('@/lib/webApiClient');
        const data = await webApiClient.get('/api/societies');
        if (data && data.success && Array.isArray(data.societies)) {
          setAllSocieties(data.societies);
        }
      } catch (e) {
        console.warn("Societies fetch notice:", e);
      }
    };
    fetchSocietiesList();
  }, []);

  const refreshLeads = async () => {
    invalidateAdminCache(`tele_onboarding_p${page}`);
    mutateCurrentPage();
  };

  // Filter worker leads (Includes both incomplete & verified candidates)
  const workerLeads = workersList.filter(w => {
    const isPassed = Boolean(w.is_tele_onboarded || w.is_interview_verified || w.status === 'admin_interview' || w.status === 'approved' || w.status === 'active' || w.status === 'live');
    if (hidePassedLeads && isPassed) return false;
    const matchesSearch = (w.name || w.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (w.phone || '').includes(searchTerm);
    const matchesStatus = callStatusFilter === 'all' || getCallStatus(w.id) === callStatusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const aPassed = Boolean(a.is_tele_onboarded || a.is_interview_verified || a.status === 'admin_interview' || a.status === 'approved');
    const bPassed = Boolean(b.is_tele_onboarded || b.is_interview_verified || b.status === 'admin_interview' || b.status === 'approved');
    if (!aPassed && bPassed) return -1;
    if (aPassed && !bPassed) return 1;
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
    const matchesStatus = callStatusFilter === 'all' || getCallStatus(e.id) === callStatusFilter;
    return matchesSearch && matchesStatus;
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

  const isWorkerLead = (lead: any) => {
    if (!lead) return activeTab !== 'employers';
    if (lead.role === 'worker') return true;
    if (lead.role === 'employer') return false;
    if (activeTab === 'workers') return true;
    if (activeTab === 'employers') return false;
    if (lead.skills && Array.isArray(lead.skills) && lead.skills.length > 0) return true;
    if (lead.residency_proof_url || lead.verification_requirement || lead.tower_block || lead.billing_address || lead.society_name) return false;
    return (activeTab as string) !== 'employers';
  };

  // Open Right Slide-Over Sheet for a selected lead
  const handleOpenLeadSheet = (lead: any) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
    setSmsSent(false);
    setEditCallNotes(callNotes[lead.id] || '');
    setEditPhone(lead.phone || '');
    setEditEmail(lead.email || '');
    setEditAlternatePhone((lead.alternate_phone || lead.alt_phone || lead.emergency_contact || lead.emergencyContact || '').replace(/\D/g, '').slice(-10));
    setDocVerState({
      aadhaar_front: Boolean(lead.is_aadhaar_front_verified || lead.is_tele_onboarded),
      aadhaar_back: Boolean(lead.is_aadhaar_back_verified || lead.is_tele_onboarded),
      residency: Boolean(lead.is_residency_verified || lead.is_tele_onboarded),
      video: Boolean(lead.is_video_verified || lead.is_tele_onboarded),
      police: Boolean(lead.is_police_verified || lead.is_tele_onboarded)
    });

    if (isWorkerLead(lead)) {
      const candidateRawName = lead.full_name || lead.profile_name || lead.name || '';
      const isFallbackName = !candidateRawName || candidateRawName.startsWith('Candidate ') || candidateRawName === 'Registered Candidate' || candidateRawName === 'Worker Candidate' || candidateRawName === 'Verified Worker';
      setEditName(isFallbackName ? '' : candidateRawName);
      setEditAge(lead.age ? String(lead.age) : '');
      const rawGen = lead.gender ? (lead.gender.charAt(0).toUpperCase() + lead.gender.slice(1).toLowerCase()) : '';
      setEditGender(rawGen);
      const parseDbArray = (val: any): string[] => {
        if (Array.isArray(val)) return val.filter(Boolean);
        if (typeof val === 'string' && val.trim()) {
          const cleaned = val.replace(/^\{|\}$/g, '').replace(/"/g, '');
          return cleaned.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        return [];
      };

      const rawSkills = parseDbArray(lead.skills).length > 0 ? parseDbArray(lead.skills) : parseDbArray(lead.category);
      setEditSkills(rawSkills);
      setEditSalary(lead.expected_salary ? String(lead.expected_salary) : '');
      setEditExperience(lead.experience_years !== null && lead.experience_years !== undefined ? String(lead.experience_years) : '0');
      setEditShiftSlot(formatWorkerShift(lead.preferred_shift || lead.work_timing || lead.shift_slot, lead.availability_slots));
      setEditBio(lead.bio || '');
      const primarySocName = lead.primary_gated_society || lead.preferred_society_name || lead.society_name || lead.society || (Array.isArray(lead.preferred_areas) ? lead.preferred_areas[0] : '');
      const secSocName = lead.secondary_gated_society || lead.secondary_society_name || (Array.isArray(lead.preferred_areas) && lead.preferred_areas.length > 1 ? lead.preferred_areas.slice(1).join(', ') : '');
      setEditSociety(primarySocName || '');
      setEditSecondarySociety(secSocName || '');
      setSecondarySearchQuery('');

      const parsedSecList = secSocName 
        ? secSocName.split(',').map((s: string) => s.trim()).filter(Boolean) 
        : (Array.isArray(lead.preferred_areas) && lead.preferred_areas.length > 1 ? lead.preferred_areas.slice(1) : []);
      setEditSecondarySocieties(parsedSecList);

      const parsedLangs = parseDbArray(lead.languages_spoken);
      setEditLanguages(parsedLangs.length > 0 ? parsedLangs : ['Hindi']);
    } else {
      const employerRawName = lead.company_name || lead.profile_name || lead.name || '';
      const isFallbackEmp = !employerRawName || employerRawName === 'Employer' || employerRawName === 'Household Owner';
      setEditName(isFallbackEmp ? '' : employerRawName);
      setEditSociety(lead.society_name || '');
      setEditTower(lead.tower_block || '');
      setEditFlat(lead.address || '');
      setEditCity(lead.city || '');
      setEditState(lead.state || '');
      setEditPincode(lead.pincode || '');
      setEditGstin(lead.gstin || '');
      setEditVerificationReq(lead.verification_requirement || 'Aadhaar Card + Police Background Audit Required (Recommended)');
    }
  };

  const handleDirectDocVerificationToggle = async (docKey: string, isVerified: boolean) => {
    if (!selectedLead) return;
    setDocVerState(prev => ({ ...prev, [docKey]: isVerified }));
    
    const fieldMap: Record<string, string> = {
      aadhaar_front: 'is_aadhaar_front_verified',
      aadhaar_back: 'is_aadhaar_back_verified',
      residency: 'is_residency_verified',
      video: 'is_video_verified'
    };
    const dbField = fieldMap[docKey];
    if (dbField) {
      setSelectedLead((prev: any) => prev ? { ...prev, [dbField]: isVerified } : null);
    }

    try {
      const isWorker = isWorkerLead(selectedLead);
      const endpoint = isWorker ? '/api/admin/worker/update' : '/api/admin/employer/update';
      const bodyPayload = isWorker ? {
        userId: selectedLead.id,
        is_aadhaar_front_verified: docKey === 'aadhaar_front' ? isVerified : (selectedLead.is_aadhaar_front_verified || docVerState.aadhaar_front),
        is_aadhaar_back_verified: docKey === 'aadhaar_back' ? isVerified : (selectedLead.is_aadhaar_back_verified || docVerState.aadhaar_back),
        is_video_verified: docKey === 'video' ? isVerified : (selectedLead.is_video_verified || docVerState.video)
      } : {
        id: selectedLead.id,
        is_residency_verified: docKey === 'residency' ? isVerified : (selectedLead.is_residency_verified || docVerState.residency),
        is_aadhaar_front_verified: docKey === 'aadhaar_front' ? isVerified : (selectedLead.is_aadhaar_front_verified || docVerState.aadhaar_front),
        is_aadhaar_back_verified: docKey === 'aadhaar_back' ? isVerified : (selectedLead.is_aadhaar_back_verified || docVerState.aadhaar_back),
      };

      const { webApiClient } = await import('@/lib/webApiClient');
      await webApiClient.post(endpoint, bodyPayload);
      refreshLeads();
    } catch (err) {
      console.warn("Direct doc verification save warning:", err);
    }
  };

  // Save Lead Updates
  const handleSaveLead = async (isPassingTeleOnboarding: boolean = false) => {
    if (!selectedLead) return;
    const cleanAlt = editAlternatePhone ? editAlternatePhone.replace(/\D/g, '') : '';
    if (cleanAlt && cleanAlt.length !== 10) {
      showToast("Alternate / Family contact number must be exactly 10 digits if provided.", "error");
      return;
    }

    setSavingLead(true);
    try {
      if (isWorkerLead(selectedLead)) {
        const workerPayload: any = { userId: selectedLead.id };
        if (editName && editName.trim()) workerPayload.full_name = editName.trim();
        if (editAge) workerPayload.age = Number(editAge);
        if (editGender) workerPayload.gender = editGender;
        if (editSkills && editSkills.length > 0) workerPayload.skills = editSkills;
        if (editSalary) workerPayload.expected_salary = Number(editSalary);
        if (editExperience !== undefined && editExperience !== '') workerPayload.experience_years = Number(editExperience);
        if (editShiftSlot) {
          workerPayload.work_timing = editShiftSlot;
          workerPayload.preferred_shift = editShiftSlot;
        }
        if (cleanAlt) {
          workerPayload.emergency_contact = `+91 ${cleanAlt}`;
          workerPayload.alternate_phone = `+91 ${cleanAlt}`;
        }
        if (editBio && editBio.trim()) workerPayload.bio = editBio.trim();
        if (editLanguages && editLanguages.length > 0) workerPayload.languages_spoken = editLanguages;
        if (editSociety && editSociety.trim()) {
          workerPayload.primary_gated_society = editSociety.trim();
          workerPayload.preferred_society_name = editSociety.trim();
        }
        if (editSecondarySocieties && editSecondarySocieties.length > 0) {
          workerPayload.secondary_gated_society = editSecondarySocieties.join(', ');
          workerPayload.secondary_society_name = editSecondarySocieties.join(', ');
        }
        if (isPassingTeleOnboarding) {
          workerPayload.is_tele_onboarded = true;
          workerPayload.tele_onboarded = true;
          workerPayload.is_interview_verified = true;
          workerPayload.status = 'approved';
        }

        const { webApiClient } = await import('@/lib/webApiClient');
        const data = await webApiClient.post('/api/admin/worker/update', workerPayload);
        if (!data || !data.success) throw new Error(data?.error || 'Failed to save worker lead');
        if (isPassingTeleOnboarding) {
          showToast("✓ Telephonic Verification Passed & Profile Marked Ready!", "success");
        } else {
          showToast("💾 Draft Progress Saved Successfully!", "success");
        }
      } else {
        const cleanAlt = editAlternatePhone ? editAlternatePhone.replace(/\D/g, '') : '';
        if (cleanAlt && cleanAlt.length !== 10) {
          showToast("Alternate / Family contact number must be exactly 10 digits if provided.", "error");
          return;
        }

        const { webApiClient } = await import('@/lib/webApiClient');
        const data = await webApiClient.post('/api/admin/employer/update', {
          id: selectedLead.id,
          company_name: editName,
          society_name: editSociety,
          tower_block: editTower,
          address: editFlat,
          alternate_phone: cleanAlt ? `+91 ${cleanAlt}` : '',
          city: editCity,
          state: editState,
          pincode: editPincode,
          gstin: editGstin,
          verification_requirement: editVerificationReq,
          is_tele_onboarded: isPassingTeleOnboarding || selectedLead.is_tele_onboarded,
          is_residency_verified: isPassingTeleOnboarding || docVerState.residency || selectedLead.is_residency_verified,
          is_aadhaar_front_verified: isPassingTeleOnboarding || docVerState.aadhaar_front || selectedLead.is_aadhaar_front_verified,
          is_aadhaar_back_verified: isPassingTeleOnboarding || docVerState.aadhaar_back || selectedLead.is_aadhaar_back_verified,
          is_aadhaar_verified: isPassingTeleOnboarding || (docVerState.aadhaar_front && docVerState.aadhaar_back) || selectedLead.is_aadhaar_verified,
          is_police_verified: isPassingTeleOnboarding || docVerState.police || selectedLead.is_police_verified,
          status: selectedLead.status || 'pending_review'
        });
        if (!data || !data.success) throw new Error(data?.error || 'Failed to save employer lead');
        showToast("Employer details & uploaded verification documents saved successfully!", "success");
      }
      if (isWorkerLead(selectedLead)) {
        setWorkersList(prev => prev.map(w => w.id === selectedLead.id ? { 
          ...w, 
          is_tele_onboarded: isPassingTeleOnboarding || w.is_tele_onboarded, 
          is_interview_verified: isPassingTeleOnboarding || w.is_interview_verified, 
          status: isPassingTeleOnboarding ? 'admin_interview' : w.status 
        } : w));
      } else {
        setEmployersList(prev => prev.map(e => e.id === selectedLead.id ? { 
          ...e, 
          is_tele_onboarded: isPassingTeleOnboarding || e.is_tele_onboarded, 
          status: isPassingTeleOnboarding ? 'admin_interview' : e.status 
        } : e));
      }
      setIsSheetOpen(false);
      refreshLeads();
    } catch (err: any) {
      showToast(err.message || 'Error saving lead', 'error');
    } finally {
      setSavingLead(false);
    }
  };

  const handleUnapproveLead = async () => {
    if (!selectedLead) return;
    setSavingLead(true);
    try {
      if (activeTab === 'workers' || isWorkerLead(selectedLead)) {
        const workerPayload: any = {
          userId: selectedLead.id,
          admin_email: typeof localStorage !== 'undefined' ? localStorage.getItem('sevikaa_user_email') || 'admin@sevikaa.in' : 'admin@sevikaa.in',
          admin_name: getAdminName(),
          is_tele_onboarded: false,
          tele_onboarded: false,
          is_interview_verified: false,
          is_live: false,
          live: false,
          status: 'unapproved'
        };

        const { webApiClient } = await import('@/lib/webApiClient');
        const data = await webApiClient.post('/api/admin/worker/update', workerPayload);
        if (!data || !data.success) throw new Error(data?.error || 'Failed to unapprove worker');

        setSelectedLead((prev: any) => prev ? {
          ...prev,
          is_tele_onboarded: false,
          tele_onboarded: false,
          is_interview_verified: false,
          is_live: false,
          live: false,
          status: 'unapproved'
        } : null);

        setWorkersList(prev => prev.map(w => w.id === selectedLead.id ? {
          ...w,
          is_tele_onboarded: false,
          tele_onboarded: false,
          is_interview_verified: false,
          is_live: false,
          live: false,
          status: 'unapproved'
        } : w));
        showToast("✕ Lead Unapproved & Removed from Live Status", "info");
      } else {
        const data = await webApiClient.post('/api/admin/employer/update', {
          id: selectedLead.id,
          is_tele_onboarded: false,
          status: 'unapproved'
        });
        if (!data || !data.success) throw new Error(data?.error || 'Failed to unapprove employer');
        setEmployersList(prev => prev.map(e => e.id === selectedLead.id ? { ...e, is_tele_onboarded: false, status: 'unapproved' } : e));
        showToast("✕ Employer Lead Unapproved", "info");
      }
      invalidateAdminCache('tele_onboarding');
      setIsSheetOpen(false);
      fetchPaginatedLeads(page);
    } catch (err: any) {
      showToast(err.message || 'Error unapproving lead', 'error');
    } finally {
      setSavingLead(false);
    }
  };

  // Switch Role (Worker <-> Employer)
  const handleSwitchRole = async () => {
    if (!selectedLead) return;
    const targetRole = isWorkerLead(selectedLead) ? 'employer' : 'worker';
    const confirmMsg = `Are you sure you want to switch ${selectedLead.name || selectedLead.phone} from ${isWorkerLead(selectedLead) ? 'Worker' : 'Employer'} to ${targetRole.toUpperCase()}?`;
    if (!confirm(confirmMsg)) return;

    setSwitchingRole(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/admin/user/switch-role', { userId: selectedLead.id, targetRole });
      if (!data || !data.success) throw new Error(data?.error || 'Failed switching role');

      showToast(`Successfully switched user to ${targetRole.toUpperCase()}!`, "success");
      setIsSheetOpen(false);
      refreshLeads();
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
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/admin/worker/send-upload-sms', { userId: selectedLead.id, phone: selectedLead.phone });
      if (data && data.success) {
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
      const isWorker = isWorkerLead(selectedLead);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', selectedLead.id);
      formData.append('assetType', assetType);
      formData.append('role', isWorker ? 'worker' : 'employer');

      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/upload/cloudinary', formData);
      if (data && data.success && data.publicUrl) {
        setSelectedLead((prev: any) => {
          if (!prev) return null;
          if (assetType === 'profile_picture_url') {
            return { ...prev, profile_picture_url: data.publicUrl, avatar_url: data.publicUrl };
          }
          return { ...prev, [assetType]: data.publicUrl };
        });
        showToast("Document uploaded successfully from WhatsApp!", "success");
        refreshLeads();
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
    { label: 'Childcare / Nanny', icon: '👶' }
  ];

  const masterLanguages = [
    'Hindi', 'English', 'Hinglish', 'Kannada', 'Tamil', 'Telugu', 
    'Assamese', 'Nepali', 'Bengali', 'Marathi', 'Malayalam', 'Odia', 'Gujarati', 'Punjabi'
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl pb-16">
      
      {/* 🌟 LIGHT & BRIGHT LIVE MOVING CAROUSEL TICKER BANNER (VERY TOP OF PAGE) */}
      <div className="bg-gradient-to-r from-blue-50/90 via-white to-purple-50/90 p-4 rounded-3xl shadow-sm border-2 border-slate-200/90 overflow-hidden relative space-y-2.5">
        {/* CSS Keyframes for Marquee */}
        <style jsx>{`
          @keyframes marqueeStrip {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-strip {
            display: flex;
            width: max-content;
            animation: marqueeStrip 32s linear infinite;
          }
          .animate-marquee-strip:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="flex items-center justify-between gap-3 relative z-10 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#34A853] animate-pulse shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              <span>Live Tele-Interview Bridge Stream (Today &amp; Tomorrow Calls)</span>
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-600 bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
            Hover to Pause ⏸️
          </span>
        </div>

        {interviewsList.length === 0 ? (
          <div className="py-3 px-4 bg-white/90 rounded-2xl border border-slate-200 text-center text-xs font-semibold text-slate-600 shadow-2xs">
            ⚡ No scheduled tele-interviews yet. When household employers accept candidate applications and schedule interview times, they will stream here live in real-time.
          </div>
        ) : (
          <div className="overflow-hidden relative w-full py-1">
            <div className="animate-marquee-strip flex items-center gap-3">
              {[...interviewsList, ...interviewsList].map((item, idx) => (
                <div 
                  key={`${item.id}_${idx}`}
                  className="bg-white border-2 border-slate-200/90 hover:border-[#1A73E8] p-3 rounded-2xl shrink-0 flex items-center gap-3 min-w-[360px] text-xs transition-all shadow-xs"
                >
                  <div className="bg-blue-50 text-[#1A73E8] p-2 rounded-xl border border-blue-200/80 font-bold shrink-0 text-[10px] text-center min-w-[78px]">
                    <Clock size={12} className="mx-auto mb-0.5 text-[#1A73E8]" />
                    <span>{item.scheduled_time || 'Today 4:00 PM'}</span>
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 truncate max-w-[120px]">{item.worker_name}</span>
                      <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded uppercase">{item.job_category || 'MAID'}</span>
                    </div>
                    <p className="text-[10.5px] font-mono text-slate-600 font-medium truncate">
                      📱 {item.worker_phone}
                    </p>
                    <p className="text-[10.5px] text-slate-600 truncate font-medium">
                      🏡 {item.employer_name} • {item.society_name}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <a
                      href={`tel:${item.worker_phone}`}
                      className="py-1 px-2.5 bg-[#34A853] hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 whitespace-nowrap cursor-pointer"
                      title="Dial Worker Candidate"
                    >
                      <PhoneCall size={10} /> Worker
                    </a>
                    <a
                      href={`tel:${item.employer_phone}`}
                      className="py-1 px-2.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 whitespace-nowrap cursor-pointer"
                      title="Dial Household Employer"
                    >
                      <Building size={10} /> Employer
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
            onClick={() => refreshLeads()}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Leads
          </button>
        </div>

        {/* Category Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
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

            <button
              onClick={() => { setActiveTab('interviews'); setPage(1); }}
              className={`py-2 px-4 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'interviews'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Calendar size={15} />
              <span>📞 Scheduled Tele-Interviews ({interviewsList.length})</span>
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

        {/* Call Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mr-1">Filter by Call Status:</span>
          <button
            onClick={() => setCallStatusFilter('all')}
            className={`py-1.5 px-3 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
              callStatusFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >All Leads</button>

          <button
            type="button"
            onClick={() => setHidePassedLeads(!hidePassedLeads)}
            className={`py-1.5 px-3 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              hidePassedLeads 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
            }`}
          >
            <span>{hidePassedLeads ? '✓ Hiding Passed Leads' : '👁️ Hide Passed Leads'}</span>
          </button>

          {CALL_STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setCallStatusFilter(opt.value)}
              className={`py-1.5 px-3 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                callStatusFilter === opt.value ? 'ring-2 ring-offset-1 ring-slate-400 ' + opt.color : opt.color + ' hover:opacity-80'
              }`}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {/* 📞 TAB CONTENT: SCHEDULED INTERVIEWS VIEW OR REGULAR LEADS GRID */}
      {activeTab === 'interviews' ? (
        <div className="space-y-4">
          {/* Sub Filter Chips for Today vs Tomorrow */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1">Filter Calls:</span>
              <button
                onClick={() => setInterviewSubFilter('all')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  interviewSubFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >All Calls ({interviewsList.length})</button>

              <button
                onClick={() => setInterviewSubFilter('today')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  interviewSubFilter === 'today' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >Today Only ({interviewsList.filter(i => i.date_group === 'today' || (i.scheduled_time && i.scheduled_time.toLowerCase().includes('today'))).length})</button>

              <button
                onClick={() => setInterviewSubFilter('tomorrow')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  interviewSubFilter === 'tomorrow' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >Tomorrow Only ({interviewsList.filter(i => i.date_group === 'tomorrow' || (i.scheduled_time && i.scheduled_time.toLowerCase().includes('tomorrow'))).length})</button>
            </div>
            <span className="text-xs text-slate-400 font-medium">Auto-synchronized with Employer Job Requisitions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviewsList
              .filter(item => {
                const matchesSearch = (item.worker_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      (item.employer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      (item.worker_phone || '').includes(searchTerm) ||
                                      (item.employer_phone || '').includes(searchTerm) ||
                                      (item.society_name || '').toLowerCase().includes(searchTerm.toLowerCase());
                const isToday = item.date_group === 'today' || (item.scheduled_time && item.scheduled_time.toLowerCase().includes('today'));
                const isTomorrow = item.date_group === 'tomorrow' || (item.scheduled_time && item.scheduled_time.toLowerCase().includes('tomorrow'));
                const matchesSub = interviewSubFilter === 'all' || (interviewSubFilter === 'today' && isToday) || (interviewSubFilter === 'tomorrow' && isTomorrow);
                return matchesSearch && matchesSub;
              })
              .map((item) => {
                const callMeta = getCallStatusMeta(getCallStatus(item.id));
                const note = callNotes[item.id] || '';
                return (
                  <div 
                    key={item.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 hover:border-purple-300 transition-all relative"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center border border-purple-200 shrink-0">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 inline-block mb-0.5">
                            {item.scheduled_time || 'Scheduled Call'}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{item.job_title || 'Domestic Workforce Call'}</h4>
                          <span className="text-[10px] text-slate-500 font-semibold">{item.job_category} • ₹{item.salary_offered}/mo</span>
                        </div>
                      </div>

                      <select
                        value={getCallStatus(item.id)}
                        onChange={(e) => setCallStatus(item.id, e.target.value)}
                        className={`text-xs font-bold py-1.5 px-3 rounded-xl border focus:outline-none cursor-pointer ${callMeta.color}`}
                      >
                        {CALL_STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dual Cards: Worker side & Employer side */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
                      {/* Worker Box */}
                      <div className="space-y-1 pr-2 border-r border-slate-200">
                        <span className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block">👷 Worker Candidate</span>
                        <p className="text-xs font-bold text-slate-900 truncate">{item.worker_name}</p>
                        <p className="text-xs font-mono font-bold text-emerald-700">{formatPhone(item.worker_phone)}</p>
                        <a
                          href={`tel:${item.worker_phone}`}
                          className="mt-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10.5px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <PhoneCall size={11} /> Dial Worker
                        </a>
                      </div>

                      {/* Employer Box */}
                      <div className="space-y-1 pl-1">
                        <span className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block">🏡 Household Employer</span>
                        <p className="text-xs font-bold text-slate-900 truncate">{item.employer_name}</p>
                        <p className="text-xs font-mono font-bold text-[#1A73E8]">{formatPhone(item.employer_phone)}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.society_name} ({item.address})</p>
                        <a
                          href={`tel:${item.employer_phone}`}
                          className="mt-1.5 py-1.5 px-3 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-[10.5px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Building size={11} /> Dial Employer
                        </a>
                      </div>
                    </div>

                    {/* Telephonic Notes Field */}
                    <div className="space-y-1 pt-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Tele-Bridge Call Notes &amp; Outcome:</label>
                      <input
                        type="text"
                        placeholder="Type tele-call result (e.g. Worker agreed to 4 PM call, employer confirmed salary)..."
                        value={note}
                        onChange={(e) => saveCallNote(item.id, e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : loading ? (
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
            {currentLeads.map((lead) => {
              const callMeta = getCallStatusMeta(getCallStatus(lead.id));
              const note = callNotes[lead.id];
              return (
              <div
                key={lead.id}
                onClick={() => handleOpenLeadSheet(lead)}
                className="bg-white p-5 rounded-3xl border border-slate-200/90 hover:border-[#1A73E8] shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer group relative"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    {(() => {
                      const lock = activeLocks[lead.id];
                      const isLockedByOther = lock && lock.admin_id !== getAdminId();
                      if (isLockedByOther) {
                        return (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse flex items-center gap-1 shadow-xs mb-1 inline-flex">
                            <PhoneCall size={9} /> In Call with {lock.admin_name}
                          </span>
                        );
                      }
                      return null;
                    })()}
                    {lead.status === 'unapproved' || lead.status === 'rejected' ? (
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 inline-block">
                        ✕ Unapproved Candidate
                      </span>
                    ) : (lead.is_tele_onboarded || lead.status === 'approved' || lead.status === 'live' || lead.status === 'active') && lead.is_interview_verified !== false ? (
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block">
                        ✓ Tele-Onboarded &amp; Verified
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

                  <div className="flex flex-col items-end gap-1.5">
                    {(() => {
                      const lock = activeLocks[lead.id];
                      const isLockedByOther = lock && lock.admin_id !== getAdminId();
                      return (
                        <a
                          href={isLockedByOther ? undefined : `tel:${lead.phone}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isLockedByOther) {
                              e.preventDefault();
                              showToast(`📞 Call Disabled: Admin ${lock.admin_name} is currently on a call with this candidate.`, "info");
                            }
                          }}
                          className={`py-2 px-3 rounded-2xl shadow-xs transition-transform flex items-center gap-1 text-xs font-bold ${
                            isLockedByOther ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                          }`}
                          title={isLockedByOther ? `Admin ${lock.admin_name} is currently on a call with this candidate` : "Call Lead"}
                        >
                          <PhoneCall size={13} /> {isLockedByOther ? 'In Call' : 'Call'}
                        </a>
                      );
                    })()}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${callMeta.color}`}>
                      {callMeta.label}
                    </span>
                  </div>
                </div>

                {note && (
                  <p className="text-[10px] text-slate-500 font-medium bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-100 line-clamp-2 italic">
                    📝 {note}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold border-t border-slate-100 pt-2.5">
                  <span className="truncate max-w-[150px]">
                    Society: {lead.primary_gated_society || lead.society_name || 'Not logged'}
                  </span>
                  <span className="text-[#1A73E8] font-bold group-hover:translate-x-0.5 transition-transform">
                    Start Tele-Interview ➔
                  </span>
                </div>
              </div>
              );
            })}
          </div>

          {/* PAGINATION CONTROLS FOOTER */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-xs font-semibold text-slate-600">
              Page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{currentLeads.length < limit ? page : '...'}</span> &nbsp;·&nbsp; {currentLeads.length} leads on this page
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

      {/* 👑 TELE-ONBOARDING PORTAL MODAL WINDOW */}
      {mounted && isSheetOpen && selectedLead && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setIsSheetOpen(false)}
        >
          <div 
            className="w-full max-w-3xl max-h-[85vh] bg-white shadow-2xl rounded-3xl flex flex-col border border-slate-100 animate-scale-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Active Telephonic Onboarding Interview</span>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>{editName || selectedLead.company_name || selectedLead.full_name || selectedLead.profile_name || 'Unnamed Lead'}</span>
                  {(selectedLead.is_tele_onboarded || selectedLead.is_interview_verified || selectedLead.status === 'admin_interview' || selectedLead.status === 'approved' || selectedLead.status === 'active' || selectedLead.status === 'live') && (
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-emerald-700" /> Verified &amp; Onboarded
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold text-[#1A73E8] bg-blue-50 px-2.5 py-0.5 rounded-xl border border-blue-200">
                    {formatPhone(editPhone)}
                  </span>
                </h3>
              </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={switchingRole}
                    onClick={handleSwitchRole}
                    className="py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 rounded-xl text-xs font-semibold border border-amber-300/60 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Repeat size={12} className={switchingRole ? 'animate-spin' : ''} />
                    <span>Switch Role to {isWorkerLead(selectedLead) ? 'Employer 🏡' : 'Worker 👷'}</span>
                  </button>

              <button
                onClick={() => setIsSheetOpen(false)}
                className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

            {/* Modal Body - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">

              {/* Active Call Presence Banner */}
              {(() => {
                const lock = activeLocks[selectedLead?.id];
                const isLockedByOther = lock && lock.admin_id !== getAdminId();
                if (!isLockedByOther) return null;
                return (
                  <div className="p-3.5 bg-amber-500 text-white rounded-2xl flex items-center justify-between text-xs font-bold shadow-md animate-pulse">
                    <div className="flex items-center gap-2">
                      <PhoneCall size={16} />
                      <span>🔒 Active Call in Progress: Admin {lock.admin_name} is currently on a call with this candidate.</span>
                    </div>
                  </div>
                );
              })()}

              {/* Quick Action Dialing & SMS Bar */}
              {(() => {
                const lock = activeLocks[selectedLead?.id];
                const isLockedByOther = lock && lock.admin_id !== getAdminId();
                const cleanPhone = (editPhone || '').replace(/\D/g, '');
                return (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                      <a
                        href={isLockedByOther ? undefined : `tel:${editPhone}`}
                        onClick={(e) => {
                          if (isLockedByOther) {
                            e.preventDefault();
                            showToast(`📞 Call Disabled: Admin ${lock.admin_name} is currently on a call with this candidate.`, "info");
                          }
                        }}
                        className={`py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 ${
                          isLockedByOther ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        title={isLockedByOther ? `Admin ${lock.admin_name} is currently on a call with this candidate` : "Call Lead"}
                      >
                        <PhoneCall size={14} /> <span>{isLockedByOther ? `In Call (${lock.admin_name})` : `Call Lead Now (${formatPhone(editPhone)})`}</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleSendUploadSms}
                        className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare size={14} />
                        <span>{smsSent ? '✓ SMS Sent to Lead' : 'Send WhatsApp / SMS Link'}</span>
                      </button>
                    </div>

                    {/* WhatsApp Quick Verification Templates */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <a
                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent('Hello! Please complete your Sevikaa profile setup here: https://sevikaa.in/worker/profile')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[9.5px] font-black uppercase flex items-center gap-1 hover:bg-emerald-100 transition-all"
                      >
                        📲 Send Profile Link
                      </a>
                      <a
                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent('Hello! Please upload your Aadhaar card front & back scan for verification on Sevikaa.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[9.5px] font-black uppercase flex items-center gap-1 hover:bg-emerald-100 transition-all"
                      >
                        📑 Request Aadhaar Scan
                      </a>
                      <a
                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent('Congratulations! Your Sevikaa Tele-Onboarding verification has been approved!')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[9.5px] font-black uppercase flex items-center gap-1 hover:bg-emerald-100 transition-all"
                      >
                        ✅ Send Verification Alert
                      </a>
                    </div>
                  </div>
                );
              })()}

              {/* 📞 CALL LOG — Status & Notes */}
              {selectedLead && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">📞 Call Log &amp; Outreach Notes</span>

                  {/* Quick Status Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {CALL_STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCallStatus(selectedLead.id, opt.value)}
                        className={`py-1.5 px-3 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          getCallStatus(selectedLead.id) === opt.value
                            ? 'ring-2 ring-offset-1 ring-slate-400 ' + opt.color
                            : opt.color + ' hover:opacity-80'
                        }`}
                      >{opt.label}</button>
                    ))}
                  </div>

                  {/* Notes Textarea */}
                  <textarea
                    rows={2}
                    value={editCallNotes}
                    onChange={(e) => setEditCallNotes(e.target.value)}
                    onBlur={() => saveCallNote(selectedLead.id, editCallNotes)}
                    placeholder="Add call notes (e.g. 'Prefers morning shift, callback Tuesday 11am')..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1A73E8] resize-none"
                  />
                </div>
              )}

              {/* FORM INPUTS & VERIFICATION VAULT */}
              {isWorkerLead(selectedLead) ? (
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

                  {/* 2. Primary Mobile, Alternate Mobile & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Alternate / Family Mobile (Optional)</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={editAlternatePhone}
                        onChange={(e) => setEditAlternatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit alternate mobile"
                        className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-[#1A73E8] focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none"
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
                        <option value="">Select Gender</option>
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
                      {ALL_SHIFT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      {!ALL_SHIFT_OPTIONS.includes(editShiftSlot) && (
                        <option value={editShiftSlot}>{editShiftSlot}</option>
                      )}
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

                    {/* Secondary Societies (Multi-Select Chips capped at Max 5) */}
                    <div className="space-y-1.5 relative">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                          <span>Secondary Workplaces ({editSecondarySocieties.length}/5 Max)</span>
                        </label>
                        {editSecondarySocieties.length < 5 && (
                          <button
                            type="button"
                            onClick={() => {
                              const slotsAvailable = 5 - editSecondarySocieties.length;
                              if (slotsAvailable <= 0) return;
                              const remaining = allSocieties
                                .map(s => s.name)
                                .filter(name => name && name !== editSociety && !editSecondarySocieties.includes(name))
                                .slice(0, slotsAvailable);
                              if (remaining.length === 0) {
                                showToast("All nearby partner societies are already assigned!", "info");
                                return;
                              }
                              const updated = [...editSecondarySocieties, ...remaining];
                              setEditSecondarySocieties(updated);
                              showToast(`Added ${remaining.length} nearby societies (Max 5 total)!`, 'success');
                            }}
                            className="text-[9.5px] font-bold text-[#1A73E8] hover:underline cursor-pointer flex items-center gap-1 bg-blue-50/80 px-2 py-0.5 rounded-lg border border-blue-100"
                          >
                            <Sparkles size={11} />
                            <span>+ Fill Up to 5 Societies</span>
                          </button>
                        )}
                      </div>

                      {/* Active Chips */}
                      {editSecondarySocieties.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl">
                          {editSecondarySocieties.map((secName) => (
                            <span 
                              key={secName}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold flex items-center gap-1.5 shadow-2xs"
                            >
                              <span>{secName}</span>
                              <button
                                type="button"
                                onClick={() => setEditSecondarySocieties(editSecondarySocieties.filter(s => s !== secName))}
                                className="hover:text-red-600 cursor-pointer font-extrabold text-slate-400 hover:scale-110 transition-transform"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <input
                        type="text"
                        value={secondarySearchQuery}
                        onFocus={() => setShowSecondarySocietyMenu(true)}
                        onChange={(e) => {
                          setSecondarySearchQuery(e.target.value);
                          setShowSecondarySocietyMenu(true);
                        }}
                        placeholder={editSecondarySocieties.length >= 5 ? "Max 5 secondary societies reached" : "Search & click to add secondary society (Max 5)..."}
                        disabled={editSecondarySocieties.length >= 5}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#1A73E8] disabled:opacity-60"
                      />

                      {showSecondarySocietyMenu && editSecondarySocieties.length < 5 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-up">
                          <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50 text-[10px] font-bold text-slate-500">
                            <span>Click to Add Secondary Society (Max 5 Total)</span>
                            <button type="button" onClick={() => setShowSecondarySocietyMenu(false)} className="text-slate-400 hover:text-slate-700">✕ Close</button>
                          </div>

                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 text-xs">
                            {allSocieties
                              .filter(s => (s.name || '').toLowerCase() !== (editSociety || '').toLowerCase() && (s.name || '').toLowerCase().includes(secondarySearchQuery.toLowerCase()))
                              .slice(0, 50)
                              .map((soc, idx) => {
                                const isAssigned = editSecondarySocieties.includes(soc.name);
                                return (
                                  <button
                                    key={soc.id || idx}
                                    type="button"
                                    onClick={() => {
                                      if (isAssigned) {
                                        setEditSecondarySocieties(editSecondarySocieties.filter(s => s !== soc.name));
                                      } else {
                                        if (editSecondarySocieties.length >= 5) {
                                          showToast('Maximum 5 secondary workplace societies allowed to prevent job notification fatigue.', 'info');
                                          return;
                                        }
                                        setEditSecondarySocieties([...editSecondarySocieties, soc.name]);
                                      }
                                      setShowSecondarySocietyMenu(false);
                                    }}
                                    className={`w-full p-2.5 text-left transition-colors flex items-center justify-between group cursor-pointer ${
                                      isAssigned ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-blue-50 text-slate-800'
                                    }`}
                                  >
                                    <div>
                                      <span className="font-bold block">{soc.name}</span>
                                      <span className="text-[10px] text-slate-400">{soc.locality || soc.city || 'Gated Society'}</span>
                                    </div>
                                    <span className="text-[10px] font-bold">
                                      {isAssigned ? 'Added ✓' : '+ Add ➔'}
                                    </span>
                                  </button>
                                );
                              })}
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
                      <span className="text-[10px] font-bold uppercase text-slate-700 tracking-wider">📁 Candidate Verification Assets (4 Documents &amp; 1 Intro Video)</span>
                      <span className="text-[9.5px] font-bold text-[#1A73E8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {([selectedLead.profile_picture_url, selectedLead.aadhaar_front_url, selectedLead.aadhaar_back_url, selectedLead.police_verification_url, selectedLead.video_url].filter(Boolean).length)} / 5 Uploaded
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {/* 1. Selfie */}
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between text-center space-y-2 relative overflow-hidden group">
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">Selfie Photo</span>
                        {selectedLead.profile_picture_url ? (
                          <div 
                            onClick={() => {
                              setPreviewMedia({ url: selectedLead.profile_picture_url, title: `${editName || 'Candidate'} - Selfie Photo`, type: 'image' });
                            }}
                            className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                          >
                            <MediaThumbnail url={selectedLead.profile_picture_url} bucket="worker-selfies" alt="Selfie" />
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
                          <div className="space-y-1.5">
                            <div 
                              onClick={() => {
                                setPreviewMedia({ url: selectedLead.aadhaar_front_url, title: `${editName || 'Candidate'} - Aadhaar Front Card`, type: 'image', docKey: 'aadhaar_front' });
                              }}
                              className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                            >
                              <MediaThumbnail url={selectedLead.aadhaar_front_url} bucket="worker-documents" alt="Aadhaar Front" />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                <FileText size={12} /> Inspect
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDocVerState(prev => ({ ...prev, aadhaar_front: !prev.aadhaar_front }))}
                              className={`w-full py-0.5 px-2 rounded-md text-[8px] font-black uppercase transition-all cursor-pointer ${
                                docVerState.aadhaar_front || selectedLead.is_tele_onboarded || selectedLead.is_aadhaar_front_verified ? 'bg-[#34A853] text-white shadow-2xs' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              }`}
                            >
                              {docVerState.aadhaar_front || selectedLead.is_tele_onboarded || selectedLead.is_aadhaar_front_verified ? '✓ Verified' : '⏳ Pending'}
                            </button>
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
                          <div className="space-y-1.5">
                            <div 
                              onClick={() => {
                                setPreviewMedia({ url: selectedLead.aadhaar_back_url, title: `${editName || 'Candidate'} - Aadhaar Back Card`, type: 'image', docKey: 'aadhaar_back' });
                              }}
                              className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                            >
                              <MediaThumbnail url={selectedLead.aadhaar_back_url} bucket="worker-documents" alt="Aadhaar Back" />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                <FileText size={12} /> Inspect
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDocVerState(prev => ({ ...prev, aadhaar_back: !prev.aadhaar_back }))}
                              className={`w-full py-0.5 px-2 rounded-md text-[8px] font-black uppercase transition-all cursor-pointer ${
                                docVerState.aadhaar_back || selectedLead.is_tele_onboarded || selectedLead.is_aadhaar_back_verified ? 'bg-[#34A853] text-white shadow-2xs' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              }`}
                            >
                              {docVerState.aadhaar_back || selectedLead.is_tele_onboarded || selectedLead.is_aadhaar_back_verified ? '✓ Verified' : '⏳ Pending'}
                            </button>
                          </div>
                        ) : (
                          <div className="h-16 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-[9.5px] font-medium text-slate-400 italic">Not Uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* 4. Police Verification Document */}
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between text-center space-y-2 relative overflow-hidden group">
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">Police Clearance</span>
                        {selectedLead.police_verification_url ? (
                          <div className="space-y-1.5">
                            <div 
                              onClick={() => {
                                const mediaUrl = resolveMediaUrl('worker-documents', selectedLead.police_verification_url);
                                if (mediaUrl) setPreviewMedia({ url: mediaUrl, title: `${editName || 'Candidate'} - Police Verification Clearance Document`, type: 'image', docKey: 'police' });
                              }}
                              className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                            >
                              {resolveMediaUrl('worker-documents', selectedLead.police_verification_url) ? (
                                <img src={resolveMediaUrl('worker-documents', selectedLead.police_verification_url)} alt="Police Clearance" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium italic">Doc Uploaded</span>
                              )}
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                <FileText size={12} /> Inspect
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDocVerState(prev => ({ ...prev, police: !prev.police }))}
                              className={`w-full py-0.5 px-2 rounded-md text-[8px] font-black uppercase transition-all cursor-pointer ${
                                docVerState.police || selectedLead.is_tele_onboarded || selectedLead.is_police_verified ? 'bg-[#34A853] text-white shadow-2xs' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              }`}
                            >
                              {docVerState.police || selectedLead.is_tele_onboarded || selectedLead.is_police_verified ? '✓ Verified' : '⏳ Pending'}
                            </button>
                          </div>
                        ) : (
                          <div className="h-16 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="text-[9.5px] font-medium text-slate-400 italic">Not Uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* 5. Intro Video */}
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between text-center space-y-2 relative overflow-hidden group">
                        <span className="text-[9.5px] font-bold text-slate-600 uppercase">15s Intro Video</span>
                        {selectedLead.video_url ? (
                          <div className="space-y-1.5">
                            <div 
                              onClick={() => {
                                const mediaUrl = resolveMediaUrl('worker-videos', selectedLead.video_url);
                                if (mediaUrl) setPreviewMedia({ url: mediaUrl, title: `${editName || 'Candidate'} - 15s Intro Video`, type: 'video', docKey: 'video' });
                              }}
                              className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex flex-col items-center justify-center text-white space-y-1 shadow-2xs"
                            >
                              <span className="w-8 h-8 rounded-full bg-[#1A73E8] flex items-center justify-center font-bold text-xs shadow-md">▶</span>
                              <span className="text-[9px] font-bold text-blue-200">Play Video</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDocVerState(prev => ({ ...prev, video: !prev.video }))}
                              className={`w-full py-0.5 px-2 rounded-md text-[8px] font-black uppercase transition-all cursor-pointer ${
                                docVerState.video || selectedLead.is_tele_onboarded || selectedLead.is_video_verified ? 'bg-[#34A853] text-white shadow-2xs' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              }`}
                            >
                              {docVerState.video || selectedLead.is_tele_onboarded || selectedLead.is_video_verified ? '✓ Verified' : '⏳ Pending'}
                            </button>
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

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'profile_picture_url' ? 'Uploading...' : '+ Selfie'}</span>
                        <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleAdminDirectUpload('profile_picture_url', f); }} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'aadhaar_front_url' ? 'Uploading...' : '+ Aadhaar Front'}</span>
                        <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleAdminDirectUpload('aadhaar_front_url', f); }} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'aadhaar_back_url' ? 'Uploading...' : '+ Aadhaar Back'}</span>
                        <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleAdminDirectUpload('aadhaar_back_url', f); }} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-amber-50 text-amber-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'police_verification_url' ? 'Uploading...' : '+ Police Doc'}</span>
                        <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleAdminDirectUpload('police_verification_url', f); }} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-blue-50 text-[#1A73E8] rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'video_url' ? 'Uploading...' : '🎥 + Intro Video'}</span>
                        <input type="file" accept="video/*,.mp4,.webm,.mov" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleAdminDirectUpload('video_url', f); }} />
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
                            onClick={() => {
                              const mediaUrl = resolveMediaUrl('verification-documents', selectedLead.avatar_url || selectedLead.profile_picture_url);
                              if (mediaUrl) setPreviewMedia({ url: mediaUrl, title: `${editName || 'Employer'} - Selfie Photo`, type: 'image' });
                            }}
                            className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                          >
                            {resolveMediaUrl('verification-documents', selectedLead.avatar_url || selectedLead.profile_picture_url) ? (
                              <img src={resolveMediaUrl('verification-documents', selectedLead.avatar_url || selectedLead.profile_picture_url)} alt="Employer Selfie" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium italic">Photo Available</span>
                            )}
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
                        {resolveMediaUrl('verification-documents', selectedLead.aadhaar_front_url) ? (
                          <div className="space-y-1.5">
                            <div 
                              onClick={() => {
                                const mediaUrl = resolveMediaUrl('verification-documents', selectedLead.aadhaar_front_url);
                                if (mediaUrl) setPreviewMedia({ url: mediaUrl, title: `${editName || 'Employer'} - Aadhaar Front Card`, type: 'image', docKey: 'aadhaar_front' });
                              }}
                              className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                            >
                              <img 
                                src={resolveMediaUrl('verification-documents', selectedLead.aadhaar_front_url)} 
                                alt="Aadhaar Front" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  if (img.src.includes('/worker-documents/')) {
                                    img.src = img.src.replace('/worker-documents/', '/verification-documents/');
                                  } else if (img.src.includes('/verification-documents/')) {
                                    img.src = img.src.replace('/verification-documents/', '/documents/');
                                  }
                                }}
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                <FileText size={12} /> Inspect
                              </div>
                            </div>
                            <span className={`block px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                              docVerState.aadhaar_front || selectedLead.is_tele_onboarded || selectedLead.is_aadhaar_front_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {docVerState.aadhaar_front || selectedLead.is_tele_onboarded || selectedLead.is_aadhaar_front_verified ? '✓ Verified' : '⏳ Pending'}
                            </span>
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
                        {resolveMediaUrl('verification-documents', selectedLead.aadhaar_back_url) ? (
                          <div className="space-y-1.5">
                            <div 
                              onClick={() => {
                                const mediaUrl = resolveMediaUrl('verification-documents', selectedLead.aadhaar_back_url);
                                if (mediaUrl) setPreviewMedia({ url: mediaUrl, title: `${editName || 'Employer'} - Aadhaar Back Card`, type: 'image', docKey: 'aadhaar_back' });
                              }}
                              className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                            >
                              <img 
                                src={resolveMediaUrl('verification-documents', selectedLead.aadhaar_back_url)} 
                                alt="Aadhaar Back" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  if (img.src.includes('/worker-documents/')) {
                                    img.src = img.src.replace('/worker-documents/', '/verification-documents/');
                                  } else if (img.src.includes('/verification-documents/')) {
                                    img.src = img.src.replace('/verification-documents/', '/documents/');
                                  }
                                }}
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                <FileText size={12} /> Inspect
                              </div>
                            </div>
                            <span className={`block px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                              docVerState.aadhaar_back || selectedLead.is_tele_onboarded || selectedLead.is_aadhaar_back_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {docVerState.aadhaar_back || selectedLead.is_tele_onboarded || selectedLead.is_aadhaar_back_verified ? '✓ Verified' : '⏳ Pending'}
                            </span>
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
                        {resolveMediaUrl('verification-documents', selectedLead.residency_proof_url) ? (
                          <div className="space-y-1.5">
                            <div 
                              onClick={() => {
                                const mediaUrl = resolveMediaUrl('verification-documents', selectedLead.residency_proof_url);
                                if (mediaUrl) setPreviewMedia({ url: mediaUrl, title: `${editName || 'Employer'} - Society Residency Proof`, type: 'image', docKey: 'residency' });
                              }}
                              className="relative h-20 w-full rounded-xl overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity border border-slate-100 bg-slate-900 flex items-center justify-center"
                            >
                              <img 
                                src={resolveMediaUrl('verification-documents', selectedLead.residency_proof_url)} 
                                alt="Residency Proof" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  if (img.src.includes('/worker-documents/')) {
                                    img.src = img.src.replace('/worker-documents/', '/verification-documents/');
                                  } else if (img.src.includes('/verification-documents/')) {
                                    img.src = img.src.replace('/verification-documents/', '/documents/');
                                  }
                                }}
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                <FileText size={12} /> Inspect
                              </div>
                            </div>
                            <span className={`block px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                              docVerState.residency || selectedLead.is_tele_onboarded || selectedLead.is_residency_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {docVerState.residency || selectedLead.is_tele_onboarded || selectedLead.is_residency_verified ? '✓ Verified' : '⏳ Pending'}
                            </span>
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
                        <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleAdminDirectUpload('profile_picture_url', f); }} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'aadhaar_front_url' ? 'Uploading...' : '+ Aadhaar Front'}</span>
                        <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleAdminDirectUpload('aadhaar_front_url', f); }} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'aadhaar_back_url' ? 'Uploading...' : '+ Aadhaar Back'}</span>
                        <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleAdminDirectUpload('aadhaar_back_url', f); }} />
                      </label>

                      <label className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-[9.5px] font-bold text-center cursor-pointer shadow-2xs">
                        <span>{uploadingAsset === 'residency_proof_url' ? 'Uploading...' : '🏡 + Residency Proof'}</span>
                        <input type="file" accept="image/*,.pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleAdminDirectUpload('residency_proof_url', f); }} />
                      </label>
                    </div>
                  </div>

                </div>
              )}

              {/* Shared Team Call Notes & History Timeline */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <MessageSquare size={12} className="text-[#1A73E8]" /> Shared Team Call Notes &amp; Outcome History
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">{sharedNotes.length} notes logged</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={newCallOutcome}
                    onChange={(e) => setNewCallOutcome(e.target.value)}
                    className="text-xs font-bold py-1.5 px-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none shrink-0"
                  >
                    <option value="connected">Connected ✓</option>
                    <option value="no_answer">No Answer ⏳</option>
                    <option value="callback_requested">Callback Set 🕒</option>
                    <option value="invalid_number">Invalid Number ✕</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Log shared call note (e.g. Requested callback at 4 PM)..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSharedNote(); }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#1A73E8]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSharedNote}
                    disabled={addingNote || !newNoteText.trim()}
                    className="px-3.5 py-1.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {addingNote ? 'Logging...' : 'Log Note'}
                  </button>
                </div>

                {/* Notes History Timeline */}
                <div className="space-y-2 max-h-36 overflow-y-auto scrollbar-thin pt-1">
                  {loadingSharedNotes ? (
                    <p className="text-[10px] text-slate-400 font-bold italic text-center py-2">Loading team notes...</p>
                  ) : sharedNotes.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-bold italic text-center py-2">No team call notes logged yet for this lead.</p>
                  ) : (
                    sharedNotes.map((n: any) => (
                      <div key={n.id} className="p-2.5 bg-white rounded-xl border border-slate-100 text-xs space-y-1 shadow-2xs">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                          <span className="text-[#1A73E8] uppercase">{n.admin_name}</span>
                          <span>{new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <p className="text-slate-800 font-medium">{n.note_text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 shrink-0 flex items-center justify-end gap-2.5">
              <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={savingLead}
                  onClick={handleUnapproveLead}
                  className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <XCircle size={14} />
                  <span>Unapprove</span>
                </button>

                <button
                  type="button"
                  disabled={savingLead}
                  onClick={() => handleSaveLead(false)}
                  className="py-2 px-3.5 bg-white text-[#1A73E8] border border-[#1A73E8] hover:bg-blue-50 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{savingLead ? 'Saving...' : 'Save Draft'}</span>
                </button>

                <button
                  type="button"
                  disabled={savingLead}
                  onClick={() => handleSaveLead(true)}
                  className={`py-2 px-4 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all ${
                    ((selectedLead.is_tele_onboarded || selectedLead.status === 'approved' || selectedLead.status === 'live') && selectedLead.status !== 'unapproved' && selectedLead.status !== 'rejected' && selectedLead.is_interview_verified !== false)
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#34A853] hover:bg-emerald-600 text-white'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  <span>
                    {savingLead 
                      ? 'Updating...' 
                      : ((selectedLead.is_tele_onboarded || selectedLead.status === 'approved' || selectedLead.status === 'live') && selectedLead.status !== 'unapproved' && selectedLead.status !== 'rejected' && selectedLead.is_interview_verified !== false)
                        ? 'Approved ✓' 
                        : 'Approve'
                    }
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* MEDIA PREVIEW LIGHTBOX MODAL (PORTALED AT TOP Z-INDEX ABOVE ALL OPEN MODALS) */}
      {previewMedia && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-3xl w-full shadow-2xl space-y-3 border border-slate-100 animate-scale-up relative z-[99999]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">{previewMedia.title}</h3>
              <button 
                onClick={() => setPreviewMedia(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-2 flex items-center justify-center min-h-[350px] max-h-[75vh] overflow-hidden">
              {previewMedia.type === 'video' ? (
                <video 
                  src={previewMedia.url} 
                  controls 
                  autoPlay 
                  className="max-h-[70vh] w-auto rounded-xl object-contain" 
                />
              ) : (
                <MediaPreviewImage url={previewMedia.url} title={previewMedia.title} />
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              {previewMedia.docKey ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (previewMedia.docKey) {
                        handleDirectDocVerificationToggle(previewMedia.docKey, true);
                        showToast(`✓ ${previewMedia.title} Approved & Saved!`, "success");
                        setPreviewMedia(null);
                      }
                    }}
                    className="py-2.5 px-4 bg-[#34A853] hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                  >
                    <CheckCircle2 size={15} />
                    <span>✓ Approve Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (previewMedia.docKey) {
                        handleDirectDocVerificationToggle(previewMedia.docKey, false);
                        showToast(`⏳ ${previewMedia.title} Marked Pending`, "info");
                        setPreviewMedia(null);
                      }
                    }}
                    className="py-2.5 px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>⏳ Mark Pending</span>
                  </button>
                </div>
              ) : <div />}

              <button
                onClick={() => setPreviewMedia(null)}
                className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer w-full sm:w-auto"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
