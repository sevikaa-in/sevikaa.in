"use client";

import React, { useState, useEffect } from 'react';
import { 
  Star, ShieldCheck, CheckCircle2, XCircle, Clock, Filter, 
  MessageSquare, Sparkles, Building, ArrowLeft, RefreshCw, ThumbsUp, ThumbsDown 
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface ReviewItem {
  id: string;
  reviewer_name: string;
  reviewer_role: 'employer' | 'worker';
  target_name: string;
  target_role: 'employer' | 'worker';
  rating: number;
  categories: any;
  comment: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  timestamp: string;
}

export default function AdminReviewsPage() {
  const { t } = useLanguage();
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.get(`/api/super-admin/reviews?status=${filterStatus}`);
      if (data && data.success && Array.isArray(data.reviews)) {
        const mapped: ReviewItem[] = data.reviews.map((r: any) => ({
          id: r.id,
          reviewer_name: r.reviewer_name || 'Verified User',
          reviewer_role: (r.reviewer_role || 'employer').toLowerCase() as any,
          target_name: r.reviewee_name || r.target_name || 'Platform User',
          target_role: (r.reviewee_role || r.target_role || 'worker').toLowerCase() as any,
          rating: r.rating || 5,
          categories: r.categories || {},
          comment: r.comment || '',
          status: r.status || 'pending',
          timestamp: r.timestamp || 'Recently'
        }));
        setReviewsList(mapped);
      } else {
        setReviewsList([]);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filterStatus]);

  const handleApprove = async (id: string) => {
    setReviewsList(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    setToastMessage('Review approved and published to public profiles ✓');
    setTimeout(() => setToastMessage(null), 3000);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      await webApiClient.post('/api/super-admin/reviews', { reviewId: id, status: 'approved', adminEmail: 'societyadmin@sevikaa.in' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    setReviewsList(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    setToastMessage('Review rejected and archived.');
    setTimeout(() => setToastMessage(null), 3000);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      await webApiClient.post('/api/super-admin/reviews', { reviewId: id, status: 'rejected', adminEmail: 'societyadmin@sevikaa.in' });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReviews = reviewsList.filter(r => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return r.status === 'pending' || r.status === 'pending_approval';
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-20 p-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl z-50 text-xs font-bold flex items-center gap-2 animate-slide-up border border-slate-700">
          <Sparkles size={16} className="text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Star size={18} className="text-amber-500 fill-amber-500" />
              <span>Society &amp; Post-Interview Reviews Moderation</span>
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Review and moderate mutual post-interview feedback before publication across Sevikaa.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 text-xs font-bold w-fit">
        <button
          onClick={() => setFilterStatus('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            filterStatus === 'pending'
              ? 'bg-white text-[#1A73E8] shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Clock size={15} />
          <span>Pending Moderation</span>
        </button>

        <button
          onClick={() => setFilterStatus('approved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            filterStatus === 'approved'
              ? 'bg-white text-[#34A853] shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <CheckCircle2 size={15} />
          <span>Approved</span>
        </button>

        <button
          onClick={() => setFilterStatus('rejected')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            filterStatus === 'rejected'
              ? 'bg-white text-[#EA4335] shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <XCircle size={15} />
          <span>Rejected</span>
        </button>

        <button
          onClick={() => setFilterStatus('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            filterStatus === 'all'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span>All</span>
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 font-bold text-xs">
            No reviews matching this filter status.
          </div>
        ) : (
          filteredReviews.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-xs">{item.reviewer_name}</span>
                  <span className="bg-blue-50 text-[#1A73E8] text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    {item.reviewer_role}
                  </span>
                  <span className="text-slate-400 text-xs">→</span>
                  <span className="font-black text-slate-900 text-xs">{item.target_name}</span>
                  <span className="bg-purple-50 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    {item.target_role}
                  </span>
                </div>

                <span className="text-[10px] font-mono font-bold text-slate-400">{item.timestamp}</span>
              </div>

              {/* Rating breakdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={15}
                      className={s <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                    />
                  ))}
                  <span className="font-black text-slate-900 text-xs ml-1">{item.rating}/5</span>
                </div>

                {item.categories && Object.keys(item.categories).length > 0 && (
                  <div className="flex flex-wrap gap-2 text-[9px] font-bold">
                    {Object.entries(item.categories).map(([k, v]) => (
                      <span key={k} className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 capitalize">
                        {k.replace('_', ' ')}: <strong className="text-slate-900">{String(v)}/5</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Comment */}
              <p className="p-3 bg-slate-50 text-slate-800 rounded-xl text-xs font-medium leading-relaxed border border-slate-100">
                "{item.comment || 'No written comment provided'}"
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div>
                  {(item.status === 'pending' || item.status === 'pending_approval') && (
                    <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-amber-200/50 uppercase">
                      Pending Moderation
                    </span>
                  )}
                  {item.status === 'approved' && (
                    <span className="bg-[#34A853]/10 text-[#34A853] text-[9px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200/50 uppercase">
                      Approved
                    </span>
                  )}
                  {item.status === 'rejected' && (
                    <span className="bg-[#EA4335]/10 text-[#EA4335] text-[9px] font-black px-2.5 py-0.5 rounded-full border border-red-200/50 uppercase">
                      Rejected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(item.id)}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-red-50 hover:text-[#EA4335] text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-200/60"
                  >
                    <ThumbsDown size={13} />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleApprove(item.id)}
                    className="py-1.5 px-3.5 bg-[#34A853] hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1 active:scale-95"
                  >
                    <ThumbsUp size={13} />
                    <span>Approve</span>
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
