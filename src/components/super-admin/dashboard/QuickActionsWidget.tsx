"use client";

import React from 'react';
import { UserPlus, PlusCircle, Settings, FileText, Send, Lock, HelpCircle } from 'lucide-react';

interface QuickActionsWidgetProps {
  onAddAdminClick: () => void;
  onAddSocietyClick: () => void;
  onExportReportsClick: () => void;
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  onAddAdminClick,
  onAddSocietyClick,
  onExportReportsClick
}) => {
  const actions = [
    {
      title: "Add Platform Manager",
      icon: <UserPlus size={16} />,
      onClick: onAddAdminClick,
      color: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100/70 border-indigo-200/40"
    },
    {
      title: "Create Society Profile",
      icon: <PlusCircle size={16} />,
      onClick: onAddSocietyClick,
      color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100/70 border-emerald-200/40"
    },
    {
      title: "Export CSV Reports",
      icon: <FileText size={16} />,
      onClick: onExportReportsClick,
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100/70 border-blue-200/40"
    },
    {
      title: "Send Global Notice",
      icon: <Send size={16} />,
      onClick: () => alert("Send global SMS/Email broadcast tool coming soon!"),
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100/70 border-purple-200/40"
    },
    {
      title: "System Credentials",
      icon: <Lock size={16} />,
      onClick: () => alert("Security credentials rotation is handled by Supabase Vault configurations."),
      color: "bg-slate-100 text-slate-700 hover:bg-slate-200/70 border-slate-300/40"
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Quick Owner Actions</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {actions.map((act, idx) => (
          <button
            key={idx}
            onClick={act.onClick}
            className={`p-4 border rounded-[20px] shadow-sm flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-all duration-150 cursor-pointer font-bold text-xs ${act.color}`}
          >
            <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100 shrink-0">
              {act.icon}
            </div>
            <span>{act.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
