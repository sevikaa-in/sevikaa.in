'use client';

import React from 'react';
import { 
  Building2, MapPin, Star, CheckCircle2, Sparkles, 
  Briefcase, Home, ShieldCheck 
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface SocietyCardProps {
  society: {
    id: string;
    name: string;
    locality: string;
    activeJobsCount: number;
    employersCount: number;
    securityType: string;
    distance: string;
  };
  isPrimary?: boolean;
  isSecondary?: boolean;
  highHiringThreshold?: number;
  onSetPrimary?: (society: any) => void;
  onToggleSecondary?: (society: any) => void;
}

export const SocietyCard: React.FC<SocietyCardProps> = ({
  society,
  isPrimary = false,
  isSecondary = false,
  highHiringThreshold = 3,
  onSetPrimary,
  onToggleSecondary
}) => {
  const { t } = useLanguage();
  const isHighHiring = society.activeJobsCount >= highHiringThreshold;

  return (
    <div 
      onClick={() => {
        if (!isPrimary && onSetPrimary) onSetPrimary(society);
      }}
      className={`p-4 rounded-3xl border transition-all space-y-3 ${
        isPrimary 
          ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border-[#1A73E8] ring-2 ring-[#1A73E8]/20 shadow-md' 
          : isSecondary
          ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200 shadow-xs cursor-pointer hover:border-emerald-400'
          : 'bg-white border-slate-200/80 hover:border-blue-300 shadow-xs cursor-pointer'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
            isPrimary 
              ? 'bg-[#1A73E8] text-white shadow-md shadow-[#1A73E8]/20' 
              : isSecondary
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600'
          }`}>
            <Building2 size={20} />
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-semibold text-slate-900 leading-tight">{society.name}</h4>
              {isPrimary && (
                <span className="bg-[#1A73E8] text-white text-[8.5px] font-semibold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Star size={9} fill="currentColor" /> {t('primaryWorkplaceBadge') || "Primary Workplace"}
                </span>
              )}
              {isSecondary && (
                <span className="bg-emerald-100 text-emerald-800 text-[8.5px] font-semibold uppercase px-2 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                  <CheckCircle2 size={9} /> {t('secondaryWorkplaceBadge') || "Secondary Workplace"}
                </span>
              )}
              {isHighHiring && !isPrimary && !isSecondary && (
                <span className="bg-amber-500 text-white text-[8.5px] font-semibold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                  <Sparkles size={9} /> 🔥 {t('highHiringBadge') || "High Hiring"}
                </span>
              )}
            </div>

            <p className="text-[10.5px] text-slate-500 font-medium flex items-center gap-1">
              <MapPin size={10} className="text-slate-400 shrink-0" />
              <span className="truncate">{society.locality}</span>
            </p>
          </div>
        </div>

        <span className="bg-slate-100 text-slate-700 text-[9.5px] font-semibold px-2.5 py-1 rounded-xl shrink-0 border border-slate-200">
          {society.distance}
        </span>
      </div>

      {/* Metrics Badges */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
        <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100">
          <span className="text-[9px] text-slate-400 font-medium block uppercase">{t('metricLiveJobs') || "Live Jobs"}</span>
          <span className="text-xs font-semibold text-[#1A73E8] flex items-center justify-center gap-1 mt-0.5">
            <Briefcase size={11} /> {society.activeJobsCount} {t('metricOpenings') || "Openings"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100">
          <span className="text-[9px] text-slate-400 font-medium block uppercase">{t('residentEmployers') || "RESIDENT EMPLOYERS"}</span>
          <span className="text-xs font-semibold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
            <Home size={11} className="text-slate-500" /> {society.employersCount} {t('householdsCount') || "Households"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100">
          <span className="text-[9px] text-slate-400 font-medium block uppercase">{t('metricGateSecurity') || "Gate Security"}</span>
          <span className="text-[10px] font-semibold text-emerald-700 truncate block mt-0.5">
            ✓ {(society.securityType || 'Gate').split(' ')[0]} {t('gateSuffix') || "Gate"}
          </span>
        </div>
      </div>

      {/* Selection Action Controls */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400 font-medium">
          {isPrimary 
            ? (t('primaryNotifSub') || '⭐ Receiving priority hiring notifications') 
            : isSecondary 
            ? (t('secondaryNotifSub') || '✅ Included in job matching alerts') 
            : (t('tapToSelectSub') || 'Tap card to set as Primary workplace')}
        </span>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onSetPrimary && (
            <button
              type="button"
              onClick={() => onSetPrimary(society)}
              disabled={isPrimary}
              className={`py-1.5 px-3 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                isPrimary
                  ? 'bg-[#1A73E8] text-white shadow-xs'
                  : 'bg-blue-50 text-[#1A73E8] hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Star size={11} fill={isPrimary ? 'currentColor' : 'none'} />
              <span>{isPrimary ? (t('primarySetBtn') || 'Primary ✓') : (t('setPrimaryBtn') || 'Set Primary')}</span>
            </button>
          )}

          {onToggleSecondary && (
            <button
              type="button"
              onClick={() => onToggleSecondary(society)}
              disabled={isPrimary}
              className={`py-1.5 px-2.5 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                isPrimary
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : isSecondary
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <CheckCircle2 size={11} />
              <span>{isSecondary ? (t('secondaryAddedBtn') || 'Secondary ✓') : (t('addSecondaryBtn') || '+ Secondary')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
