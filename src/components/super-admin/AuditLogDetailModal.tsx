"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, ShieldCheck, UserCheck, Key, CreditCard, Settings, AlertTriangle, Terminal, Code, ArrowRight } from 'lucide-react';

export interface AuditLogItem {
  id: string;
  action: string;
  category: string;
  severity: string;
  actor: string;
  actorRole: string;
  admin_email?: string;
  admin_name?: string;
  target_name?: string;
  target_id?: string;
  changes_summary?: string;
  raw_payload?: any;
  ipAddress: string;
  timestamp: string;
  details: string;
}

interface AuditLogDetailModalProps {
  log: AuditLogItem | null;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ log, onClose }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  if (!log) return null;

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-50 text-[#EA4335] border-red-200/60';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      default:
        return 'bg-blue-50 text-[#1A73E8] border-blue-200/60';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'auth_security':
        return <Key size={18} className="text-amber-600" />;
      case 'moderation':
        return <UserCheck size={18} className="text-[#34A853]" />;
      case 'payment_webhook':
        return <CreditCard size={18} className="text-purple-600" />;
      case 'system_alert':
        return <AlertTriangle size={18} className="text-[#EA4335]" />;
      default:
        return <Settings size={18} className="text-[#1A73E8]" />;
    }
  };

  const adminEmail = log.admin_email || (log.actor && log.actor.includes('@') ? log.actor : '');
  const adminName = log.admin_name || (log.actor && !log.actor.includes('@') ? log.actor : (adminEmail && adminEmail.includes('@') ? adminEmail.split('@')[0] : ''));
  const targetName = log.target_name || 'System Resource';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-2xl border border-slate-100 shadow-xs">
              {getCategoryIcon(log.category)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">{log.action}</h3>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getSeverityBadge(log.severity)}`}>
                  {log.severity}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5 font-mono">
                <Clock size={11} />
                <span>{log.timestamp}</span>
                <span>•</span>
                <span>IP: {log.ipAddress}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Audit Context Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Target Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Target Subject / Resource</span>
              <div className="font-black text-xs text-slate-800 truncate">{targetName}</div>
              {log.target_id && (
                <div className="text-[9.5px] font-mono text-slate-400 truncate">ID: {log.target_id}</div>
              )}
            </div>

            {/* Initiator Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Initiating Administrator</span>
              <div className="font-black text-xs text-slate-800">{adminName}</div>
              <div className="text-[9.5px] font-mono text-[#1A73E8] truncate">{adminEmail}</div>
            </div>
          </div>

          {/* Action Details & Changes Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#34A853]" />
              <span>Audit Logged Summary</span>
            </h4>
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 font-mono text-xs leading-relaxed">
              {log.changes_summary || log.details || 'No detailed change notes recorded for this event.'}
            </div>
          </div>

          {/* Raw Payload Inspector Toggle */}
          {log.raw_payload && (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-xs font-bold text-[#1A73E8] hover:text-[#1557b0] flex items-center gap-1.5 cursor-pointer"
              >
                <Code size={14} />
                <span>{showRawJson ? 'Hide Raw Audit JSON Payload' : 'Inspect Raw Audit JSON Payload'}</span>
              </button>

              {showRawJson && (
                <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl border border-slate-900 font-mono text-[10px] overflow-x-auto max-h-48 scrollbar-hide">
                  {typeof log.raw_payload === 'string' 
                    ? log.raw_payload 
                    : JSON.stringify(log.raw_payload, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Close Audit Inspector
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
