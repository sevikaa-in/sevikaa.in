"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEmployerDashboard } from '../layout';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { executeRazorpayCheckout } from '@/utils/razorpay';
import { 
  CreditCard, ShieldCheck, Lock, ArrowLeft, CheckCircle2, 
  Sparkles, Building, Phone, Mail, MapPin, Zap, Check, AlertCircle, QrCode
} from 'lucide-react';
import Link from 'next/link';

function CheckoutFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') || 'standard';
  const queryUserId = searchParams.get('userId') || searchParams.get('user_id');
  const queryPhone = searchParams.get('phone') || searchParams.get('mobile');
  const queryName = searchParams.get('name') || searchParams.get('company_name');
  const queryEmail = searchParams.get('email');

  const { employerProfile, setEmployerProfile, showToast } = useEmployerDashboard();
  const { t } = useLanguage();

  const PLAN_DATA: Record<string, any> = {
    free: {
      id: 'free',
      name: t('planFree') || 'Free Trial',
      price: 0,
      validity: '7 Days',
      jobPosts: '1 Job Post',
      contactUnlocks: '0 Unlocks (View Bios Only)',
      features: [
        '1 Active Job Requisition',
        'Browse Worker Bios & Ratings',
        'Basic Applicant Notifications'
      ]
    },
    basic: {
      id: 'basic',
      name: t('planBasic') || 'Basic Plan',
      price: 299,
      validity: '30 Days',
      jobPosts: '3 Job Posts',
      contactUnlocks: '10 Candidate Phone Unlocks',
      features: [
        '3 Active Job Requisitions',
        'Direct Candidate Calling (10 Unlocks)',
        'Watch 60-Second Worker Intro Videos',
        'Society Gate Security Badges',
        'Jio DLT Instant SMS Alerts'
      ]
    },
    standard: {
      id: 'standard',
      name: t('planStandard') || 'Standard Plan',
      price: 699,
      validity: '60 Days',
      jobPosts: '10 Job Posts',
      contactUnlocks: '50 Candidate Phone Unlocks',
      features: [
        '10 Active Job Requisitions',
        '50 Candidate Contact Phone Unlocks',
        'Full Worker Intro Video Access',
        'Aadhaar ID & Police Clearance Badges',
        'Priority Applicant Matching in Society',
        'Dedicated WhatsApp Support'
      ]
    },
    pro: {
      id: 'pro',
      name: t('planPro') || 'Pro Family Plan',
      price: 1499,
      validity: '90 Days',
      jobPosts: 'Unlimited Job Posts',
      contactUnlocks: 'Unlimited Unlocks',
      features: [
        'Unlimited Job Requisitions',
        'Unlimited Candidate Phone Unlocks',
        'Watch All Intro Videos & Audio Bios',
        'Verified Aadhaar + Police Background Audit',
        '1-on-1 Dedicated Sevikaa Hiring Manager',
        'Replacement Guarantee within 30 Days'
      ]
    }
  };

  const plan = PLAN_DATA[planParam.toLowerCase()] || PLAN_DATA['standard'];

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const displayCompanyName = employerProfile.company_name || queryName || 'Verma Household';
  const displayPhone = employerProfile.phone || queryPhone || '+91 98765 43210';
  const displayEmail = employerProfile.email || queryEmail || 'employer@sevikaa.in';
  const displaySociety = employerProfile.society_name || 'DLF Westend Heights';
  const displayAddress = employerProfile.address || employerProfile.tower || 'Tower B - Flat 402';

  const handleProcessPayment = async () => {
    setIsProcessing(true);

    executeRazorpayCheckout({
      amount: plan.price,
      planName: plan.name,
      userName: displayCompanyName,
      userEmail: displayEmail,
      userPhone: displayPhone,
      paymentMethod,
      onSuccess: async (paymentId: string) => {
        try {
          // 1. Update employer local state
          setEmployerProfile((prev: any) => ({
            ...prev,
            subscription_status: `${plan.name}`
          }));

          // 2. Update Supabase employer_profiles & transactions log
          const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                                !process.env.NEXT_PUBLIC_SUPABASE_URL;

          if (!isPlaceholder) {
            const { data: { session } } = await supabase.auth.getSession();
            const activeUserId = session?.user?.id || queryUserId;

            if (activeUserId) {
              await supabase
                .from('employer_profiles')
                .update({
                  subscription_status: `${plan.name}`,
                  updated_at: new Date().toISOString()
                })
                .eq('id', activeUserId);

              // Log transaction entry
              try {
                await supabase
                  .from('transactions')
                  .insert([{
                    user_id: activeUserId,
                    amount: plan.price,
                    status: 'captured',
                    payment_id: paymentId,
                    plan_name: plan.name,
                    payment_method: paymentMethod.toUpperCase(),
                    created_at: new Date().toISOString()
                  }]);
              } catch (txErr) {
                console.error("Transactions log error:", txErr);
              }
            }
          }

          showToast(`Payment successful! ${plan.name} is now active for your household.`, 'success');
          
          setTimeout(() => {
            router.push('/employer');
          }, 1000);
        } catch (err) {
          console.error("Payment activation error:", err);
          showToast("Payment captured, but profile update encountered an issue.", "warning");
        } finally {
          setIsProcessing(false);
        }
      },
      onFailure: (errorMsg: string) => {
        setIsProcessing(false);
        showToast(`Payment failed: ${errorMsg}`, 'error');
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-20">
      
      {/* Top Back Header */}
      <div className="flex items-center gap-3">
        <Link 
          href="/employer/pricing"
          className="p-2 bg-white hover:bg-slate-100 rounded-xl text-slate-600 border border-slate-200 transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-lg font-black text-slate-900">{t('checkoutHeaderTitle') || "Checkout & Payment"}</h2>
          <p className="text-xs text-slate-400 font-semibold">{t('checkoutHeaderSub') || "100% Secure Razorpay Subscription Activation"}</p>
        </div>
      </div>

      {/* 📦 ORDER SUMMARY CARD */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl space-y-4 border border-blue-500/20">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[9px] text-blue-300 font-black uppercase tracking-wider block">{t('selectedTierLabel') || "Selected Subscription Tier"}</span>
            <h3 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
              <span>{plan.name}</span>
              <span className="bg-blue-500/30 text-blue-200 text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-400/30">
                {plan.validity}
              </span>
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-400 font-bold block uppercase">{t('totalPayableLabel') || "Total Payable"}</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">₹{plan.price}</span>
          </div>
        </div>

        {/* Plan Features */}
        <div className="space-y-2">
          {plan.features.map((feat: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 🏡 HOUSEHOLD BILLING INFORMATION */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
          <Building size={15} className="text-[#1A73E8]" />
          <span>{t('billingInfoTitle') || "Billing Account Information"}</span>
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">{t('employerFullNameLabel') || "Employer Name"}</span>
            <span className="text-slate-900 font-black truncate block mt-0.5">{displayCompanyName}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">{t('primaryPhoneLabel') || "Mobile Contact"}</span>
            <span className="text-slate-900 font-mono truncate block mt-0.5">{displayPhone}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">{t('gatedSocietyLabel') || "Gated Community"}</span>
            <span className="text-slate-900 truncate block mt-0.5">{displaySociety}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">{t('flatAddressLabel') || "Flat Address"}</span>
            <span className="text-slate-900 truncate block mt-0.5">{displayAddress}</span>
          </div>
        </div>
      </div>

      {/* 💳 PAYMENT METHOD SELECTOR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
          <CreditCard size={15} className="text-[#1A73E8]" />
          <span>{t('selectPaymentMethodTitle') || "Select Payment Method"}</span>
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'upi', label: t('methodUpi') || 'UPI / QR', icon: '📱', sub: 'Google Pay, PhonePe, Paytm' },
            { id: 'card', label: t('methodCard') || 'Card', icon: '💳', sub: 'Credit / Debit Card' },
            { id: 'netbanking', label: t('methodNetbanking') || 'Net Banking', icon: '🏦', sub: 'All Major Banks' },
          ].map((method) => {
            const isSelected = paymentMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as any)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-50 border-[#1A73E8] text-[#1A73E8] ring-1 ring-[#1A73E8]/30 font-black shadow-xs' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:border-slate-300'
                }`}
              >
                <span className="text-lg block">{method.icon}</span>
                <span className="text-xs block mt-1 leading-tight">{method.label}</span>
              </button>
            );
          })}
        </div>

        {/* UPI Details Input */}
        {paymentMethod === 'upi' && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800">{t('instantUpiTitle') || "Instant UPI Payment"}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full">{t('zeroFeeBadge') || "Zero Gateway Fee"}</span>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold block">{t('enterUpiLabel') || "Enter VPA / UPI ID (e.g. mobile@upi)"}</label>
              <input 
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. 9876543210@paytm or name@okaxis"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8]"
              />
            </div>
          </div>
        )}

        {/* Card Details Notice */}
        {paymentMethod === 'card' && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs font-bold text-slate-700">
            <p>{t('secureCardTitle') || "Secure Card Payment via Razorpay"}</p>
            <p className="text-[11px] text-slate-400 font-medium">{t('secureCardSub') || "Supports Visa, Mastercard, RuPay, and Maestro. 256-bit SSL encrypted."}</p>
          </div>
        )}

        {/* Net Banking Notice */}
        {paymentMethod === 'netbanking' && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs font-bold text-slate-700">
            <p>{t('netbankingTitle') || "Net Banking Instant Authorization"}</p>
            <p className="text-[11px] text-slate-400 font-medium">{t('netbankingSub') || "Supports HDFC, ICICI, SBI, Axis, Kotak, and 50+ Indian Banks."}</p>
          </div>
        )}
      </div>

      {/* 🔒 SECURITY BADGE & SUBMIT ACTION */}
      <div className="space-y-3">
        <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200/60 flex items-center gap-2.5 text-xs font-semibold text-blue-900">
          <ShieldCheck size={18} className="text-[#1A73E8] shrink-0" />
          <span>{t('securityGuaranteeSub') || "100% Guaranteed Refund Policy • Instant Subscription Activation"}</span>
        </div>

        <button
          onClick={handleProcessPayment}
          disabled={isProcessing}
          className="w-full py-3.5 px-6 bg-[#1A73E8] hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-2xl text-sm font-black shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <Zap size={16} />
          <span>{isProcessing ? (t('processingPaymentState') || 'Processing Payment...') : `${t('payAndActivateBtn') || 'Pay & Activate Subscription'} (₹${plan.price})`}</span>
        </button>
      </div>

    </div>
  );
}

export default function EmployerCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CheckoutFormContent />
    </Suspense>
  );
}
