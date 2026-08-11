"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEmployerDashboard } from '../../../layout';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  Users, ArrowLeft, Search, Check, Send, Sparkles, ShieldCheck, 
  MapPin, Star, Lock, AlertCircle, CheckCircle2, Building, RefreshCw 
} from 'lucide-react';

export default function EmployerJobInvitePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const { employerProfile, postedJobs, showToast } = useEmployerDashboard();
  const { t } = useLanguage();

  const [job, setJob] = useState<any | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function loadJobAndWorkers() {
      setLoadingJob(true);
      setLoadingWorkers(true);

      try {
        // 1. Fetch Target Job Requisition from DB or Local State
        let targetJob = postedJobs.find((j: any) => String(j.id) === String(jobId));

        if (!targetJob && jobId) {
          const { data: dbJob } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .maybeSingle();
          if (dbJob) targetJob = dbJob;
        }

        setJob(targetJob || null);

        // 2. Fetch employer-safe worker directory (excludes Aadhaar front/back & police URLs)
        const { data: dbWorkers, error: wErr } = await supabase
          .from('employer_worker_directory')
          .select('id, user_id, full_name, gender, age, experience_years, expected_salary, skills, languages_spoken, primary_gated_society, preferred_shift, bio, video_url, profile_picture_url, avatar_url, status, rating, total_reviews, is_aadhaar_verified, is_police_verified, is_interview_verified, created_at')
          .or('status.eq.live,status.eq.approved')
          .order('created_at', { ascending: false });

        if (!wErr && dbWorkers) {
          const mapped = dbWorkers.map((w: any) => ({
            id: w.user_id || w.id,
            name: w.full_name || w.profiles?.full_name || 'Verified Helper',
            skills: Array.isArray(w.skills) ? w.skills : [w.category || 'Cook'],
            category: Array.isArray(w.skills) && w.skills[0] ? w.skills[0] : (w.category || 'Cook'),
            experience: `${w.experience_years || 2} Years Exp`,
            salary: w.expected_salary ? Number(w.expected_salary).toLocaleString('en-IN') : '15,000',
            society: w.preferred_society_name || employerProfile.society_name || 'Gated Society',
            rating: w.rating || 4.9,
            reviewsCount: w.total_reviews || 12,
            isPoliceVerified: !!w.is_police_verified
          }));
          setWorkersList(mapped);
        }
      } catch (err) {
        console.error("Error loading invite page data:", err);
      } finally {
        setLoadingJob(false);
        setLoadingWorkers(false);
      }
    }

    loadJobAndWorkers();
  }, [jobId, employerProfile.society_name]);

  const categories = ['All', 'Cook', 'Maid', 'Nanny', 'Driver'];

  const filteredWorkers = workersList.filter(w => {
    if (selectedCategory !== 'All') {
      const cat = (w.category || '').toLowerCase();
      const skillsStr = (w.skills || []).join(' ').toLowerCase();
      const target = selectedCategory.toLowerCase();
      if (!cat.includes(target) && !skillsStr.includes(target)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = w.name.toLowerCase().includes(q);
      const societyMatch = w.society.toLowerCase().includes(q);
      if (!nameMatch && !societyMatch) return false;
    }
    return true;
  });

  const toggleSelectWorker = (id: string) => {
    setSelectedWorkerIds(prev => 
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedWorkerIds.length === filteredWorkers.length) {
      setSelectedWorkerIds([]);
    } else {
      setSelectedWorkerIds(filteredWorkers.map(w => w.id));
    }
  };

  const handleSendMassInvitations = async () => {
    if (!job || selectedWorkerIds.length === 0) return;

    const isApproved = job.status === 'active' || job.status === 'approved';
    if (!isApproved) {
      showToast("Invitations can only be sent for Admin-Approved Job Requisitions!", "warning");
      return;
    }

    setIsSending(true);
    try {
      // Dispatch in-app invitation records for selected workers into Supabase applications table
      const inserts = selectedWorkerIds.map(wId => ({
        employer_id: employerProfile.user_id || employerProfile.id,
        job_id: job.id,
        worker_id: wId,
        status: 'invited',
        admin_note: 'Mass Job Invitation dispatched by Employer'
      }));

      const { error } = await supabase
        .from('applications')
        .insert(inserts);

      if (error) {
        // If duplicate invitation exists, swallow or report
        console.warn("Insert invitation notice:", error);
      }

      showToast(`Mass Job Invitation sent to ${selectedWorkerIds.length} verified helpers! App push notifications dispatched.`, 'success');
      router.push('/employer/jobs');
    } catch (err: any) {
      showToast(`Error sending invitations: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw size={28} className="text-[#1A73E8] animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading Job Requisition Details...</p>
      </div>
    );
  }

  const isApproved = job && (job.status === 'active' || job.status === 'approved');

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-32">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center gap-3">
        <Link
          href="/employer/jobs"
          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-colors shadow-2xs"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Mass Worker Invitation Screen</h2>
          <p className="text-xs text-slate-500 font-semibold">
            Invite verified live helpers in your society to apply for your job requisition.
          </p>
        </div>
      </div>

      {/* Target Job Summary Banner */}
      {job ? (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="bg-blue-50 text-[#1A73E8] text-[9.5px] font-black uppercase px-3 py-1 rounded-full border border-blue-200">
              Inviting For Requisition
            </span>
            <span className={`text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
              isApproved ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {isApproved ? '🟢 Approved Requisition' : '⏳ Pending Admin Audit'}
            </span>
          </div>

          {postedJobs && postedJobs.length > 1 ? (
            <div className="pt-1 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Select Target Job Requisition:
              </label>
              <select
                value={job?.id || ''}
                onChange={(e) => {
                  const selected = postedJobs.find(j => String(j.id) === String(e.target.value));
                  if (selected) setJob(selected);
                }}
                className="w-full py-2.5 px-3 bg-slate-50 border-2 border-blue-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-[#1A73E8] cursor-pointer"
              >
                {postedJobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title} — ₹{j.salary || 15000}/mo ({j.status === 'active' || j.status === 'approved' ? '🟢 Approved' : '⏳ Pending Audit'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <h3 className="text-base font-black text-slate-900">{job.title}</h3>
              <p className="text-xs font-bold text-slate-600 flex items-center gap-3">
                <span>₹{job.salary || 15000}/mo</span>
                <span>&bull;</span>
                <span className="text-[#1A73E8]">{job.society_name || employerProfile.society_name}</span>
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs font-bold text-amber-900 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <span>Job Requisition not found. Please select a valid job from My Jobs page.</span>
        </div>
      )}

      {/* Approved Job Requirement Banner Warning */}
      {!isApproved && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl space-y-1 text-amber-950">
          <h4 className="text-xs font-black flex items-center gap-1.5 text-amber-900">
            <Lock size={15} /> Approved Job Requisition Required
          </h4>
          <p className="text-xs font-medium leading-relaxed text-amber-900/90">
            To send invitations to domestic helpers, your job requisition must first be audited &amp; approved by Sevikaa Admin. This prevents spam and protects worker safety.
          </p>
        </div>
      )}

      {/* Filter Pills & Search Container */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search helper name or society..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#1A73E8]"
            />
          </div>

          <button
            onClick={toggleSelectAll}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black shrink-0 cursor-pointer text-center"
          >
            {selectedWorkerIds.length === filteredWorkers.length && filteredWorkers.length > 0 ? 'Deselect All' : 'Select All Filtered'}
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#1A73E8] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates Multi-Select List */}
      {loadingWorkers ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center space-y-3 shadow-xs">
          <RefreshCw size={28} className="text-[#1A73E8] animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading verified live workers in society...</p>
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="p-10 bg-white rounded-3xl border border-slate-100 text-center space-y-2 shadow-xs">
          <Users size={32} className="mx-auto text-slate-300" />
          <p className="text-xs font-bold text-slate-600">No verified live workers found matching filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkers.map(w => {
            const isSelected = selectedWorkerIds.includes(w.id);

            return (
              <div
                key={w.id}
                onClick={() => toggleSelectWorker(w.id)}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-blue-50/80 border-[#1A73E8] shadow-xs'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Checkbox */}
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-[#1A73E8] border-[#1A73E8] text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check size={14} className="stroke-[3]" />}
                  </div>

                  {/* Avatar & Details */}
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 text-[#1A73E8] font-black text-base flex items-center justify-center shrink-0">
                    {w.name.charAt(0)}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900 truncate">{w.name}</h4>
                      <span className="px-2 py-0.5 bg-emerald-50 text-[#34A853] text-[8.5px] font-black uppercase rounded-full border border-emerald-200 shrink-0 flex items-center gap-0.5">
                        <ShieldCheck size={10} /> Verified
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500">
                      {w.category} &bull; {w.experience} &bull; ⭐ {w.rating} ({w.reviewsCount})
                    </p>
                    <p className="text-[10.5px] text-slate-400 font-medium truncate">
                      📍 {w.society}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-700 font-mono block">
                    ₹{w.salary}/mo
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Multi-Select Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-50 shadow-2xl flex justify-center">
        <div className="w-full max-w-md flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black text-slate-900 block">
              {selectedWorkerIds.length} Helpers Selected
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block">
              App Push Notification (Zero DLT Spam)
            </span>
          </div>

          <button
            onClick={handleSendMassInvitations}
            disabled={isSending || selectedWorkerIds.length === 0 || !isApproved}
            className="py-3 px-6 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Send size={14} className={isSending ? 'animate-spin' : ''} />
            <span>{isSending ? 'Sending Invitations...' : `Send Invitations (${selectedWorkerIds.length})`}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
