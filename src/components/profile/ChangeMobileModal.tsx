"use client";

import React, { useState, useEffect } from 'react';
import { Phone, ShieldCheck, Lock, AlertCircle, CheckCircle2, X, RefreshCw, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ChangeMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhone: string;
  onSuccess: (newPhone: string) => void;
}

export function ChangeMobileModal({ isOpen, onClose, currentPhone, onSuccess }: ChangeMobileModalProps) {
  const [step, setStep] = useState<'input' | 'verify' | 'success'>('input');
  const [newPhone, setNewPhone] = useState('');
  const [oldOtp, setOldOtp] = useState('');
  const [newOtp, setNewOtp] = useState('');
  const [requestId, setRequestId] = useState('');
  const [oldPhoneMasked, setOldPhoneMasked] = useState('');
  const [newPhoneMasked, setNewPhoneMasked] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Timer state (10 minutes = 600s)
  const [timeLeft, setTimeLeft] = useState(600);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'verify' && timeLeft > 0) {
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
  }, [step, timeLeft]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleReset = () => {
    setStep('input');
    setNewPhone('');
    setOldOtp('');
    setNewOtp('');
    setRequestId('');
    setError(null);
    setLoading(false);
    setTimeLeft(600);
    setCanResend(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // ---------------------------------------------------------------------------
  // STEP 1: Request Change & Dispatch Dual OTPs
  // ---------------------------------------------------------------------------
  const handleRequestOtps = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNew = newPhone.replace(/\D/g, '').slice(-10);
    if (cleanNew.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    const cleanCurrent = currentPhone.replace(/\D/g, '').slice(-10);
    if (cleanCurrent === cleanNew) {
      setError('New mobile number must be different from your current number');
      return;
    }

    setLoading(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const result = await webApiClient.post('/api/auth/change-mobile', {
        action: 'request-change',
        newPhone: cleanNew
      });
      if (result.error) {
        throw new Error(result.error || 'Failed to send verification OTPs');
      }

      setRequestId(result.requestId);
      setOldPhoneMasked(result.oldPhoneMasked || `+91 ******${cleanCurrent.slice(-4)}`);
      setNewPhoneMasked(result.newPhoneMasked || `+91 ******${cleanNew.slice(-4)}`);
      setStep('verify');
      setTimeLeft(600);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 2: Verify Dual OTPs & Submit
  // ---------------------------------------------------------------------------
  const handleVerifyDualOtps = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (oldOtp.trim().length !== 6) {
      setError('Please enter the complete 6-digit OTP sent to your current mobile number');
      return;
    }

    if (newOtp.trim().length !== 6) {
      setError('Please enter the complete 6-digit OTP sent to your new mobile number');
      return;
    }

    setLoading(true);
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const result = await webApiClient.post('/api/auth/change-mobile', {
        action: 'verify-and-update',
        requestId,
        oldOtp: oldOtp.trim(),
        newOtp: newOtp.trim()
      });
      if (result.error) {
        throw new Error(result.error || 'Invalid verification OTPs');
      }

      setStep('success');
      setTimeout(() => {
        onSuccess(result.newPhone || newPhone.replace(/\D/g, '').slice(-10));
        handleClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the OTPs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-all">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Change Mobile Number</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Dual-OTP Security Verification</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Phone Input Stage */}
          {step === 'input' && (
            <form onSubmit={handleRequestOtps} className="space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Current Registered Number
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-slate-700 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="font-mono text-sm font-medium">
                    +91 {currentPhone.replace(/\D/g, '').slice(-10) || 'Registered Number'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  New Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Enter 10-digit new mobile number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-14 pr-4 py-3 text-sm text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  We will send 2 verification OTPs: one to your current number and one to your new number.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || newPhone.length !== 10}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Sending OTPs...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification OTPs</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Dual OTP Verification Stage */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyDualOtps} className="space-y-5">
              <div className="rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 p-4 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Dual Security Verification Active
                </p>
                <p>Please enter both 6-digit OTP codes received via SMS.</p>
              </div>

              {/* OTP 1: Current Number */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    1. OTP sent to Current Number ({oldPhoneMasked})
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={oldOtp}
                    onChange={(e) => setOldOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-11 pr-4 py-2.5 text-center font-mono text-base font-semibold tracking-widest text-slate-900 dark:text-white placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* OTP 2: New Number */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    2. OTP sent to New Number ({newPhoneMasked})
                  </label>
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={newOtp}
                    onChange={(e) => setNewOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-11 pr-4 py-2.5 text-center font-mono text-base font-semibold tracking-widest text-slate-900 dark:text-white placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Timer & Resend */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>OTPs valid for: <strong className="font-mono text-slate-900 dark:text-white">{formatTime(timeLeft)}</strong></span>
                <button
                  type="button"
                  disabled={!canResend || loading}
                  onClick={handleRequestOtps}
                  className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                >
                  Resend OTPs
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || oldOtp.length !== 6 || newOtp.length !== 6}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Verify & Update Number</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success State */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Mobile Number Updated!</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your profile mobile number has been changed successfully.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
