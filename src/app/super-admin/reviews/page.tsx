"use client";

import React, { useState } from 'react';
import { 
  Star, ShieldCheck, CheckCircle2, XCircle, Clock, Filter, 
  MessageSquare, UserCheck, ShieldAlert, Sparkles, Building, ArrowLeft, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface ReviewItem {
  id: string;
  reviewer_name: string;
  reviewer_role: 'employer' | 'worker';
  target_name: string;
  target_role: 'employer' | 'worker';
  interaction_type: 'worked' | 'interviewed' | 'interacted';
  rating: number;
  punctuality_rating: number;
  hygiene_behavior_rating: number;
  work_quality_respect_rating: number;
  comment: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  created_at: string;
  society_name?: string;
}

export default function SuperAdminReviewsPage() {
  const [filterStatus, setFilterStatus] = useState<'pending_approval' | 'approved' | 'rejected' | 'all'>('pending_approval');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);

  React.useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          const mapped: ReviewItem[] = data.map((r: any) => ({
            id: r.id,
            reviewer_name: r.reviewer_name || r.author_name || 'Verified User',
            reviewer_role: r.reviewer_role || 'employer',
            target_name: r.target_name || r.worker_name || 'Platform User',
            target_role: r.target_role || 'worker',
            interaction_type: r.interaction_type || 'worked',
            rating: r.rating || 5,
            punctuality_rating: r.punctuality_rating || 5,
            hygiene_behavior_rating: r.hygiene_behavior_rating || 5,
            work_quality_respect_rating: r.work_quality_respect_rating || 5,
            comment: r.comment || r.feedback || '',
            status: r.status || 'pending_approval',
            created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
            society_name: r.society_name || 'General Locality'
          }));
          setReviewsList(mapped);
        } else {
          setReviewsList([]);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };

    fetchReviews();
  }, []);

  const handleApprove = async (id: string) => {
    setReviewsList(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    setToastMessage('Review approved & published across platform ✓');
    setTimeout(() => setToastMessage(null), 3000);

    try {
      await supabase.from('reviews').update({ status: 'approved' }).eq('id', id);
    } catch (err) {
      console.error("Error approving review in DB:", err);
    }
  };

  const handleReject = async (id: string) => {
    setReviewsList(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    setToastMessage('Review rejected and archived.');
    setTimeout(() => setToastMessage(null), 3000);

    try {
      await supabase.from('reviews').update({ status: 'rejected' }).eq('id', id);
    } catch (err) {
      console.error("Error rejecting review in DB:", err);
    }
  };

  const handleDelete = async (id: string) => {
    setReviewsList(prev => prev.filter(r => r.id !== id));
    setToastMessage('Review permanently purged from platform ledger.');
    setTimeout(() => setToastMessage(null), 3000);

    try {
      await supabase.from('reviews').delete().eq('id', id);
    } catch (err) {
      console.error("Error deleting review from DB:", err);
    }
  };

  const filteredReviews = reviewsList.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-20 p-4">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-slate-900 text-white text-xs font-black px-4 py-3 rounded-2xl shadow-2xl z-[9999] flex items-center gap-2 animate-bounce border border-slate-700">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-50 text-purple-700 text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border border-purple-200/60 inline-flex items-center gap-1">
              <ShieldCheck size={11} />
              <span>Super Admin Global Audit</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare size={20} className="text-purple-600" />
            <span>Super Admin Review Moderation Queue</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Global audit control for 2-way platform reviews. Approvals grant public visibility across society search results.
          </p>
        </div>

        <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1.5 rounded-2xl border border-amber-200 shrink-0">
          {reviewsList.filter(r => r.status === 'pending_approval').length} Pending Approval
        </span>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold text-slate-600">
        {[
          { id: 'pending_approval', label: 'Pending Approval ⏳', count: reviewsList.filter(r => r.status === 'pending_approval').length },
          { id: 'approved', label: 'Approved & Published ✓', count: reviewsList.filter(r => r.status === 'approved').length },
          { id: 'rejected', label: 'Rejected ✕', count: reviewsList.filter(r => r.status === 'rejected').length },
          { id: 'all', label: 'All Records', count: reviewsList.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-xl text-center cursor-pointer transition-all ${
              filterStatus === tab.id 
                ? 'bg-white text-purple-700 shadow-xs font-black' 
                : 'hover:text-slate-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border border-slate-100 text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto text-slate-300" />
            <p className="text-xs font-black text-slate-400">No reviews found matching this moderation filter.</p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-4 relative"
            >
              {/* Header: Reviewer & Target info */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{rev.reviewer_name}</span>
                    <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-black uppercase">
                      {rev.reviewer_role}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">&rarr; Reviewed &rarr;</span>
                    <span className="text-xs font-black text-purple-700">{rev.target_name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10.5px] font-bold text-slate-500">
                    <Building size={12} className="text-slate-400" />
                    <span>{rev.society_name || 'Gated Society Network'}</span>
                    <span>&bull;</span>
                    <span>{new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {rev.status === 'pending_approval' && (
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-amber-200">
                      Pending Audit ⏳
                    </span>
                  )}
                  {rev.status === 'approved' && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-200">
                      Approved ✓
                    </span>
                  )}
                  {rev.status === 'rejected' && (
                    <span className="bg-red-100 text-red-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-red-200">
                      Rejected ✕
                    </span>
                  )}
                </div>
              </div>

              {/* Verified Interaction Badge */}
              <div className="bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs font-bold text-emerald-900">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>
                    Verified Interaction Proof: 
                    {rev.interaction_type === 'worked' && ' Hired / Worked Together Record ✓'}
                    {rev.interaction_type === 'interviewed' && ' Scheduled Interview Record ✓'}
                    {rev.interaction_type === 'interacted' && ' Job Application Record ✓'}
                  </span>
                </div>
                <span className="text-[9px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-black uppercase">
                  Verified Proof
                </span>
              </div>

              {/* Ratings & Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Overall Star Rating</span>
                  <div className="flex items-center gap-1 text-amber-500 mt-0.5">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <Star key={st} size={14} className={st <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                    ))}
                    <span className="text-slate-900 font-black ml-1">({rev.rating}/5)</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Punctuality:</span>
                    <span className="text-slate-900 font-black">{rev.punctuality_rating} / 5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Hygiene / Behavior:</span>
                    <span className="text-slate-900 font-black">{rev.hygiene_behavior_rating} / 5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Work Quality:</span>
                    <span className="text-slate-900 font-black">{rev.work_quality_respect_rating} / 5</span>
                  </div>
                </div>
              </div>

              {/* Comment Box */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-black block">Written Feedback</span>
                <p className="text-xs text-slate-800 font-medium bg-purple-50/30 p-3 rounded-2xl border border-purple-100/60 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleDelete(rev.id)}
                  className="py-2 px-3 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                  title="Purge Review"
                >
                  <Trash2 size={13} />
                  <span>Purge</span>
                </button>
                {rev.status === 'pending_approval' && (
                  <>
                    <button
                      onClick={() => handleReject(rev.id)}
                      className="py-2 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-black cursor-pointer transition-all border border-red-200 flex items-center gap-1"
                    >
                      <XCircle size={14} />
                      <span>Reject Review</span>
                    </button>
                    <button
                      onClick={() => handleApprove(rev.id)}
                      className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>Approve &amp; Publish ✓</span>
                    </button>
                  </>
                )}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
