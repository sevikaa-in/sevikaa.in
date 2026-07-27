"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../../../context/LanguageContext';
import { supabase } from '../../../lib/supabaseClient';
import { GlobalLanguageSelector } from '../../../components/GlobalLanguageSelector';
import { ToastContainer, ToastItem } from '../../../components/admin/dashboard/Toast';
import { 
  Home, PlusCircle, Search, User, CreditCard, LogOut, 
  ArrowLeft, CheckCircle2, ShieldAlert, Sparkles, Phone, Lock, Briefcase
} from 'lucide-react';

const MOCK_SOCIETIES = [
  { id: '91cb520f-d5b7-4b71-9f20-b44c3c3de101', name: 'DLF Westend Heights - Akshayanagar' },
  { id: 'c7e2d9a3-5bc5-442a-a921-ef743bd2b6d2', name: 'Prestige Song of the South - Bangalore' },
  { id: 'b1a2f3c4-e888-4c91-a1b2-3f8c8dcb2e83', name: 'SNN Raj Serenity - Bangalore' }
];

interface EmployerDashboardContextProps {
  user: any;
  loading: boolean;
  employerProfile: any;
  setEmployerProfile: React.Dispatch<React.SetStateAction<any>>;
  isPremium: boolean;
  unlockedContacts: string[];
  unlockedPhones: Record<string, string>;
  bookmarkedContacts: string[];
  postedJobs: any[];
  societiesList: any[];
  unlockCredits: number;
  deletionRequested: boolean;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  handleUnlockContact: (workerId: string) => Promise<void>;
  handleToggleBookmark: (workerId: string) => void;
  handlePostJob: (jobData: any) => Promise<void>;
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
  const [unlockCredits, setUnlockCredits] = useState(10);
  const [unlockedContacts, setUnlockedContacts] = useState<string[]>(['w_1']);
  const [unlockedPhones, setUnlockedPhones] = useState<Record<string, string>>({
    'w_1': '+91 98765 43210'
  });
  const [bookmarkedContacts, setBookmarkedContacts] = useState<string[]>([]);
  const [societiesList, setSocietiesList] = useState<any[]>(MOCK_SOCIETIES);
  const [deletionRequested, setDeletionRequested] = useState(false);

  const [employerProfile, setEmployerProfile] = useState<any>({
    company_name: "Ria Bhagat",
    society_name: "DLF Westend Heights - Akshayanagar",
    phone: "+91 98765 43210",
    subscription_status: "Standard Plan",
    address: "Tower 4, Apt 802"
  });

  const [postedJobs, setPostedJobs] = useState<any[]>([
    {
      id: 'job_101',
      title: 'Full Time North Indian Cook Needed',
      category: 'cook',
      salary: '15000',
      status: 'active',
      created_at: '2026-07-25',
      applicationsCount: 4,
      description: 'Looking for experienced cook to prepare breakfast, lunch and dinner for family of 4 in Akshayanagar.'
    }
  ]);

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
        setUser({ id: 'emp_demo', email: 'employer@demo.com' });
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
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
              company_name: profile.employer_profiles.name || profile.employer_profiles.company_name || 'Employer',
              society_name: profile.employer_profiles.billing_address || 'DLF Westend Heights',
              phone: profile.phone || '',
              subscription_status: profile.employer_profiles.subscription_status || 'free',
              address: profile.employer_profiles.billing_address || ''
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleUnlockContact = async (workerId: string) => {
    if (unlockedContacts.includes(workerId)) return;
    if (unlockCredits <= 0) {
      showToast('Unlock limit reached. Upgrade your subscription plan for more unlocks.', 'warning');
      return;
    }

    try {
      setUnlockedContacts(prev => [...prev, workerId]);
      setUnlockCredits(prev => prev - 1);
      setUnlockedPhones(prev => ({
        ...prev,
        [workerId]: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`
      }));
      showToast('Contact phone unlocked successfully!', 'success');
    } catch (err: any) {
      showToast(`Unlock failed: ${err.message}`, 'error');
    }
  };

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
      status: 'pending', // Pending Admin Audit & Approval before appearing on Worker feed
      created_at: new Date().toISOString().split('T')[0],
      applicationsCount: 0,
      description: jobData.description
    };
    setPostedJobs(prev => [newJob, ...prev]);
    showToast('New job requisition submitted! Pending Admin audit before going live for workers.', 'info');
    router.push('/employer/dashboard');
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
    { id: 'overview', label: 'Explore', href: '/employer/dashboard', icon: <Search size={18} /> },
    { id: 'post-job', label: 'Post Job', href: '/employer/dashboard/post-job', icon: <PlusCircle size={18} /> },
    { id: 'workers', label: 'Candidates', href: '/employer/dashboard/workers', icon: <User size={18} />, badge: unlockedContacts.length },
    { id: 'account', label: 'Account', href: '/employer/dashboard/account', icon: <CreditCard size={18} /> },
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
      user, loading, employerProfile, setEmployerProfile, isPremium, unlockedContacts,
      unlockedPhones, bookmarkedContacts, postedJobs, societiesList, unlockCredits,
      deletionRequested, showToast, handleUnlockContact, handleToggleBookmark, handlePostJob,
      handleRequestAccountDeletion, handleLogout
    }}>
      <div className="bg-slate-100 min-h-screen flex justify-center items-start font-sans antialiased">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />

        {/* Mobile Viewport Container - Clean Flat Interface */}
        <div className="w-full max-w-md bg-slate-50 min-h-screen border-x border-slate-200/80 shadow-xl flex flex-col relative pb-16">

          {/* App Header */}
          <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-slate-400 hover:text-slate-700">
                <ArrowLeft size={18} />
              </Link>
              <img src="/logo.png" alt="Sevikaa Logo" className="h-7 w-auto object-contain" />
              <span className="font-black text-xs text-slate-800">Employer App</span>
            </div>

            <div className="flex items-center gap-2">
              <GlobalLanguageSelector />
              
              {/* Unlock Credits Pill */}
              <div className="bg-blue-50 text-[#1A73E8] border border-blue-200/50 py-0.5 px-2 rounded-xl text-[10px] font-black flex items-center gap-1">
                <Phone size={10} />
                <span>{unlockCredits} Unlocks</span>
              </div>

              {/* Employer Name Pill */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 py-1 px-2 rounded-xl">
                <span className="text-xs font-black text-slate-800 truncate max-w-[130px]" title={employerProfile.company_name}>
                  {employerProfile.company_name || 'Employer'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                  deletionRequested 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-blue-50 text-[#1A73E8]'
                }`}>
                  {deletionRequested ? 'Pending' : 'Active'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
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
          <main className="flex-1 overflow-y-auto p-4 space-y-4">
            {children}
          </main>

          {/* Exclusive Mobile Bottom Navigation Bar */}
          <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-2 flex justify-around items-center z-50 shadow-lg">
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
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 bg-[#1A73E8] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </EmployerDashboardContext.Provider>
  );
}
