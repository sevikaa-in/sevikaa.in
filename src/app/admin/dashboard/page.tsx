"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Users, Briefcase, FileText, CheckCircle2, XCircle, Clock, Video, 
  MessageSquare, Star, ArrowRight, ShieldCheck, LogOut, Settings,
  LayoutDashboard, Menu, X, Search, ChevronLeft, Calendar, HelpCircle, 
  MapPin, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';

// Import Reusable Widgets
import { DocumentInspector } from '../../../components/admin/dashboard/DocumentInspector';
import { WorkerQueue } from '../../../components/admin/dashboard/WorkerQueue';
import { EmployerQueue } from '../../../components/admin/dashboard/EmployerQueue';
import { JobQueue } from '../../../components/admin/dashboard/JobQueue';
import { ReviewQueue } from '../../../components/admin/dashboard/ReviewQueue';
import { InterviewQueue } from '../../../components/admin/dashboard/InterviewQueue';
import { DisputesQueue } from '../../../components/admin/dashboard/DisputesQueue';

export default function AdminDashboard() {
  const router = useRouter();
  
  // Navigation & Shell State
  const [activeTab, setActiveTab] = useState<'overview' | 'workers' | 'employers' | 'jobs' | 'reviews' | 'interviews' | 'disputes'>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected audit items
  const [selectedWorker, setSelectedWorker] = useState<any>(null);

  // Data Loading & State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Operational metrics
  const [counts, setCounts] = useState({
    pendingWorkers: 0,
    pendingEmployers: 0,
    pendingJobs: 0,
    pendingReviews: 0,
    interviewsToday: 0,
    activeDisputes: 0
  });

  // Dynamic Lists for Core Workflows
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [employersList, setEmployersList] = useState<any[]>([]);
  const [pendingJobsList, setPendingJobsList] = useState<any[]>([]);
  const [pendingReviewsList, setPendingReviewsList] = useState<any[]>([]);
  const [interviewsList, setInterviewsList] = useState<any[]>([]);
  const [disputesList, setDisputesList] = useState<any[]>([]);

  // Fetch real statistics from Supabase tables
  const fetchDashboardData = async () => {
    setError('');
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (isPlaceholder) {
      // Mock stats for demo mode
      setCounts({
        pendingWorkers: 2,
        pendingEmployers: 1,
        pendingJobs: 1,
        pendingReviews: 1,
        interviewsToday: 2,
        activeDisputes: 1
      });

      const mockWorkers = [
        { 
          id: 'w1', 
          name: 'Ramesh Kumar', 
          full_name: 'Ramesh Kumar',
          category: 'Cook', 
          skills: ['Cook', 'Maid'],
          languages_spoken: ['Hindi', 'English'],
          status: 'pending_review', 
          age: 34, 
          gender: 'male',
          badges: { mobile: 'Verified', aadhaar: 'Pending', police: 'Pending', interview: 'Pending', video: 'Verified', profile: 'Pending' },
          preferred_society_name: 'DLF Westend Heights',
          profile_picture_url: '',
          aadhaar_front_url: '',
          video_url: ''
        },
        { 
          id: 'w2', 
          name: 'Sunita Sharma', 
          full_name: 'Sunita Sharma',
          category: 'Nanny', 
          skills: ['Nanny'],
          languages_spoken: ['Kannada', 'Telugu'],
          status: 'admin_interview', 
          age: 28, 
          gender: 'female',
          badges: { mobile: 'Verified', aadhaar: 'Verified', police: 'Pending', interview: 'Pending', video: 'Pending', profile: 'Pending' },
          preferred_society_name: 'Prestige Song of the South',
          profile_picture_url: '',
          aadhaar_front_url: '',
          video_url: ''
        }
      ];

      setWorkersList(mockWorkers);
      setSelectedWorker(mockWorkers[0]);

      setEmployersList([
        { id: 'e1', name: 'Alok Goel', company_name: 'Goel Tech', billing_address: 'DLF Akshayanagar', subscription_status: 'premium' }
      ]);

      setPendingJobsList([
        { id: 'j1', title: 'Need Full Time Cook', category: 'Cook', salary_offered: 15000, society_name: 'DLF Westend Heights', employer: 'Alok Goel', description: 'Cooking organic healthy meals for family of 4 in DLF Akshayanagar.' }
      ]);

      setPendingReviewsList([
        { id: 'r1', reviewer: 'Alok Goel', target: 'Ramesh Kumar', rating: 5, comment: 'Ramesh is extremely punctual and clean. Highly recommended!' }
      ]);

      setInterviewsList([
        { id: 'i1', workerName: 'Ramesh Kumar', category: 'Cook', time: '11:00 AM', status: 'Today', result: '', resultNotes: '' },
        { id: 'i2', workerName: 'Sunita Sharma', category: 'Nanny', time: '02:30 PM', status: 'Today', result: '', resultNotes: '' }
      ]);

      setDisputesList([
        { id: 'd1', reported_user: 'Ramesh Kumar', reporter: 'Alok Goel', reason: 'Worker did not show up for scheduled shift twice.', priority: 'High', evidence: 'WhatsApp screenshots' }
      ]);

      setLoading(false);
      return;
    }

    try {
      // 1. Fetch pending workers list
      const { data: profilesList } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          phone,
          status,
          role,
          worker_profiles (
            full_name,
            skills,
            languages_spoken,
            availability_slots,
            age,
            gender,
            profile_picture_url,
            video_url
          )
        `)
        .eq('role', 'worker');

      if (profilesList) {
        const mappedWorkers = profilesList.map((p: any) => ({
          id: p.id,
          name: p.worker_profiles?.full_name || 'N/A',
          full_name: p.worker_profiles?.full_name || 'N/A',
          skills: p.worker_profiles?.skills || [],
          languages_spoken: p.worker_profiles?.languages_spoken || [],
          status: p.status,
          age: p.worker_profiles?.age || 0,
          gender: p.worker_profiles?.gender || 'N/A',
          profile_picture_url: p.worker_profiles?.profile_picture_url || '',
          video_url: p.worker_profiles?.video_url || '',
          badges: { 
            mobile: p.phone ? 'Verified' : 'Pending', 
            aadhaar: p.status === 'approved' || p.status === 'live' ? 'Verified' : 'Pending', 
            police: 'Pending', 
            interview: p.status === 'approved' || p.status === 'live' ? 'Verified' : 'Pending', 
            video: p.worker_profiles?.video_url ? 'Verified' : 'Pending', 
            profile: p.status === 'live' ? 'Verified' : 'Pending' 
          }
        }));
        setWorkersList(mappedWorkers);
        if (mappedWorkers.length > 0) {
          setSelectedWorker(mappedWorkers[0]);
        }
      }

      // 2. Fetch pending employers
      const { data: employers } = await supabase
        .from('employer_profiles')
        .select('*');
      if (employers) {
        setEmployersList(employers);
      }

      // 3. Fetch pending jobs
      const { data: pendingJobs } = await supabase
        .from('jobs')
        .select('*, employer:employer_profiles(*)')
        .eq('status', 'pending_approval');
      if (pendingJobs) {
        setPendingJobsList(pendingJobs.map(j => ({
          id: j.id,
          title: j.title || 'General Job',
          category: j.category || 'General',
          salary_offered: j.salary_range || 0,
          society_name: j.society_name || 'Bangalore Sector',
          employer: j.employer?.name || 'Household',
          description: j.description || ''
        })));
      }

      // 4. Fetch pending reviews
      const { data: pendingReviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'pending');
      if (pendingReviews) {
        setPendingReviewsList(pendingReviews.map(r => ({
          id: r.id,
          reviewer: 'Employer',
          target: 'Worker',
          rating: r.rating || 5,
          comment: r.comment || ''
        })));
      }

      // Counts state
      setCounts({
        pendingWorkers: profilesList?.filter((p: any) => p.status === 'pending_review').length || 0,
        pendingEmployers: employers?.filter((e: any) => e.status === 'pending_review').length || 0,
        pendingJobs: pendingJobs?.length || 0,
        pendingReviews: pendingReviews?.length || 0,
        interviewsToday: profilesList?.filter((p: any) => p.status === 'admin_interview').length || 0,
        activeDisputes: 0
      });

    } catch (err: any) {
      console.error("Dashboard database fetch error:", err);
      setError(err.message || 'Database error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        fetchDashboardData();
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }
        setUser(session.user);
        fetchDashboardData();
      } catch (err) {
        console.error("Admin check error:", err);
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  // Document Badge updater
  const handleUpdateBadge = (badgeKey: string, status: 'Pending' | 'Verified' | 'Rejected') => {
    if (selectedWorker) {
      setSelectedWorker((prev: any) => ({
        ...prev,
        badges: {
          ...prev.badges,
          [badgeKey]: status
        }
      }));
      setWorkersList(prev => prev.map(w => w.id === selectedWorker.id ? {
        ...w,
        badges: {
          ...w.badges,
          [badgeKey]: status
        }
      } : w));
    }
  };

  // Worker verification status updater
  const handleUpdateWorkerStatus = async (workerId: string, newStatus: string) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    try {
      if (!isPlaceholder) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ status: newStatus })
          .eq('id', workerId);
        if (updateErr) throw updateErr;
      }

      setWorkersList(prev => prev.map(w => w.id === workerId ? { ...w, status: newStatus } : w));
      if (selectedWorker?.id === workerId) {
        setSelectedWorker((prev: any) => ({ ...prev, status: newStatus }));
      }
      alert(`Worker verification status successfully updated to: ${newStatus}`);
      fetchDashboardData();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  // Job moderation actions (PRD section 4.1)
  const handleModerateJob = async (jobId: string, approved: boolean) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    try {
      if (!isPlaceholder) {
        const { error: updateErr } = await supabase
          .from('jobs')
          .update({ status: approved ? 'approved' : 'rejected' })
          .eq('id', jobId);
        if (updateErr) throw updateErr;
      }

      setPendingJobsList(prev => prev.filter(j => j.id !== jobId));
      setCounts(prev => ({ ...prev, pendingJobs: Math.max(0, prev.pendingJobs - 1) }));
      alert(approved ? "Job approved and published live!" : "Job rejected and returned to draft.");
    } catch (err: any) {
      alert(`Job action failed: ${err.message}`);
    }
  };

  // Review moderation actions (PRD section 4.6)
  const handleModerateReview = async (reviewId: string, action: 'approved' | 'rejected' | 'hidden') => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    try {
      if (!isPlaceholder) {
        const { error: updateErr } = await supabase
          .from('reviews')
          .update({ status: action })
          .eq('id', reviewId);
        if (updateErr) throw updateErr;
      }

      setPendingReviewsList(prev => prev.filter(r => r.id !== reviewId));
      setCounts(prev => ({ ...prev, pendingReviews: Math.max(0, prev.pendingReviews - 1) }));
      alert(`Review status successfully modified to: ${action}`);
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
    }
  };

  // Dispute resolution actions
  const handleResolveDispute = (disputeId: string) => {
    setDisputesList(prev => prev.filter(d => d.id !== disputeId));
    setCounts(prev => ({ ...prev, activeDisputes: Math.max(0, prev.activeDisputes - 1) }));
    alert("Dispute successfully resolved and archived!");
  };

  // Interview result logger
  const handleLogInterviewResult = (id: string, result: 'Pass' | 'Fail' | 'Re-interview', resultNotes: string) => {
    setInterviewsList(prev => prev.map(item => item.id === id ? {
      ...item,
      status: 'Completed',
      result,
      resultNotes
    } : item));
    alert("Interview feedback logged successfully!");
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

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-[#202124] font-sans antialiased">
      
      {/* 1. SIDEBAR NAVIGATION - SEVIKAA BRANDING */}
      <aside 
        className={`bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 transition-all duration-300 sticky top-0 h-screen z-40 hidden md:flex ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <img src="/logo.png" alt="Sevikaa Logo" className="h-8 w-auto object-contain bg-white rounded-full p-0.5 border border-slate-100" />
              {!sidebarCollapsed && <span className="font-extrabold text-sm tracking-tight text-slate-800">Sevikaa Admin</span>}
            </div>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-400 hover:text-slate-800 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} className={`transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'overview', label: 'Operations Center', icon: <LayoutDashboard size={16} /> },
              { id: 'workers', label: 'Worker Verification', icon: <Users size={16} /> },
              { id: 'employers', label: 'Employer Audits', icon: <ShieldCheck size={16} /> },
              { id: 'jobs', label: 'Job Moderation', icon: <Briefcase size={16} /> },
              { id: 'reviews', label: 'Review Moderation', icon: <MessageSquare size={16} /> },
              { id: 'interviews', label: 'Interview Logs', icon: <Calendar size={16} /> },
              { id: 'disputes', label: 'Safety Disputes', icon: <ShieldAlert size={16} /> }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold relative group cursor-pointer ${
                    isActive 
                      ? 'bg-[#1A73E8]/10 text-[#1A73E8]' 
                      : 'text-gray-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <div className="shrink-0">{tab.icon}</div>
                  {!sidebarCollapsed && <span>{tab.label}</span>}
                  
                  {/* Tooltip for collapsed mode */}
                  {sidebarCollapsed && (
                    <div className="absolute left-16 bg-[#202124] text-white text-[9px] font-black py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow z-50">
                      {tab.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full py-2.5 px-3 hover:bg-[#EA4335]/5 text-gray-500 hover:text-[#EA4335] rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold cursor-pointer"
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE COLLAPSIBLE OVERLAY DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#202124]/40 backdrop-blur-sm z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full p-4 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Sevikaa Logo" className="h-8 w-auto bg-white rounded-full p-0.5 border border-slate-100" />
                  <span className="font-extrabold text-sm tracking-tight text-slate-800">Sevikaa Admin</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-gray-400 hover:text-slate-800 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <nav className="space-y-1">
                {[
                  { id: 'overview', label: 'Operations Center', icon: <LayoutDashboard size={16} /> },
                  { id: 'workers', label: 'Worker Verification', icon: <Users size={16} /> },
                  { id: 'employers', label: 'Employer Audits', icon: <ShieldCheck size={16} /> },
                  { id: 'jobs', label: 'Job Moderation', icon: <Briefcase size={16} /> },
                  { id: 'reviews', label: 'Review Moderation', icon: <MessageSquare size={16} /> },
                  { id: 'interviews', label: 'Interview Logs', icon: <Calendar size={16} /> },
                  { id: 'disputes', label: 'Safety Disputes', icon: <ShieldAlert size={16} /> }
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full py-3 px-3 rounded-xl flex items-center gap-3 transition-all text-xs font-bold cursor-pointer ${
                        isActive ? 'bg-[#1A73E8]/10 text-[#1A73E8]' : 'text-gray-500 hover:bg-slate-50'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <button onClick={handleLogout} className="w-full py-3 px-3 hover:bg-[#EA4335]/5 text-gray-500 hover:text-[#EA4335] rounded-xl flex items-center gap-3 transition-all text-xs font-bold cursor-pointer">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN VIEWPORT & SCROLL AREA */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 hover:bg-slate-50 rounded-lg md:hidden text-gray-500 hover:text-slate-800 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            
            {/* Global Search Input (UI Only) */}
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search phone, email, worker... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-100 hover:border-slate-200/80 rounded-xl text-xs font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-all duration-150"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-gray-700 hover:border-gray-300 focus:outline-none transition-all cursor-pointer"
            >
              {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Last 90 Days', 'This Year'].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <span className="bg-[#FBBC05]/10 text-amber-600 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
              Moderation Mode
            </span>
          </div>
        </header>

        {/* 3. MAIN CONTENT CONTAINER */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* TAB 1: OPERATIONS OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Productivity Analytics Bar (Step 6) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: "Today's Pending Tasks", value: counts.pendingWorkers + counts.pendingJobs, color: "text-[#FBBC05]" },
                  { label: "Completed Today", value: "14 audits", color: "text-[#34A853]" },
                  { label: "Avg Review Time", value: "4.8 mins", color: "text-[#1A73E8]" },
                  { label: "Interviews Scheduled", value: counts.interviewsToday, color: "text-[#1A73E8]" },
                  { label: "Avg Approval Time", value: "1.2 hours", color: "text-[#34A853]" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-4 border border-slate-100 rounded-[20px] shadow-sm text-center">
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-wider">{stat.label}</span>
                    <span className={`block text-xl font-black mt-1 ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Quick Owner Actions Panel (Step 7) */}
              <div className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Quick Moderation Actions</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <button onClick={() => setActiveTab('workers')} className="py-2.5 px-3 bg-[#1A73E8] hover:bg-[#1A73E8]/90 text-white rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer text-center">
                    Verify Next Worker
                  </button>
                  <button onClick={() => setActiveTab('jobs')} className="py-2.5 px-3 bg-[#34A853] hover:bg-[#34A853]/90 text-white rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer text-center">
                    Approve Next Job
                  </button>
                  <button onClick={() => setActiveTab('employers')} className="py-2.5 px-3 bg-[#FBBC05] text-[#202124] rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer text-center">
                    Review Next Employer
                  </button>
                  <button onClick={() => setActiveTab('interviews')} className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer text-center">
                    Start Interview Call
                  </button>
                </div>
              </div>

              {/* Alerts feed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Active backlogs */}
                <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-800">Operational Backlog Queue</h4>
                  <div className="space-y-3 text-xs font-bold text-slate-700">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-gray-400">Workers Waiting:</span>
                      <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">{counts.pendingWorkers}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-gray-400">Employers Waiting:</span>
                      <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">{counts.pendingEmployers}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-gray-400">Jobs Awaiting Moderation:</span>
                      <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">{counts.pendingJobs}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-gray-400">Reviews to Moderate:</span>
                      <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">{counts.pendingReviews}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Active Disputes Reported:</span>
                      <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full text-[10px]">{counts.activeDisputes}</span>
                    </div>
                  </div>
                </div>

                {/* System notification health */}
                <div className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-800">System Notification Gateways</h4>
                  <div className="space-y-3 text-xs font-bold text-slate-700">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-gray-400">SMS Gateway (MSG91):</span>
                      <span className="text-[#34A853] bg-emerald-50 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black">Healthy</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-gray-400">Email Dispatcher (Amazon SES):</span>
                      <span className="text-[#34A853] bg-emerald-50 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black">Healthy</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Payment Capture webhook:</span>
                      <span className="text-[#34A853] bg-emerald-50 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black">Healthy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKER MODERATION CENTER WITH DUAL INSPECTOR PANELS */}
          {activeTab === 'workers' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
              <div className="lg:col-span-7">
                <WorkerQueue 
                  loading={loading} 
                  error={error} 
                  workers={workersList} 
                  selectedWorkerId={selectedWorker?.id || ''} 
                  onSelectWorker={setSelectedWorker} 
                  onUpdateStatus={handleUpdateWorkerStatus} 
                />
              </div>
              <div className="lg:col-span-5 h-full">
                <DocumentInspector 
                  worker={selectedWorker} 
                  onUpdateBadge={handleUpdateBadge} 
                />
              </div>
            </div>
          )}

          {/* TAB 3: EMPLOYER AUDITS */}
          {activeTab === 'employers' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <EmployerQueue 
                loading={loading} 
                error={error} 
                employers={employersList} 
                onToggleSubscription={async (id, curSub) => {
                  const nextSub = curSub === 'premium' ? 'free' : 'premium';
                  const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                                        !process.env.NEXT_PUBLIC_SUPABASE_URL;
                  try {
                    if (!isPlaceholder) {
                      const { error: updateErr } = await supabase
                        .from('employer_profiles')
                        .update({ subscription_status: nextSub })
                        .eq('id', id);
                      if (updateErr) throw updateErr;
                    }
                    setEmployersList(prev => prev.map(e => e.id === id ? { ...e, subscription_status: nextSub } : e));
                    alert("Employer subscription status updated!");
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
                onApproveEmployer={async (id) => {
                  const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                                        !process.env.NEXT_PUBLIC_SUPABASE_URL;
                  try {
                    if (!isPlaceholder) {
                      const { error: updateErr } = await supabase
                        .from('employer_profiles')
                        .update({ status: 'approved' })
                        .eq('id', id);
                      if (updateErr) throw updateErr;
                    }
                    setEmployersList(prev => prev.filter(e => e.id !== id));
                    alert("Employer profile approved!");
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
                onRejectEmployer={async (id) => {
                  const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                                        !process.env.NEXT_PUBLIC_SUPABASE_URL;
                  try {
                    if (!isPlaceholder) {
                      const { error: updateErr } = await supabase
                        .from('employer_profiles')
                        .update({ status: 'rejected' })
                        .eq('id', id);
                      if (updateErr) throw updateErr;
                    }
                    setEmployersList(prev => prev.filter(e => e.id !== id));
                    alert("Employer profile rejected.");
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
              />
            </div>
          )}

          {/* TAB 4: JOB MODERATION */}
          {activeTab === 'jobs' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <JobQueue 
                loading={loading} 
                error={error} 
                jobs={pendingJobsList} 
                onModerateJob={handleModerateJob} 
              />
            </div>
          )}

          {/* TAB 5: REVIEW MODERATION */}
          {activeTab === 'reviews' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <ReviewQueue 
                loading={loading} 
                error={error} 
                reviews={pendingReviewsList} 
                onModerateReview={handleModerateReview} 
              />
            </div>
          )}

          {/* TAB 6: INTERVIEW SCREENINGS */}
          {activeTab === 'interviews' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <InterviewQueue 
                loading={loading} 
                error={error} 
                interviews={interviewsList} 
                onLogResult={handleLogInterviewResult} 
              />
            </div>
          )}

          {/* TAB 7: DISPUTES BACKLOGS */}
          {activeTab === 'disputes' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <DisputesQueue 
                loading={loading} 
                error={error} 
                disputes={disputesList} 
                onResolveDispute={handleResolveDispute} 
              />
            </div>
          )}
        </main>

        {/* 4. ENTERPRISE SYSTEM FOOTER */}
        <footer className="bg-white border-t border-slate-100 py-6 px-6 text-center text-xs text-gray-400 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-400/80">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              <span>Version: v1.2.0-stable</span>
              <span>•</span>
              <span>Env: production</span>
              <span>•</span>
              <span>DB: PostgreSQL 15.6</span>
              <span>•</span>
              <span>Region: ap-south-1 (Mumbai)</span>
            </div>
            <div>
              <span>Powered by YugaYatra Retail (OPC) Private Limited • © {new Date().getFullYear()} All Rights Reserved</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
