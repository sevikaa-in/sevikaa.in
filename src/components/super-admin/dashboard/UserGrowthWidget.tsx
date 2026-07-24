"use client";

import React from 'react';
import { Users, UserCheck, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface UserGrowthWidgetProps {
  loading: boolean;
  error: string;
  counts: {
    totalWorkers: number;
    verifiedWorkers: number;
    pendingWorkers: number;
    totalEmployers: number;
    activeEmployers: number;
    totalSocieties: number;
  };
}

export const UserGrowthWidget: React.FC<UserGrowthWidgetProps> = ({
  loading,
  error,
  counts
}) => {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-[20px]"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-[20px] text-xs text-red-600 font-bold flex items-center gap-2">
        <HelpCircle size={16} />
        <span>Failed to load user growth stats: {error}</span>
      </div>
    );
  }

  interface SectionItem {
    label: string;
    value: string | number;
    color?: string;
  }

  interface Section {
    title: string;
    icon: React.ReactNode;
    bg: string;
    items: SectionItem[];
  }

  const sections: Section[] = [
    {
      title: "Worker Ecosystem",
      icon: <Users size={18} className="text-emerald-500" />,
      bg: "bg-emerald-50/40",
      items: [
        { label: "Total Workers", value: counts.totalWorkers },
        { label: "Verified & Active", value: counts.verifiedWorkers },
        { label: "Pending Verification", value: counts.pendingWorkers, color: "text-amber-500" }
      ]
    },
    {
      title: "Employer Ecosystem",
      icon: <UserCheck size={18} className="text-blue-500" />,
      bg: "bg-blue-50/40",
      items: [
        { label: "Total Employers", value: counts.totalEmployers },
        { label: "Active Subscribers", value: counts.activeEmployers },
        { label: "Elite Unlock Conversion", value: counts.totalEmployers > 0 ? `${Math.round((counts.activeEmployers / counts.totalEmployers) * 100)}%` : "0%" }
      ]
    },
    {
      title: "Societies & Managers",
      icon: <ShieldAlert size={18} className="text-purple-500" />,
      bg: "bg-purple-50/40",
      items: [
        { label: "Registered Societies", value: counts.totalSocieties },
        { label: "Active Regional Areas", value: "Bangalore (3)" },
        { label: "Platform Moderators", value: "2 Active" }
      ]
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">User Ecosystem</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((section, idx) => (
          <div key={idx} className={`border border-slate-100 p-5 rounded-[20px] shadow-sm flex flex-col justify-between space-y-4 bg-white`}>
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                {section.icon}
                <span>{section.title}</span>
              </h4>
            </div>

            <div className="space-y-3 flex-1">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-400">{item.label}</span>
                  <span className={`font-black text-slate-800 ${item.color || ''}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
