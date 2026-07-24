"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Key, Mail, Phone, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface OtpLoginProps {
  onBack: () => void;
  onSuccess: (sessionData: { user: { id: string; phone?: string; email?: string } }) => void;
  role?: 'worker' | 'employer' | null;
}

export const OtpLogin: React.FC<OtpLoginProps> = ({ onBack, onSuccess, role }) => {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

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
      setError('Please enter your mobile number or email');
      return;
    }

    const isEmail = formattedInput.includes('@');
    const isPhone = /^\+?[1-9]\d{1,14}$/.test(formattedInput.replace(/[\s-()]/g, '')) || /^\d{10}$/.test(formattedInput);

    if (!isEmail && !isPhone) {
      setError('Enter a valid email address or 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      // Check if credentials are placeholder
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        // Fallback for demonstration/mock testing
        console.log(`Mocking OTP dispatch to ${formattedInput}`);
        setTimeout(() => {
          setLoading(false);
          setStep('verify');
          setResendTimer(30);
        }, 1000);
        return;
      }

      // Live Supabase trigger
      const authPayload = isEmail 
        ? { email: formattedInput }
        : { phone: formattedInput.startsWith('+') ? formattedInput : `+91${formattedInput}` };

      const { error: authError } = await supabase.auth.signInWithOtp(authPayload);

      if (authError) {
        throw authError;
      }

      setLoading(false);
      setStep('verify');
      setResendTimer(30);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to dispatch OTP. Please verify connections.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpValue.length < 4) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);

    try {
      const formattedInput = inputValue.trim();
      const isEmail = formattedInput.includes('@');
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        // Mock success verification
        setTimeout(() => {
          setLoading(false);
          onSuccess({
            user: {
              id: 'mock-user-uuid-12345',
              email: isEmail ? formattedInput : undefined,
              phone: !isEmail ? formattedInput : undefined
            }
          });
        }, 1000);
        return;
      }

      // Live Supabase verify
      const verifyPayload = isEmail
        ? { email: formattedInput, token: otpValue, type: 'email' as const }
        : { phone: formattedInput.startsWith('+') ? formattedInput : `+91${formattedInput}`, token: otpValue, type: 'sms' as const };

      const { data, error: verifyError } = await supabase.auth.verifyOtp(verifyPayload);

      if (verifyError) {
        throw verifyError;
      }

      setLoading(false);
      if (data.user) {
        onSuccess({
          user: {
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone
          }
        });
      } else {
        setError('Verification failed. Try again.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Incorrect verification code. Please check again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8 max-w-md mx-auto w-full">
      
      {/* Brand Logo Header */}
      <div className="mb-4 flex flex-col items-center text-center">
        <img src="/logo.png" alt="Sevikaa Logo" className="h-28 w-auto object-contain" />
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">POWERED BY YUGAYATRA RETAIL</p>
        <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Helping India hire trusted Maids, Cooks & Nannies.</p>
      </div>

      <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-sm p-6 relative">
        {/* Back Button */}
        <button
          onClick={step === 'verify' ? () => setStep('input') : onBack}
          className="absolute left-6 top-6 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-full cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center pt-8 mb-6">
          <div className="mx-auto w-12 h-12 bg-[#1A73E8]/10 rounded-full flex items-center justify-center mb-3 text-[#1A73E8]">
            {step === 'input' ? <ShieldCheck size={24} /> : <Key size={24} />}
          </div>
          <h2 className="text-xl font-bold text-[#202124]">
            {step === 'input' 
              ? (role === 'worker' ? 'Welcome, Worker!' : t('loginTitle')) 
              : t('enterOtp')}
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-2 px-4 leading-relaxed">
            {step === 'input' 
              ? (role === 'worker' 
                  ? 'Sign in or create your free account to find trusted Maid, Cook, and Nanny jobs. Enter your mobile number or email to receive a secure OTP.' 
                  : t('loginSub')) 
              : t('otpSub')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#EA4335]/5 border border-[#EA4335]/20 rounded-2xl text-xs text-[#EA4335] text-center font-medium">
            {error}
          </div>
        )}

        {step === 'input' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder={role === 'worker' ? 'Mobile Number or Email Address' : t('emailOrPhone')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
                className="w-full py-4 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-medium text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-all placeholder:text-gray-400"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                {inputValue.includes('@') ? <Mail size={20} /> : <Phone size={20} />}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#1A73E8] hover:bg-[#1A73E8]/90 active:scale-[0.98] text-white font-bold rounded-2xl shadow-sm transition-all duration-150 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center min-h-[56px] cursor-pointer"
            >
              {loading ? t('loading') : (role === 'worker' ? 'Continue with OTP' : t('sendOtp'))}
            </button>

            {role === 'worker' && (
              <p className="text-[10px] text-center text-gray-400 mt-4 font-semibold">
                Free Registration • Secure OTP Verification • No Hidden Charges
              </p>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                placeholder="0 0 0 0 0 0"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                className="w-full py-4 bg-gray-50 border border-gray-200 rounded-2xl text-center text-xl font-bold tracking-widest text-[#202124] focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#34A853] hover:bg-[#34A853]/90 active:scale-[0.98] text-white font-bold rounded-2xl shadow-sm transition-all duration-150 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center min-h-[56px] cursor-pointer"
            >
              {loading ? t('loading') : t('verifyOtp')}
            </button>

            <div className="text-center text-xs mt-3">
              {resendTimer > 0 ? (
                <span className="text-gray-400 font-medium">Resend OTP in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-[#1A73E8] font-bold hover:underline cursor-pointer"
                >
                  Resend Verification Code
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Public & Compliance Footer */}
      <footer className="mt-8 space-y-4 w-full text-xs text-gray-400 text-center">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 font-bold">
          <Link href="/about" className="hover:text-[#1A73E8] transition-colors">About</Link>
          <Link href="/how-it-works" className="hover:text-[#1A73E8] transition-colors">How It Works</Link>
          <Link href="/pricing" className="hover:text-[#1A73E8] transition-colors">Pricing</Link>
          <Link href="/safety" className="hover:text-[#1A73E8] transition-colors">Safety</Link>
          <Link href="/contact" className="hover:text-[#1A73E8] transition-colors">Contact Us</Link>
          <Link href="/faq" className="hover:text-[#1A73E8] transition-colors">FAQ</Link>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] font-semibold text-gray-400/80">
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <Link href="/refunds" className="hover:text-gray-600 transition-colors">Refund Policy</Link>
          <Link href="/shipping" className="hover:text-gray-600 transition-colors">Shipping Policy</Link>
        </div>
        <p className="text-[10px] mt-2 font-medium">
          Powered by YugaYatra Retail (OPC) Private Limited<br />
          © {new Date().getFullYear()} All Rights Reserved
        </p>
      </footer>
    </div>
  );
};
