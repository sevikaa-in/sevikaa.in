"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LanguageSelector } from '../components/onboarding/LanguageSelector';
import { OtpLogin } from '../components/onboarding/OtpLogin';
import { WorkerFunnel } from '../components/onboarding/WorkerFunnel';
import { EmployerFunnel } from '../components/onboarding/EmployerFunnel';
import { StatusPending } from '../components/onboarding/StatusPending';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { 
  Check, Shield, ChevronDown, HelpCircle, Star, Phone, Mail, 
  MapPin, UserPlus, Search, PhoneCall, Sparkles, CreditCard, Lock
} from 'lucide-react';

type ViewState = 
  | 'landing'
  | 'language' 
  | 'login' 
  | 'worker-funnel' 
  | 'employer-funnel' 
  | 'status-pending';

export default function Home() {
  const router = useRouter();
  const { language, t } = useLanguage();
  
  // Onboarding wizard view state
  const [view, setView] = useState<ViewState>('landing');
  const [targetRole, setTargetRole] = useState<'worker' | 'employer' | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string; phone?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // FAQ Accordion local state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Initialize and check active session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                              !process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (isPlaceholder) {
          setView('landing');
          setLoading(false);
          return;
        }

        // Live Supabase check
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone
          });

          // Fetch profile to verify route
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, status')
            .eq('id', session.user.id)
            .single();

          const checkUrlParams = () => {
            const searchParams = new URLSearchParams(window.location.search);
            const roleParam = searchParams.get('role');
            if (roleParam === 'worker') {
              setTargetRole('worker');
              setView('language');
            } else if (roleParam === 'employer') {
              setTargetRole('employer');
              setView('login');
            }
          };

          if (profile) {
            if (profile.role === 'worker') {
              const { data: workerProfile } = await supabase
                .from('worker_profiles')
                .select('id')
                .eq('user_id', session.user.id)
                .maybeSingle();

              if (workerProfile) {
                router.push('/worker/dashboard');
              } else {
                setTargetRole('worker');
                setView('worker-funnel');
              }
            } else if (profile.role === 'employer') {
              const { data: employerProfile } = await supabase
                .from('employer_profiles')
                .select('id')
                .eq('user_id', session.user.id)
                .maybeSingle();

              if (employerProfile) {
                router.push('/employer/dashboard');
              } else {
                setTargetRole('employer');
                setView('employer-funnel');
              }
            } else {
              setView('landing');
              checkUrlParams();
            }
          } else {
            setView('landing');
            checkUrlParams();
          }
        } else {
          setView('landing');
          const searchParams = new URLSearchParams(window.location.search);
          const roleParam = searchParams.get('role');
          if (roleParam === 'worker') {
            setTargetRole('worker');
            setView('language');
          } else if (roleParam === 'employer') {
            setTargetRole('employer');
            setView('login');
          }
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
  };

  const handleStartEmployerFlow = () => {
    setTargetRole('employer');
    setView('login'); // Skip language selector for employers
  };

  const handleLoginSuccess = async (sessionData: { user: { id: string; email?: string; phone?: string } }) => {
    const sessionUser = sessionData.user;
    setUser(sessionUser);
    setLoading(true);

    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setView(targetRole === 'worker' ? 'worker-funnel' : 'employer-funnel');
        setLoading(false);
        return;
      }

      // Check profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', sessionUser.id)
        .single();

      if (profile) {
        if (profile.role === 'worker') {
          const { data: workerProfile } = await supabase
            .from('worker_profiles')
            .select('id')
            .eq('user_id', sessionUser.id)
            .maybeSingle();

          if (workerProfile) {
            router.push('/worker/dashboard');
          } else {
            setTargetRole('worker');
            setView('worker-funnel');
          }
        } else if (profile.role === 'employer') {
          const { data: employerProfile } = await supabase
            .from('employer_profiles')
            .select('id')
            .eq('user_id', sessionUser.id)
            .maybeSingle();

          if (employerProfile) {
            router.push('/employer/dashboard');
          } else {
            setTargetRole('employer');
            setView('employer-funnel');
          }
        } else {
          setView(targetRole === 'worker' ? 'worker-funnel' : 'employer-funnel');
        }
      } else {
        setView(targetRole === 'worker' ? 'worker-funnel' : 'employer-funnel');
      }
    } catch (err) {
      console.error("Profile check error:", err);
      setView(targetRole === 'worker' ? 'worker-funnel' : 'employer-funnel');
    } finally {
      setLoading(false);
    }
  };

  const onWorkerOnboardingComplete = () => {
    alert("Worker onboarding completed! Redirecting to dashboard.");
    router.push('/worker/dashboard');
  };

  const onEmployerOnboardingComplete = () => {
    alert("Employer Profile setup completed! Redirecting to dashboard.");
    router.push('/employer/dashboard');
  };

  const handleReset = async () => {
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!isPlaceholder) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setView('landing');
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-bold text-sm">
        Loading Sevikaa Onboarding...
      </div>
    );
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
            <LanguageSelector onNext={() => setView('login')} />
          )}
          {view === 'login' && (
            <OtpLogin 
              onBack={() => setView('landing')} 
              onSuccess={handleLoginSuccess} 
              role={targetRole}
            />
          )}
          {view === 'worker-funnel' && user && (
            <WorkerFunnel 
              userId={user.id} 
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
      </div>
    );
  }

  // Otherwise, render the Unified Landing Page with top header and regulatory footer
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-[#202124]">
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:scale-102 active:scale-98 transition-all">
            <img src="/logo.png" alt="Sevikaa Logo" className="h-20 w-auto object-contain" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            {[
              { label: 'About Us', href: '/about' },
              { label: 'How It Works', href: '/how-it-works' },
              { label: 'Pricing', href: '/pricing' },
              { label: 'Safety', href: '/safety' },
              { label: 'Contact', href: '/contact' },
              { label: 'FAQ', href: '/faq' }
            ].map((link, index) => (
              <Link 
                key={index} 
                href={link.href} 
                className="relative py-1 text-gray-600 hover:text-[#1A73E8] transition-all hover:scale-105 active:scale-95 duration-200 group font-bold"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1A73E8] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300" />
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* 2. HERO MARKETING SECTION & 2 CTA CARDS */}
      <section className="bg-white border-b border-gray-200 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#34A853]/10 text-[#34A853] rounded-full text-xs font-bold mx-auto">
            <Shield size={12} />
            <span>🛡️ India's Trusted Domestic Workforce Platform</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-[#202124]">
            Connecting Trusted Homes with Trusted Domestic Workers
          </h1>
          <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Whether you're looking for work or looking to hire, Sevikaa helps verified maids, cooks, and nannies connect with families nearby through smart, society-based matching.
          </p>

          {/* Core Entrance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-6">
            <button
              onClick={handleStartWorkerFlow}
              className="p-6 rounded-3xl border-2 border-gray-200 hover:border-[#1A73E8] text-left active:scale-[0.98] transition-all bg-white shadow-sm flex flex-col justify-between min-h-[180px] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#1A73E8]/10 text-[#1A73E8] group-hover:bg-[#1A73E8] group-hover:text-white flex items-center justify-center transition-all">
                <UserPlus size={24} />
              </div>
              <div className="space-y-1">
                <span className="block text-lg font-extrabold text-gray-700">Looking for Work?</span>
                <span className="block text-[11px] text-gray-400 font-medium leading-normal">Create your profile, showcase your skills, set your availability, and connect with trusted employers near you.</span>
                <span className="inline-block mt-2 text-xs font-bold text-[#1A73E8] group-hover:underline">Find Jobs &rarr;</span>
              </div>
            </button>

            <button
              onClick={handleStartEmployerFlow}
              className="p-6 rounded-3xl border-2 border-gray-200 hover:border-[#34A853] text-left active:scale-[0.98] transition-all bg-white shadow-sm flex flex-col justify-between min-h-[180px] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#34A853]/10 text-[#34A853] group-hover:bg-[#34A853] group-hover:text-white flex items-center justify-center transition-all">
                <Search size={24} />
              </div>
              <div className="space-y-1">
                <span className="block text-lg font-extrabold text-gray-700">Looking to Hire?</span>
                <span className="block text-[11px] text-gray-400 font-medium leading-normal">Discover verified maids, cooks, and nannies available in your society or nearby and hire with confidence.</span>
                <span className="inline-block mt-2 text-xs font-bold text-[#34A853] group-hover:underline">Find Workers &rarr;</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="py-16 px-4 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div>
            <h2 className="text-2xl font-black text-gray-800">How Sevikaa Works</h2>
            <p className="text-gray-400 text-xs mt-1 font-medium">Three Simple Steps to Connect, Hire & Get Hired</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Register & Get Verified', desc: 'Create your profile in minutes. Workers showcase their skills and availability, while employers add their hiring requirements. Verified profiles help build trust for everyone.', icon: <UserPlus size={18} />, hoverBorder: 'hover:border-[#1A73E8]', badgeBg: 'bg-[#1A73E8]', iconBg: 'bg-[#1A73E8]/5 text-[#1A73E8]' },
              { step: '2', title: 'Smart Society-Based Matching', desc: 'Our intelligent matching system connects workers and employers from the same apartment or nearby societies based on skills, availability, and location preferences.', icon: <Search size={18} />, hoverBorder: 'hover:border-[#FBBC05]', badgeBg: 'bg-[#FBBC05]', iconBg: 'bg-[#FBBC05]/5 text-[#FBBC05]' },
              { step: '3', title: 'Connect & Start with Confidence', desc: 'Employers can securely unlock contact details to connect via Call or WhatsApp, while workers receive genuine nearby job opportunities from verified families.', icon: <PhoneCall size={18} />, hoverBorder: 'hover:border-[#34A853]', badgeBg: 'bg-[#34A853]', iconBg: 'bg-[#34A853]/5 text-[#34A853]' }
            ].map((item, i) => (
              <div key={i} className={`bg-white rounded-3xl border-2 border-gray-200 p-6 text-left space-y-4 shadow-sm relative transition-all duration-200 hover:shadow-md cursor-pointer ${item.hoverBorder}`}>
                <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full ${item.badgeBg} text-white font-black text-xs flex items-center justify-center shadow-sm`}>
                  {item.step}
                </div>
                <div className={`p-3 rounded-2xl w-fit ${item.iconBg}`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-700 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SAFETY & TRUST SECTION */}
      <section className="py-16 px-4 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Safety & Trust</h2>
            <p className="text-gray-400 text-xs mt-1 font-medium">Designed to build trust between workers and employers.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { title: 'Aadhaar Verified', subtitle: 'Verified Identity', desc: 'Every worker submits a government-issued Aadhaar for identity verification, helping employers hire with greater confidence.', icon: <Shield size={20} />, color: 'bg-red-50 text-[#EA4335]', hoverBorder: 'hover:border-[#EA4335]' },
              { title: 'Location Privacy', subtitle: 'Your Privacy Comes First', desc: 'Exact addresses and GPS locations are never shared. Employers only see approximate locations until a connection is established.', icon: <Lock size={20} />, color: 'bg-blue-50 text-[#1A73E8]', hoverBorder: 'hover:border-[#1A73E8]' },
              { title: 'Police Verification', subtitle: 'Additional Peace of Mind', desc: 'Workers can upload their Police Clearance Certificate (PCC). Verified documents are reviewed before the Police Verified badge is displayed.', icon: <Shield size={20} />, color: 'bg-green-50 text-[#34A853]', hoverBorder: 'hover:border-[#34A853]' }
            ].map((item, i) => (
              <div key={i} className={`p-6 bg-gray-50 border-2 border-gray-200 rounded-3xl space-y-4 transition-all duration-200 hover:shadow-md cursor-pointer ${item.hoverBorder}`}>
                <div className={`p-3 rounded-2xl w-fit ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-700 text-sm">{item.title}</h3>
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold mt-0.5">{item.subtitle}</span>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section className="py-16 px-4 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Simple & Transparent Pricing</h2>
            <p className="text-gray-400 text-xs mt-1 font-medium">Free for domestic workers. Premium features for employers who want to hire faster.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto items-stretch">
            {/* Workers Free */}
            <div 
              onClick={handleStartWorkerFlow}
              className="bg-white border-2 border-gray-200 p-6 rounded-3xl text-left flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:border-[#34A853] hover:shadow-lg hover:shadow-green-100/50 cursor-pointer shadow-sm"
            >
              <div className="space-y-4">
                <div>
                  <span className="bg-[#34A853]/10 text-[#34A853] text-[9px] font-bold px-2.5 py-0.5 rounded-full">🟢 For Domestic Workers</span>
                  <h4 className="text-base font-extrabold text-gray-700 mt-3">Always Free</h4>
                  <div className="text-3xl font-black text-gray-800 mt-1"><sup className="text-lg font-bold">₹</sup>0</div>
                  <p className="text-xs text-gray-400 mt-1 leading-normal font-medium">Everything you need to find your next job—at no cost.</p>
                </div>
                <ul className="text-xs text-gray-500 space-y-2 border-t border-gray-100 pt-4 font-semibold">
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-[#34A853] shrink-0" /> Create your verified profile</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-[#34A853] shrink-0" /> Apply for unlimited job opportunities</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-[#34A853] shrink-0" /> Update your skills & availability anytime</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-[#34A853] shrink-0" /> Receive interview requests from employers</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-[#34A853] shrink-0" /> Multilingual profile support</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleStartWorkerFlow(); }}
                className="w-full py-3 mt-6 text-xs font-bold rounded-2xl border-2 border-[#34A853] text-[#34A853] hover:bg-[#34A853] hover:text-white transition-all active:scale-[0.98]"
              >
                Register for Free
              </button>
            </div>

            {/* Employers Subscription */}
            <div 
              onClick={handleStartEmployerFlow}
              className="bg-white border-2 border-[#1A73E8] p-6 rounded-3xl text-left flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-100/50 cursor-pointer relative shadow-md"
            >
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-[#1A73E8] to-[#9b51e0] text-white text-[9px] font-black px-3.5 py-1 rounded-full shadow-sm uppercase tracking-wide">
                Popular
              </div>
              <div className="space-y-4">
                <div>
                  <span className="bg-[#1A73E8]/10 text-[#1A73E8] text-[9px] font-bold px-2.5 py-0.5 rounded-full">🔵 For Employers</span>
                  <h4 className="text-base font-extrabold text-gray-700 mt-3">Premium Pass</h4>
                  <div className="text-3xl font-black text-gray-800 mt-1"><sup className="text-lg font-bold">₹</sup>999<span className="text-xs text-gray-400 font-medium">/30 Days</span></div>
                  <p className="text-xs text-gray-400 mt-1 leading-normal font-medium">Everything you need to hire trusted domestic workers with confidence.</p>
                </div>
                <ul className="text-xs text-gray-500 space-y-2 border-t border-gray-100 pt-4 font-semibold">
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-[#1A73E8] shrink-0" /> View unlimited verified worker profiles</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-[#1A73E8] shrink-0" /> Unlock Call & WhatsApp contact details</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-[#1A73E8] shrink-0" /> Smart society-based worker matching</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-[#1A73E8] shrink-0" /> Post unlimited job requirements</li>
                  <li className="flex items-center gap-1.5"><Check size={14} className="text-[#1A73E8] shrink-0" /> Priority support during your subscription</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleStartEmployerFlow(); }}
                className="w-full py-3 mt-6 text-xs font-bold rounded-2xl bg-[#1A73E8] text-white hover:bg-[#155cb4] transition-all shadow-md shadow-blue-200/50 active:scale-[0.98]"
              >
                Get Premium Pass
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION SECTION */}
      <section className="py-16 px-4 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto space-y-12 text-center">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Frequently Asked Questions</h2>
            <p className="text-gray-400 text-xs mt-1 font-medium">Everything you need to know about Sevikaa.</p>
          </div>
          <div className="space-y-3.5 text-left">
            {[
              { q: "Is Sevikaa free for domestic workers?", a: "Yes. Registration and job applications are completely free for maids, cooks, and nannies.", tag: "🟢 Free Tier" },
              { q: "How does Sevikaa help me find the right match?", a: "Our smart society-based matching connects verified workers and employers based on location, skills, and availability, making hiring faster and more convenient.", tag: "📍 Matching" },
              { q: "Is my personal information safe on Sevikaa?", a: "Yes. Identity documents and personal information are securely protected. Exact addresses are never publicly displayed, ensuring privacy for both workers and employers.", tag: "🔒 Privacy" }
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className={`bg-gray-50 border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
                    isOpen ? 'border-[#1A73E8] shadow-md shadow-blue-50/50' : 'border-gray-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 flex items-center justify-between text-xs font-bold text-gray-700 hover:bg-gray-100/50"
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle size={16} className="text-[#1A73E8] shrink-0" /> 
                      <span className="leading-snug">{faq.q}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[8px] text-gray-400 font-bold uppercase shrink-0">
                        {faq.tag}
                      </span>
                    </span>
                    <ChevronDown size={14} className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#1A73E8]' : 'text-gray-400'}`} />
                  </button>
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-40 border-t border-gray-200/50 bg-white' : 'max-h-0'
                    }`}
                  >
                    <div className="px-5 py-4 text-xs text-gray-400 font-semibold leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 text-center">
            <Link 
              href="/faq" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A73E8] hover:underline"
            >
              Have more questions? View all FAQs &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 7. CONTACT & SUPPORT SECTION */}
      <section className="py-16 px-4 bg-gray-50 border-b border-gray-200">
        <div className="max-w-xl mx-auto space-y-6 text-center">
          <div>
            <h2 className="text-2xl font-black text-gray-800">Support & Contact</h2>
            <p className="text-gray-400 text-xs mt-1 font-medium">Need assistance? Our support team is here to help workers and employers every step of the way.</p>
          </div>
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-6 space-y-0 divide-y divide-gray-100 shadow-sm text-left text-xs font-bold text-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50">
            {/* Row 1: Email */}
            <a 
              href="mailto:support@sevikaa.in" 
              className="flex items-start gap-4 py-4 first:pt-0 transition-all duration-200 hover:bg-[#1A73E8]/5 -mx-6 px-6 rounded-t-3xl cursor-pointer group block"
            >
              <div className="p-2.5 rounded-xl bg-[#1A73E8]/10 text-[#1A73E8] shrink-0 group-hover:bg-[#1A73E8] group-hover:text-white transition-all">
                <Mail size={16} />
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 uppercase">Support Email</span>
                <span className="block mt-0.5 text-sm font-extrabold text-gray-700 group-hover:text-[#1A73E8] transition-colors">support@sevikaa.in</span>
                <span className="block text-[9px] text-gray-400 font-medium leading-normal mt-1">For account support, profile verification, partnerships, billing enquiries, and general assistance.</span>
              </div>
            </a>

            {/* Row 2: Phone */}
            <a 
              href="tel:+918757728679" 
              className="flex items-start gap-4 py-4 transition-all duration-200 hover:bg-[#34A853]/5 -mx-6 px-6 cursor-pointer group block"
            >
              <div className="p-2.5 rounded-xl bg-[#34A853]/10 text-[#34A853] shrink-0 group-hover:bg-[#34A853] group-hover:text-white transition-all">
                <Phone size={16} />
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 uppercase">Customer Support</span>
                <span className="block mt-0.5 text-sm font-extrabold text-gray-700 group-hover:text-[#34A853] transition-colors">+91 87577 28679</span>
                <span className="block text-[9px] text-gray-400 font-medium leading-normal mt-1">Speak with our support team during business hours for quick assistance.</span>
              </div>
            </a>

            {/* Row 3: Business Hours */}
            <div className="flex items-start gap-4 py-4 transition-all duration-200 hover:bg-[#FBBC05]/5 -mx-6 px-6 group">
              <div className="p-2.5 rounded-xl bg-[#FBBC05]/10 text-[#FBBC05] shrink-0 group-hover:bg-[#FBBC05] group-hover:text-white transition-all">
                <Sparkles size={16} />
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 uppercase">Business Hours</span>
                <span className="block mt-0.5 text-sm font-extrabold text-gray-700 group-hover:text-[#FBBC05] transition-colors">Monday – Friday: 10:00 AM – 5:00 PM (IST)</span>
                <span className="block text-[9px] text-gray-400 font-medium leading-normal mt-1">Saturday & Sunday: Closed. Email enquiries are responded to within 1–2 business days.</span>
              </div>
            </div>

            {/* Row 4: Company Info */}
            <div className="flex items-start gap-4 py-4 last:pb-0 transition-all duration-200 hover:bg-[#EA4335]/5 -mx-6 px-6 rounded-b-3xl group">
              <div className="p-2.5 rounded-xl bg-[#EA4335]/10 text-[#EA4335] shrink-0 group-hover:bg-[#EA4335] group-hover:text-white transition-all">
                <MapPin size={16} />
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 uppercase">Owned & Operated By</span>
                <span className="block mt-0.5 text-sm font-extrabold text-gray-700 group-hover:text-[#EA4335] transition-colors">YugaYatra Retail (OPC) Private Limited</span>
                <span className="block text-xs font-semibold text-gray-400 mt-1 leading-normal">
                  Electronic City, Phase 1, Bengaluru, Karnataka, India
                </span>
                <span className="block text-[9px] text-gray-400 mt-0.5">CIN: U47912KA2024OPC188603 (Registered with the Ministry of Corporate Affairs, Government of India)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. REGULATORY FOOTER POLICIES */}
      <footer className="bg-[#202124] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-8 text-center">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-bold text-gray-400">
            <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/safety" className="hover:text-white transition-colors">Safety</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] text-gray-500 border-t border-gray-800 pt-6">
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms & Conditions</Link>
            <span className="text-gray-700">|</span>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <span className="text-gray-700">|</span>
            <Link href="/refunds" className="hover:text-gray-300 transition-colors">Refund & Cancellation</Link>
            <span className="text-gray-700">|</span>
            <Link href="/shipping" className="hover:text-gray-300 transition-colors">Shipping & Delivery</Link>
            <span className="text-gray-700">|</span>
            <Link href="/sitemap.xml" className="hover:text-gray-300 transition-colors">Sitemap</Link>
          </div>
          <div className="space-y-1 pt-2">
            <p className="text-[10px] text-gray-500 font-bold max-w-md mx-auto leading-normal">
              Sevikaa is proudly owned and operated by YugaYatra Retail (OPC) Private Limited, a Government-Registered and DPIIT-Recognized Startup committed to building trusted digital platforms for India.
            </p>
            <p className="text-[9px] text-gray-600 font-semibold pt-1">
              © {new Date().getFullYear()} Sevikaa. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
