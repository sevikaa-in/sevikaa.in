"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Check, Mail, Phone, MapPin, Calendar, CreditCard, 
  Briefcase, Sparkles, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

interface EmployerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employer: any;
  onApproveEmployer: (id: string) => void;
  onRejectEmployer: (id: string) => void;
}

export const EmployerDetailModal: React.FC<EmployerDetailModalProps> = ({
  isOpen,
  onClose,
  employer,
  onApproveEmployer,
  onRejectEmployer
}) => {
  const [mounted, setMounted] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !employer) return;

    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (isPlaceholder) {
      setJobs([
        { 
          id: 'mock-j1', 
          category: 'cook', 
          description: 'Organic healthy North Indian vegetarian cooking required for family of 4.', 
          salary_range_min: 15000, 
          status: 'pending',
          created_at: '2026-07-02T10:15:00Z'
        },
        { 
          id: 'mock-j2', 
          category: 'maid', 
          description: 'Daily house cleaning and kitchen cleaning services. Prefers morning slots.', 
          salary_range_min: 9000, 
          status: 'live',
          created_at: '2026-07-15T09:00:00Z'
        }
      ]);
      return;
    }

    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('employer_id', employer.user_id);
        if (error) throw error;
        setJobs(data || []);
      } catch (err) {
        console.error("Error loading employer jobs:", err);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [isOpen, employer]);

  if (!isOpen || !employer || !mounted) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-[9999] flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full sm:w-[640px] md:w-[720px] lg:w-[780px] h-screen max-h-screen bg-white shadow-2xl flex flex-col border-l border-slate-200/80 animate-slide-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A73E8] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#1A73E8]/20">
              {employer.name ? employer.name[0] : 'E'}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>{employer.name}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  employer.status === 'live' || employer.status === 'approved' 
                    ? 'bg-emerald-50 text-[#34A853] border border-emerald-200/50' 
                    : employer.status === 'suspended' || employer.status === 'rejected'
                    ? 'bg-red-50 text-[#EA4335] border border-red-200/50'
                    : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                }`}>
                  {employer.status?.replace('_', ' ')}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Employer Profile Audit &bull; ID: <span className="font-mono text-slate-600">{employer.id}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
            title="Close Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">

          {/* Deletion Pending Call Verification Box */}
          {employer.status === 'deletion_requested' && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-amber-700" />
                  <h4 className="text-xs font-black text-amber-900">Employer Account Deletion Requested</h4>
                </div>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[8px] font-black uppercase">
                  Call Verification Pending
                </span>
              </div>

              <p className="text-[11px] text-amber-900/90 font-medium">
                Stated Offboarding Reason: <strong>"{employer.offboarding_reason || 'Already hired domestic worker'}"</strong>
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                <a 
                  href={`tel:${employer.phone}`}
                  className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                >
                  <Phone size={13} />
                  <span>Call Employer ({employer.phone || '+91 98765 43210'})</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onApproveEmployer(employer.id);
                      onClose();
                    }}
                    className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
                  >
                    Restore Profile Live
                  </button>
                  <button
                    onClick={() => {
                      onRejectEmployer(employer.id);
                      onClose();
                    }}
                    className="py-2 px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
                  >
                    Approve &amp; Execute Deletion
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Metadata Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Employer Identity Metadata</span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-3 text-xs font-bold text-slate-700">
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Account Type</span>
                <span className="inline-flex items-center gap-1 text-[#1A73E8] bg-blue-50 px-2 py-0.5 rounded text-[10px] font-black uppercase mt-0.5">
                  <CreditCard size={10} />
                  {employer.subscription_status || 'Free'} Pass
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Signup Date</span>
                <span className="flex items-center gap-1 text-slate-700 mt-0.5">
                  <Calendar size={10} className="text-slate-400" />
                  {formatDate(employer.signup_date || employer.created_at)}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Household / Company</span>
                <span className="text-slate-800 font-extrabold mt-0.5 block">{employer.company_name || 'Individual Household'}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Phone</span>
                <span className="flex items-center gap-1 text-slate-700 mt-0.5 font-bold">
                  <Phone size={10} className="text-slate-400" />
                  {employer.phone || 'N/A'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Email Address</span>
                <span className="flex items-center gap-1 text-slate-700 mt-0.5 font-bold">
                  <Mail size={10} className="text-slate-400" />
                  {employer.email || 'N/A'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Residential Gated Society</span>
                <span className="flex items-center gap-1 text-slate-800 font-extrabold bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <MapPin size={12} className="text-[#1A73E8] shrink-0" />
                  <span>{employer.society_name || employer.preferred_society || 'DLF Westend Heights'}</span>
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Full Billing Address</span>
                <span className="flex items-start gap-1 text-slate-700 font-semibold bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>{employer.billing_address || 'Bangalore, Karnataka'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Job Postings History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posted Jobs Overview ({jobs.length})</span>
              <span className="text-[9px] text-slate-400 font-bold">Employer requirement history</span>
            </div>

            {loadingJobs ? (
              <div className="py-6 text-center text-xs text-slate-400 font-bold animate-pulse">Loading job listings...</div>
            ) : jobs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-bold flex flex-col items-center gap-1">
                <Sparkles size={18} className="text-slate-300" />
                <span>No Job Listings Posted</span>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.id} className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800 capitalize">{job.title || `${job.category} needed`}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        job.status === 'live' || job.status === 'approved' ? 'bg-emerald-50 text-[#34A853]' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-600 font-semibold leading-relaxed line-clamp-2">
                      {job.description}
                    </p>
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 pt-1.5 border-t border-slate-100">
                      <span>Salary: ₹{job.salary_range_min || 'N/A'}/mo</span>
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white shrink-0 shadow-lg">
          <button
            onClick={() => {
              onRejectEmployer(employer.id);
              onClose();
            }}
            className="w-full sm:w-auto py-2.5 px-4 bg-red-50 hover:bg-red-100 text-[#EA4335] rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border border-red-200/50"
          >
            Reject / Suspend Account
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Close Drawer
            </button>
            <button
              onClick={() => {
                onApproveEmployer(employer.id);
                onClose();
              }}
              className="py-2.5 px-5 bg-[#34A853] hover:bg-[#2b8a43] text-white rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md shadow-[#34A853]/20 flex items-center gap-1.5"
            >
              <Check size={15} strokeWidth={3} />
              Approve Live Profile
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

