
"use client";

import React, { useState, useEffect } from 'react';
import { useSuperAdminDashboard } from '../layout';
import { 
  Star, CheckCircle2, XCircle, ShieldCheck, Search, RefreshCw, 
  MessageSquare, User, ArrowRight, Clock, ThumbsUp, ThumbsDown
} from 'lucide-react';

export default function ReviewsPage() {
  const { showToast, user } = useSuperAdminDashboard();

  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/reviews?status=${statusFilter}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviewsList(data.reviews);
      }
    } catch (err) {
      console.warn("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const handleModerateReview = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    setActionLoading(reviewId);
    try {
      const res = await fetch('/api/super-admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          status: newStatus,
          adminEmail: user?.email || 'superadmin@sevikaa.in'
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Review ${newStatus.toUpperCase()} successfully!`, newStatus === 'approved' ? 'success' : 'info');
        fetchReviews();
      } else {
        showToast(data.error || 'Failed to moderate review', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Moderation network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReviews = reviewsList.filter((r) => {
    const matchesSearch = (r.reviewer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.reviewee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.comment || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const pendingCount = reviewsList.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-6xl pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Star size={18} className="text-amber-500 fill-amber-500" />
            <span>Post-Interview Rating &amp; Review Moderation Console</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Moderate post-interview feedback submitted by employers and workers across India before publication.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Moderation Status Tabs */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 text-xs font-bold w-fit">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            statusFilter === 'pending'
              ? 'bg-white text-[#1A73E8] shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Clock size={15} />
          <span>Pending Queue ({pendingCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            statusFilter === 'approved'
              ? 'bg-white text-[#34A853] shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <CheckCircle2 size={15} />
          <span>Approved</span>
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            statusFilter === 'rejected'
              ? 'bg-white text-[#EA4335] shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <XCircle size={15} />
          <span>Rejected</span>
        </button>

        <button
          onClick={() => setStatusFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            statusFilter === 'all'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span>All Reviews</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search reviewer, candidate, or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#1A73E8] focus:outline-none"
          />
        </div>

        <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase">
          {filteredReviews.length} Reviews
        </span>
      </div>

      {/* Reviews Queue Cards */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 font-bold text-xs">
            No reviews matching your filter in moderation queue.
          </div>
        ) : (
          filteredReviews.map((r) => (
            <div 
              key={r.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4 hover:border-slate-200 transition-all"
            >
              {/* Card Header: Reviewer -> Target User */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-3">
                  {/* Reviewer Badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900 text-xs">{r.reviewer_name}</span>
                    <span className="bg-blue-50 text-[#1A73E8] text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-blue-100">
                      {r.reviewer_role}
                    </span>
                  </div>

                  <ArrowRight size={14} className="text-slate-300 shrink-0" />

                  {/* Target Badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900 text-xs">{r.reviewee_name}</span>
                    <span className="bg-purple-50 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-purple-100">
                      {r.reviewee_role}
                    </span>
                  </div>
                  {/* Interaction Stage Badge */}
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                    r.interaction_type === 'worked_together' || r.interaction_type === 'worked'
                      ? 'bg-emerald-50 text-[#34A853] border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {r.interaction_type === 'worked_together' || r.interaction_type === 'worked' ? '💼 Worked Together' : '📞 Call Impression'}
                  </span>
                </div>

                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {r.timestamp}
                </span>
              </div>

              {/* Star Rating & Category Scores */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/80">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                      />
                    ))}
                  </div>
                  <span className="font-black text-slate-900 text-xs ml-1">{r.rating} / 5 Rating</span>
                </div>

                {/* Category Chips */}
                {r.categories && Object.keys(r.categories).length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.entries(r.categories).map(([k, v]) => (
                      <span key={k} className="bg-white text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-slate-200/60 capitalize">
                        {k.replace('_', ' ')}: <strong className="text-slate-900">{String(v)}/5</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback Comment Text */}
              <div className="space-y-1">
                <span className="block text-[9.5px] font-bold text-gray-400 uppercase">Feedback Comment:</span>
                <p className="p-3 bg-slate-50 text-slate-800 rounded-xl text-xs font-medium leading-relaxed border border-slate-100">
                  "{r.comment || 'No written comment provided'}"
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div>
                  {r.status === 'approved' && (
                    <span className="bg-[#34A853]/10 text-[#34A853] text-[9.5px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200/50 uppercase">
                      Approved &amp; Live
                    </span>
                  )}
                  {r.status === 'rejected' && (
                    <span className="bg-[#EA4335]/10 text-[#EA4335] text-[9.5px] font-black px-2.5 py-0.5 rounded-full border border-red-200/50 uppercase">
                      Rejected
                    </span>
                  )}
                  {r.status === 'pending' && (
                    <span className="bg-amber-50 text-amber-700 text-[9.5px] font-black px-2.5 py-0.5 rounded-full border border-amber-200/50 uppercase">
                      Pending Moderation
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={actionLoading === r.id}
                    onClick={() => handleModerateReview(r.id, 'rejected')}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-red-50 hover:text-[#EA4335] text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200/60"
                  >
                    <ThumbsDown size={13} />
                    <span>Reject</span>
                  </button>

                  <button
                    disabled={actionLoading === r.id}
                    onClick={() => handleModerateReview(r.id, 'approved')}
                    className="py-1.5 px-3.5 bg-[#34A853] hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    <ThumbsUp size={13} />
                    <span>Approve Review</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
