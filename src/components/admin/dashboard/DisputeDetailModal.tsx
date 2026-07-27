"use client";

import React, { useState } from 'react';
import { 
  X, AlertTriangle, User, ShieldAlert, MessageSquare, Check, 
  ChevronUp, Flag, Ban, FileText
} from 'lucide-react';

interface DisputeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: any;
  onResolveDispute: (id: string) => void;
}

export const DisputeDetailModal: React.FC<DisputeDetailModalProps> = ({
  isOpen,
  onClose,
  dispute,
  onResolveDispute
}) => {
  const [adminNotes, setAdminNotes] = useState('');

  if (!isOpen || !dispute) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px] z-50 flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full sm:w-[600px] md:w-[680px] lg:w-[740px] h-full bg-white shadow-2xl flex flex-col border-l border-slate-200/80 animate-slide-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
              dispute.priority === 'High' ? 'bg-red-50 text-[#EA4335]' : 'bg-amber-50 text-amber-600'
            }`}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span>Dispute Investigation</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase border ${
                  dispute.priority === 'High' 
                    ? 'bg-red-50 text-[#EA4335] border-red-100/50' 
                    : 'bg-amber-50 text-amber-600 border-amber-100/50'
                }`}>
                  {dispute.priority} Priority
                </span>
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                Dispute #ID: {dispute.id} &bull; Reported against: {dispute.reported_user}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-gray-400 hover:text-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Parties Involved */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-red-50/40 border border-red-100/50 p-4 rounded-2xl space-y-1.5">
              <span className="block text-[9px] font-black text-[#EA4335] uppercase tracking-wider">Reported User (Accused)</span>
              <span className="block text-xs font-black text-slate-800">{dispute.reported_user}</span>
              <span className="block text-[9px] text-gray-400 font-bold">Target of complaint filed</span>
            </div>
            <div className="bg-blue-50/40 border border-blue-100/50 p-4 rounded-2xl space-y-1.5">
              <span className="block text-[9px] font-black text-[#1A73E8] uppercase tracking-wider">Reported By (Reporter)</span>
              <span className="block text-xs font-black text-slate-800">{dispute.reporter}</span>
              <span className="block text-[9px] text-gray-400 font-bold">User who submitted the complaint</span>
            </div>
          </div>

          {/* Dispute Details */}
          <div className="bg-slate-50/40 border border-slate-100 p-5 rounded-2xl space-y-4">
            <span className="block text-[9.5px] font-black text-slate-700 uppercase tracking-wider">Dispute Reason & Details</span>
            
            <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-white p-4 rounded-xl border border-slate-100/50">
              "{dispute.reason}"
            </p>

            {dispute.evidence && (
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#1A73E8]">
                <FileText size={12} />
                <span>Attached Evidence: {dispute.evidence}</span>
              </div>
            )}
          </div>

          {/* Admin Resolution Notes */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
            <span className="block text-[9.5px] font-black text-slate-700 uppercase tracking-wider">Admin Resolution Notes</span>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Document your investigation findings, steps taken, and resolution rationale..."
              rows={4}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none resize-none text-slate-800"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/20">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {}}
              className="flex-1 sm:flex-initial py-2.5 px-4 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <ChevronUp size={14} />
              Escalate to Super Admin
            </button>
            <button
              onClick={() => {}}
              className="flex-1 sm:flex-initial py-2.5 px-4 border border-red-200/50 bg-red-50 hover:bg-red-100 text-[#EA4335] rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Ban size={14} />
              Suspend User
            </button>
          </div>

          <button
            onClick={() => {
              onResolveDispute(dispute.id);
              onClose();
            }}
            className="w-full sm:w-auto py-2.5 px-5 bg-[#34A853] hover:bg-[#2b8a43] text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check size={14} strokeWidth={3} />
            Resolve & Close Dispute
          </button>
        </div>
      </div>
    </div>
  );
};
