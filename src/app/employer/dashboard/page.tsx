"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { supabase } from '../../../lib/supabaseClient';
import { formatDistance } from '../../../utils/geo';
import { 
  User, Calendar, Search, Bookmark, PlusCircle, CheckCircle2, 
  MessageSquare, Phone, Lock, Sparkles, CreditCard, Bell, Settings, LogOut, ShieldCheck 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const MOCK_SOCIETIES = [
  { id: '91cb520f-d5b7-4b71-9f20-b44c3c3de101', name: 'DLF Westend Heights - Akshayanagar' },
  { id: 'c7e2d9a3-5bc5-442a-a921-ef743bd2b6d2', name: 'Prestige Song of the South - Bangalore' },
  { id: 'b1a2f3c4-e888-4c91-a1b2-3f8c8dcb2e83', name: 'SNN Raj Serenity - Bangalore' }
];

export default function EmployerDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'post-job' | 'search' | 'payments' | 'settings'>('home');
  const [isPremium, setIsPremium] = useState(false);
  const [unlockedContacts, setUnlockedContacts] = useState<string[]>([]); // worker_id[]
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [societiesList, setSocietiesList] = useState<any[]>(MOCK_SOCIETIES);

  // Search filter states
  const [searchCategory, setSearchCategory] = useState<'maid' | 'cook' | 'nanny'>('maid');
  const [searchSociety, setSearchSociety] = useState('91cb520f-d5b7-4b71-9f20-b44c3c3de101');
  const [maxSalary, setMaxSalary] = useState(15000);
  const [workers, setWorkers] = useState<any[]>([]);

  // Job Posting Form State
  const [jobCategory, setJobCategory] = useState<'maid' | 'cook' | 'nanny'>('maid');
  const [jobDescription, setJobDescription] = useState('');
  const [jobSociety, setJobSociety] = useState('1');
  const [jobSalary, setJobSalary] = useState('10000');

  // Trigger search logic calling local Next.js match router API
  const handleSearch = async () => {
    try {
      const response = await fetch(`/api/match?societyId=${searchSociety}&category=${searchCategory}&maxSalary=${maxSalary}`);
      const data = await response.json();
      if (data.results) {
        setWorkers(data.results);
      }
    } catch (err) {
      console.error("Search fetch error:", err);
    }
  };

  useEffect(() => {
    const fetchEmployerData = async () => {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setUser({ id: 'mock-employer-uuid-123' });
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }
        const sessionUser = session.user;
        setUser(sessionUser);

        // Verify primary profile role to ensure route isolation
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', sessionUser.id)
          .single();

        if (profile && profile.role !== 'employer') {
          router.push(profile.role === 'worker' ? '/worker/dashboard' : '/');
          return;
        }

        // Get employer profile
        const { data: ep } = await supabase
          .from('employer_profiles')
          .select('*')
          .eq('user_id', sessionUser.id)
          .single();

        if (ep) {
          setIsPremium(ep.subscription_status === 'active');
          
          // Get active jobs count
          const { count } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('employer_id', ep.id);
          
          setActiveJobsCount(count || 0);
        } else {
          // Employer profile doesn't exist yet, auto create it
          const { data: newEp } = await supabase
            .from('employer_profiles')
            .insert({
              user_id: sessionUser.id,
              name: sessionUser.email?.split('@')[0] || 'Employer',
              subscription_status: 'free'
            })
            .select()
            .single();
          if (newEp) {
            setIsPremium(false);
          }
        }

        // Fetch operational societies
        const { data: socs } = await supabase
          .from('societies')
          .select('*');
        if (socs && socs.length > 0) {
          setSocietiesList(socs);
          setSearchSociety(socs[0].id);
          setJobSociety(socs[0].id);
        }

      } catch (err) {
        console.error("Employer fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployerData();
  }, [router]);

  useEffect(() => {
    handleSearch();
  }, [searchCategory, searchSociety, maxSalary]);

  const handleUnlock = (workerId: string) => {
    if (!isPremium) {
      setActiveTab('payments');
      alert("A Premium Subscription is required to unlock worker contact details. Redirecting to payment options.");
      return;
    }
    setUnlockedContacts(prev => [...prev, workerId]);
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholder && user) {
      try {
        const { data: ep } = await supabase
          .from('employer_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (ep) {
          const { error: jobErr } = await supabase
            .from('jobs')
            .insert({
              employer_id: ep.id,
              category: jobCategory,
              description: jobDescription,
              salary_range: parseInt(jobSalary) || 0,
              society_id: jobSociety,
              status: 'pending_approval'
            });

          if (jobErr) throw jobErr;
          setActiveJobsCount(prev => prev + 1);
        }
      } catch (err) {
        console.error("Post job error:", err);
        alert("Failed to submit job. Verify database connections.");
        return;
      }
    }

    alert(`Job for ${jobCategory.toUpperCase()} successfully posted! Status is pending admin approval.`);
    setJobDescription('');
    setActiveTab('home');
  };

  const handleUpgrade = async () => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholder && user) {
      try {
        await supabase
          .from('employer_profiles')
          .update({ subscription_status: 'active' })
          .eq('user_id', user.id);
      } catch (err) {
        console.error("Upgrade error:", err);
      }
    }

    setIsPremium(true);
    setActiveTab('search');
    alert("Razorpay payment simulation successful! You are now a Premium Employer. Workers contact details can now be unlocked.");
  };

  const handleLogout = async () => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!isPlaceholder) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('sevikaa_language');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-bold text-sm">
        Loading Employer Dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto w-full border-x border-gray-200">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Sevikaa Logo" className="h-8 w-auto object-contain bg-white rounded-full p-0.5 border border-gray-100" />
          <span className="font-extrabold text-lg tracking-tight text-[#202124]">Sevikaa</span>
        </div>
        <div className="flex items-center gap-2">
          {isPremium ? (
            <span className="bg-[#34A853]/10 text-[#34A853] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Sparkles size={8} /> Premium
            </span>
          ) : (
            <button 
              onClick={() => setActiveTab('payments')}
              className="bg-[#1A73E8] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm"
            >
              Get Premium
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto pb-24">
        
        {/* HOME TAB: Summary */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Summary Card */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Subscription Tier</span>
                <span className="block text-xl font-black text-[#202124] mt-0.5">
                  {isPremium ? 'Premium Access Active' : 'Free Demo Account'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-xs font-bold">
                <div>
                  <span className="text-gray-400">Active Jobs:</span>
                  <span className="text-gray-700 ml-1">{activeJobsCount} (Pending approval)</span>
                </div>
                <div>
                  <span className="text-gray-400">Unlocked Contacts:</span>
                  <span className="text-[#34A853] ml-1">{unlockedContacts.length}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setActiveTab('post-job')}
                className="p-5 bg-white rounded-3xl border border-gray-200 hover:border-[#1A73E8] active:scale-95 transition-all text-left shadow-sm flex flex-col justify-between min-h-[120px]"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center">
                  <PlusCircle size={20} />
                </div>
                <span className="block text-sm font-bold text-gray-700 mt-4">Post a Job</span>
              </button>

              <button 
                onClick={() => setActiveTab('search')}
                className="p-5 bg-white rounded-3xl border border-gray-200 hover:border-[#34A853] active:scale-95 transition-all text-left shadow-sm flex flex-col justify-between min-h-[120px]"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#34A853]/10 text-[#34A853] flex items-center justify-center">
                  <Search size={20} />
                </div>
                <span className="block text-sm font-bold text-gray-700 mt-4">Find Workers</span>
              </button>
            </div>
          </div>
        )}

        {/* POST JOB TAB */}
        {activeTab === 'post-job' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-[#202124]">Post a New Job</h2>
            <form onSubmit={handlePostJob} className="bg-white rounded-3xl border border-gray-200 p-5 space-y-4 shadow-sm">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Job Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {['maid', 'cook', 'nanny'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setJobCategory(c as any)}
                      className={`py-3 rounded-xl border-2 font-bold text-xs capitalize transition-all ${
                        jobCategory === c ? 'border-[#1A73E8] bg-[#1A73E8]/5 text-[#1A73E8]' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="E.g., 3BHK cleaning, dusting, 6 days a week."
                  required
                  rows={3}
                  className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:bg-white focus:border-[#1A73E8] focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Apartment Society</label>
                <select
                  value={jobSociety}
                  onChange={(e) => setJobSociety(e.target.value)}
                  className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:bg-white focus:border-[#1A73E8]"
                >
                  {societiesList.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Salary Offer (₹)</label>
                <input
                  type="number"
                  value={jobSalary}
                  onChange={(e) => setJobSalary(e.target.value)}
                  className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:bg-white focus:border-[#1A73E8]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#1A73E8] hover:bg-[#1A73E8]/90 text-white font-bold rounded-2xl shadow-sm text-sm active:scale-95 transition-all min-h-[46px]"
              >
                Publish Job Post
              </button>
            </form>
          </div>
        )}

        {/* SEARCH WORKERS TAB */}
        {activeTab === 'search' && (
          <div className="space-y-5 animate-fade-in">
            {/* Filter Drawer Panel */}
            <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex gap-2">
                {['maid', 'cook', 'nanny'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSearchCategory(c as any)}
                    className={`flex-1 py-2 border rounded-full text-[10px] font-bold capitalize transition-all ${
                      searchCategory === c ? 'bg-[#1A73E8] text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <select
                  value={searchSociety}
                  onChange={(e) => setSearchSociety(e.target.value)}
                  className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-600 focus:outline-none"
                >
                  {societiesList.map(s => (
                    <option key={s.id} value={s.id}>{s.name.split(',')[0]}</option>
                  ))}
                </select>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2">
                  <span className="text-gray-400 font-bold mr-1">Max ₹</span>
                  <input
                    type="number"
                    value={maxSalary}
                    onChange={(e) => setMaxSalary(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent font-bold text-gray-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Results Grid List */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Matched Workers</h3>
              {loading ? (
                <div className="text-center py-6 text-xs text-gray-400 font-bold">Querying local Matching Engine...</div>
              ) : workers.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 font-bold">No matching workers found for this selection.</div>
              ) : (
                workers.map((worker) => {
                  const isUnlocked = unlockedContacts.includes(worker.user_id);
                  const isSameSociety = worker.preferred_society_id === searchSociety;
                  return (
                    <div key={worker.user_id} className="bg-white rounded-3xl border border-gray-200 p-4 shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-base font-bold text-gray-400 border border-gray-100">
                            {worker.full_name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-700">{worker.full_name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold text-[#1A73E8]">★ {worker.average_rating.toFixed(1)}</span>
                              <span className="text-[10px] font-bold text-gray-400">• {worker.age} Yrs • {worker.gender}</span>
                            </div>
                          </div>
                        </div>

                        {/* Location Privacy distance format indicator */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          isSameSociety ? 'bg-[#34A853]/10 text-[#34A853]' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {formatDistance(worker.approximate_distance, isSameSociety)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold border-y border-gray-100 py-2">
                        <div className="text-gray-400">Expected Salary: <span className="text-gray-700">₹{worker.expected_salary}/mo</span></div>
                        <div className="flex gap-1">
                          {worker.is_aadhaar_verified && <span className="text-[#34A853]">✓ Aadhaar</span>}
                          {worker.is_interview_verified && <span className="text-[#34A853]">✓ Interviewed</span>}
                        </div>
                      </div>

                      {/* Contact Paywall Controls */}
                      {isUnlocked ? (
                        <div className="flex gap-2">
                          <a 
                            href={`https://wa.me/919876543210`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 bg-[#34A853] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                          >
                            <MessageSquare size={14} />
                            <span>WhatsApp Worker</span>
                          </a>
                          <a 
                            href={`tel:+919876543210`}
                            className="py-2.5 px-3 border border-gray-200 rounded-xl text-gray-500 active:scale-95 transition-all flex items-center justify-center"
                          >
                            <Phone size={14} />
                          </a>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUnlock(worker.user_id)}
                          className="w-full py-2.5 bg-[#1A73E8]/10 hover:bg-[#1A73E8]/20 text-[#1A73E8] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                        >
                          <Lock size={12} />
                          <span>Unlock Contact {!isPremium && '(Requires Premium)'}</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* PAYMENTS & PREMIUM SELECTION TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-[#202124]">Subscription Options</h2>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 text-center space-y-6">
              <div className="w-12 h-12 rounded-full bg-[#1A73E8]/10 text-[#1A73E8] flex items-center justify-center mx-auto">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-700">Premium Employer Access</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Gain instant access to unlock worker phone numbers, message directly on WhatsApp, and save unlimited candidate bookmarks.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex justify-between items-center text-left">
                <div>
                  <span className="block text-xs font-bold text-gray-700">Sevikaa Elite Pass</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">30-day unlimited unlocks</span>
                </div>
                <span className="text-lg font-black text-[#1A73E8]">₹999</span>
              </div>

              {isPremium ? (
                <div className="py-3 px-4 bg-[#34A853]/5 border border-[#34A853]/10 rounded-2xl text-xs font-bold text-[#34A853] flex items-center justify-center gap-1">
                  <ShieldCheck size={16} />
                  <span>Your Premium Account is Active!</span>
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="w-full py-4 bg-[#1A73E8] hover:bg-[#1A73E8]/90 text-white font-bold rounded-2xl shadow-sm text-sm active:scale-95 transition-all min-h-[46px]"
                >
                  Pay ₹999 via Razorpay
                </button>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-[#202124]">Employer Settings</h2>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-4 space-y-4">
              <button
                onClick={handleLogout}
                className="w-full py-4 mt-4 border border-[#EA4335]/20 hover:bg-[#EA4335]/5 text-[#EA4335] font-bold rounded-2xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut size={16} />
                <span>Log Out Session</span>
              </button>

              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-gray-400 font-bold pt-6 mt-4 border-t border-gray-100">
                <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Use</Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
                <span>•</span>
                <Link href="/refunds" className="hover:text-gray-600 transition-colors">Refund Policy</Link>
                <span>•</span>
                <Link href="/shipping" className="hover:text-gray-600 transition-colors">Shipping Policy</Link>
                <span>•</span>
                <Link href="/contact" className="hover:text-gray-600 transition-colors">Contact Support</Link>
              </div>
              <p className="text-[9px] text-gray-400 text-center mt-3 font-semibold">
                © {new Date().getFullYear()} Sevikaa. All rights reserved.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Footer Tab Bar */}
      <nav className="bg-white border-t border-gray-200 flex justify-between items-center px-4 py-2 sticky bottom-0 z-10 shadow-lg max-w-md mx-auto w-full">
        {[
          { id: 'home', label: 'Home', icon: <PlusCircle size={20} /> },
          { id: 'post-job', label: 'Post Job', icon: <Bookmark size={20} /> },
          { id: 'search', label: 'Search', icon: <Search size={20} /> },
          { id: 'payments', label: 'Pricing', icon: <CreditCard size={20} /> },
          { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-2 select-none active:scale-95 transition-all min-h-[48px] ${
                isActive ? 'text-[#1A73E8]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.icon}
              <span className="text-[9px] font-bold mt-1 leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
