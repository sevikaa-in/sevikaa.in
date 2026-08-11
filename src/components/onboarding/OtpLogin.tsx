"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Key, Mail, Phone, ShieldCheck, Sparkles, CheckCircle2, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface OtpLoginProps {
  onBack: () => void;
  onSuccess: (sessionData: { user: { id: string; phone?: string; email?: string }; role?: string; isExistingUser?: boolean; accessToken?: string }) => void;
  role?: 'worker' | 'employer' | null;
}

export const OtpLogin: React.FC<OtpLoginProps> = ({ onBack, onSuccess, role }) => {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(120);
  const [loginMethod, setLoginMethod] = useState<'mobile' | 'email'>('mobile');

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const formattedInput = inputValue.trim();
    if (!formattedInput) {
      setError(loginMethod === 'mobile' ? 'Please enter your 10-digit mobile number' : 'Please enter your email address');
      return;
    }

    if (loginMethod === 'email') {
      if (!formattedInput.includes('@') || !formattedInput.includes('.')) {
        setError('Enter a valid email address');
        return;
      }
    } else {
      // mobile
      const cleanPhone = formattedInput.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setError('Enter a valid 10-digit mobile number');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone: loginMethod === 'mobile' ? formattedInput : undefined,
          email: loginMethod === 'email' ? formattedInput : undefined,
          role: role || undefined
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch OTP code');
      }

      setLoading(false);
      setStep('verify');
      setResendTimer(120);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to dispatch OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpValue.length < 4) {
      setError('Please enter the complete verification code');
      return;
    }

    setLoading(true);

    try {
      const formattedInput = inputValue.trim();

      const response = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          phone: loginMethod === 'mobile' ? formattedInput : undefined,
          email: loginMethod === 'email' ? formattedInput : undefined,
          otp: otpValue,
          role: role || undefined
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.user) {
        throw new Error(data.error || 'Verification failed. Incorrect code.');
      }

      setLoading(false);
      const token = data.access_token || data.token || data.session?.access_token || '';
      if (typeof window !== 'undefined' && token) {
        localStorage.setItem('sevikaa_token', token);
      }

      onSuccess({
        user: data.user,
        role: data.user.role || role || undefined,
        isExistingUser: data.isExistingUser,
        accessToken: token
      });
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Incorrect verification code. Please check again.');
    }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-between items-center px-4 py-8 max-w-lg mx-auto w-full">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 -z-10 w-96 h-96 bg-gradient-to-tr from-blue-400/20 via-indigo-400/20 to-purple-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 -z-10 w-80 h-80 bg-gradient-to-br from-emerald-300/15 via-teal-300/15 to-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="w-full text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-4 shadow-sm">
          <Lock className="w-3.5 h-3.5 text-blue-600" />
          <span>Secure Sevikaa Portal Access</span>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <img src="/logo.png" alt="Sevikaa Logo" className="h-16 w-auto object-contain drop-shadow-md transition-transform duration-300 hover:scale-105" />
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-2">POWERED BY YUGAYATRA RETAIL</p>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="w-full bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl shadow-blue-900/5 p-7 relative transition-all duration-300">
        
        {/* Back Button */}
        <button
          onClick={step === 'verify' ? () => setStep('input') : onBack}
          className="absolute left-6 top-6 text-slate-400 hover:text-slate-700 transition-colors p-2 hover:bg-slate-100 rounded-full cursor-pointer group"
          title="Go back"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Card Title & Icon */}
        <div className="text-center pt-3 mb-6">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25 transition-transform duration-300 hover:scale-105">
            {step === 'input' ? <ShieldCheck size={28} /> : <Key size={28} />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {step === 'input' 
              ? (role === 'worker' ? (t('workerWelcome') || 'Welcome Back') : (t('loginTitle') || 'Sign In to Sevikaa')) 
              : (t('enterOtp') || 'Enter Verification Code')}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1.5 px-4 leading-relaxed">
            {step === 'input' 
              ? (role === 'worker' 
                  ? (t('workerLoginSub') || 'Enter your details to access your account & jobs') 
                  : (t('loginSub') || 'Enter your mobile number or email to receive a secure OTP')) 
              : `${t('otpSub') || 'We have sent a verification code to'} ${inputValue}`}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs text-rose-600 text-center font-semibold animate-shake">
            {error}
          </div>
        )}

        {step === 'input' ? (
          <>
            {/* Segmented Control Toggle */}
            <div className="p-1 bg-slate-100 rounded-2xl flex mb-5 border border-slate-200/60">
              <button
                type="button"
                onClick={() => { setLoginMethod('mobile'); setInputValue(''); setError(''); }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  loginMethod === 'mobile'
                    ? 'bg-white text-blue-600 shadow-md shadow-slate-200 border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Mobile Number</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setLoginMethod('email'); setInputValue(''); setError(''); }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  loginMethod === 'email'
                    ? 'bg-white text-blue-600 shadow-md shadow-slate-200 border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Address</span>
              </button>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="relative group">
                {loginMethod === 'mobile' ? (
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl focus-within:bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all overflow-hidden">
                    <div className="pl-4 pr-2 py-3.5 flex items-center gap-1.5 border-r border-slate-200 text-slate-700 font-bold text-sm bg-slate-100/50 select-none">
                      <span className="text-base">🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      pattern="\d{10}"
                      maxLength={10}
                      placeholder="10-digit Mobile Number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      className="w-full py-3.5 px-3 bg-transparent text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl focus-within:bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all overflow-hidden">
                    <div className="pl-4 text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={loading}
                      className="w-full py-3.5 px-3 bg-transparent text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              {(() => {
                const isInputValid = loginMethod === 'mobile'
                  ? inputValue.replace(/\D/g, '').length === 10
                  : (inputValue.includes('@') && inputValue.includes('.'));
                
                return (
                  <button
                    type="submit"
                    disabled={loading || !isInputValid}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Get Verification Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                );
              })()}

              {/* Trust Callouts */}
              <div className="pt-2 flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Instant OTP
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  Secure & Encryption
                </span>
              </div>
            </form>
          </>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block text-center">
                6-Digit Security Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus
                className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-2xl font-black tracking-[0.4em] text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpValue.length < 4}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify & Proceed</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs pt-1">
              {resendTimer > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-slate-500 font-semibold text-[11px]">
                  Resend code in <strong className="text-slate-800">{formatTimer(resendTimer)}</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-blue-600 font-bold hover:text-blue-700 hover:underline cursor-pointer inline-flex items-center gap-1 text-xs"
                >
                  Didn&apos;t receive code? Resend OTP
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Public & Compliance Footer */}
      <footer className="mt-8 space-y-3 w-full text-xs text-slate-400 text-center">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 font-bold">
          <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
          <Link href="/how-it-works" className="hover:text-blue-600 transition-colors">How It Works</Link>
          <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
          <Link href="/safety" className="hover:text-blue-600 transition-colors">Safety</Link>
          <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Us</Link>
          <Link href="/faq" className="hover:text-blue-600 transition-colors">FAQ</Link>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-400/80">
          <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
          <Link href="/refunds" className="hover:text-slate-600 transition-colors">Refund Policy</Link>
          <Link href="/shipping" className="hover:text-slate-600 transition-colors">Shipping Policy</Link>
        </div>
        <p className="text-[10px] mt-2 font-medium text-slate-400">
          Powered by YugaYatra Retail (OPC) Private Limited<br />
          © {new Date().getFullYear()} All Rights Reserved
        </p>
      </footer>
    </div>
  );
};
