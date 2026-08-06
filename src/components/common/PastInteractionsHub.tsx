"use client";

import React, { useState, useEffect } from 'react';
import { Star, Briefcase, UserCheck, PhoneCall, CheckCircle2, RefreshCw } from 'lucide-react';
import ReviewModal from './ReviewModal';

export interface InteractedPerson {
  id: string;
  name: string;
  role: 'worker' | 'employer';
  phone?: string;
  jobCategory?: string;
  lastInteractionDate: string;
  interactionType: 'interview_call' | 'worked_together';
  hasReviewed?: boolean;
}

interface PastInteractionsHubProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'employer' | 'worker';
}

export default function PastInteractionsHub({
  currentUserId,
  currentUserName,
  currentUserRole
}: PastInteractionsHubProps) {
  const [activeTab, setActiveTab] = useState<'interactions' | 'given' | 'received'>('interactions');
  const [interactedPeople, setInteractedPeople] = useState<InteractedPerson[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<any[]>([]);
  const [reviewsReceived, setReviewsReceived] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReviewTarget, setSelectedReviewTarget] = useState<InteractedPerson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/history?userId=${currentUserId}&role=${currentUserRole}`);
      const data = await res.json();
      if (data.success) {
        setInteractedPeople(data.interactedPeople || []);
        setReviewsGiven(data.reviewsGiven || []);
        setReviewsReceived(data.reviewsReceived || []);
      }
    } catch (err) {
      console.error("Error fetching review history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) fetchHistory();
  }, [currentUserId]);

  const handleOpenReview = (person: InteractedPerson) => {
    setSelectedReviewTarget(person);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-5 animate-fade-in w-full max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <UserCheck size={18} className="text-[#1A73E8]" />
            <span>Past Interacted People &amp; Rating History</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Review past {currentUserRole === 'employer' ? 'candidates interviewed or hired' : 'employers contacted or worked with'}.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200/60 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 text-xs font-bold w-fit">
        <button
          onClick={() => setActiveTab('interactions')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            activeTab === 'interactions' ? 'bg-white text-[#1A73E8] shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Past Interacted ({interactedPeople.length})
        </button>
        <button
          onClick={() => setActiveTab('given')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            activeTab === 'given' ? 'bg-white text-[#34A853] shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Reviews Given ({reviewsGiven.length})
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-black ${
            activeTab === 'received' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Reviews Received ({reviewsReceived.length})
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
          <div className="w-6 h-6 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold">Loading...</span>
        </div>
      )}

      {/* Tab 1: Interacted People */}
      {!loading && activeTab === 'interactions' && (
        <div className="space-y-3">
          {interactedPeople.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              <UserCheck size={32} className="text-slate-300" />
              <div className="text-center">
                <p className="text-xs font-black text-slate-500">No interactions yet</p>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  {currentUserRole === 'employer'
                    ? 'Workers who apply to your jobs or attend interviews will appear here.'
                    : 'Employers you apply to or interview with will appear here.'}
                </p>
              </div>
            </div>
          ) : (
            interactedPeople.map((person) => {
              const alreadyReviewed = reviewsGiven.some(r => r.reviewee_id === person.id);
              return (
                <div
                  key={person.id}
                  className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white border border-slate-200/80 rounded-2xl text-slate-700 shrink-0">
                      {person.interactionType === 'worked_together' ? (
                        <Briefcase size={18} className="text-[#34A853]" />
                      ) : (
                        <PhoneCall size={18} className="text-[#1A73E8]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs">{person.name}</span>
                        <span className="bg-blue-50 text-[#1A73E8] text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-blue-100">
                          {person.role}
                        </span>
                        {person.interactionType === 'worked_together' && (
                          <span className="bg-emerald-50 text-[#34A853] text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-100">
                            Worked Together
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5">
                        {person.jobCategory || 'General Interaction'} &bull; <span className="font-mono">{person.lastInteractionDate}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {alreadyReviewed ? (
                      <span className="bg-emerald-50 text-[#34A853] text-[10px] font-black px-3 py-1.5 rounded-xl border border-emerald-200/60 flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        <span>Review Submitted</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenReview(person)}
                        className="py-2 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                      >
                        <Star size={14} className="fill-white" />
                        <span>Rate &amp; Review</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Reviews Given */}
      {!loading && activeTab === 'given' && (
        <div className="space-y-3">
          {reviewsGiven.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl">
              You haven't submitted any reviews yet.
            </div>
          ) : (
            reviewsGiven.map((r) => (
              <div key={r.id} className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                  <span>Feedback for: {r.reviewee_name} ({r.reviewee_role})</span>
                  <span className="text-[10px] font-mono text-slate-400">{r.timestamp}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                  ))}
                  <span className="text-xs font-black text-slate-800 ml-1">{r.rating}/5</span>
                </div>
                <p className="text-xs text-slate-700 font-medium bg-white p-2.5 rounded-xl border border-slate-100">
                  "{r.comment || 'No written comment'}"
                </p>
                <div className="pt-1">
                  {r.status === 'approved' ? (
                    <span className="bg-emerald-50 text-[#34A853] text-[9px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Approved &amp; Published
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-amber-200">
                      Pending Moderation
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Reviews Received */}
      {!loading && activeTab === 'received' && (
        <div className="space-y-3">
          {reviewsReceived.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl">
              No approved reviews received on your profile yet.
            </div>
          ) : (
            reviewsReceived.map((r) => (
              <div key={r.id} className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                  <span>From: {r.reviewer_name} ({r.reviewer_role})</span>
                  <span className="text-[10px] font-mono text-slate-400">{r.timestamp}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
                  ))}
                  <span className="text-xs font-black text-slate-800 ml-1">{r.rating}/5</span>
                </div>
                <p className="text-xs text-slate-700 font-medium bg-white p-2.5 rounded-xl border border-slate-100">
                  "{r.comment}"
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Review Modal */}
      {selectedReviewTarget && (
        <ReviewModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReviewTarget(null);
          }}
          reviewerId={currentUserId}
          reviewerName={currentUserName}
          reviewerRole={currentUserRole}
          revieweeId={selectedReviewTarget.id}
          revieweeName={selectedReviewTarget.name}
          revieweeRole={selectedReviewTarget.role}
          onSuccess={fetchHistory}
        />
      )}
    </div>
  );
}
