"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { ToastContainer, ToastItem } from '../../../components/admin/dashboard/Toast';
import { 
  Users, Briefcase, FileText, CheckCircle2, XCircle, Clock, Video, 
  MessageSquare, Star, ArrowRight, ShieldCheck, LogOut, Settings,
  LayoutDashboard, Menu, X, Search, ChevronLeft, Calendar, HelpCircle, 
  MapPin, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';

interface AdminContextProps {
  loading: boolean;
  error: string;
  user: any;
  counts: {
    pendingWorkers: number;
    pendingEmployers: number;
    pendingJobs: number;
    pendingReviews: number;
    interviewsToday: number;
    activeDisputes: number;
  };
  workersList: any[];
  employersList: any[];
  pendingJobsList: any[];
  pendingReviewsList: any[];
  interviewsList: any[];
  disputesList: any[];
  selectedWorker: any;
  setSelectedWorker: React.Dispatch<React.SetStateAction<any>>;
  setWorkersList: React.Dispatch<React.SetStateAction<any[]>>;
  setEmployersList: React.Dispatch<React.SetStateAction<any[]>>;
  setPendingJobsList: React.Dispatch<React.SetStateAction<any[]>>;
  setPendingReviewsList: React.Dispatch<React.SetStateAction<any[]>>;
  setInterviewsList: React.Dispatch<React.SetStateAction<any[]>>;
  setDisputesList: React.Dispatch<React.SetStateAction<any[]>>;
  setCounts: React.Dispatch<React.SetStateAction<{
    pendingWorkers: number;
    pendingEmployers: number;
    pendingJobs: number;
    pendingReviews: number;
    interviewsToday: number;
    activeDisputes: number;
  }>>;
  dateRange: string;
  setDateRange: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  fetchDashboardData: () => Promise<void>;
  handleUpdateBadge: (badgeKey: string, status: 'Pending' | 'Verified' | 'Rejected') => Promise<void>;
  handleUpdateWorkerStatus: (workerId: string, newStatus: string) => Promise<void>;
  handleModerateJob: (jobId: string, approved: boolean) => Promise<void>;
  handleModerateReview: (reviewId: string, action: 'approved' | 'rejected' | 'hidden') => Promise<void>;
  handleResolveDispute: (disputeId: string) => void;
  handleLogInterviewResult: (id: string, result: 'Pass' | 'Fail' | 'Re-interview', resultNotes: string) => void;
  handleLogout: () => Promise<void>;
}

const AdminDashboardContext = createContext<AdminContextProps | undefined>(undefined);

export function useAdminDashboard() {
  const context = useContext(AdminDashboardContext);
  if (!context) {
    throw new Error("useAdminDashboard must be used within an AdminDashboardProvider");
  }
  return context;
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Navigation & Shell State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Ctrl+K → focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
          badges: { mobile: 'Verified', aadhaar: 'Pending', police: 'Pending', interview: 'Pending', video: 'Pending', profile: 'Pending' },
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
        { 
          id: 'e1', 
          name: 'Alok Goel', 
          company_name: 'Goel Tech', 
          billing_address: 'DLF Akshayanagar', 
          subscription_status: 'premium',
          email: 'alok@goeltech.com',
          phone: '+91 9876543210',
          status: 'live',
          signup_date: '2026-07-01T10:00:00Z'
        }
      ]);

      setPendingJobsList([
        { 
          id: 'j1', 
          title: 'Need Full Time Cook', 
          category: 'cook', 
          salary_offered: 15000, 
          salary_range_min: 15000,
          salary_range_max: 18000,
          society_name: 'DLF Westend Heights', 
          employer: 'Alok Goel', 
          employer_email: 'alok@goeltech.com',
          employer_phone: '+91 9876543210',
          description: 'Cooking organic healthy meals for family of 4 in DLF Akshayanagar.',
          required_slots: {
            weekly_grid: {
              monday: ['morning', 'evening'],
              tuesday: ['morning', 'evening'],
              wednesday: ['morning', 'evening'],
              thursday: ['morning', 'evening'],
              friday: ['morning', 'evening'],
              saturday: ['morning', 'evening'],
              sunday: []
            },
            full_day: false,
            live_in: false
          },
          created_at: '2026-07-27T08:00:00Z'
        }
      ]);

      setPendingReviewsList([
        { 
          id: 'r1', 
          reviewer: 'Alok Goel', 
          reviewer_email: 'alok@goeltech.com',
          reviewer_phone: '+91 9876543210',
          reviewer_company: 'Goel Tech',
          target: 'Ramesh Kumar', 
          target_email: 'ramesh@example.com',
          target_phone: '+91 9123456789',
          target_skills: ['Cook', 'Maid'],
          rating: 5, 
          comment: 'Ramesh is extremely punctual and clean. Highly recommended!',
          created_at: '2026-07-26T12:00:00Z'
        }
      ]);

      setInterviewsList([
        { 
          id: 'i1', 
          workerName: 'Ramesh Kumar', 
          category: 'Cook', 
          time: '11:00 AM', 
          status: 'Today', 
          result: '', 
          resultNotes: '',
          worker: {
            id: 'w1',
            name: 'Ramesh Kumar',
            full_name: 'Ramesh Kumar',
            age: 29,
            gender: 'Male',
            skills: ['Cook', 'Maid'],
            languages_spoken: ['Hindi', 'English'],
            experience_years: 5,
            expected_salary: 14000,
            email: 'ramesh@gmail.com',
            phone: '+91 9876543210',
            emergency_contact: '+91 9999988888',
            status: 'pending_review',
            badges: { mobile: 'Verified', aadhaar: 'Verified', police: 'Pending', interview: 'Pending', video: 'Pending', profile: 'Pending' }
          }
        },
        { 
          id: 'i2', 
          workerName: 'Sunita Sharma', 
          category: 'Nanny', 
          time: '02:30 PM', 
          status: 'Today', 
          result: '', 
          resultNotes: '',
          worker: {
            id: 'w2',
            name: 'Sunita Sharma',
            full_name: 'Sunita Sharma',
            age: 34,
            gender: 'Female',
            skills: ['Nanny', 'Maid'],
            languages_spoken: ['Hindi', 'Punjabi'],
            experience_years: 8,
            expected_salary: 16000,
            email: 'sunita@gmail.com',
            phone: '+91 8888877777',
            emergency_contact: '+91 7777766666',
            status: 'pending_review',
            badges: { mobile: 'Verified', aadhaar: 'Verified', police: 'Pending', interview: 'Pending', video: 'Verified', profile: 'Pending' }
          }
        }
      ]);

      setDisputesList([
        { id: 'd1', reported_user: 'Ramesh Kumar', reporter: 'Alok Goel', reason: 'Worker did not show up for scheduled shift twice.', priority: 'High', evidence: 'WhatsApp screenshots' }
      ]);

      setLoading(false);
      return;
    }

    try {
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
            video_url,
            aadhaar_front_url,
            aadhaar_back_url,
            experience_years,
            emergency_contact,
            expected_salary
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
          aadhaar_front_url: p.worker_profiles?.aadhaar_front_url || '',
          aadhaar_back_url: p.worker_profiles?.aadhaar_back_url || '',
          experience_years: p.worker_profiles?.experience_years || 0,
          emergency_contact: p.worker_profiles?.emergency_contact || '',
          expected_salary: p.worker_profiles?.expected_salary || 0,
          email: p.email || '',
          phone: p.phone || '',
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

        const pendingWorkers = mappedWorkers.filter(w => w.status === 'pending_review' || w.status === 'admin_interview');
        setInterviewsList(pendingWorkers.map((w, index) => ({
          id: w.id,
          workerName: w.name,
          category: w.skills?.[0] || 'General',
          time: `Slot ${index + 1}: Morning`,
          status: w.status === 'admin_interview' ? 'Completed' : 'Today',
          result: w.status === 'approved' ? 'Pass' : '',
          resultNotes: '',
          worker: w
        })));
      }

      const { data: employers } = await supabase
        .from('employer_profiles')
        .select('*, profiles(email, phone, status, created_at)');
      let mappedEmployers: any[] = [];
      if (employers) {
        mappedEmployers = employers.map((e: any) => ({
          ...e,
          email: e.profiles?.email || '',
          phone: e.profiles?.phone || '',
          status: e.profiles?.status || 'pending_review',
          signup_date: e.profiles?.created_at || e.created_at
        }));
        setEmployersList(mappedEmployers);
      }

      const { data: pendingJobs } = await supabase
        .from('jobs')
        .select('*, employer:profiles(*, employer_profiles(*))')
        .eq('status', 'pending');
      if (pendingJobs) {
        setPendingJobsList(pendingJobs.map(j => {
          const employerProfile = j.employer?.employer_profiles?.[0];
          return {
            id: j.id,
            title: j.title || 'General Job',
            category: j.category || 'General',
            salary_offered: j.salary_range_min || 0,
            salary_range_min: j.salary_range_min || 0,
            salary_range_max: j.salary_range_max || 0,
            society_name: j.society_name || 'Bangalore Sector',
            employer: employerProfile?.name || 'Household',
            employer_email: j.employer?.email || '',
            employer_phone: j.employer?.phone || '',
            description: j.description || '',
            required_slots: j.required_slots || {},
            created_at: j.created_at
          };
        }));
      }

      const { data: pendingReviews } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          status,
          created_at,
          author:profiles!reviews_author_id_fkey(
            email,
            phone,
            employer_profiles(name, company_name)
          ),
          target:profiles!reviews_target_id_fkey(
            email,
            phone,
            worker_profiles(full_name, skills)
          )
        `)
        .eq('status', 'pending');
      if (pendingReviews) {
        setPendingReviewsList(pendingReviews.map((r: any) => {
          const authorData = Array.isArray(r.author) ? r.author[0] : r.author;
          const targetData = Array.isArray(r.target) ? r.target[0] : r.target;
          const authorProfile = authorData?.employer_profiles?.[0] || authorData?.employer_profiles;
          const targetProfile = targetData?.worker_profiles?.[0] || targetData?.worker_profiles;
          
          return {
            id: r.id,
            rating: r.rating || 5,
            comment: r.comment || '',
            created_at: r.created_at,
            reviewer: authorProfile?.name || 'Employer',
            reviewer_email: authorData?.email || '',
            reviewer_phone: authorData?.phone || '',
            reviewer_company: authorProfile?.company_name || 'Individual Household',
            target: targetProfile?.full_name || 'Worker',
            target_email: targetData?.email || '',
            target_phone: targetData?.phone || '',
            target_skills: targetProfile?.skills || []
          };
        }));
      }

      setCounts({
        pendingWorkers: profilesList?.filter((p: any) => p.status === 'pending_review' || p.status === 'admin_interview' || p.status === 'deletion_requested').length || 7,
        pendingEmployers: mappedEmployers.filter((e: any) => e.status === 'pending_review' || e.status === 'deletion_requested').length || 0,
        pendingJobs: pendingJobs?.length || 0,
        pendingReviews: pendingReviews?.length || 0,
        interviewsToday: profilesList?.filter((p: any) => p.status === 'admin_interview').length || 1,
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

  const handleUpdateBadge = async (badgeKey: string, status: 'Pending' | 'Verified' | 'Rejected') => {
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

      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!isPlaceholder) {
        try {
          const updateFields: any = {};
          if (badgeKey === 'aadhaar') updateFields.is_aadhaar_verified = (status === 'Verified');
          if (badgeKey === 'police') updateFields.is_police_verified = (status === 'Verified');
          if (badgeKey === 'interview') updateFields.is_interview_verified = (status === 'Verified');

          const { error } = await supabase
            .from('worker_profiles')
            .update(updateFields)
            .eq('user_id', selectedWorker.id);

          if (error) throw error;
        } catch (err) {
          console.error("Failed to save verification badge:", err);
        }
      }
    }
  };

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
      showToast(`Worker status updated to: ${newStatus}`);
      fetchDashboardData();
    } catch (err: any) {
      showToast(`Update failed: ${err.message}`, 'error');
    }
  };

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
      showToast(approved ? 'Job approved and published live!' : 'Job rejected and returned to draft.', approved ? 'success' : 'warning');
    } catch (err: any) {
      showToast(`Job action failed: ${err.message}`, 'error');
    }
  };

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
      showToast(`Review ${action} successfully.`, 'success');
    } catch (err: any) {
      showToast(`Review action failed: ${err.message}`, 'error');
    }
  };

  const handleResolveDispute = (disputeId: string) => {
    setDisputesList(prev => prev.filter(d => d.id !== disputeId));
    setCounts(prev => ({ ...prev, activeDisputes: Math.max(0, prev.activeDisputes - 1) }));
    showToast('Dispute resolved and archived.', 'success');
  };

  const handleLogInterviewResult = async (id: string, result: 'Pass' | 'Fail' | 'Re-interview', resultNotes: string) => {
    const nextStatus = result === 'Pass' ? 'approved' : result === 'Fail' ? 'suspended' : 'admin_interview';
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    try {
      if (!isPlaceholder) {
        const { error } = await supabase
          .from('profiles')
          .update({ status: nextStatus })
          .eq('id', id);
        if (error) throw error;
      }
      setInterviewsList(prev => prev.map(item => item.id === id ? {
        ...item,
        status: 'Completed',
        result,
        resultNotes
      } : item));
      setWorkersList(prev => prev.map(w => w.id === id ? { ...w, status: nextStatus } : w));
      showToast(`Interview logged. Worker is now ${nextStatus}.`, result === 'Pass' ? 'success' : result === 'Fail' ? 'error' : 'warning');
      fetchDashboardData();
    } catch (err: any) {
      showToast('Error logging interview result: ' + err.message, 'error');
    }
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
    <AdminDashboardContext.Provider value={{
      loading, error, user, counts, workersList, employersList, pendingJobsList,
      pendingReviewsList, interviewsList, disputesList, selectedWorker,
      setSelectedWorker, setWorkersList, setEmployersList, setPendingJobsList,
      setPendingReviewsList, setInterviewsList, setDisputesList, setCounts,
      dateRange, setDateRange, searchQuery, setSearchQuery, fetchDashboardData,
      handleUpdateBadge, handleUpdateWorkerStatus, handleModerateJob, handleModerateReview,
      handleResolveDispute, handleLogInterviewResult, handleLogout
    }}>
      <div className="flex min-h-screen bg-[#F8F9FA] text-[#202124] font-sans antialiased">
        
        {/* 1. SIDEBAR NAVIGATION */}
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
                { id: 'overview',    label: 'Operations Center',   href: '/admin/dashboard',            icon: <LayoutDashboard size={16} />, badge: 0 },
                { id: 'workers',     label: 'Worker Verification',  href: '/admin/dashboard/workers',     icon: <Users size={16} />,           badge: counts.pendingWorkers },
                { id: 'employers',   label: 'Employer Audits',      href: '/admin/dashboard/employers',   icon: <ShieldCheck size={16} />,      badge: counts.pendingEmployers },
                { id: 'jobs',        label: 'Job Moderation',       href: '/admin/dashboard/jobs',        icon: <Briefcase size={16} />,        badge: counts.pendingJobs },
                { id: 'reviews',     label: 'Reviews Moderation',   href: '/admin/dashboard/reviews',     icon: <Star size={16} />,             badge: counts.pendingReviews },
                { id: 'interviews',  label: 'Interviews Panel',     href: '/admin/dashboard/interviews',  icon: <Calendar size={16} />,         badge: counts.interviewsToday },
                { id: 'disputes',    label: 'Disputes Resolution',  href: '/admin/dashboard/disputes',    icon: <ShieldAlert size={16} />,      badge: counts.activeDisputes }
              ].map((tab) => {
                const isActive = (tab.id === 'overview' && pathname === '/admin/dashboard') || (tab.id !== 'overview' && pathname === tab.href);
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold relative group cursor-pointer ${
                      isActive 
                        ? 'bg-[#1A73E8]/10 text-[#1A73E8] shadow-sm shadow-[#1A73E8]/5' 
                        : 'text-gray-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <div className="shrink-0">{tab.icon}</div>
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1">{tab.label}</span>
                        {tab.badge > 0 && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                            tab.id === 'disputes' ? 'bg-red-50 text-[#EA4335]' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {tab.badge}
                          </span>
                        )}
                      </>
                    )}
                    {sidebarCollapsed && tab.badge > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 border border-white" />
                    )}
                    {/* Tooltip for collapsed mode */}
                    {sidebarCollapsed && (
                      <div className="absolute left-16 bg-[#202124] text-white text-[9px] font-black py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow z-50">
                        {tab.label}{tab.badge > 0 ? ` (${tab.badge})` : ''}
                      </div>
                    )}
                  </Link>
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
                    { id: 'overview', label: 'Operations Center', href: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
                    { id: 'workers', label: 'Worker Verification', href: '/admin/dashboard/workers', icon: <Users size={16} /> },
                    { id: 'employers', label: 'Employer Audits', href: '/admin/dashboard/employers', icon: <ShieldCheck size={16} /> },
                    { id: 'jobs', label: 'Job Moderation', href: '/admin/dashboard/jobs', icon: <Briefcase size={16} /> },
                    { id: 'reviews', label: 'Reviews Moderation', href: '/admin/dashboard/reviews', icon: <Star size={16} /> },
                    { id: 'interviews', label: 'Interviews Panel', href: '/admin/dashboard/interviews', icon: <Calendar size={16} /> },
                    { id: 'disputes', label: 'Disputes resolution', href: '/admin/dashboard/disputes', icon: <ShieldAlert size={16} /> }
                  ].map((tab) => {
                    const isActive = (tab.id === 'overview' && pathname === '/admin/dashboard') || (tab.id !== 'overview' && pathname === tab.href);
                    return (
                      <Link
                        key={tab.id}
                        href={tab.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`w-full py-3 px-3 rounded-xl flex items-center gap-3 transition-all text-xs font-bold cursor-pointer ${
                          isActive ? 'bg-[#1A73E8]/10 text-[#1A73E8]' : 'text-gray-500 hover:bg-slate-50'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </Link>
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
              
              {/* Global Search Input */}
              <div className="relative hidden sm:block w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-100 hover:border-slate-200/80 rounded-xl text-xs font-bold focus:bg-white focus:border-[#1A73E8] focus:outline-none transition-all duration-150"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-gray-700 hover:border-gray-300 focus:outline-none transition-all cursor-pointer hidden sm:block"
              >
                {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Last 90 Days', 'This Year'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              {/* Admin Avatar */}
              {user && (
                <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-[#1A73E8]/10 border border-[#1A73E8]/20 flex items-center justify-center text-[#1A73E8] text-[10px] font-black uppercase select-none">
                    {(user.user_metadata?.full_name || user.email || 'A').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <span className="block text-[10px] font-black text-slate-800 leading-none">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin'}
                    </span>
                    <span className="block text-[8.5px] text-gray-400 font-bold mt-0.5">Operations</span>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* 3. MAIN TABBED CONTENT */}
          <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
            {children}
          </main>

          {/* 4. SYSTEM FOOTER */}
          <footer className="bg-white border-t border-slate-100 py-6 px-6 text-center text-xs text-gray-400 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-400/80">
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                <span>Version: v1.2.0-stable</span>
                <span>•</span>
                <span>Role: admin_operations</span>
              </div>
              <div>
                <span>Powered by YugaYatra Retail (OPC) Private Limited • © {new Date().getFullYear()} All Rights Reserved</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AdminDashboardContext.Provider>
  );
}
