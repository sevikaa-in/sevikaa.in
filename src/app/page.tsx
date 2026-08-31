"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LanguageSelector } from '../components/onboarding/LanguageSelector';
import { OtpLogin } from '../components/onboarding/OtpLogin';
import { NewUserRoleSelector } from '../components/onboarding/NewUserRoleSelector';
import { WorkerFunnel } from '../components/onboarding/WorkerFunnel';
import { EmployerFunnel } from '../components/onboarding/EmployerFunnel';
import { StatusPending } from '../components/onboarding/StatusPending';
import { PremiumLoadingScreen } from '@/components/ui/PremiumLoadingScreen';
import { useLanguage } from '../context/LanguageContext';
import { GlobalLanguageSelector } from '../components/GlobalLanguageSelector';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { supabase } from '../lib/supabaseClient';
import { 
  Check, Shield, ChevronDown, HelpCircle, Star, Phone, Mail, 
  MapPin, UserPlus, Search, PhoneCall, Sparkles, CreditCard, Lock, Building2
} from 'lucide-react';

type ViewState = 
  | 'landing'
  | 'language' 
  | 'login' 
  | 'worker-funnel' 
  | 'employer-funnel' 
  | 'status-pending'
  | 'new-user-role-select';

async function findWorkerProfile(userId: string, phone?: string, email?: string) {
  if (!userId) return null;

  // 1. Check worker_profiles by user_id
  const { data: p1 } = await supabase.from('worker_profiles').select('id').eq('user_id', userId).maybeSingle();
  if (p1) return p1;

  // 2. Check worker_profiles by id
  const { data: p2 } = await supabase.from('worker_profiles').select('id').eq('id', userId).maybeSingle();
  if (p2) return p2;

  // 3. Lookup target user ID from profiles by phone or email first, then check worker_profiles
  const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  if (cleanPhone.length === 10 || cleanEmail.includes('@')) {
    let query = supabase.from('profiles').select('id');
    if (cleanPhone.length === 10) {
      query = query.ilike('phone', `%${cleanPhone}%`);
    } else {
      query = query.ilike('email', cleanEmail);
    }
    const { data: prof } = await query.maybeSingle();

    if (prof?.id && prof.id !== userId) {
      const { data: p3 } = await supabase.from('worker_profiles').select('id').eq('user_id', prof.id).maybeSingle();
      if (p3) return p3;
      const { data: p4 } = await supabase.from('worker_profiles').select('id').eq('id', prof.id).maybeSingle();
      if (p4) return p4;
    }
  }

  return null;
}

