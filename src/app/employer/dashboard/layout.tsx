"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../../../context/LanguageContext';
import { supabase } from '../../../lib/supabaseClient';
import { GlobalLanguageSelector } from '../../../components/GlobalLanguageSelector';
import { ToastContainer, ToastItem } from '../../../components/admin/dashboard/Toast';
import { 
  Home, PlusCircle, Search, User, Users, CreditCard, LogOut, 
  ArrowLeft, CheckCircle2, ShieldAlert, Sparkles, Phone, Lock, Briefcase, Menu, X, Bell 
} from 'lucide-react';



interface EmployerDashboardContextProps {
  user: any;
  loading: boolean;
  employerProfile: any;
  setEmployerProfile: React.Dispatch<React.SetStateAction<any>>;
  isPremium: boolean;
  bookmarkedContacts: string[];
  postedJobs: any[];
  societiesList: any[];
  deletionRequested: boolean;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  handleToggleBookmark: (workerId: string) => void;
  handlePostJob: (jobData: any) => Promise<void>;
  handleUpdateJob: (jobId: string, updatedData: any) => Promise<void>;
  handleRequestAccountDeletion: (reason: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const EmployerDashboardContext = createContext<EmployerDashboardContextProps | null>(null);

export const useEmployerDashboard = () => {
  const context = useContext(EmployerDashboardContext);
  if (!context) {
    throw new Error('useEmployerDashboard must be used within EmployerDashboardLayout');
  }
  return context;
};

export default function EmployerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [bookmarkedContacts, setBookmarkedContacts] = useState<string[]>([]);
  const [societiesList, setSocietiesList] = useState<any[]>([]);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [employerProfile, setEmployerProfile] = useState<any>({
    company_name: "Employer Profile",
    email: "",
    society_name: "",
    phone: "",
    subscription_status: "Standard Plan",
    address: ""
  });

  const [postedJobs, setPostedJobs] = useState<any[]>([]);

  const showToast = (message: string, type?: 'success' | 'error' | 'warning' | 'info') => {
    const id = `toast_${Date.now()}`;
    const toastType = type || 'info';
    setToasts(prev => [...prev, { id, message, type: toastType }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchSession = async () => {
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        setUser({ id: 'emp_demo', email: 'lakhan.sah@gmail.com' });
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      let activeUserId = session?.user?.id;

      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, employer_profiles(*)')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          if (profile.status === 'deletion_requested') {
            setDeletionRequested(true);
          }
          if (profile.employer_profiles) {
            setEmployerProfile({
              company_name: profile.employer_profiles.name || profile.employer_profiles.company_name || 'Lakhan Lal Sah',
              email: profile.email || session.user.email || 'lakhan.sah@gmail.com',
              society_name: profile.employer_profiles.billing_address || 'DLF Westend Heights - Akshayanagar',
              phone: profile.phone || '+91 98765 43210',
              subscription_status: profile.employer_profiles.subscription_status || 'Standard Plan',
              address: profile.employer_profiles.billing_address || 'Tower 4, Apt 802'
            });
          }
        }
      }

      // Fetch ONLY this Employer's Own Jobs from Supabase Database
      let jobsQuery = supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeUserId) {
        jobsQuery = jobsQuery.eq('employer_id', activeUserId);
      } else {
        // Fallback filter for demo employer name if not logged into auth
        jobsQuery = jobsQuery.or(`employer_name.eq."Lakhan Lal Sah",employer_id.eq."emp_demo"`);
      }

      const { data: dbJobs, error: jobsErr } = await jobsQuery;

      if (dbJobs) {
        const mappedJobs = dbJobs.map((j: any) => ({
          id: j.id,
          title: j.title || 'Job Requisition',
          category: j.category || 'general',
          salary: j.salary_offered || j.salary || '15000',
          status: j.status || 'active',
          adminNote: j.admin_note || j.adminNote || undefined,
          created_at: j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : 'Today',
          applicationsCount: j.applications_count || j.applicationsCount || 0,
          description: j.description || '',
          family_members: j.family_members || '4 Members (2 Adults, 2 Kids)',
          flat_type: j.flat_type || '3BHK Apartment',
          shift_hours: j.shift_hours || 'Full Day (8:00 AM – 4:00 PM)',
          dietary_pref: j.dietary_pref || 'Both Veg & Non-Veg',
          leave_policy: j.leave_policy || '4 Sundays Off + 1 Paid Leave'
        }));
        setPostedJobs(mappedJobs);
      }
    } catch (err) {
      console.error("Error fetching employer session/jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleToggleBookmark = (workerId: string) => {
    setBookmarkedContacts(prev => 
      prev.includes(workerId) ? prev.filter(id => id !== workerId) : [...prev, workerId]
    );
  };

  const handlePostJob = async (jobData: any) => {
    const newJob = {
      id: `job_${Date.now()}`,
      title: jobData.title,
      category: jobData.category,
      salary: jobData.salary,
      salary_offered: jobData.salary,
      status: 'pending',
      created_at: new Date().toISOString().split('T')[0],
      applicationsCount: 0,
      description: jobData.description,
      dietary_pref: jobData.dietaryPref,
      leave_policy: jobData.leavePolicy,
      family_members: '4 Members (2 Adults, 2 Kids)',
      flat_type: '3BHK Apartment',
      shift_hours: 'Full Day (8:00 AM – 4:00 PM)'
    };

    try {
      if (user?.id) {
        await supabase.from('jobs').insert([{
          title: jobData.title,
          category: jobData.category,
          salary_offered: jobData.salary,
          status: 'pending',
          description: jobData.description,
          employer_name: employerProfile.company_name,
          society_name: employerProfile.society_name
        }]);
      }
    } catch (err) {
      console.error("Supabase job insert error:", err);
    }

    setPostedJobs(prev => [newJob, ...prev]);
    showToast('New job requisition submitted! Pending Admin audit before going live for workers.', 'info');
    router.push('/employer/dashboard/jobs');
  };

  const handleUpdateJob = async (jobId: string, updatedData: any) => {
    try {
      await supabase.from('jobs').update({
        title: updatedData.title,
        salary_offered: updatedData.salary,
        description: updatedData.description,
        category: updatedData.category,
        status: 'pending' // Resubmit for review
      }).eq('id', jobId);
    } catch (err) {
      console.error("Supabase job update error:", err);
    }

    setPostedJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          ...updatedData,
          status: 'pending',
          adminNote: undefined
        };
      }
      return job;
    }));
    showToast('Job requisition updated and resubmitted for Admin review!', 'success');
  };

  const handleRequestAccountDeletion = async (reason: string) => {
    setDeletionRequested(true);
    showToast('Account deletion request logged. Sevikaa admin will call your phone to confirm offboarding.', 'warning');
  };

  const handleLogout = async () => {
    try {
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!isPlaceholder) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.location.href = '/';
      }
    }
  };

  const navItems = [
    { id: 'overview', label: t('navOverview') || 'Home', href: '/employer/dashboard', icon: <Home size={20} /> },
    { id: 'post-job', label: t('navPostJob') || 'Post Job', href: '/employer/dashboard/post-job', icon: <PlusCircle size={20} /> },
    { id: 'my-jobs', label: 'My Jobs', href: '/employer/dashboard/jobs', icon: <Briefcase size={20} /> },
    { id: 'workers', label: t('navCandidates') || 'Applicants', href: '/employer/dashboard/workers', icon: <Users size={20} /> },
    { id: 'account', label: t('navAccount') || 'Account', href: '/employer/dashboard/account', icon: <User size={20} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-300">Loading Employer Mobile App...</span>
        </div>
      </div>
    );
  }

  return (
    <EmployerDashboardContext.Provider value={{
      user, loading, employerProfile, setEmployerProfile, isPremium,
      bookmarkedContacts, postedJobs, societiesList, deletionRequested,
      showToast, handleToggleBookmark, handlePostJob,
      handleUpdateJob, handleRequestAccountDeletion, handleLogout
    }}>
      <div className="bg-slate-100 min-h-screen flex justify-center items-start font-sans antialiased">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        
        {/* Mobile Viewport Container - Clean Flat Interface */}
        <div className="w-full max-w-md bg-slate-50 min-h-screen border-x border-slate-200/80 shadow-xl flex flex-col relative">

          {/* Clean Mobile App Header with Integrated Dropdown Menu */}
          <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link href="/" className="text-slate-400 hover:text-slate-700">
                  <ArrowLeft size={18} />
                </Link>
                <img src="/logo.png" alt="Sevikaa Logo" className="h-7 w-auto object-contain" />
                <span className="font-black text-xs text-slate-800">Employer</span>
              </div>

              <div className="flex items-center gap-2">
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 py-1 px-2.5 rounded-xl text-[10px] font-black flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  <span>Subscribed</span>
                </div>

                {/* Notifications Bell Button */}
                <Link
                  href="/employer/dashboard/notifications"
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer relative flex items-center justify-center"
                  title="Notifications & Alerts"
                >
                  <Bell size={18} />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#EA4335] border border-white animate-pulse" />
                </Link>

                {/* Hamburger Mobile Menu Toggle Button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  aria-label="Toggle Navigation Menu"
                >
                  {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
                </button>
              </div>
            </div>

            {/* Slide-Down Mobile Header Menu Overlay Drawer (Floats over the screen content) */}
            {showMobileMenu && (
              <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-4 space-y-4 shadow-2xl animate-fade-in z-[100]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{employerProfile.company_name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{employerProfile.society_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    deletionRequested 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-blue-50 text-[#1A73E8]'
                  }`}>
                    {deletionRequested ? 'Pending' : 'Active'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-500">App Language:</span>
                  <GlobalLanguageSelector />
                </div>

                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => { setShowMobileMenu(false); handleLogout(); }}
                    className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Log Out Session</span>
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* Account Deletion Request Banner Notice */}
          {deletionRequested && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-[11px] font-semibold text-amber-900 flex items-center gap-2">
              <ShieldAlert size={14} className="text-amber-700 shrink-0" />
              <span>
                <strong>Account Deletion Pending:</strong> Sevikaa Admin will call <strong>{employerProfile.phone}</strong> to confirm offboarding.
              </span>
            </div>
          )}

          {/* Main Scrollable Screen Area */}
          <main className="flex-1 p-4 space-y-4 pb-6">
            {children}
          </main>

          {/* Sticky Mobile Bottom Navigation Bar */}
          <nav className="sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 py-2.5 px-2 flex justify-around items-center z-50 shadow-lg shrink-0">
            {navItems.map((item) => {
              const isActive = (item.id === 'overview' && pathname === '/employer/dashboard') || (item.id !== 'overview' && pathname === item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[9.5px] font-bold transition-all relative ${
                    isActive 
                      ? 'text-[#1A73E8] font-black bg-blue-50/80 scale-105' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {item.icon}
                  <span>{item.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </EmployerDashboardContext.Provider>
  );
}
