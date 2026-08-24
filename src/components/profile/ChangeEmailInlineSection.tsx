"use client";

import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, Lock, AlertCircle, CheckCircle2, RefreshCw, ArrowRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useLanguage } from '@/context/LanguageContext';

interface ChangeEmailInlineSectionProps {
  currentEmail: string;
  onSuccess: (newEmail: string) => void;
  label?: string;
}

export function ChangeEmailInlineSection({ currentEmail, onSuccess, label }: ChangeEmailInlineSectionProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  // Sequential Auto-Trigger Flow for Email:
  // 'input_new_email': User enters New Email address up front
  // 'step1_verify': User enters OTP 1 (sent to Current Mobile/Email)
  // 'step2_verify': Identity verified -> OTP 2 auto-dispatched to New Email -> User enters OTP 2
  // 'success': Completed & Saved to DB
  const [step, setStep] = useState<'input_new_email' | 'step1_verify' | 'step2_verify' | 'success'>('input_new_email');
  
  const [newEmail, setNewEmail] = useState('');
  const [requestId, setRequestId] = useState('');
  const [oldContactMasked, setOldContactMasked] = useState('');
  const [oldOtp, setOldOtp] = useState('');
  
  const [newEmailMasked, setNewEmailMasked] = useState('');
  const [newOtp, setNewOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Timer state (10 minutes = 600s)
  const [timeLeft, setTimeLeft] = useState(600);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isEditing && (step === 'step1_verify' || step === 'step2_verify') && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isEditing, step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleReset = () => {
    setIsEditing(false);
    setStep('input_new_email');
    setNewEmail('');
    setRequestId('');
    setOldOtp('');
    setNewOtp('');
    setError(null);
    setLoading(false);
    setTimeLeft(600);
    setCanResend(false);
  };

  // Helper mask for email
  const maskEmailStr = (emailStr: string) => {
    if (!emailStr || !emailStr.includes('@')) return emailStr;
    const parts = emailStr.split('@');
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 3 ? `${name.slice(0, 3)}***` : `${name.slice(0, 1)}***`;
    return `${maskedName}@${domain}`;
  };

  // ---------------------------------------------------------------------------
  // STEP 1 INITIATION: Enter New Email Address & dispatch Security OTP 1
  // ---------------------------------------------------------------------------
  const handleRequestStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNew = newEmail.trim().toLowerCase();
    if (!cleanNew || !cleanNew.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (currentEmail && currentEmail.trim().toLowerCase() === cleanNew) {
      setError('New email address must be different from your current email');
      return;
    }

    setLoading(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/auth/change-email', {
        action: 'request-step1-otp',
        newEmail: cleanNew
      });
      if (data.error) {
        throw new Error(data.error || 'Failed to send security verification code');
      }

      setRequestId(data.requestId);
      setOldContactMasked(data.oldContactMasked);
      setStep('step1_verify');
      setTimeLeft(600);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Error sending verification code.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 1 VERIFY: Validate Security OTP 1 -> INSTANTLY AUTO-TRIGGERS OTP 2 to New Email
  // ---------------------------------------------------------------------------
  const handleVerifyStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (oldOtp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP sent to your registered contact');
      return;
    }

    setLoading(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/auth/change-email', {
        action: 'verify-step1-otp',
        requestId,
        oldOtp: oldOtp.trim()
      });
      if (data.error) {
        throw new Error(data.error || 'Step 1 OTP verification failed');
      }

      // Step 1 Verified! Server instantly sent OTP 2 to New Email
      setNewEmailMasked(data.newEmailMasked || maskEmailStr(newEmail));
      setStep('step2_verify');
      setTimeLeft(600);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Incorrect OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 2 VERIFY: Validate OTP 2 (New Email) & Save to DB
  // ---------------------------------------------------------------------------
  const handleVerifyStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newOtp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP sent to your new email address');
      return;
    }

    setLoading(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/auth/change-email', {
        action: 'verify-step2-otp',
        requestId,
        newOtp: newOtp.trim()
      });
      if (data.error) {
        throw new Error(data.error || 'Step 2 OTP verification failed');
      }

      setStep('success');
      onSuccess(data.newEmail);

      setTimeout(() => {
        handleReset();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Incorrect OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DEFAULT READ-ONLY VIEW
  // ---------------------------------------------------------------------------
  if (!isEditing) {
    return (
      <div className="space-y-1">
        <label className="text-slate-500 text-[10px] uppercase block font-bold">
          {label || t('primaryEmailLabel') || "Primary Email Address"}
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3.5 top-3 text-slate-400" size={15} />
            <input 
              type="email" 
              readOnly
              disabled
              value={currentEmail} 
              placeholder={t('noEmailLinked') || "No email linked"}
              className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold cursor-not-allowed select-none text-xs"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="py-2.5 px-5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Lock size={12} />
            <span>{t('updateBtn') || "Update"}</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // EXPANDED INLINE SECTION: SEQUENTIAL EMAIL UPDATE FLOW
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border-2 border-blue-200 shadow-sm animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#1A73E8] text-white">
            <Mail size={14} />
          </div>
          <h4 className="text-xs font-black text-slate-900">
            {step === 'input_new_email' && 'Update Primary Email Address'}
            {step === 'step1_verify' && 'Step 1: Security Identity Verification'}
            {step === 'step2_verify' && 'Step 2: Verify New Email Address'}
            {step === 'success' && 'Email Address Updated!'}
          </h4>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Enter New Email Address */}
      {step === 'input_new_email' && (
        <form onSubmit={handleRequestStep1} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10.5px] font-extrabold text-slate-700">Enter New Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-slate-400" size={15} />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. name@example.com"
                className="w-full p-2.5 pl-10 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:border-[#1A73E8] focus:outline-none text-xs"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              A security code will first be sent to your registered contact ({currentEmail ? maskEmailStr(currentEmail) : 'mobile / email'}) to verify your identity.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-3.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newEmail.includes('@')}
              className="py-2 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Sending Security Code...</span>
                </>
              ) : (
                <>
                  <span>Send Security Code</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 1 VERIFY: Enter Security OTP 1 */}
      {step === 'step1_verify' && (
        <form onSubmit={handleVerifyStep1} className="space-y-3">
          <div className="bg-blue-50/70 border border-blue-100 p-2.5 rounded-xl text-[11px] text-blue-900 font-semibold flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#1A73E8] shrink-0" />
            <span>Security code sent to <strong>{oldContactMasked || 'your registered contact'}</strong>.</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-700 uppercase block">
              1. Enter Security Code sent to {oldContactMasked}
            </label>
            <input
              type="text"
              maxLength={6}
              value={oldOtp}
              onChange={(e) => setOldOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit OTP"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-black text-sm text-slate-900 focus:border-[#1A73E8] focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-500 font-medium font-mono">
              Code valid for: <strong className="text-slate-800">{formatTime(timeLeft)}</strong>
            </span>
            <button
              type="button"
              onClick={handleRequestStep1}
              disabled={!canResend && timeLeft > 0}
              className={`font-bold text-xs flex items-center gap-1 ${
                canResend || timeLeft === 0 ? 'text-[#1A73E8] hover:underline cursor-pointer' : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw size={11} />
              <span>Resend Code</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-3.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || oldOtp.length !== 6}
              className="py-2 px-5 bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Verifying & Sending OTP 2...</span>
                </>
              ) : (
                <>
                  <span>Verify Code & Continue</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2 VERIFY: OTP 1 Verified! Auto-dispatched OTP 2 -> Enter New Email OTP */}
      {step === 'step2_verify' && (
        <form onSubmit={handleVerifyStep2} className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-[11px] text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>Identity verified! OTP 2 dispatched to new email <strong>{newEmailMasked || maskEmailStr(newEmail)}</strong>.</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-700 uppercase block">
              2. Enter 6-Digit OTP sent to {newEmailMasked || maskEmailStr(newEmail)}
            </label>
            <input
              type="text"
              maxLength={6}
              value={newOtp}
              onChange={(e) => setNewOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit OTP"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-black text-sm text-slate-900 focus:border-[#1A73E8] focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-500 font-medium font-mono">
              OTP valid for: <strong className="text-slate-800">{formatTime(timeLeft)}</strong>
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-3.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || newOtp.length !== 6}
              className="py-2 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Verifying & Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Verify & Save New Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* SUCCESS STAGE */}
      {step === 'success' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center space-y-1">
          <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
          <h4 className="text-sm font-black text-emerald-900">Email Address Updated Successfully!</h4>
          <p className="text-xs font-medium text-emerald-700">Your new primary email ({newEmailMasked || maskEmailStr(newEmail)}) is saved to your account database.</p>
        </div>
      )}

    </div>
  );
}
