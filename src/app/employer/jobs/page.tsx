"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useEmployerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Briefcase, PlusCircle, Clock, CheckCircle2, ShieldAlert, Edit3, Eye, 
  Trash2, X, Save, Sparkles, MapPin, IndianRupee, Users, AlertCircle, RefreshCw, Send, Lock
} from 'lucide-react';

export default function EmployerMyJobsPage() {
  const { t } = useLanguage();
  const { 
    postedJobs, employerProfile, handleUpdateJob, showToast 
  } = useEmployerDashboard();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending' | 'closed'>('all');
  const [editingJob, setEditingJob] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('cook');
  const [editSocietyName, setEditSocietyName] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editFamilyMembers, setEditFamilyMembers] = useState('');
  const [editFlatType, setEditFlatType] = useState('');
  const [editShiftHours, setEditShiftHours] = useState('');
  const [editDietaryPref, setEditDietaryPref] = useState('Both Veg & Non-Veg');
  const [editLeavePolicy, setEditLeavePolicy] = useState('4 Sundays Off + 1 Paid Leave');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter jobs by status
  const filteredJobs = postedJobs.filter(job => {
    if (activeTab === 'active') return job.status === 'active' || job.status === 'approved';
    if (activeTab === 'pending') return job.status === 'pending' || job.status === 'changes_requested';
    if (activeTab === 'closed') return job.status === 'closed' || job.status === 'filled';
    return true;
  });

  const activeCount = postedJobs.filter(j => j.status === 'active' || j.status === 'approved').length;
  const pendingCount = postedJobs.filter(j => j.status === 'pending' || j.status === 'changes_requested').length;
  const totalApplicants = postedJobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0);

  const handleOpenEdit = (job: any) => {
    setEditingJob(job);
    setEditTitle(job.title || '');
    setEditCategory(job.category || 'cook');
    setEditSocietyName(job.society_name || job.societyName || employerProfile?.society_name || 'DLF Westend Heights');
    setEditSalary(job.salary || '15000');
    setEditFamilyMembers(job.family_members || '4 Members (2 Adults, 2 Kids)');
    setEditFlatType(job.flat_type || '3BHK Apartment');
    setEditShiftHours(job.shift_hours || 'Full Day (8:00 AM – 4:00 PM)');
    setEditDietaryPref(job.dietary_pref || 'Both Veg & Non-Veg');
    setEditLeavePolicy(job.leave_policy || '4 Sundays Off + 1 Paid Leave');
    setEditDescription(job.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob || !editTitle.trim()) return;
    setIsSaving(true);
    await handleUpdateJob(editingJob.id, {
      title: editTitle.trim(),
      category: editCategory,
      society_name: editSocietyName.trim(),
      societyName: editSocietyName.trim(),
      salary: editSalary.trim(),
      family_members: editFamilyMembers.trim(),
      flat_type: editFlatType.trim(),
      shift_hours: editShiftHours.trim(),
      dietary_pref: editDietaryPref,
      leave_policy: editLeavePolicy,
      description: editDescription.trim()
    });
    setIsSaving(false);
    setEditingJob(null);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-24">
      
      {/* Page Title & Post Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-50 text-[#1A73E8] text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200/60 inline-flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" />
              {t('employerRequisitions')}
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase size={18} className="text-[#1A73E8]" />
            <span>{t('myPostedRequisitions')}</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-relaxed">
            {t('manageRequisitionsSub')}
          </p>
        </div>

        <Link
          href="/employer/post-job"
          className="py-2.5 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95"
        >
          <PlusCircle size={15} />
          <span>{t('postNewJobReq')}</span>
        </Link>
      </div>

      {/* 📊 HERO STATS BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-xl space-y-4 relative overflow-hidden border border-blue-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 size={10} /> {t('activePipeline')}
            </span>
            <h3 className="text-sm font-black text-white">
              {postedJobs.length} {t('postedIn')} {employerProfile.society_name?.split('-')[0] || 'Society'}
            </h3>
            <p className="text-[11px] text-slate-300 font-medium">
              {t('aadhaarVerifiedSub')}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shrink-0 flex items-center gap-3 text-center">
            <div>
              <span className="text-[8.5px] text-slate-300 font-bold block uppercase">{t('liveJobs')}</span>
              <span className="text-base font-black text-emerald-400">{activeCount}</span>
            </div>
            <div className="w-px h-7 bg-white/15" />
            <div>
              <span className="text-[8.5px] text-slate-300 font-bold block uppercase">{t('pendingAudit')}</span>
              <span className="text-base font-black text-amber-300">{pendingCount}</span>
            </div>
            <div className="w-px h-7 bg-white/15" />
            <div>
              <span className="text-[8.5px] text-slate-300 font-bold block uppercase">{t('inboundApps')}</span>
              <span className="text-base font-black text-blue-300">{totalApplicants}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 STATUS FILTER TABS */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl text-xs font-bold text-slate-600 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
            activeTab === 'all' ? 'bg-white text-[#1A73E8] font-black shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <Briefcase size={13} />
          <span>{t('allFilter')} ({postedJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
            activeTab === 'active' ? 'bg-white text-[#1A73E8] font-black shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <CheckCircle2 size={13} />
          <span>{t('activeLiveFilter')} ({activeCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
            activeTab === 'pending' ? 'bg-white text-[#1A73E8] font-black shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          <Clock size={13} />
          <span>{t('pendingFeedbackFilter')} ({pendingCount})</span>
        </button>
      </div>

      {/* 💼 JOBS LIST */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-3 shadow-xs">
            <Briefcase size={36} className="mx-auto text-slate-300" />
            <div>
              <h4 className="text-xs font-black text-slate-800">{t('noRequisitionsYet')}</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                {t('noRequisitionsSub')}
              </p>
            </div>
            <Link
              href="/employer/dashboard/post-job"
              className="py-2.5 px-5 bg-[#1A73E8] text-white rounded-xl text-xs font-black shadow-md cursor-pointer hover:bg-blue-600 transition-all inline-flex items-center gap-1.5"
            >
              <PlusCircle size={14} /> {t('postFirstJobBtn')}
            </Link>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isActive = job.status === 'active' || job.status === 'approved';
            const isChangesRequested = job.status === 'changes_requested';

            return (
              <div 
                key={job.id}
                className={`bg-white p-5 rounded-3xl border transition-all space-y-4 shadow-xs hover:shadow-md ${
                  isChangesRequested 
                    ? 'border-red-200 bg-red-50/10' 
                    : isActive 
                    ? 'border-emerald-200' 
                    : 'border-amber-200/80'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-slate-900 leading-snug">{job.title}</h3>
                      <span className="px-2 py-0.5 bg-blue-50 text-[#1A73E8] text-[9px] font-black uppercase rounded-full border border-blue-200">
                        {job.category || 'General'}
                      </span>
                    </div>

                    <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <MapPin size={11} className="text-[#1A73E8]" />
                      <span>{job.society_name || job.societyName || employerProfile.society_name || 'Society Location'}</span>
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase shrink-0 border flex items-center gap-1 ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : isChangesRequested 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {isActive ? (
                      <><CheckCircle2 size={10} /> {t('activePublished')}</>
                    ) : isChangesRequested ? (
                      <><ShieldAlert size={10} /> {t('actionRequired')}</>
                    ) : (
                      <><Clock size={10} /> {t('pendingAdminAudit')}</>
                    )}
                  </span>
                </div>

                {/* 🚨 ADMIN AUDIT FEEDBACK WARNING (IF CHANGES REQUESTED) */}
                {isChangesRequested && job.adminNote && (
                  <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl space-y-1.5 text-red-950">
                    <div className="flex items-center gap-1.5 text-xs font-black text-red-700">
                      <ShieldAlert size={15} />
                      <span>Admin Audit Feedback Note</span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed bg-white/80 p-2.5 rounded-xl border border-red-100 text-red-900">
                      "{job.adminNote}"
                    </p>
                    <div className="pt-1 flex items-center justify-end">
                      <button
                        onClick={() => handleOpenEdit(job)}
                        className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10.5px] font-black cursor-pointer inline-flex items-center gap-1 shadow-xs"
                      >
                        <Edit3 size={12} /> {t('requestChanges')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Job Specs Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold text-slate-700">
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Monthly Offered Salary</span>
                    <span className="text-xs font-black text-emerald-700 mt-0.5 block font-mono">
                      ₹{job.salary ? Number(job.salary).toLocaleString('en-IN') : '15,000'} / mo
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Inbound Applications</span>
                    <span className="text-xs font-black text-[#1A73E8] mt-0.5 block">
                      {job.applicationsCount || 0} Candidates Applied
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 col-span-2 sm:col-span-1">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Date Created</span>
                    <span className="text-[10.5px] font-black text-slate-800 mt-0.5 block">
                      {job.created_at || 'Recently'}
                    </span>
                  </div>
                </div>

                {/* Description Text */}
                {job.description && (
                  <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                    "{job.description}"
                  </p>
                )}

                {/* Action Buttons Row */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href="/employer/dashboard/workers"
                      className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Users size={13} />
                      <span>{t('viewCandidates')} ({job.applicationsCount || 0})</span>
                    </Link>

                    <button
                      onClick={() => handleOpenEdit(job)}
                      className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 size={13} />
                      <span>{t('editRequisition')}</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 font-semibold">
                    ID: {job.id}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ✏️ EDIT JOB REQUISITION MODAL */}
      {editingJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-up border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-[#1A73E8] rounded-xl">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Edit Household Requisition</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{editingJob.title}</p>
                </div>
              </div>
              <button onClick={() => setEditingJob(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-xl hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-bold">
              {/* Category, Title & Society */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-500 text-[10px] uppercase block">Job Headline Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-500 text-[10px] uppercase block">Gated Society / Location Name</label>
                  <input
                    type="text"
                    placeholder="e.g. DLF Westend Heights - Akshayanagar"
                    value={editSocietyName}
                    onChange={(e) => setEditSocietyName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] uppercase block">Domestic Help Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
                  >
                    <option value="cook">🍳 Cook / Chef</option>
                    <option value="maid">🧹 Maid / Housekeeper</option>
                    <option value="nanny">👶 Nanny / Childcare</option>
                    <option value="driver">🚗 Private Driver</option>
                    <option value="caregiver">👵 Elderly Caregiver</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] uppercase block">Monthly Offered Salary (₹)</label>
                  <input
                    type="text"
                    value={editSalary}
                    onChange={(e) => setEditSalary(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Household Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] uppercase block">Family Setup / Members</label>
                  <input
                    type="text"
                    placeholder="e.g. 4 Members (2 Adults, 2 Kids)"
                    value={editFamilyMembers}
                    onChange={(e) => setEditFamilyMembers(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] uppercase block">Residence Type / Flat</label>
                  <input
                    type="text"
                    placeholder="e.g. 3BHK Apartment (Tower 4)"
                    value={editFlatType}
                    onChange={(e) => setEditFlatType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                  />
                </div>
              </div>

              {/* Shift Hours & Dietary Pref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] uppercase block">Shift Hours &amp; Schedule</label>
                  <input
                    type="text"
                    placeholder="e.g. Full Day (8:00 AM – 4:00 PM)"
                    value={editShiftHours}
                    onChange={(e) => setEditShiftHours(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] uppercase block">Dietary &amp; Food Pref</label>
                  <select
                    value={editDietaryPref}
                    onChange={(e) => setEditDietaryPref(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
                  >
                    <option value="Both Veg & Non-Veg">Both Veg &amp; Non-Veg</option>
                    <option value="Pure Vegetarian Only">Pure Vegetarian Only</option>
                    <option value="Jain Food Prep Only">Jain Food Prep Only</option>
                  </select>
                </div>
              </div>

              {/* Leave Policy */}
              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">Monthly Leave Entitlement</label>
                <select
                  value={editLeavePolicy}
                  onChange={(e) => setEditLeavePolicy(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none cursor-pointer"
                >
                  <option value="4 Sundays Off + 1 Paid Leave">4 Sundays Off + 1 Paid Leave (Recommended)</option>
                  <option value="4 Sundays Off Only">4 Sundays Off Only</option>
                  <option value="Alternate Sundays Off">Alternate Sundays Off (2 Offs / Month)</option>
                  <option value="No Fixed Off (Paid Overtime)">No Fixed Off (Paid Overtime Compensation)</option>
                </select>
              </div>

              {/* Description & Scope of Work */}
              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">Detailed Duties &amp; Scope of Work</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Specify daily tasks, utensil care, infant duties, or meal requirements..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-[#1A73E8] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={13} />
                  <span>{isSaving ? 'Saving...' : 'Save & Resubmit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
