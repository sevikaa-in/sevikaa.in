"use client";

import React, { useState } from 'react';
import { ShieldAlert, Sparkles, Star, Search, Check, Trash2, EyeOff } from 'lucide-react';

interface ReviewQueueProps {
  loading: boolean;
  error: string;
  reviews: any[];
  onModerateReview: (id: string, action: 'approved' | 'rejected' | 'hidden') => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  loading,
  error,
  reviews,
  onModerateReview
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl"></div>
        <div className="h-48 bg-slate-200 rounded-[20px]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-[20px] text-xs text-red-600 font-bold flex items-center gap-2">
        <ShieldAlert size={16} />
        <span>Error loading review queue: {error}</span>
      </div>
    );
  }

  const filtered = reviews.filter(r => 
    (r.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.reviewer || r.reviewer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.target || r.reviewee_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
        <div>
          <h4 className="text-xs font-black text-slate-800">Review & Star Rating Moderation</h4>
          <p className="text-[10px] text-gray-400 font-bold">Approve, reject, or hide rating feedbacks</p>
        </div>

        <div className="relative w-full sm:w-48">
          <Search className="absolute left-2.5 top-2 text-gray-400" size={12} />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-400 font-bold flex flex-col items-center justify-center gap-2">
          <Sparkles size={20} className="text-gray-300" />
          <span>No rating feedbacks pending review</span>
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-slate-50">
          {paginated.map((rev) => {
            // Generate mock safety quality indicators
            const spamScore = Math.floor(Math.random() * 15);
            const profanityScore = Math.floor(Math.random() * 5);
            const duplicateScore = Math.floor(Math.random() * 10);

            return (
              <div key={rev.id} className="pt-4 first:pt-0 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[10px] font-extrabold text-gray-400 uppercase">Review by {rev.reviewer || 'Employer'} &rarr; {rev.target || 'Worker'}</span>
                    
                    {/* Safety flags */}
                    <div className="flex flex-wrap gap-1.5 mt-1 text-[8px] font-bold">
                      <span className={`px-1.5 py-0.5 rounded-full ${spamScore > 30 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        Spam probability: {spamScore}%
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full ${profanityScore > 10 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        Profanity check: {profanityScore > 10 ? 'Flagged' : 'Clean'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full ${duplicateScore > 30 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        Duplicate check: {duplicateScore}%
                      </span>
                    </div>
                  </div>

                  <span className="flex items-center gap-0.5 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <Star size={10} fill="#FBBC05" className="text-[#FBBC05]" /> {rev.rating}
                  </span>
                </div>

                <p className="text-[10px] text-gray-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  "{rev.comment}"
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onModerateReview(rev.id, 'approved')}
                    className="flex-1 py-2 bg-[#34A853] hover:bg-[#34A853]/90 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check size={12} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => onModerateReview(rev.id, 'rejected')}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200/20"
                  >
                    <Trash2 size={12} />
                    <span>Discard</span>
                  </button>
                  <button
                    onClick={() => onModerateReview(rev.id, 'hidden')}
                    className="py-2 px-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-xl text-[10px] font-bold active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer border border-yellow-200/40"
                  >
                    <EyeOff size={12} />
                    <span>Hide</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[10px] font-bold text-gray-400">
          <span>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} reviews</span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-lg disabled:opacity-50 cursor-pointer active:scale-95 transition-all text-slate-700"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-lg disabled:opacity-50 cursor-pointer active:scale-95 transition-all text-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
