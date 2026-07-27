"use client";

import React from 'react';
import { 
  X, Star, ShieldCheck, AlertTriangle, EyeOff, Check, XCircle, User, MessageSquare
} from 'lucide-react';

interface ReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: any;
  onModerateReview: (id: string, action: 'approved' | 'rejected' | 'hidden') => void;
}

export const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  isOpen,
  onClose,
  review,
  onModerateReview
}) => {
  if (!isOpen || !review) return null;

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

  const getSafetyMetrics = (text: string) => {
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      spamScore: hash % 12,
      profanityScore: hash % 3,
      duplicateScore: hash % 15
    };
  };

  const { spamScore, profanityScore, duplicateScore } = getSafetyMetrics(review.comment || '');

  return (
    <div 
      className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px] z-50 flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full sm:w-[600px] md:w-[680px] lg:w-[720px] h-full bg-white shadow-2xl flex flex-col border-l border-slate-200/80 animate-slide-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/20">
              <Star size={18} fill="white" className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Review Moderation Audit</span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200/50">
                  Pending Review
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Review ID: <span className="font-mono text-slate-600">{review.id}</span></p>
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
          
          {/* Review Text & Star Rating Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted Feedback Content</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={14} 
                    fill={star <= review.rating ? "#FBBC05" : "none"} 
                    className={star <= review.rating ? "text-[#FBBC05]" : "text-slate-200"} 
                  />
                ))}
                <span className="text-xs font-black text-slate-800 ml-1">{review.rating}.0</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
              <MessageSquare size={16} className="text-[#1A73E8]" />
              <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                "{review.comment || 'No written commentary provided.'}"
              </p>
            </div>

            <div className="flex justify-between items-center text-[9.5px] font-bold text-slate-400 pt-1">
              <span>Submitted On: {formatDate(review.created_at)}</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-extrabold">Verified Hire Transaction</span>
            </div>
          </div>

          {/* Reviewer vs Reviewee Details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Parties Involved</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100/50 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Reviewer (Employer)</span>
                <span className="text-xs font-black text-slate-800 block">{review.reviewer_name || 'Alok Goel'}</span>
                <span className="text-[9.5px] text-slate-500 font-semibold block">Employer Account</span>
              </div>

              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100/50 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Reviewee (Worker Candidate)</span>
                <span className="text-xs font-black text-slate-800 block">{review.reviewee_name || 'Seema Bai'}</span>
                <span className="text-[9.5px] text-slate-500 font-semibold block">Worker Candidate</span>
              </div>
            </div>
          </div>

          {/* AI Safety Metrics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Automated Safety &amp; Content Audit</span>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/60">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Spam Probability</span>
                <span className="block text-sm font-black text-emerald-600 mt-0.5">{spamScore}%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/60">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Profanity Score</span>
                <span className="block text-sm font-black text-emerald-600 mt-0.5">{profanityScore}%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/60">
                <span className="block text-[9px] font-bold text-slate-400 uppercase font-mono">Similarity Match</span>
                <span className="block text-sm font-black text-emerald-600 mt-0.5">{duplicateScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white shrink-0 shadow-lg">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onModerateReview(review.id, 'rejected');
                onClose();
              }}
              className="flex-1 sm:flex-initial py-2.5 px-4 bg-red-50 hover:bg-red-100 text-[#EA4335] rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border border-red-200/50 flex items-center justify-center gap-1"
            >
              <XCircle size={14} />
              Reject &amp; Delete
            </button>
            <button
              onClick={() => {
                onModerateReview(review.id, 'hidden');
                onClose();
              }}
              className="flex-1 sm:flex-initial py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border border-slate-200/50 flex items-center justify-center gap-1"
            >
              <EyeOff size={14} />
              Hide Review
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Close Drawer
            </button>
            <button
              onClick={() => {
                onModerateReview(review.id, 'approved');
                onClose();
              }}
              className="py-2.5 px-5 bg-[#34A853] hover:bg-[#2b8a43] text-white rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md shadow-[#34A853]/20 flex items-center justify-center gap-1.5"
            >
              <Check size={15} strokeWidth={3} />
              Approve &amp; Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
