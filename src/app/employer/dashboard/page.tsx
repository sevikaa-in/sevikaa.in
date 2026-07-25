"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { supabase } from '../../../lib/supabaseClient';
import { formatDistance } from '../../../utils/geo';
import { 
  User, Calendar, Search, Bookmark, PlusCircle, CheckCircle2, 
  MessageSquare, Phone, Lock, Sparkles, CreditCard, Bell, Settings, LogOut, 
  ShieldCheck, Home, FileText, Heart, Info, ArrowLeft, Check, AlertCircle, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = [
  { id: 'early_morning', label: 'Early (6 AM - 9 AM)' },
  { id: 'morning', label: 'Morning (9 AM - 12 PM)' },
  { id: 'afternoon', label: 'Afternoon (12 PM - 3 PM)' },
  { id: 'evening', label: 'Evening (3 PM - 6 PM)' },
  { id: 'night', label: 'Night (6 PM - 9 PM)' }
];

const MOCK_SOCIETIES = [
  { id: '91cb520f-d5b7-4b71-9f20-b44c3c3de101', name: 'DLF Westend Heights - Akshayanagar' },
  { id: 'c7e2d9a3-5bc5-442a-a921-ef743bd2b6d2', name: 'Prestige Song of the South - Bangalore' },
  { id: 'b1a2f3c4-e888-4c91-a1b2-3f8c8dcb2e83', name: 'SNN Raj Serenity - Bangalore' }
];

const TASK_OPTIONS: Record<string, string[]> = {
  maid: ['🧹 Floor Mopping', '🧼 Dusting', '🍽️ Utensils Washing', '🧺 Laundry', '🪟 Window Cleaning'],
  cook: ['🥦 Veg Cooking', '🍗 Non-Veg Cooking', '🍚 North Indian', '🥞 South Indian', '🧹 Kitchen Cleanup'],
  nanny: ['👶 Infant Care (<1 yr)', '🧒 Toddler Care (1-3 yrs)', '🎒 School Prep', '📚 Homework Help', '🧸 Toy Room Cleanup']
};

export default function EmployerDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'post-job' | 'search' | 'payments' | 'settings'>('home');
  const [isPremium, setIsPremium] = useState(false);
  
  // Unlocked candidate contacts tracking
  const [unlockedContacts, setUnlockedContacts] = useState<string[]>([]); // worker_id[]
  const [unlockedPhones, setUnlockedPhones] = useState<Record<string, string>>({}); // worker_id -> phone

  // Bookmarks candidates list
  const [bookmarkedContacts, setBookmarkedContacts] = useState<string[]>([]); // worker_id[]

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [employerProfile, setEmployerProfile] = useState<any>(null);
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [societiesList, setSocietiesList] = useState<any[]>(MOCK_SOCIETIES);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search filter states
  const [searchCategory, setSearchCategory] = useState<'maid' | 'cook' | 'nanny'>('maid');
  const [searchSociety, setSearchSociety] = useState('91cb520f-d5b7-4b71-9f20-b44c3c3de101');
  const [maxSalary, setMaxSalary] = useState(15000);
  const [workers, setWorkers] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Job Posting Form State
  const [jobCategory, setJobCategory] = useState<'maid' | 'cook' | 'nanny'>('maid');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobSociety, setJobSociety] = useState('91cb520f-d5b7-4b71-9f20-b44c3c3de101');
  const [jobSalary, setJobSalary] = useState('12000');
  const [jobSpecificTasks, setJobSpecificTasks] = useState<string[]>([]);
  const [jobRequiredSlots, setJobRequiredSlots] = useState<Record<string, string[]>>({});

  // Receipt ledger
  const [receipts, setReceipts] = useState<any[]>([
    { id: 'REC-1084', date: '2026-07-25', description: 'Sevikaa Elite Pass Upgrade', amount: '₹999', method: 'Razorpay', status: 'Success' }
  ]);

  // Fetch match results
  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/match?societyId=${searchSociety}&category=${searchCategory}&maxSalary=${maxSalary}`);
      const data = await response.json();
      if (data.results) {
        setWorkers(data.results);
      }
    } catch (err) {
      console.error("Search fetch error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const fetchEmployerData = async () => {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setUser({ id: 'mock-employer-uuid-123', email: 'employer@demo.com' });
        setEmployerProfile({ id: 'mock-ep-id', name: 'Demo Employer Household' });
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

        // Get or Auto-create employer profile
        let { data: ep } = await supabase
          .from('employer_profiles')
          .select('*')
          .eq('user_id', sessionUser.id)
          .single();

        if (!ep) {
          const { data: newEp } = await supabase
            .from('employer_profiles')
            .insert({
              user_id: sessionUser.id,
              name: sessionUser.email?.split('@')[0] || 'Employer Household',
              subscription_status: 'free'
            })
            .select()
            .single();
          ep = newEp;
        }

        if (ep) {
          setEmployerProfile(ep);
          setIsPremium(ep.subscription_status === 'premium'); // Matches database check constraint ('free', 'premium')
          
          // Get active jobs
          const { data: jobs } = await supabase
            .from('jobs')
            .select('*, society:societies(*)')
            .eq('employer_id', ep.id);
          
          if (jobs) {
            setPostedJobs(jobs);
            setActiveJobsCount(jobs.length);
          }

          // Fetch unlocked contacts
          const { data: unlocks } = await supabase
            .from('employer_unlocks')
            .select('worker_id, profiles(phone)')
            .eq('employer_id', ep.id);

          if (unlocks) {
            const unlockedIds = unlocks.map(u => u.worker_id);
            const phoneMap: Record<string, string> = {};
            unlocks.forEach((u: any) => {
              if (u.profiles?.phone) {
                phoneMap[u.worker_id] = u.profiles.phone;
              }
            });
            setUnlockedContacts(unlockedIds);
            setUnlockedPhones(phoneMap);
          }

          // Fetch bookmarks
          const { data: bookmarks } = await supabase
            .from('employer_bookmarks')
            .select('worker_id')
            .eq('employer_id', ep.id);

          if (bookmarks) {
            setBookmarkedContacts(bookmarks.map(b => b.worker_id));
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

  // Unlock Contact handler invoking secure backend API endpoint
  const handleUnlock = async (workerId: string) => {
    setError('');
    setSuccess('');
    if (!isPremium) {
      setActiveTab('payments');
      setError("A Premium Subscription is required to unlock worker contact details.");
      return;
    }

    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setUnlockedContacts(prev => [...prev, workerId]);
        setUnlockedPhones(prev => ({ ...prev, [workerId]: '+919876543210' }));
        setSuccess("Worker details unlocked successfully (Mock)!");
        return;
      }

      const response = await fetch('/api/employer/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, employerUserId: user.id })
      });
      const data = await response.json();

      if (data.success) {
        setUnlockedPhones(prev => ({ ...prev, [workerId]: data.phone }));
        setUnlockedContacts(prev => [...prev, workerId]);
        setSuccess("Contact details unlocked successfully!");
      } else {
        setError(data.error || "Failed to unlock contact. Verify subscription.");
      }
    } catch (err: any) {
      console.error("Unlock contact API error:", err);
      setError("Server connection failure during unlock request.");
    }
  };

  // Shortlisting candidates (bookmarks)
  const toggleBookmark = async (workerId: string) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    const isBookmarked = bookmarkedContacts.includes(workerId);
    
    if (isBookmarked) {
      setBookmarkedContacts(prev => prev.filter(id => id !== workerId));
      if (!isPlaceholder && employerProfile) {
        await supabase
          .from('employer_bookmarks')
          .delete()
          .eq('employer_id', employerProfile.id)
          .eq('worker_id', workerId);
      }
    } else {
      setBookmarkedContacts(prev => [...prev, workerId]);
      if (!isPlaceholder && employerProfile) {
        await supabase
          .from('employer_bookmarks')
          .insert({
            employer_id: employerProfile.id,
            worker_id: workerId
          });
      }
    }
  };

  // Post new job with task checkbox criteria and slot grid availability rules
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!jobTitle.trim()) return setError('Please enter job title.');
    if (!jobDescription.trim()) return setError('Please enter job details.');

    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    try {
      if (isPlaceholder) {
        setPostedJobs(prev => [
          ...prev,
          {
            id: `job_mock_${Date.now()}`,
            title: jobTitle,
            category: jobCategory,
            description: jobDescription,
            salary_range_min: parseInt(jobSalary) || 0,
            salary_range_max: parseInt(jobSalary) || 0,
            status: 'pending_approval',
            society: societiesList.find(s => s.id === jobSociety)?.name || 'Demo Society'
          }
        ]);
        setActiveJobsCount(prev => prev + 1);
        setSuccess("Job posted successfully (Mock Mode)!");
        setJobTitle('');
        setJobDescription('');
        setJobSpecificTasks([]);
        setJobRequiredSlots({});
        setTimeout(() => setActiveTab('home'), 1000);
        return;
      }

      if (employerProfile) {
        const { error: jobErr } = await supabase
          .from('jobs')
          .insert({
            employer_id: employerProfile.id,
            title: jobTitle,
            category: jobCategory,
            description: jobDescription,
            salary_range_min: parseInt(jobSalary) || 0,
            salary_range_max: parseInt(jobSalary) || 0,
            society_id: jobSociety,
            specific_tasks: jobSpecificTasks,
            required_slots: jobRequiredSlots,
            status: 'pending_approval'
          });

        if (jobErr) throw jobErr;

        setSuccess("Job requirement posted successfully! Pending admin approval.");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: any) {
      console.error("Post job error:", err);
      setError(err.message || "Failed to post job requirement.");
    }
  };

  // Simulate upgrading using standard premium DB string value
  const handleUpgrade = async () => {
    setError('');
    setSuccess('');
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    try {
      if (isPlaceholder) {
        setIsPremium(true);
        setSuccess("Mock checkout complete! Premium active.");
        setTimeout(() => setActiveTab('search'), 1000);
        return;
      }

      const { error: updErr } = await supabase
        .from('employer_profiles')
        .update({ subscription_status: 'premium' }) // Updates status string to 'premium'
        .eq('user_id', user.id);

      if (updErr) throw updErr;

      setIsPremium(true);
      setSuccess("Subscription upgraded successfully (Simulated Razorpay capture)!");
      
      // Update receipts ledger locally
      setReceipts(prev => [
        ...prev,
        { id: `REC-${Math.floor(1000 + Math.random() * 9000)}`, date: new Date().toISOString().split('T')[0], description: 'Sevikaa Elite Pass Upgrade', amount: '₹999', method: 'Razorpay', status: 'Success' }
      ]);

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("Upgrade error:", err);
      setError("Failed to upgrade subscription tier.");
    }
  };

  const toggleJobSlotCell = (day: string, slotId: string) => {
    const daySlots = jobRequiredSlots[day] || [];
    const updated = daySlots.includes(slotId)
      ? daySlots.filter(s => s !== slotId)
      : [...daySlots, slotId];
    
    setJobRequiredSlots({ ...jobRequiredSlots, [day]: updated });
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
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC] text-slate-400 font-black text-sm">
        Loading Employer Dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] max-w-md mx-auto w-full border-x border-slate-100 font-sans antialiased text-slate-800">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Sevikaa Logo" className="h-8 w-auto object-contain" />
          <span className="font-black text-base tracking-tight text-slate-800">Sevikaa</span>
        </div>
        <div className="flex items-center gap-2">
          {isPremium ? (
            <span className="bg-green-50 text-[#22C55E] text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-green-100/60">
              <Sparkles size={8} className="fill-[#22C55E]" /> Premium
            </span>
          ) : (
            <button 
              onClick={() => setActiveTab('payments')}
              className="bg-[#2563EB] hover:bg-blue-700 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm border-0 cursor-pointer active:scale-95 transition-all"
            >
              Get Premium
            </button>
          )}
        </div>
      </header>

      {/* DYNAMIC VIEW CONTAINER */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6 pb-24">
        
        {/* Global Notifications */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-500 text-center font-medium flex items-center justify-center gap-1.5">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-500 text-center font-medium flex items-center justify-center gap-1.5">
            <Check size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Back navigation helper */}
        {activeTab !== 'home' && (
          <button 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 hover:bg-slate-50 hover:text-slate-800 active:scale-95 transition-all cursor-pointer shadow-sm shadow-slate-100/50"
          >
            <ArrowLeft size={12} strokeWidth={3} />
            <span>BACK TO HOME</span>
          </button>
        )}

        {/* ================= HOME TAB ================= */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
            {/* Greetings block */}
            <div className="space-y-1 px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Welcome Back 👋</span>
              <h1 className="text-2xl font-black text-slate-800 leading-tight">Hi, {employerProfile?.name.split(' ')[0]}</h1>
              <p className="text-xs text-slate-500 font-medium">Ready to discover your next opportunity?</p>
            </div>

            {/* Subscription status widget */}
            <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Subscription Tier</span>
                <span className="text-base font-black text-slate-800 block mt-0.5">
                  {isPremium ? '💎 Premium Access Active' : 'Free Demo Account'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-500">
                <div>
                  Active Requirements: <span className="text-slate-800 ml-0.5">{activeJobsCount}</span>
                </div>
                <div>
                  Unlocked Contacts: <span className="text-[#22C55E] ml-0.5">{unlockedContacts.length}</span>
                </div>
              </div>

              {!isPremium && (
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 space-y-3 mt-1">
                  <h4 className="text-xs font-black text-[#2563EB]">Unlock Unlimited Contacts</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    View worker credentials, contact candidates directly on WhatsApp, and book interviews in your society.
                  </p>
                  <button 
                    onClick={() => setActiveTab('payments')}
                    className="w-full py-2.5 bg-[#2563EB] text-white text-[10px] font-bold rounded-lg border-0 hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Upgrade for ₹999
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions grid */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveTab('post-job')}
                className="p-5 bg-white rounded-[20px] border border-slate-100 text-left shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 flex flex-col justify-between min-h-[140px] group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
                  <PlusCircle size={18} />
                </div>
                <div className="space-y-1 mt-4">
                  <span className="block text-xs font-black text-slate-800 group-hover:text-[#2563EB] transition-colors">Post a Job</span>
                  <span className="block text-[9px] text-slate-400 font-medium leading-normal">
                    Create detailed job post parameters specifying category, slots and tasks.
                  </span>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('search')}
                className="p-5 bg-white rounded-[20px] border border-slate-100 text-left shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 flex flex-col justify-between min-h-[140px] group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center border border-green-100 shadow-sm shrink-0">
                  <Search size={18} />
                </div>
                <div className="space-y-1 mt-4">
                  <span className="block text-xs font-black text-slate-800 group-hover:text-green-600 transition-colors">Find Workers</span>
                  <span className="block text-[9px] text-slate-400 font-medium leading-normal">
                    Discover verified domestic assistants in your neighborhood.
                  </span>
                </div>
              </button>
            </div>

            {/* Managed posted jobs listings */}
            <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <h3 className="text-xs font-black text-slate-800">My Job Listings</h3>
              <div className="space-y-2.5">
                {postedJobs.map((job) => (
                  <div key={job.id} className="p-3 bg-slate-50 border border-slate-100/80 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-700 capitalize">{job.title || `${job.category} requirement`}</h4>
                      <span className="block text-[9px] text-slate-400 font-bold mt-0.5">Offer: ₹{job.salary_range_min?.toLocaleString()}/mo • {job.society?.name || 'Local Society'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                      job.status === 'approved' ? 'bg-green-50 text-[#22C55E]' : 'bg-amber-50 text-[#F59E0B]'
                    }`}>
                      {job.status === 'approved' ? 'Live' : 'Pending Approval'}
                    </span>
                  </div>
                ))}
                {postedJobs.length === 0 && (
                  <p className="text-[10px] font-bold text-slate-400 text-center py-4">No job listings posted yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= POST A NEW JOB TAB ================= */}
        {activeTab === 'post-job' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-black text-slate-800 px-1">Post a New Job</h2>
            
            <form onSubmit={handlePostJob} className="bg-white rounded-[20px] border border-slate-100 p-5 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="E.g., Reliable Morning Cook needed for small family"
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Job Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {['maid', 'cook', 'nanny'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setJobCategory(c as any);
                        setJobSpecificTasks([]); // reset task checklist
                      }}
                      className={`py-2 px-3 rounded-lg border text-[10px] font-black capitalize transition-all cursor-pointer ${
                        jobCategory === c 
                          ? 'bg-blue-50 text-[#2563EB] border-blue-300' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {c === 'maid' && '🧹 Maid'}
                      {c === 'cook' && '🍳 Cook'}
                      {c === 'nanny' && '👶 Nanny'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task specific checkboxes */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Required Tasks Checklist</label>
                <div className="grid grid-cols-2 gap-2">
                  {TASK_OPTIONS[jobCategory]?.map((task) => {
                    const isChecked = jobSpecificTasks.includes(task);
                    return (
                      <button
                        key={task}
                        type="button"
                        onClick={() => {
                          setJobSpecificTasks(prev => 
                            prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
                          );
                        }}
                        className={`py-2 px-2.5 rounded-lg border text-[9px] font-bold text-left transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-slate-50 text-[#2563EB] border-blue-200' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '} {task}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Job Description / Details</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Provide house details, timings, preferences, veg/non-veg requirements, or flat dimensions."
                  required
                  rows={3}
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none resize-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Apartment Society Location</label>
                <select
                  value={jobSociety}
                  onChange={(e) => setJobSociety(e.target.value)}
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors cursor-pointer"
                >
                  {societiesList.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Monthly Salary Offer (₹/mo)</label>
                <input
                  type="number"
                  value={jobSalary}
                  onChange={(e) => setJobSalary(e.target.value)}
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                />
              </div>

              {/* Interactive slot grid for job post requirements */}
              <div className="space-y-2 pt-1 border-t border-slate-50">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Required Schedule Slots</label>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 text-[9px] w-full">
                  <div className="grid grid-cols-8 bg-slate-100 border-b border-slate-200 text-center py-2 font-bold text-slate-500">
                    <div>Slot</div>
                    {DAYS.map(d => <div key={d}>{d}</div>)}
                  </div>
                  {SLOTS.map((slot) => (
                    <div key={slot.id} className="grid grid-cols-8 border-b border-slate-200 items-center last:border-0 min-h-[36px] text-center">
                      <div className="font-bold text-slate-400 py-1 border-r border-slate-200 truncate px-0.5 leading-tight" title={slot.label}>
                        {slot.label.split(' ')[0]}
                      </div>
                      {DAYS.map((day) => {
                        const isSelected = jobRequiredSlots[day]?.includes(slot.id);
                        return (
                          <div
                            key={day}
                            onClick={() => toggleJobSlotCell(day, slot.id)}
                            className={`h-full border-r border-slate-200 last:border-r-0 flex items-center justify-center cursor-pointer transition-all active:scale-90 select-none ${
                              isSelected ? 'bg-blue-500 text-white' : 'hover:bg-slate-100'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={4} />}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <p className="text-[8px] text-slate-400 text-center font-bold">Configure schedule slot rules for matching.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm shadow-blue-100 text-xs active:scale-95 transition-all border-0 mt-4 cursor-pointer"
              >
                Publish Job Post Requirement
              </button>
            </form>
          </div>
        )}

        {/* ================= FIND WORKERS (MATCH SEARCH) TAB ================= */}
        {activeTab === 'search' && (
          <div className="space-y-5 animate-fade-in">
            {/* Filter Drawer Card */}
            <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <div className="flex gap-2">
                {['maid', 'cook', 'nanny'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSearchCategory(c as any)}
                    className={`flex-1 py-2 border rounded-full text-[10px] font-black capitalize transition-all cursor-pointer ${
                      searchCategory === c 
                        ? 'bg-[#2563EB] text-white border-transparent shadow-sm shadow-blue-100' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {c === 'maid' && '🧹 Maid'}
                    {c === 'cook' && '🍳 Cook'}
                    {c === 'nanny' && '👶 Nanny'}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase">Target Society</label>
                  <select
                    value={searchSociety}
                    onChange={(e) => setSearchSociety(e.target.value)}
                    className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {societiesList.map(s => (
                      <option key={s.id} value={s.id}>{s.name.split(' - ')[0]}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase">Max Budget Monthly</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <span className="text-slate-400 font-bold mr-1">₹</span>
                    <input
                      type="number"
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent font-bold text-slate-700 focus:outline-none border-0 p-0 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Matched Workers list */}
            <div className="space-y-4">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Matched Assistants</h3>
              
              {searchLoading ? (
                <div className="text-center py-10 text-xs text-slate-400 font-bold">Querying local Matching Engine...</div>
              ) : workers.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 font-bold bg-white rounded-[20px] border border-slate-100">
                  No matching workers found for this criteria in your vicinity.
                </div>
              ) : (
                workers.map((worker) => {
                  const isUnlocked = unlockedContacts.includes(worker.user_id);
                  const isSameSociety = worker.preferred_society_id === searchSociety;
                  const isBookmarked = bookmarkedContacts.includes(worker.user_id);
                  
                  return (
                    <div key={worker.user_id} className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4 animate-fade-in relative">
                      {/* Shortlist star overlay toggle */}
                      <button 
                        type="button"
                        onClick={() => toggleBookmark(worker.user_id)}
                        className="absolute right-5 top-5 p-1 bg-transparent border-0 cursor-pointer text-slate-300 hover:text-amber-500 transition-colors"
                        title={isBookmarked ? 'Remove shortlist' : 'Add to Shortlist'}
                      >
                        <Heart size={18} className={isBookmarked ? 'fill-red-500 text-red-500' : 'text-slate-300'} />
                      </button>

                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                          <span className="text-base font-black text-slate-400">
                            {worker.full_name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        
                        <div className="space-y-1 flex-1 pr-6">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-black text-slate-800 leading-tight">{worker.full_name}</h4>
                            <span className="text-[10px] font-black text-amber-500 flex items-center gap-0.5">★ {worker.average_rating ? worker.average_rating.toFixed(1) : '5.0'}</span>
                          </div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{worker.age} Yrs • {worker.gender}</span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black mt-1 ${
                            isSameSociety ? 'bg-green-50 text-[#22C55E]' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {formatDistance(worker.approximate_distance, isSameSociety)}
                          </span>
                        </div>
                      </div>

                      {/* Info metrics checklist grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-50 pt-3 text-[10px] font-bold text-slate-500">
                        <div>Expected Salary: <span className="text-slate-800">₹{worker.expected_salary?.toLocaleString()}/mo</span></div>
                        <div className="flex gap-1.5 flex-wrap justify-end">
                          {worker.is_aadhaar_verified && <span className="text-[#22C55E]">✓ Aadhaar</span>}
                          {worker.is_police_verified && <span className="text-[#22C55E]">✓ Police</span>}
                        </div>
                      </div>

                      {/* Paywall Controls with Secure Unlocked Contacts */}
                      {isUnlocked ? (
                        <div className="flex gap-2.5 border-t border-slate-50 pt-3.5">
                          <a 
                            href={`https://wa.me/${unlockedPhones[worker.user_id]?.replace(/\D/g, '') || '919876543210'}?text=Hi%20${encodeURIComponent(worker.full_name)},%20I%20saw%20your%20profile%20on%20Sevikaa%20and%20would%20like%20to%20discuss%20a%20work%20opportunity.`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 py-3 bg-[#22C55E] hover:bg-green-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm shadow-green-100/50 cursor-pointer border-0"
                          >
                            <MessageSquare size={14} />
                            <span>WhatsApp Helper</span>
                          </a>
                          <a 
                            href={`tel:${unlockedPhones[worker.user_id] || '+919876543210'}`}
                            className="py-3 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                          >
                            <Phone size={14} />
                          </a>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUnlock(worker.user_id)}
                          className="w-full py-3 bg-blue-50 text-[#2563EB] hover:bg-blue-100 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border-0 mt-1"
                        >
                          <Lock size={12} />
                          <span>Unlock Contact Details {!isPremium && '(Requires Premium)'}</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= SUBSCRIPTION & BILLING TAB ================= */}
        {activeTab === 'payments' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-black text-slate-800 px-1">Subscription Options</h2>
            
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 text-center space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto border border-blue-100">
                <CreditCard size={20} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-black text-slate-800">Premium Employer Access</h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                  Unlock candidate details, message helpers directly on WhatsApp, and shortcut your hiring loop inside your society.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center text-left text-xs font-bold text-slate-700">
                <div>
                  <span className="block">Sevikaa Premium Pass</span>
                  <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">30 Days Unlimited Unlocks</span>
                </div>
                <span className="text-lg font-black text-[#2563EB]">₹999</span>
              </div>

              {isPremium ? (
                <div className="py-3 px-4 bg-green-50 border border-green-100 rounded-xl text-xs font-black text-[#22C55E] flex items-center justify-center gap-1">
                  <ShieldCheck size={16} />
                  <span>Your Premium Account is Active!</span>
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm shadow-blue-100 text-xs active:scale-95 transition-all cursor-pointer border-0"
                >
                  Pay ₹999 via Razorpay
                </button>
              )}
            </div>

            {/* Receipts Log lists past activations */}
            <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <h3 className="text-xs font-black text-slate-800">Billing Receipts</h3>
              <div className="space-y-2.5">
                {receipts.map((rec) => (
                  <div key={rec.id} className="p-3 bg-slate-50 border border-slate-100/80 rounded-xl flex items-center justify-between text-[10px] font-bold text-slate-600">
                    <div>
                      <span className="block text-slate-800">{rec.description}</span>
                      <span className="block text-[8px] text-slate-400 font-bold mt-0.5">{rec.date} • {rec.id} • {rec.method}</span>
                    </div>
                    <span className="text-slate-800 font-black">{rec.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= SETTINGS TAB ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-black text-slate-800 px-1">Settings</h2>
            
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5 space-y-5">
              <button
                onClick={handleLogout}
                className="w-full py-4 border border-[#EA4335]/20 hover:bg-[#EA4335]/5 text-[#EA4335] font-bold rounded-2xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-transparent"
              >
                <LogOut size={16} />
                <span>Log Out Session</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= REGULATORY FOOTER ================= */}
        <footer className="bg-slate-900 text-white py-8 px-6 mt-8 rounded-t-[20px] text-center text-xs space-y-4 -mx-4">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 font-bold text-slate-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/safety" className="hover:text-white transition-colors">Safety</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[9px] text-slate-500 border-t border-slate-800 pt-4">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <span className="text-slate-700">|</span>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <span className="text-slate-700">|</span>
            <Link href="/refunds" className="hover:text-slate-300 transition-colors">Refunds & Cancellation</Link>
            <span className="text-slate-700">|</span>
            <Link href="/shipping" className="hover:text-slate-300 transition-colors">Shipping & Delivery</Link>
          </div>
          <p className="text-[9px] text-slate-500 font-medium">
            Powered by YugaYatra Retail (OPC) Private Limited<br />
            © {new Date().getFullYear()} Sevikaa. All rights reserved.
          </p>
        </footer>

      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="bg-white border-t border-slate-100 flex justify-between items-center px-4 py-2 sticky bottom-0 z-50 shadow-lg max-w-md mx-auto w-full">
        {[
          { id: 'home', label: 'Home', icon: <Home size={18} /> },
          { id: 'post-job', label: 'Post Job', icon: <PlusCircle size={18} /> },
          { id: 'search', label: 'Search', icon: <Search size={18} /> },
          { id: 'payments', label: 'Pricing', icon: <CreditCard size={18} /> },
          { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 select-none active:scale-95 transition-all min-h-[48px] cursor-pointer bg-transparent border-0 ${
                isActive ? 'text-[#2563EB] font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              {tab.icon}
              <span className="text-[8px] mt-1 leading-tight text-center">{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