async function findEmployerProfile(userId: string, phone?: string, email?: string) {
  if (!userId) return null;

  // 1. Check employer_profiles by user_id
  const { data: p1 } = await supabase.from('employer_profiles').select('id').eq('user_id', userId).maybeSingle();
  if (p1) return p1;

  // 2. Check employer_profiles by id
  const { data: p2 } = await supabase.from('employer_profiles').select('id').eq('id', userId).maybeSingle();
  if (p2) return p2;

  // 3. Lookup target user ID from profiles by phone or email first, then check employer_profiles
  const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  if (cleanPhone.length === 10 || cleanEmail.includes('@')) {
    let query = supabase.from('profiles').select('id');
    if (cleanPhone.length === 10) {
      query = query.ilike('phone', `%${cleanPhone}%`);
    } else {
      query = query.ilike('email', cleanEmail);
    }
    const { data: prof } = await query.maybeSingle();

    if (prof?.id && prof.id !== userId) {
      const { data: p3 } = await supabase.from('employer_profiles').select('id').eq('user_id', prof.id).maybeSingle();
      if (p3) return p3;
      const { data: p4 } = await supabase.from('employer_profiles').select('id').eq('id', prof.id).maybeSingle();
      if (p4) return p4;
    }
  }

  return null;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  
  // Onboarding wizard view state
  const [view, setView] = useState<ViewState>('landing');
  const [targetRole, setTargetRole] = useState<'worker' | 'employer' | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string; phone?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mismatchNotice, setMismatchNotice] = useState<{ requestedRole: string; actualRole: string } | null>(null);
  
  // FAQ Accordion local state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fallback userId from localStorage in case user state is stale
  const effectiveUserId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('sevikaa_user_id') || '' : '');

  // React to URL role query parameter changes (e.g. from header nav buttons)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    const stepParam = searchParams.get('step');
    
    // Only apply URL params if user is not in active onboarding/login flow
    if (view === 'landing' || view === 'language') {
      if (roleParam === 'worker') {
        setTargetRole('worker');
        setView(stepParam === 'login' ? 'login' : 'language');
      } else if (roleParam === 'employer') {
        setTargetRole('employer');
        setView(stepParam === 'login' ? 'login' : 'language');
      }
    }
  }, [searchParams]);

  // Initialize and check active session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
        const currentParams = new URLSearchParams(currentSearch);
        const isBrowsing = currentParams.get('browse') === 'true' || currentParams.get('mode') === 'public';

        if (isBrowsing) {
          setView('landing');
          setLoading(false);
          return;
        }

        // Fetch user profile via server API using webApiClient
        try {
          const { webApiClient } = await import('@/lib/webApiClient');
          const meData = await webApiClient.get('/api/auth/me');
          if (meData && meData.success && (meData.profile || meData.user)) {
            const userObj = meData.user || meData.profile;
            setUser({ id: userObj.id, email: userObj.email, phone: userObj.phone });
            const dbRole = userObj.role;

            if (dbRole === 'super-admin') {
              if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=super-admin; path=/; max-age=2592000; SameSite=Lax`;
              router.push('/super-admin');
              return;
            }
            if (dbRole === 'admin') {
              if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=admin; path=/; max-age=2592000; SameSite=Lax`;
              router.push('/admin');
              return;
            }
            if (dbRole === 'employer' || meData.employerProfile) {
              if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=employer; path=/; max-age=2592000; SameSite=Lax`;
              router.push('/employer');
              return;
            }
            if (dbRole === 'worker' || meData.workerProfile) {
              if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=worker; path=/; max-age=2592000; SameSite=Lax`;
              router.push('/worker');
              return;
            }

            // User exists in profiles table but has no sub-profile yet
            setView('new-user-role-select');
            return;
          }
        } catch (meErr) {
          console.warn("Auth me fetch notice:", meErr);
        }

        // Unauthenticated visitor -> check URL parameters
        setView('landing');
        const roleParam = currentParams.get('role');
        const stepParam = currentParams.get('step');
        if (roleParam === 'worker') {
          setTargetRole('worker');
          setView(stepParam === 'login' ? 'login' : 'language');
        } else if (roleParam === 'employer') {
          setTargetRole('employer');
          setView(stepParam === 'login' ? 'login' : 'language');
        }
      } catch (err) {
        console.error("Session initialize error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [router]);

  const handleStartWorkerFlow = () => {
    setTargetRole('worker');
    setView('language');
    window.history.pushState({}, '', '?role=worker&step=language');
  };

  const handleStartEmployerFlow = () => {
    setTargetRole('employer');
    setView('language');
    window.history.pushState({}, '', '?role=employer&step=language');
  };

  const handleBackToLanding = () => {
    setView('landing');
    window.history.pushState({}, '', '/');
  };

  const handleLoginSuccess = async (sessionData: { user: { id: string; email?: string; phone?: string; role?: string }; role?: string; isExistingUser?: boolean; hasCompletedProfile?: boolean; requiresOnboarding?: boolean; accessToken?: string }) => {
    const sessionUser = sessionData.user;
    const userRole = sessionUser.role || sessionData.role || targetRole;
    setUser(sessionUser);

    if (typeof window !== 'undefined') {
      localStorage.setItem('sevikaa_user', JSON.stringify(sessionUser));
      localStorage.setItem('sevikaa_user_id', sessionUser.id);
      document.cookie = `sevikaa_user_id=${sessionUser.id}; path=/; max-age=2592000; SameSite=Lax`;
    }

    // 1. New user or missing sub-profile -> route directly to onboarding funnel
    if (sessionData.requiresOnboarding || sessionData.hasCompletedProfile === false) {
      setLoading(false);
      if (userRole === 'employer') {
        if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=employer; path=/; max-age=2592000; SameSite=Lax`;
        setTargetRole('employer');
        setView('employer-funnel');
      } else if (userRole === 'worker') {
        if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=worker; path=/; max-age=2592000; SameSite=Lax`;
        setTargetRole('worker');
        setView('worker-funnel');
      } else {
        setView('new-user-role-select');
      }
      return;
    }

    setLoading(true);

    // 1b. Role Mismatch Detection (e.g. user clicked Employer login but registered as Worker)
    if (targetRole && userRole && targetRole !== userRole && (userRole === 'worker' || userRole === 'employer')) {
      setMismatchNotice({ requestedRole: targetRole, actualRole: userRole });
      await new Promise((res) => setTimeout(res, 2200));
    }

    try {
      // 2. Direct role-based redirection for existing users with completed profile
      if (userRole === 'super-admin') {
        if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=super-admin; path=/; max-age=86400; SameSite=Lax`;
        window.location.href = '/super-admin';
        return;
      }
      if (userRole === 'admin') {
        if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=admin; path=/; max-age=86400; SameSite=Lax`;
        window.location.href = '/admin';
        return;
      }

      // 3. Server-side profile & sub-profile checks via /api/auth/me
      try {
        const { webApiClient } = await import('@/lib/webApiClient');
        const meData = await webApiClient.get('/api/auth/me');
        if (meData && meData.success) {
          const dbRole = meData.profile?.role || meData.user?.role;

          if (dbRole === 'super-admin') {
            if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=super-admin; path=/; max-age=86400; SameSite=Lax`;
            router.push('/super-admin');
            return;
          }
          if (dbRole === 'admin') {
            if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=admin; path=/; max-age=86400; SameSite=Lax`;
            router.push('/admin');
            return;
          }

          if (dbRole === 'employer' || meData.employerProfile) {
            if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=employer; path=/; max-age=86400; SameSite=Lax`;
            window.location.href = '/employer';
            return;
          }
          if (dbRole === 'worker' || meData.workerProfile) {
            if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=worker; path=/; max-age=86400; SameSite=Lax`;
            window.location.href = '/worker';
            return;
          }
        }
      } catch (meErr) {
        console.warn("Auth me fetch notice:", meErr);
      }

      // 4. Fallback profile checks
      const employerProfile = await findEmployerProfile(sessionUser.id, sessionUser.phone, sessionUser.email);
      if (employerProfile) {
        if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=employer; path=/; max-age=86400; SameSite=Lax`;
        window.location.href = '/employer';
        return;
      }

      const workerProfile = await findWorkerProfile(sessionUser.id, sessionUser.phone, sessionUser.email);
      if (workerProfile) {
        if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=worker; path=/; max-age=86400; SameSite=Lax`;
        window.location.href = '/worker';
        return;
      }

      // 5. If role is explicitly worker or employer, redirect to dashboard
      if (userRole === 'employer') {
        if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=employer; path=/; max-age=86400; SameSite=Lax`;
        window.location.href = '/employer';
        return;
      }
      if (userRole === 'worker') {
        if (typeof window !== 'undefined') document.cookie = `sevikaa_user_role=worker; path=/; max-age=86400; SameSite=Lax`;
        window.location.href = '/worker';
        return;
      }

      // 6. Otherwise route to new user role selection
      setView('new-user-role-select');
    } catch (err) {
      console.error("Profile check error:", err);
      setView('new-user-role-select');
    } finally {
      setLoading(false);
    }
  };

  const handlePostOtpRoleSelected = (selectedRole: 'worker' | 'employer') => {
    if (typeof window !== 'undefined') {
      document.cookie = `sevikaa_user_role=${selectedRole}; path=/; max-age=86400`;
    }
    setTargetRole(selectedRole);
    if (selectedRole === 'employer') {
      setView('employer-funnel');
    } else {
      setView('worker-funnel');
    }
  };

  const onWorkerOnboardingComplete = () => {
    if (typeof window !== 'undefined') {
      document.cookie = `sevikaa_user_role=worker; path=/; max-age=2592000; SameSite=Lax`;
      window.location.href = '/worker';
    }
  };

  const onEmployerOnboardingComplete = () => {
    if (typeof window !== 'undefined') {
      document.cookie = `sevikaa_user_role=employer; path=/; max-age=2592000; SameSite=Lax`;
      window.location.href = '/employer';
    }
  };

  const handleReset = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sevikaa_user');
        localStorage.removeItem('sevikaa_user_id');
        document.cookie = "sevikaa_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "sevikaa_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }

      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!isPlaceholder) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setTargetRole(null);
      setView('landing');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (err) {
      console.error("Sign out error:", err);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  if (loading) {
    return <PremiumLoadingScreen portalType={targetRole || 'general'} mismatchNotice={mismatchNotice} />;
  }

  // Render onboarding wizard pages if in active signup flows
  if (view !== 'landing') {
    const isFunnelView = view === 'worker-funnel' || view === 'employer-funnel';

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-[#202124]">
        {isFunnelView && (
          <header className="bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Sevikaa Logo" className="h-12 w-auto object-contain" />
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                view === 'worker-funnel' 
                  ? 'bg-[#1A73E8]/10 text-[#1A73E8]' 
                  : 'bg-[#34A853]/10 text-[#34A853]'
              }`}>
                {view === 'worker-funnel' ? 'Worker Registration' : 'Employer Profile Setup'}
              </span>
            </div>
            <button 
              onClick={handleReset}
              className="text-xs font-bold text-gray-400 hover:text-[#EA4335] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer bg-gray-50 hover:bg-[#EA4335]/5 border border-gray-200 hover:border-[#EA4335]/20 px-3.5 py-2 rounded-xl"
            >
              Sign Out &rarr;
            </button>
          </header>
        )}
        <main className={`flex-1 w-full bg-gray-50 ${isFunnelView ? 'flex items-center justify-center py-6' : ''}`}>
          {view === 'language' && (
            <LanguageSelector 
              onNext={() => {
                setView('login');
                const currentRole = targetRole || 'worker';
                window.history.pushState({}, '', `?role=${currentRole}&step=login`);
              }} 
              onBack={handleBackToLanding}
            />
          )}
          {view === 'login' && (
            <OtpLogin 
              onBack={() => {
                setView('language');
                const currentRole = targetRole || 'worker';
                window.history.pushState({}, '', `?role=${currentRole}&step=language`);
              }} 
              onSuccess={handleLoginSuccess} 
              role={targetRole}
            />
          )}
          {view === 'new-user-role-select' && effectiveUserId && (
            <NewUserRoleSelector 
              userId={effectiveUserId} 
              initialRole={targetRole}
              onRoleSelected={handlePostOtpRoleSelected} 
            />
          )}
          {view === 'worker-funnel' && user && (
            <WorkerFunnel 
              onComplete={onWorkerOnboardingComplete} 
              onCancel={handleReset}
            />
          )}
          {view === 'employer-funnel' && user && (
            <EmployerFunnel 
              userId={user.id} 
              onComplete={onEmployerOnboardingComplete} 
            />
          )}
          {view === 'status-pending' && (
            <StatusPending onReset={handleReset} />
          )}
        </main>

        {/* Unified Compliance Footer for Onboarding */}
        {isFunnelView && (
          <footer className="bg-white border-t border-gray-200 py-6 px-4 text-center text-xs text-gray-400">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 font-bold mb-3">
              <Link href="/about" className="hover:text-[#1A73E8] transition-colors">About</Link>
              <Link href="/how-it-works" className="hover:text-[#1A73E8] transition-colors">How It Works</Link>
              <Link href="/pricing" className="hover:text-[#1A73E8] transition-colors">Pricing</Link>
              <Link href="/safety" className="hover:text-[#1A73E8] transition-colors">Safety</Link>
              <Link href="/contact" className="hover:text-[#1A73E8] transition-colors">Contact Us</Link>
              <Link href="/faq" className="hover:text-[#1A73E8] transition-colors">FAQ</Link>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] font-semibold text-gray-400/80 mb-3">
              <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
              {view === 'employer-funnel' && (
                <>
                  <Link href="/refunds" className="hover:text-gray-600 transition-colors">Refund & Cancellation</Link>
                  <Link href="/shipping" className="hover:text-gray-600 transition-colors">Shipping & Delivery</Link>
                </>
              )}
            </div>
            <p className="text-[10px] font-medium">
              Powered by YugaYatra Retail (OPC) Private Limited<br />
              © {new Date().getFullYear()} All Rights Reserved
            </p>
          </footer>
        )}
      </div>
    );
  }

  // Otherwise, render the Unified Landing Page with top header and regulatory footer
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-[#202124]">
      {/* 1. TOP NAVIGATION HEADER */}
      <PublicNavbar />

      {/* 2. HERO MARKETING SECTION & 2 ENTRANCE CARDS */}
      <section className="bg-gradient-to-b from-blue-50/50 via-white to-slate-50 border-b border-slate-200/80 py-20 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-200 shadow-sm mx-auto">
            <Shield size={14} className="text-[#34A853]" />
            <span>🛡️ India's #1 Verified Domestic Workforce Platform</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-slate-900">
              Connecting Trusted Homes with <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#1A73E8] via-indigo-600 to-[#34A853] bg-clip-text text-transparent">
                Verified Domestic Workers
              </span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-semibold">
              Smart society-based matching for maids, cooks, nannies, caregivers &amp; drivers across 500+ gated communities.
            </p>
          </div>

          {/* Core Entrance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto pt-4 text-left">
            
            {/* Card 1: Domestic Helpers (Green Theme) */}
            <div
              onClick={handleStartWorkerFlow}
              className="p-7 rounded-3xl border-2 border-emerald-200 hover:border-emerald-500 transition-all duration-300 bg-white shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between space-y-6 group cursor-pointer active:scale-[0.98] relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 text-[#34A853] border border-emerald-100 group-hover:bg-[#34A853] group-hover:text-white transition-all">
                    <UserPlus size={22} />
                  </div>
                  <span className="text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    🟢 100% Free For Workers
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-[#34A853] transition-colors leading-snug">
                    Looking for Work?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1.5">
                    Create your profile, showcase skills &amp; shift timings, and receive direct job calls from nearby families.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleStartWorkerFlow(); }}
                className="w-full py-3 px-4 bg-[#34A853] hover:bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Register as Worker (Free)</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Card 2: Household Employers (Blue Theme) */}
            <div
              onClick={handleStartEmployerFlow}
              className="p-7 rounded-3xl border-2 border-blue-200 hover:border-[#1A73E8] transition-all duration-300 bg-white shadow-sm hover:shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between space-y-6 group cursor-pointer active:scale-[0.98] relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3.5 rounded-2xl bg-blue-50 text-[#1A73E8] border border-blue-100 group-hover:bg-[#1A73E8] group-hover:text-white transition-all">
                    <Search size={22} />
                  </div>
                  <span className="text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-50 text-[#1A73E8] border border-blue-200">
                    🔵 For Household Employers
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-[#1A73E8] transition-colors leading-snug">
                    Looking to Hire Help?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1.5">
                    Discover verified maids, cooks, nannies &amp; drivers available in your apartment complex or nearby societies.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleStartEmployerFlow(); }}
                className="w-full py-3 px-4 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Hire Domestic Helper</span>
                <span>&rarr;</span>
              </button>
            </div>

          </div>

          {/* Trust Proof Points Bar */}
          <div className="pt-2 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs font-extrabold text-slate-500">
            <span className="flex items-center gap-1.5"><Check size={15} className="text-[#34A853]" /> Aadhaar Verified</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-[#34A853]" /> Zero Agency Commission</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-[#1A73E8]" /> Smart Society Matching</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-[#1A73E8]" /> 100% Safe &amp; Private</span>
          </div>

          {/* 🏘️ PUBLIC PARTNER SOCIETIES BANNER */}
          <div className="max-w-2xl mx-auto mt-6 bg-gradient-to-r from-blue-50/90 via-white to-blue-50/90 p-6 sm:p-7 rounded-3xl text-slate-900 shadow-md text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-2 border-blue-200/80">
            <div className="space-y-1.5 min-w-0">
              <span className="bg-blue-100/80 text-[#1A73E8] text-[9.5px] font-black uppercase px-3 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1.5 shadow-sm">
                <Building2 size={12} className="text-[#1A73E8]" /> 500+ Partner Gated Communities
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                Explore Partner Societies or Request Your Community Onboarding
              </h3>
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                Browse live jobs, verified helpers &amp; onboard your apartment complex with gate verification.
              </p>
            </div>
            <Link
              href="/societies"
              className="py-3 px-5 bg-[#1A73E8] hover:bg-blue-600 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-blue-500/20 shrink-0 whitespace-nowrap active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore Directory &rarr;</span>
            </Link>
          </div>

        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="py-20 px-4 bg-white border-b border-slate-200/80 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10">
          <div>
            <span className="bg-blue-50 text-[#1A73E8] text-[10px] font-black uppercase px-3.5 py-1 rounded-full border border-blue-200/60 inline-flex items-center gap-1.5 mb-3 shadow-sm">
              <Sparkles size={13} />
              3-Step Simple Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              How Sevikaa Works
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-semibold max-w-lg mx-auto">
              Three simple steps to connect, hire &amp; get hired with total peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { 
                step: 'STEP 01', 
                title: 'Register & Get Verified', 
                desc: 'Create your profile in minutes. Workers showcase skills & availability, while employers list hiring needs. Government ID verification builds instant trust.', 
                icon: <UserPlus size={22} />, 
                badgeBg: 'bg-blue-50 text-[#1A73E8] border-blue-100', 
                iconBg: 'bg-blue-50 text-[#1A73E8] border-blue-100', 
                hoverBorder: 'hover:border-[#1A73E8] hover:shadow-blue-500/10' 
              },
              { 
                step: 'STEP 02', 
                title: 'Smart Society Matching', 
                desc: 'Our intelligent matching engine pairs verified helpers and employers from the exact same apartment complex or nearby gated societies based on skills & shifts.', 
                icon: <Search size={22} />, 
                badgeBg: 'bg-amber-50 text-amber-700 border-amber-100', 
                iconBg: 'bg-amber-50 text-amber-600 border-amber-100', 
                hoverBorder: 'hover:border-[#FBBC05] hover:shadow-amber-500/10' 
              },
              { 
                step: 'STEP 03', 
                title: 'Direct Connect & Hire', 
                desc: 'Employers securely unlock verified contacts to connect via Call or WhatsApp, while workers receive direct job offers with zero agency commissions.', 
                icon: <PhoneCall size={22} />, 
                badgeBg: 'bg-emerald-50 text-[#34A853] border-emerald-100', 
                iconBg: 'bg-emerald-50 text-[#34A853] border-emerald-100', 
                hoverBorder: 'hover:border-[#34A853] hover:shadow-emerald-500/10' 
              }
            ].map((item, i) => (
              <div 
                key={i} 
                className={`bg-white rounded-3xl border border-slate-200/80 p-7 text-left space-y-5 shadow-sm relative transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${item.hoverBorder}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl border ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <span className={`text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full border ${item.badgeBg}`}>
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <Link 
              href="/how-it-works" 
              className="inline-flex items-center gap-2 py-3 px-6 bg-white border border-slate-200 hover:border-[#1A73E8] rounded-2xl text-xs font-black text-slate-700 hover:text-[#1A73E8] transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <span>Explore Detailed Workflow &amp; Hiring Guides</span>
              <span className="text-[#1A73E8]">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. SAFETY & TRUST SECTION */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200/80 relative overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-12 text-center relative z-10">
          <div>
            <span className="bg-red-50 text-[#EA4335] text-[10px] font-black uppercase px-3.5 py-1 rounded-full border border-red-200/60 inline-flex items-center gap-1.5 mb-3 shadow-sm">
              <Shield size={13} />
              Identity &amp; Safety Audit
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Safety &amp; Verification You Can Trust
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-semibold max-w-xl mx-auto">
              Built from the ground up to protect both domestic helpers and household families with strict privacy standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { 
                title: 'Aadhaar Verified Identity', 
                badge: 'Government Verified',
                subtitle: 'VERIFIED GOVT ID', 
                desc: 'Every worker submits a government-issued Aadhaar for multi-step identity verification, helping employers hire with 100% confidence.', 
                icon: <Shield size={22} />, 
                iconBg: 'bg-red-50 text-[#EA4335] border-red-100', 
                hoverBorder: 'hover:border-[#EA4335] hover:shadow-red-500/10' 
              },
              { 
                title: 'Strict Location Privacy', 
                badge: 'Privacy First',
                subtitle: 'ADDRESSES NEVER PUBLIC', 
                desc: 'Exact house addresses and GPS locations are never exposed. Employers only see society names until a hiring connection is confirmed.', 
                icon: <Lock size={22} />, 
                iconBg: 'bg-blue-50 text-[#1A73E8] border-blue-100', 
                hoverBorder: 'hover:border-[#1A73E8] hover:shadow-blue-500/10' 
              },
              { 
                title: 'Police Clearance (PCC)', 
                badge: 'Background Check',
                subtitle: 'ADDITIONAL PEACE OF MIND', 
                desc: 'Domestic helpers can upload their official Police Clearance Certificate (PCC), thoroughly reviewed before the Police Verified badge is awarded.', 
                icon: <Shield size={22} />, 
                iconBg: 'bg-emerald-50 text-[#34A853] border-emerald-100', 
                hoverBorder: 'hover:border-[#34A853] hover:shadow-emerald-500/10' 
              }
            ].map((item, i) => (
              <div 
                key={i} 
                className={`p-7 bg-white border border-slate-200/80 rounded-3xl space-y-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-sm cursor-pointer ${item.hoverBorder}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl border ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <span className="text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                    {item.badge}
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">{item.title}</h3>
                  <span className="block text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider mt-1">{item.subtitle}</span>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <Link 
              href="/safety" 
              className="inline-flex items-center gap-2 py-3 px-6 bg-white border border-slate-200 hover:border-[#1A73E8] rounded-2xl text-xs font-black text-slate-700 hover:text-[#1A73E8] transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <span>Learn more about Sevikaa Safety Standards</span>
              <span className="text-[#1A73E8]">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section className="py-16 px-4 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto space-y-10 text-center">
          <div>
            <span className="bg-blue-50 text-[#1A73E8] text-[10px] font-black uppercase px-3 py-1 rounded-full border border-blue-200/60 inline-block mb-2">
              Simple &amp; Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Fair Pricing for Everyone</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 font-semibold">100% Free forever for domestic workers. Transparent hiring plans for household employers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-3xl mx-auto">
            
            {/* Card 1: Domestic Helpers (Free Forever) */}
            <div 
              onClick={handleStartWorkerFlow}
              className="bg-white border-2 border-emerald-200 p-8 rounded-3xl text-left flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-100/50 cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-200">
                    🟢 For Domestic Helpers
                  </span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-100/60 px-2.5 py-0.5 rounded-md">
                    100% FREE
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Worker Membership</h3>
                  <div className="text-4xl font-black text-gray-900 mt-2">
                    <sup className="text-xl font-bold">₹</sup>0 <span className="text-xs text-gray-400 font-bold uppercase">/ Forever</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
                    Maids, cooks, nannies, and drivers never pay any fee to register, showcase skills, or connect with nearby families.
                  </p>
                </div>

                <ul className="text-xs text-gray-600 space-y-2.5 border-t border-gray-100 pt-5 font-bold">
                  <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500 shrink-0" /> Verified Worker Profile Badge</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500 shrink-0" /> Apply for Unlimited Nearby Job Posts</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500 shrink-0" /> Direct Employer Interview Calls</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500 shrink-0" /> Zero Agency or Salary Commission</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleStartWorkerFlow(); }}
                className="w-full py-3.5 mt-8 text-xs font-black rounded-2xl bg-emerald-50 text-emerald-700 border-2 border-emerald-400 hover:bg-emerald-600 hover:text-white transition-all active:scale-[0.98] shadow-sm"
              >
                Register as Worker (Free)
              </button>
            </div>

            {/* Card 2: Household Employers (Hiring Passes) */}
            <div 
              className="bg-white border-2 border-[#1A73E8] p-8 rounded-3xl text-left flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-100/80 relative shadow-md"
            >
              <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-[#1A73E8] to-indigo-600 text-white text-[9.5px] font-black px-4 py-1 rounded-full shadow-md uppercase tracking-wider">
                Recommended For Families
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-50 text-[#1A73E8] text-[10px] font-black uppercase px-3 py-1 rounded-full border border-blue-200">
                    🔵 For Household Employers
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Employer Hiring Passes</h3>
                  <div className="text-4xl font-black text-gray-900 mt-2">
                    <span className="text-xs text-gray-400 font-bold mr-1">Starts from</span><sup className="text-xl font-bold">₹</sup>299 <span className="text-xs text-gray-400 font-bold uppercase">/ 30 Days</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
                    Unlock verified candidate contact details, post job requirements, and get society-matched domestic workers instantly.
                  </p>
                </div>

                <ul className="text-xs text-gray-600 space-y-2.5 border-t border-gray-100 pt-5 font-bold">
                  <li className="flex items-center gap-2"><Check size={16} className="text-[#1A73E8] shrink-0" /> Starter, Standard &amp; Pro Unlimited Passes</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-[#1A73E8] shrink-0" /> Unlock Direct Call &amp; WhatsApp Contacts</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-[#1A73E8] shrink-0" /> Smart Society-Based Worker Matching</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-[#1A73E8] shrink-0" /> Zero Hidden Charges &amp; No Agency Fees</li>
                </ul>
              </div>

              <Link
                href="/pricing"
                className="w-full py-3.5 mt-8 text-xs font-black rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-center shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] block"
              >
                View All Hiring Plans &amp; Pricing &rarr;
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION SECTION */}
      <section className="py-20 px-4 bg-gradient-to-b from-white via-slate-50 to-white border-b border-slate-200/80 relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-10 text-center relative z-10">
          <div>
            <span className="bg-blue-50 text-[#1A73E8] text-[10px] font-black uppercase px-3.5 py-1 rounded-full border border-blue-200/60 inline-flex items-center gap-1.5 mb-3 shadow-sm">
              <HelpCircle size={12} />
              Got Questions? We've Got Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-semibold">
              Everything you need to know about how Sevikaa connects verified helpers with trusted households.
            </p>
          </div>

          <div className="space-y-4 text-left">
            {[
              { 
                q: "Is Sevikaa completely free for domestic workers?", 
                a: "Yes! Maids, cooks, nannies, caregivers, and drivers never pay any registration fees, commission, or salary cuts. Sevikaa is 100% free forever for all domestic workers.", 
                tag: "🟢 100% Free Worker Guarantee" 
              },
              { 
                q: "How does Sevikaa match domestic helpers with nearby homes?", 
                a: "Our smart society-based matching engine pairs verified helpers with household employers in the exact same apartment complex or nearby gated societies based on skills, work shifts, and availability.", 
                tag: "📍 Society Matching" 
              },
              { 
                q: "How are worker identity and background verified?", 
                a: "Every worker profile undergoes government-issued Aadhaar identity verification. Additionally, workers can submit Police Clearance Certificates (PCC) for the Police Verified Badge.", 
                tag: "🔒 Verified Trust" 
              },
              { 
                q: "What hiring plans are available for household employers?", 
                a: "Employers can choose from Starter (₹299/30 days), Standard (₹699/60 days), or Pro Unlimited (₹1,499/90 days) passes to unlock verified contact details and hire with total peace of mind.", 
                tag: "💳 Flexible Passes" 
              }
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                    isOpen 
                      ? 'border-[#1A73E8] shadow-xl shadow-blue-500/10 ring-1 ring-[#1A73E8]/20 bg-gradient-to-r from-blue-50/20 via-white to-white' 
                      : 'border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 flex items-center justify-between text-xs sm:text-sm font-extrabold text-slate-800 hover:text-[#1A73E8] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-3 pr-4">
                      <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                        isOpen ? 'bg-[#1A73E8] text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <HelpCircle size={16} />
                      </div>
                      <span className="leading-snug">{faq.q}</span>
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[9.5px] font-black uppercase tracking-wider border border-slate-200/60">
                        {faq.tag}
                      </span>
                      <div className={`p-1.5 rounded-lg transition-transform duration-300 ${isOpen ? 'bg-blue-100 text-[#1A73E8] rotate-180' : 'text-slate-400'}`}>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 animate-fade-in pl-14">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 text-center">
            <Link 
              href="/faq" 
              className="inline-flex items-center gap-2 py-3 px-6 bg-white border border-slate-200 hover:border-[#1A73E8] rounded-2xl text-xs font-black text-slate-700 hover:text-[#1A73E8] transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <span>Have more questions? View complete FAQ Directory</span>
              <span className="text-[#1A73E8]">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. CONTACT & SUPPORT SECTION */}
      <section className="py-20 px-4 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto space-y-10 text-center">
          <div>
            <span className="bg-blue-50 text-[#1A73E8] text-[10px] font-black uppercase px-3 py-1 rounded-full border border-blue-200/60 inline-block mb-2 shadow-sm">
              We Are Here To Help
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Support &amp; Contact
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-semibold max-w-lg mx-auto">
              Our dedicated support team assists workers, employers, and apartment RWAs every step of the way.
            </p>
          </div>

          {/* 2-Column Responsive Support Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            {/* Card 1: Email Support */}
            <a 
              href="mailto:support@sevikaa.in"
              className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 hover:border-[#1A73E8] hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group cursor-pointer block shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-blue-50 text-[#1A73E8] group-hover:bg-[#1A73E8] group-hover:text-white transition-all">
                  <Mail size={20} />
                </div>
                <span className="text-[10px] font-extrabold uppercase text-[#1A73E8] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  Email Support
                </span>
              </div>
              <div>
                <h3 className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Official Support Email</h3>
                <div className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-[#1A73E8] transition-colors mt-0.5">
                  support@sevikaa.in
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                  For profile verifications, employer billing, partnership enquiries, and account assistance. Responded within 24 hours.
                </p>
              </div>
            </a>

            {/* Card 2: Phone Helpline & Business Hours */}
            <a 
              href="tel:+918757728679"
              className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4 hover:border-[#34A853] hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 group cursor-pointer block shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-emerald-50 text-[#34A853] group-hover:bg-[#34A853] group-hover:text-white transition-all">
                  <Phone size={20} />
                </div>
                <span className="text-[10px] font-extrabold uppercase text-[#34A853] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  Customer Helpline
                </span>
              </div>
              <div>
                <h3 className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Phone &amp; WhatsApp Support</h3>
                <div className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-[#34A853] transition-colors mt-0.5">
                  +91 87577 28679
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                  Mon – Fri: 10:00 AM – 5:00 PM (IST). Speak directly with our customer support executives for quick assistance.
                </p>
              </div>
            </a>

          </div>

          {/* Bottom Corporate Entity Card */}
          <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-sm text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-red-50 text-[#EA4335] shrink-0">
                <MapPin size={22} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-900">YugaYatra Retail (OPC) Private Limited</span>
                  <span className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-slate-200">
                    Government Registered
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-bold">
                  Electronic City, Phase 1, Bengaluru, Karnataka, India
                </p>
                <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed pt-0.5">
                  CIN: U47912KA2024OPC188603 (Registered under the Ministry of Corporate Affairs, Govt. of India)
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
