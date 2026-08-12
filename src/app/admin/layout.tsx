"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PrefetchLink } from '@/components/admin/PrefetchLink';
import { supabase } from '@/lib/supabaseClient';
import { enforceSingleAdminSession } from '@/lib/singleSessionEnforcer';
import { ToastContainer, ToastItem } from '@/components/admin/dashboard/Toast';
import { formatWorkerShift } from '@/utils/formatWorkerShift';
import { 
  Users, Briefcase, FileText, CheckCircle2, XCircle, Clock, Video, 
  MessageSquare, Star, ArrowRight, ShieldCheck, LogOut, Settings,
  LayoutDashboard, Menu, X, Search, ChevronLeft, Calendar, HelpCircle, 
  MapPin, ShieldAlert, Sparkles, RefreshCw, PhoneCall
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
  fetchDashboardData: (pageVal?: number, currentTab?: string) => Promise<void>;
  handleUpdateBadge: (badgeKey: string, status: 'Pending' | 'Verified' | 'Rejected') => Promise<void>;
  handleUpdateWorkerStatus: (workerId: string, newStatus: string) => Promise<void>;
  handleModerateJob: (jobId: string, action: 'approve' | 'reject' | 'request_changes' | 'unapprove' | 'revert' | boolean, adminNote?: string) => Promise<void>;
  handleModerateReview: (reviewId: string, action: 'approved' | 'rejected' | 'hidden') => Promise<void>;
  handleResolveDispute: (disputeId: string) => void;
  handleLogInterviewResult: (id: string, result: 'Pass' | 'Fail' | 'Re-interview', resultNotes: string) => void;
  handleLogout: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
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
  const fetchDashboardData = async (pageVal = 1, currentTab?: string) => {
    setError('');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (userProfile?.role && userProfile.role !== 'admin' && userProfile.role !== 'super-admin') {
        if (userProfile.role === 'worker') router.push('/worker');
        else if (userProfile.role === 'employer') router.push('/employer');
        else router.push('/');
        return;
      }
      if (userProfile?.role) {
        document.cookie = `sevikaa_user_role=${userProfile.role}; path=/; max-age=86400`;
      }
    }

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
          id: 'job_102', 
          title: 'Housemaid for Deep Cleaning & Ironing', 
          category: 'maid', 
          salary_offered: 12000, 
          salary_range_min: 12000,
          salary_range_max: 15000,
          society_name: 'General Locality', 
          employer: 'Household Employer', 
          employer_email: '',
          employer_phone: '',
          description: 'Need reliable maid for daily sweeping, mopping, utensil cleaning, and clothes ironing.',
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
      const targetTab = currentTab || 'overview';
      const { webApiClient } = await import('@/lib/webApiClient');
      const apiData = await webApiClient.get(`/api/admin/data?tab=${targetTab}&page=${pageVal}&limit=100`);

      if (apiData && apiData.success) {
        const { workers, employers, societies, jobs, counts } = apiData;

        if (counts) {
          setCounts(counts);
        }

        if (workers && Array.isArray(workers)) {
          const mappedWorkers = workers.map((w: any) => {
            const displayName = (w.full_name && w.full_name.trim() && w.full_name !== 'Verified Worker')
              ? w.full_name.trim()
              : (w.name && w.name.trim() && w.name !== 'Verified Worker')
              ? w.name.trim()
              : w.email
              ? w.email.split('@')[0].charAt(0).toUpperCase() + w.email.split('@')[0].slice(1)
              : w.phone
              ? `Candidate (${w.phone.slice(-4)})`
              : 'Registered Worker';

            const displayCategory = (w.skills && Array.isArray(w.skills) && w.skills.length > 0)
              ? w.skills.join(', ')
              : 'Domestic Worker';

            return {
              ...w,
              id: w.id,
              name: displayName,
              full_name: displayName,
              email: w.email || '',
              phone: w.phone || '',
              skills: w.skills || [],
              languages_spoken: Array.isArray(w.languages_spoken) ? w.languages_spoken : (typeof w.languages_spoken === 'string' ? w.languages_spoken.split(',').map((s: string) => s.trim()).filter(Boolean) : ['Hindi']),
              displayCategory,
              status: w.status || 'pending_review',
              age: w.age || 28,
              gender: w.gender || 'female',
              bio: w.bio || '',
              primary_gated_society: w.primary_gated_society || w.preferred_society_name || w.society_name || w.society || '',
              preferred_society_name: w.primary_gated_society || w.preferred_society_name || w.society_name || w.society || '',
              secondary_gated_society: w.secondary_gated_society || w.secondary_society_name || '',
              secondary_society_name: w.secondary_gated_society || w.secondary_society_name || '',
              preferred_areas: Array.isArray(w.preferred_areas) && w.preferred_areas.length > 0 ? w.preferred_areas : [w.primary_gated_society || w.preferred_society_name, w.secondary_gated_society || w.secondary_society_name].filter(Boolean),
              profile_picture_url: w.profile_picture_url || '',
              video_url: w.video_url || '',
              aadhaar_front_url: w.aadhaar_front_url || '',
              aadhaar_back_url: w.aadhaar_back_url || '',
              experience_years: w.experience_years || 0,
              expected_salary: w.expected_salary || 0,
              preferred_shift: formatWorkerShift(w.preferred_shift || w.work_timing, w.availability_slots),
              work_timing: formatWorkerShift(w.preferred_shift || w.work_timing, w.availability_slots),
              availability_slots: w.availability_slots || null,
              emergency_contact: w.emergency_contact || w.alternate_phone || w.alt_phone || '',
              alternate_phone: w.alternate_phone || w.alt_phone || w.emergency_contact || '',
              created_at: w.created_at,
              badges: {
                mobile: w.phone ? 'Verified' : 'Pending',
                aadhaar_front: w.is_aadhaar_front_verified === true ? 'Verified' : 'Pending',
                aadhaar_back: w.is_aadhaar_back_verified === true ? 'Verified' : 'Pending',
                aadhaar: w.is_aadhaar_verified === true || (w.is_aadhaar_front_verified === true && w.is_aadhaar_back_verified === true) ? 'Verified' : 'Pending',
                police: w.is_police_verified === true ? 'Verified' : 'Pending',
                interview: w.is_interview_verified === true || w.is_tele_onboarded === true ? 'Verified' : 'Pending',
                video: w.is_video_verified === true ? 'Verified' : 'Pending',
                profile: w.status === 'approved' || w.status === 'live' ? 'Verified' : 'Pending'
              }
            };
          });
          setWorkersList(mappedWorkers);
          setSelectedWorker((prevSelected: any) => {
            if (!prevSelected && mappedWorkers.length > 0) return mappedWorkers[0];
            if (prevSelected) {
              const updatedSelected = mappedWorkers.find((w: any) => w.id === prevSelected.id);
              return updatedSelected || prevSelected;
            }
            return null;
          });

          const pendingWorkers = mappedWorkers.filter((w: any) => w.status === 'pending_review' || w.status === 'admin_interview');
          setInterviewsList(pendingWorkers.map((w: any, index: number) => {
            const dateObj = w.created_at ? new Date(w.created_at) : new Date();
            const timeString = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            const isToday = dateObj.toDateString() === new Date().toDateString();
            const slotTime = isToday ? `Today at ${timeString}` : `${dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${timeString}`;

            return {
              id: w.id,
              workerName: w.name,
              category: w.displayCategory,
              time: slotTime,
              status: w.status === 'admin_interview' ? 'Completed' : 'Today',
              result: w.status === 'approved' ? 'Pass' : '',
              resultNotes: '',
              worker: w
            };
          }));
        }

        if (employers && Array.isArray(employers)) {
          const mappedEmployers = employers.map((e: any) => ({
            ...e,
            name: e.company_name || e.name || 'Employer Household',
            email: e.email || '',
            phone: e.phone || '',
            status: e.status || 'pending_review',
            signup_date: e.created_at || 'Today',
            badges: {
              mobile: e.phone ? 'Verified' : 'Pending',
              aadhaar_front: e.is_aadhaar_front_verified === true ? 'Verified' : 'Pending',
              aadhaar_back: e.is_aadhaar_back_verified === true ? 'Verified' : 'Pending',
              residency: e.is_residency_verified === true ? 'Verified' : 'Pending',
              interview: e.is_interview_verified === true || e.is_tele_onboarded === true ? 'Verified' : 'Pending',
              profile: e.status === 'approved' || e.status === 'active' ? 'Verified' : 'Pending'
            }
          }));
          setEmployersList(mappedEmployers);
        }

        if (jobs && Array.isArray(jobs)) {
          const mappedJobs = jobs.map((j: any) => {
            const empName = j.employer_name || j.company_name || 'Employer Household';
            const empPhone = j.employer_phone || j.phone || '';
            const empEmail = j.employer_email || j.email || '';
            const salaryVal = j.salary_offered || j.salary || j.salary_range_min || 15000;

            return {
              id: j.id,
              user_id: j.user_id || j.employer_id,
              title: j.title || j.description || 'General Job Requirement',
              category: j.category || 'Domestic Worker',
              salary_offered: salaryVal,
              salary: salaryVal,
              society_name: j.society_name || 'Gated Community',
              employer: empName,
              employer_name: empName,
              employer_email: empEmail,
              employer_phone: empPhone,
              phone: empPhone,
              email: empEmail,
              description: j.description || 'Job requisition awaiting admin moderation.',
              status: j.status || 'pending',
              admin_note: j.admin_note || undefined,
              created_at: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : 'Today'
            };
          });
          setPendingJobsList(mappedJobs);
        }

        setCounts({
          pendingWorkers: apiData.workers?.filter((w: any) => w.status === 'pending_review' || w.status === 'admin_interview' || w.status === 'deletion_requested').length || apiData.counts?.pendingWorkers || 0,
          pendingEmployers: apiData.employers?.filter((e: any) => e.status === 'pending_review' || e.status === 'deletion_requested').length || apiData.counts?.pendingEmployers || 0,
          pendingJobs: apiData.jobs?.filter((j: any) => {
            const s = (j.status || 'pending').toLowerCase();
            return s === 'pending' || s === 'pending_review';
          }).length || apiData.counts?.pendingJobs || 0,
          pendingReviews: 0,
          interviewsToday: apiData.workers?.filter((w: any) => w.status === 'admin_interview').length || apiData.counts?.interviewsToday || 0,
          activeDisputes: 0
        });
      }
    } catch (err: any) {
      console.error("Dashboard database fetch error:", err);
      setError(err.message || 'Database error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cleanupFn: (() => void) | null = null;

    const checkAdmin = async () => {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        fetchDashboardData();
        return;
      }

      try {
        let activeUser: any = null;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          activeUser = session.user;
        } else if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('sevikaa_user');
          if (storedUser) {
            try { activeUser = JSON.parse(storedUser); } catch (e) {}
          }
        }

        if (!activeUser) {
          router.push('/');
          return;
        }

        setUser(activeUser);
        fetchDashboardData();

        // Enforce Single Active Session for Admin
        cleanupFn = await enforceSingleAdminSession(activeUser.id, (reason) => {
          showToast(reason, 'error');
          supabase.auth.signOut();
          router.push('/');
        });
      } catch (err) {
        console.error("Admin check error:", err);
        setLoading(false);
      }
    };

    checkAdmin();

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [router]);

  useEffect(() => {
    if (pathname) {
      const currentTab = pathname.split('/').pop() || 'overview';
      fetchDashboardData(1, currentTab);
    }
  }, [pathname]);

  useEffect(() => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (isPlaceholder) return;

    const channel = supabase
      .channel('admin_live_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
          if (badgeKey === 'aadhaar_front') updateFields.is_aadhaar_front_verified = (status === 'Verified');
          if (badgeKey === 'aadhaar_back') updateFields.is_aadhaar_back_verified = (status === 'Verified');
          if (badgeKey === 'aadhaar') {
            updateFields.is_aadhaar_front_verified = (status === 'Verified');
            updateFields.is_aadhaar_back_verified = (status === 'Verified');
            updateFields.is_aadhaar_verified = (status === 'Verified');
          }
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

  const handleUpdateWorkerStatus = async (workerId: string, newStatus: string, adminNote?: string) => {
    try {
      const { webApiClient } = await import('@/lib/webApiClient');
      const data = await webApiClient.post('/api/admin/worker/update', {
        userId: workerId,
        status: newStatus,
        is_tele_onboarded: true,
        is_interview_verified: true,
        notes: adminNote
      });
      if (!data.success) {
        throw new Error(data.error || 'Failed to update candidate status');
      }

      if (newStatus === 'changes_requested') {
        webApiClient.post('/api/admin/worker/send-upload-sms', { userId: workerId }).catch(err => console.warn('Send upload SMS error:', err));
      }

      setWorkersList(prev => prev.map(w => w.id === workerId ? { ...w, status: newStatus, is_tele_onboarded: true, is_interview_verified: true, admin_note: adminNote || w.admin_note } : w));
      if (selectedWorker?.id === workerId) {
        setSelectedWorker((prev: any) => ({ ...prev, status: newStatus, is_tele_onboarded: true, is_interview_verified: true, admin_note: adminNote || prev.admin_note }));
      }
      showToast(`✓ Worker status updated to: ${newStatus.replace('_', ' ').toUpperCase()}`, 'success');
      fetchDashboardData();
    } catch (err: any) {
      showToast(`Update failed: ${err.message}`, 'error');
    }
  };

  const handleModerateJob = async (jobId: string, action: 'approve' | 'reject' | 'request_changes' | 'unapprove' | 'revert' | boolean, adminNote?: string) => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                          !process.env.NEXT_PUBLIC_SUPABASE_URL;

    const targetJob = pendingJobsList.find(j => j.id === jobId);
    const isApprove = action === true || action === 'approve';
    const isChanges = action === 'request_changes';
    const isRevert = action === 'unapprove' || action === 'revert';
    const newStatus = isApprove ? 'approved' : isChanges ? 'changes_requested' : isRevert ? 'pending_review' : 'rejected';
    const noteText = adminNote || (isChanges ? 'Admin Audit Feedback: Please clarify if ironing duties are included and update morning shift start time.' : undefined);

    try {
      // 1. Call Backend API via webApiClient
      const { webApiClient } = await import('@/lib/webApiClient');
      await webApiClient.post('/api/admin/job/update', { id: jobId, status: newStatus, admin_note: noteText });

      // 2. Trigger multi-channel SMS & Email alert to employer if changes requested
      if (isChanges) {
        try {
          await webApiClient.post('/api/notifications/trigger', {
            type: 'job_changes_requested',
            name: targetJob?.employer || 'Employer',
            phone: targetJob?.phone || targetJob?.employer_phone || '+919876543210',
            email: targetJob?.email || targetJob?.employer_email,
            note: noteText
          });
        } catch (notifErr) {
          console.error("SMS notification trigger failed:", notifErr);
        }
      }

      setPendingJobsList(prev => prev.map(j => j.id === jobId ? { ...j, status: isApprove ? 'active' : newStatus } : j));
      setCounts(prev => ({ 
        ...prev, 
        pendingJobs: isApprove ? Math.max(0, prev.pendingJobs - 1) : prev.pendingJobs 
      }));

      showToast(
        isApprove 
          ? '✓ Job approved and published live!' 
          : isChanges 
          ? 'Feedback note sent to employer! Requisition marked as Action Required.' 
          : isRevert
          ? 'Job reverted to Pending Approval status.'
          : 'Job rejected and returned to draft.', 
        isApprove ? 'success' : 'info'
      );
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

      // Automatically dispatch new MSG91 DLT SMS to worker if rescheduled
      if (result === 'Re-interview') {
        const targetWorker = workersList.find(w => w.id === id);
        if (targetWorker?.phone) {
          try {
            const { webApiClient } = await import('@/lib/webApiClient');
            await webApiClient.post('/api/notifications/trigger', {
              type: 'interview_scheduled',
              userId: id,
              name: targetWorker.name,
              phone: targetWorker.phone,
              note: resultNotes || 'Interview rescheduled by admin'
            });
          } catch (e) {
            console.warn("Reschedule SMS notification notice:", e);
          }
        }
      }

      setInterviewsList(prev => prev.map(item => item.id === id ? {
        ...item,
        status: result === 'Re-interview' ? 'Today' : 'Completed',
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

  const q = searchQuery.toLowerCase().trim();

  const filteredWorkers = workersList.filter(w => !q ||
    (w.name || '').toLowerCase().includes(q) ||
    (w.phone || '').toLowerCase().includes(q) ||
    (w.email || '').toLowerCase().includes(q) ||
    (w.society || '').toLowerCase().includes(q)
  );

  const filteredEmployers = employersList.filter(e => !q ||
    (e.company_name || e.name || '').toLowerCase().includes(q) ||
    (e.phone || '').toLowerCase().includes(q) ||
    (e.email || '').toLowerCase().includes(q) ||
    (e.billing_address || e.address || '').toLowerCase().includes(q)
  );

  const filteredJobs = pendingJobsList.filter(j => !q ||
    (j.title || '').toLowerCase().includes(q) ||
    (j.employer || j.employer_name || '').toLowerCase().includes(q) ||
    (j.society_name || '').toLowerCase().includes(q) ||
    (j.category || '').toLowerCase().includes(q)
  );

  const filteredReviews = pendingReviewsList.filter(r => !q ||
    (r.reviewerName || r.reviewer_name || '').toLowerCase().includes(q) ||
    (r.workerName || r.target_name || '').toLowerCase().includes(q) ||
    (r.comment || '').toLowerCase().includes(q)
  );

  return (
    <AdminDashboardContext.Provider value={{
      loading, error, user, counts, workersList: filteredWorkers, employersList: filteredEmployers,
      pendingJobsList: filteredJobs, pendingReviewsList: filteredReviews, interviewsList, disputesList,
      selectedWorker, setSelectedWorker, setWorkersList, setEmployersList, setPendingJobsList,
      setPendingReviewsList, setInterviewsList, setDisputesList, setCounts,
      dateRange, setDateRange, searchQuery, setSearchQuery, fetchDashboardData,
      handleUpdateBadge, handleUpdateWorkerStatus, handleModerateJob, handleModerateReview,
      handleResolveDispute, handleLogInterviewResult, handleLogout, showToast
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
              <Link href="/admin" className="flex items-center gap-2 overflow-hidden group cursor-pointer" title="Sevikaa Admin Dashboard">
                <img src="/logo.png" alt="Sevikaa Logo" className="h-8 w-auto object-contain bg-white rounded-full p-0.5 border border-slate-100 transition-transform group-hover:scale-105" />
                {!sidebarCollapsed && <span className="font-extrabold text-sm tracking-tight text-slate-800 group-hover:text-[#1A73E8] transition-colors">Sevikaa Admin</span>}
              </Link>
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
                { id: 'overview',        label: 'Operations Center',   href: '/admin',                 icon: <LayoutDashboard size={16} />, badge: 0 },
                { id: 'tele-onboarding', label: 'Tele-Onboarding Hub', href: '/admin/tele-onboarding',  icon: <PhoneCall size={16} />,       badge: 0 },
                { id: 'workers',         label: 'Worker Verification',  href: '/admin/workers',          icon: <Users size={16} />,           badge: counts.pendingWorkers },
                { id: 'employers',   label: 'Employer Audits',      href: '/admin/employers',   icon: <ShieldCheck size={16} />,      badge: counts.pendingEmployers },
                { id: 'jobs',        label: 'Job Moderation',       href: '/admin/jobs',        icon: <Briefcase size={16} />,        badge: counts.pendingJobs },
                { id: 'reviews',     label: 'Reviews Moderation',   href: '/admin/reviews',     icon: <Star size={16} />,             badge: counts.pendingReviews },
                { id: 'assisted-jobs',  label: 'Assisted Job Matcher', href: '/admin/assisted-jobs',  icon: <Sparkles size={16} />,         badge: 0 },
                { id: 'disputes',    label: 'Disputes Resolution',  href: '/admin/disputes',    icon: <ShieldAlert size={16} />,      badge: counts.activeDisputes },
                { id: 'enquiries',   label: 'Support Enquiries',    href: '/admin/enquiries',   icon: <HelpCircle size={16} />,       badge: 0 }
              ].map((tab) => {
                const isActive = (tab.id === 'overview' && pathname === '/admin') || (tab.id !== 'overview' && pathname === tab.href);
                const apiKey = tab.id === 'tele-onboarding' ? 'tele_onboarding_p1_l12' : `admin_data_${tab.id}_p1_l20`;
                const apiFetcher = () => import('@/lib/webApiClient').then(({ webApiClient }) => webApiClient.get(tab.id === 'tele-onboarding' ? '/api/admin/data?tab=tele-onboarding&page=1&limit=12' : `/api/admin/data?tab=${tab.id}&page=1&limit=20`));

                return (
                  <PrefetchLink
                    key={tab.id}
                    href={tab.href}
                    apiKey={apiKey}
                    apiFetcher={apiFetcher}
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
                  </PrefetchLink>
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
              {/* Date Range Selector - Only visible on Overview Dashboard */}
              {(pathname === '/admin' || pathname === '/admin/dashboard') && (
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-gray-700 hover:border-gray-300 focus:outline-none transition-all cursor-pointer hidden sm:block"
                >
                  {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'Last 90 Days', 'This Year'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

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
