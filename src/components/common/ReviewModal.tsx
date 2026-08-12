"use client";

import React, { useState } from 'react';
import { Star, X, CheckCircle2, PhoneCall, Briefcase, Send, Globe } from 'lucide-react';
import { translations, SUPPORTED_LANGUAGES, LanguageCode } from '@/utils/translations';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: 'employer' | 'worker';
  revieweeId: string;
  revieweeName: string;
  revieweeRole: 'worker' | 'employer';
  interviewId?: string;
  onSuccess?: () => void;
  defaultLang?: LanguageCode;
}

export default function ReviewModal({
  isOpen,
  onClose,
  reviewerId,
  reviewerName,
  reviewerRole,
  revieweeId,
  revieweeName,
  revieweeRole,
  interviewId,
  onSuccess,
  defaultLang = 'en'
}: ReviewModalProps) {
  const [lang, setLang] = useState<LanguageCode>(defaultLang);
  
  // Fetch active translation bundle from src/locales/*.json
  const activeLocale = translations[lang] || translations.en;
  
  // Helper translation lookup with fallback
  const getT = (key: string, defaultText: string) => {
    return activeLocale[key] || translations.en[key] || defaultText;
  };

  const [interactionType, setInteractionType] = useState<'interview_impression' | 'worked_together'>('interview_impression');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  
  const [cat1, setCat1] = useState<number>(5);
  const [cat2, setCat2] = useState<number>(5);
  const [cat3, setCat3] = useState<number>(5);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const categoriesData = reviewerRole === 'employer' 
        ? { punctuality: cat1, skill_hygiene: cat2, polite_behavior: cat3 }
        : { respectful_behavior: cat1, clear_job_terms: cat2, timely_payment: cat3 };

      const { webApiClient } = await import('@/lib/webApiClient');
      const resData = await webApiClient.post('/api/reviews/submit', {
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        reviewer_role: reviewerRole,
        reviewee_id: revieweeId,
        reviewee_name: revieweeName,
        reviewee_role: revieweeRole,
        interaction_type: interactionType,
        rating,
        categories: categoriesData,
        comment,
        interview_id: interviewId
      });

      const data = resData;
      if (data.success) {
        setSubmittedSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSubmittedSuccess(false);
          onClose();
        }, 2200);
      } else {
        alert(data.error || "Failed to submit review");
      }
    } catch (err: any) {
      alert("Error submitting review: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#202124]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-[#1A73E8] rounded-xl">
              <Star size={18} className="fill-[#1A73E8]" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">
                {getT('reviewModalTitle', 'Post-Interaction Rating & Feedback')}
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {getT('feedbackFor', 'Feedback for')} <span className="font-bold text-slate-800">{revieweeName}</span> ({revieweeRole})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector Dropdown using src/locales */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-xl text-[10px] font-bold text-slate-700">
              <Globe size={12} className="text-[#1A73E8]" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LanguageCode)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer max-w-[90px] truncate"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-slate-800 p-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {submittedSuccess ? (
          <div className="p-8 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 bg-emerald-50 text-[#34A853] rounded-full flex items-center justify-center mx-auto border border-emerald-200/60">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-sm font-black text-slate-900">
              {getT('reviewSubmittedSuccess', 'Feedback Submitted Successfully!')}
            </h4>
            <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
              {getT('reviewSubmittedDesc', 'Thank you for maintaining trust on Sevikaa. Your review will go live after Super Admin moderation.')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="p-5 sm:p-6 space-y-4">
            
            {/* Interaction Type Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {getT('interactionTypeLabel', 'Interaction Type')}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setInteractionType('interview_impression')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    interactionType === 'interview_impression'
                      ? 'bg-blue-50/60 border-[#1A73E8] text-[#1A73E8]'
                      : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    <PhoneCall size={14} />
                    <span>{getT('interviewCallLabel', 'Interview Call')}</span>
                  </div>
                  <span className="text-[9.5px] font-medium text-slate-500 mt-1 leading-tight">
                    {getT('callDesc', 'First phone/in-person interview impression')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInteractionType('worked_together')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    interactionType === 'worked_together'
                      ? 'bg-emerald-50/60 border-[#34A853] text-[#34A853]'
                      : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    <Briefcase size={14} />
                    <span>{getT('workedTogetherLabel', 'Worked Together')}</span>
                  </div>
                  <span className="text-[9.5px] font-medium text-slate-500 mt-1 leading-tight">
                    {getT('workDesc', 'Hired for trial or active work engagement')}
                  </span>
                </button>
              </div>
            </div>

            {/* Overall Star Rating Selector */}
            <div className="text-center space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {interactionType === 'worked_together' 
                  ? getT('workplaceRatingLabel', 'Workplace Performance Rating') 
                  : getT('interviewRatingLabel', 'Interview Impression Rating')}
              </span>

              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        size={28}
                        className={active ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                      />
                    </button>
                  );
                })}
              </div>

              <span className="block text-xs font-black text-slate-800">
                {rating === 5 && `⭐ 5/5 - ${getT('star5Label', 'Outstanding Experience')}`}
                {rating === 4 && `⭐ 4/5 - ${getT('star4Label', 'Very Good')}`}
                {rating === 3 && `⭐ 3/5 - ${getT('star3Label', 'Average Experience')}`}
                {rating === 2 && `⭐ 2/5 - ${getT('star2Label', 'Needs Improvement')}`}
                {rating === 1 && `⭐ 1/5 - ${getT('star1Label', 'Unsatisfactory')}`}
              </span>
            </div>

            {/* Category Ratings Breakdown */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {getT('categoryFeedbackLabel', 'Detailed Category Feedback')}
              </span>

              <div className="space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span>{reviewerRole === 'employer' ? getT('punctualityLabel', 'Punctuality & Timing') : getT('respectfulBehaviorLabel', 'Respectful Work Behavior')}</span>
                  <select
                    value={cat1}
                    onChange={(e) => setCat1(Number(e.target.value))}
                    className="p-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    <option value={5}>5 ★</option>
                    <option value={4}>4 ★</option>
                    <option value={3}>3 ★</option>
                    <option value={2}>2 ★</option>
                    <option value={1}>1 ★</option>
                  </select>
                </div>

                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span>{reviewerRole === 'employer' ? getT('skillHygieneLabel', 'Skill Level & Work Hygiene') : getT('clearTermsLabel', 'Clear Job Terms & Scope')}</span>
                  <select
                    value={cat2}
                    onChange={(e) => setCat2(Number(e.target.value))}
                    className="p-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    <option value={5}>5 ★</option>
                    <option value={4}>4 ★</option>
                    <option value={3}>3 ★</option>
                    <option value={2}>2 ★</option>
                    <option value={1}>1 ★</option>
                  </select>
                </div>

                <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span>{reviewerRole === 'employer' ? getT('politeBehaviorLabel', 'Polite Communication') : getT('timelyPaymentLabel', 'Timely Compensation')}</span>
                  <select
                    value={cat3}
                    onChange={(e) => setCat3(Number(e.target.value))}
                    className="p-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    <option value={5}>5 ★</option>
                    <option value={4}>4 ★</option>
                    <option value={3}>3 ★</option>
                    <option value={2}>2 ★</option>
                    <option value={1}>1 ★</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Written Comments */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {getT('commentsLabel', 'Written Feedback & Comments')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={getT('commentPlaceholder', 'Share your genuine feedback...')}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1A73E8] focus:bg-white h-20"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-1 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {getT('cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-1/2 py-2.5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send size={14} />
                <span>{submitting ? getT('submitting', 'Submitting...') : getT('submit', 'Submit Feedback')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
