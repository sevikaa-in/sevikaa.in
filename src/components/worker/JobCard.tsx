'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, IndianRupee, MapPin, Clock, Check, Eye, CheckCircle2, Lock, Send, ChevronRight 
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface JobCardProps {
  job: any;
  applications?: any[];
  appliedJobIds?: string[];
  isWorkerVerified?: boolean;
  onApply?: (job: any) => void;
  isApplying?: boolean;
  showApplyButton?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  applications = [],
  appliedJobIds = [],
  isWorkerVerified = true,
  onApply,
  isApplying = false,
  showApplyButton = true
}) => {
  const { t } = useLanguage();

  const matchingApp = applications.find((a: any) => a.jobId === job.id || a.jobTitle === job.title || a.id === job.id);
  const hasApplied = appliedJobIds.includes(job.id) || !!matchingApp;
  const cleanSalary = job.salary_offered ? Number(job.salary_offered).toLocaleString('en-IN') : '15,000';

  const getTranslatedTitle = (j: any) => {
    if (!j) return 'Domestic Helper Job';
    if (j.id === 'c9bf0b7b-3b02-44e1-a20d-70498b8c2d1b') return 'Full Day Housekeeping & Deep Cleaning';
    if (j.id === 'd78a9e4f-8f12-4c22-921a-5b12847a98b1') return 'North & South Indian Family Cook';
    if (j.id === 'e412a89c-1120-4e55-901b-1b918a204910') return 'Toddler Nanny & Infant Caregiver';
    return j.title || 'Domestic Worker Job';
  };

  const getTranslatedDesc = (j: any) => {
    if (!j) return 'Looking for an experienced domestic helper for household work.';
    if (j.description && j.description.trim().length > 25) return j.description;
    if (j.description && j.description.trim().length > 0) {
      const titleStr = j.title ? `${j.title}: ` : '';
      return `${titleStr}${j.description}. Looking for an experienced, honest and reliable helper with good hygiene standards.`;
    }
    return 'Looking for an experienced domestic helper for household work. Reliable and hygienic work habits required.';
  };

  return (
    <div className="group relative bg-gradient-to-b from-white via-slate-50/30 to-slate-50/80 rounded-[28px] border border-slate-200/80 hover:border-[#1A73E8]/40 shadow-xs hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between space-y-4 overflow-hidden">
      {/* Glass highlight background */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all" />

      {/* Info Area */}
      <div className="space-y-3 min-w-0 flex-1 relative z-10 w-full">
        {/* Employer Header */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-[#1A73E8] to-indigo-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 ring-2 ring-blue-100">
              {(job.employer_name || job.society_name || 'H')[0]}
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight truncate">
                {job.employer_name || 'Verified Household'}
              </p>
              <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                <span>{t('sevikaaVerifiedHousehold') || 'Sevikaa Verified Household'}</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 self-start xs:self-auto">
            <span className="text-xs font-black text-emerald-800 font-mono bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 px-3 py-1.5 rounded-2xl border border-emerald-300/70 shadow-xs inline-flex items-center gap-1 whitespace-nowrap">
              <IndianRupee size={12} className="text-emerald-600 stroke-[2.5] shrink-0" />
              <span>{cleanSalary} / mo</span>
            </span>
          </div>
        </div>

        {/* Job Title & Location */}
        <div className="space-y-1">
          <h4 className="text-base font-black text-slate-900 group-hover:text-[#1A73E8] transition-colors leading-snug tracking-tight">
            {getTranslatedTitle(job)}
          </h4>
          <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5 bg-slate-100/70 px-2.5 py-1 rounded-xl w-fit border border-slate-200/60">
            <MapPin size={13} className="text-[#1A73E8] shrink-0" />
            <span className="truncate">{job.society_name || job.locality || 'Residential Society'}</span>
          </p>
        </div>

        {/* Description Snippet */}
        <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-100/80 line-clamp-2 w-full">
          {getTranslatedDesc(job)}
        </p>

        {/* Shift & Perks Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {job.shift_hours && (
            <span className="px-2.5 py-1 bg-indigo-50/90 text-indigo-700 text-[10.5px] font-bold rounded-xl border border-indigo-100 flex items-center gap-1 whitespace-nowrap">
              <Clock size={11} className="text-indigo-600 shrink-0" /> {job.shift_hours}
            </span>
          )}
          {job.perks?.map((perk: string, i: number) => (
            <span key={i} className="px-2.5 py-1 bg-emerald-50/90 text-emerald-800 text-[10px] font-black rounded-xl border border-emerald-200/60 flex items-center gap-1 whitespace-nowrap">
              <Check size={11} strokeWidth={3} className="text-emerald-600 shrink-0" /> {perk}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="pt-3.5 border-t border-slate-200/70 w-full shrink-0 flex flex-col sm:flex-row items-center gap-2 relative z-10">
        <Link
          href={`/worker/jobs/${job.id}`}
          className={`py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95 border border-slate-200/60 whitespace-nowrap ${
            showApplyButton ? 'w-full sm:w-1/2' : 'w-full'
          }`}
        >
          <Eye size={14} className="text-slate-500 shrink-0" />
          <span className="whitespace-nowrap">{t('viewDetails') || 'View Details'}</span>
        </Link>

        {showApplyButton && (
          <button
            onClick={() => onApply && onApply(job)}
            disabled={hasApplied || !isWorkerVerified || isApplying}
            className={`w-full sm:w-1/2 py-2.5 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap ${
              hasApplied 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20' 
                : !isWorkerVerified
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-amber-950 shadow-md shadow-amber-300/40 border border-amber-300/80 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#1A73E8] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md shadow-blue-500/25'
            }`}
          >
            {hasApplied ? (
              <>
                <CheckCircle2 size={14} className="shrink-0" />
                <span className="whitespace-nowrap">{t('applied') || 'Applied ✓'}</span>
              </>
            ) : !isWorkerVerified ? (
              <>
                <Lock size={13} className="shrink-0" />
                <span className="whitespace-nowrap">{t('pendingAuditBadge') || 'Pending Audit'}</span>
              </>
            ) : (
              <>
                <Send size={13} className="shrink-0" />
                <span className="whitespace-nowrap">{isApplying ? (t('applying') || 'Applying...') : (t('applyNow') || 'Apply Now')}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
