"use client";

import React, { useState } from 'react';
import { Star, ShieldCheck, Lock, X, CheckCircle2, AlertCircle, Send, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface VerifiedReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: 'employer' | 'worker';
  targetId: string;
  targetName: string;
  targetRole: 'employer' | 'worker';
  interactionType: 'worked' | 'interviewed' | 'interacted' | null;
  onSubmitSuccess: (newReview: any) => void;
}

export const VerifiedReviewModal: React.FC<VerifiedReviewModalProps> = ({
  isOpen,
  onClose,
  reviewerId,
  reviewerName,
  reviewerRole,
  targetId,
  targetName,
  targetRole,
  interactionType,
  onSubmitSuccess
}) => {
  const { t } = useLanguage();

  const [rating, setRating] = useState<number>(5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);
  const [hygieneBehaviorRating, setHygieneBehaviorRating] = useState<number>(5);
  const [workQualityRespectRating, setWorkQualityRespectRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const isEligible = Boolean(interactionType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return;

    setIsSubmitting(true);

    const reviewData = {
      id: `rev-${Date.now()}`,
      reviewer_id: reviewerId,
      reviewer_name: reviewerName,
      reviewer_role: reviewerRole,
      target_id: targetId,
      target_name: targetName,
      target_role: targetRole,
      interaction_type: interactionType,
      rating,
      punctuality_rating: punctualityRating,
      hygiene_behavior_rating: hygieneBehaviorRating,
      work_quality_respect_rating: workQualityRespectRating,
      comment: comment || 'Verified rating submitted for platform audit.',
      status: 'pending_approval',
      created_at: new Date().toISOString()
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitSuccess(reviewData);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto relative animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="bg-blue-50 text-[#1A73E8] text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200/60 inline-flex items-center gap-1">
              <ShieldCheck size={11} />
              <span>{t('writeVerifiedReviewTitle') || "Write Verified Review"}</span>
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 leading-snug">
            Rate {targetName} ({targetRole === 'worker' ? 'Domestic Worker' : 'Household Employer'})
          </h3>
        </div>

        {/* 🔒 INELIGIBLE INTERACTION WARNING (IF NO VERIFIED INTERACTION RECORD) */}
        {!isEligible ? (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2 text-amber-900">
            <div className="flex items-center gap-2 font-black text-xs text-amber-900">
              <Lock size={16} className="text-amber-600 shrink-0" />
              <span>{t('reviewBlockedNoticeTitle') || "Verified Interaction Required"}</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-amber-800">
              {t('reviewBlockedNotice') || "Reviews are allowed only after a verified interaction (Interviewed, Worked, or Applied). You cannot review users you haven't interacted with."}
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Verified Interaction Proof Badge */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-900">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>
                  {interactionType === 'worked' && 'Verified Hiring / Work Record ✓'}
                  {interactionType === 'interviewed' && 'Verified Interview Record ✓'}
                  {interactionType === 'interacted' && 'Verified Job Application Record ✓'}
                </span>
              </div>
              <span className="text-[9px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-black uppercase">
                Eligible
              </span>
            </div>

            {/* Overall Star Rating */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-center">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Overall Satisfaction Rating
              </label>
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                  >
                    <Star
                      size={28}
                      className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-600 block">
                {rating === 5 && '⭐⭐⭐⭐⭐ Exceptional (5 / 5)'}
                {rating === 4 && '⭐⭐⭐⭐ Very Good (4 / 5)'}
                {rating === 3 && '⭐⭐⭐ Average (3 / 5)'}
                {rating === 2 && '⭐⭐ Below Expectations (2 / 5)'}
                {rating === 1 && '⭐ Poor Experience (1 / 5)'}
              </span>
            </div>

            {/* Detailed Criteria Ratings */}
            <div className="space-y-3 bg-white p-3 rounded-2xl border border-slate-100 text-xs font-bold text-slate-700">
              {/* Punctuality */}
              <div className="flex items-center justify-between">
                <span className="text-slate-600">{t('punctualityRatingLabel') || "Punctuality & Timeliness:"}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPunctualityRating(st)}
                      className="cursor-pointer"
                    >
                      <Star size={14} className={st <= punctualityRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Hygiene / Behavior */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-600">
                  {targetRole === 'worker' 
                    ? (t('hygieneRatingLabel') || "Hygiene & Cleanliness:") 
                    : (t('fairPayRatingLabel') || "Fair Pay & Respect:")}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setHygieneBehaviorRating(st)}
                      className="cursor-pointer"
                    >
                      <Star size={14} className={st <= hygieneBehaviorRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Work Quality / Behavior */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-600">{t('workQualityRatingLabel') || "Work Quality & Behavior:"}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setWorkQualityRespectRating(st)}
                      className="cursor-pointer"
                    >
                      <Star size={14} className={st <= workQualityRespectRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Written Comment Textarea */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase block">
                {t('reviewCommentLabel') || "Written Feedback / Experience Notes"}
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share specific details about punctuality, work quality, or household interaction..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1A73E8]"
              />
            </div>

            {/* Admin Audit Notice */}
            <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100 flex items-start gap-2 text-[10.5px] font-semibold text-blue-900">
              <Sparkles size={14} className="text-[#1A73E8] shrink-0 mt-0.5" />
              <span>{t('reviewSubmittedPendingAdminNotice') || "Submitted reviews are audited by Sevikaa Admin before publishing to prevent fake or abusive ratings."}</span>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-2xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Send size={14} />
              <span>{isSubmitting ? 'Submitting to Admin Queue...' : (t('submitReviewBtn') || 'Submit Verified Review for Admin Approval')}</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
