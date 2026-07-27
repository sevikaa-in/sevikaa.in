"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../../../context/LanguageContext';
import { supabase } from '../../../lib/supabaseClient';
import { GlobalLanguageSelector } from '../../../components/GlobalLanguageSelector';
import { ToastContainer, ToastItem } from '../../../components/admin/dashboard/Toast';
import { 
  User, Briefcase, MapPin, Calendar, CheckCircle2, LogOut, 
  Settings, ArrowLeft, Heart, ShieldAlert, Sparkles, Bell
} from 'lucide-react';

const MOCK_SOCIETIES = [
  { id: '91cb520f-d5b7-4b71-9f20-b44c3c3de101', name: 'DLF Westend Heights - Akshayanagar' },
  { id: 'c7e2d9a3-5bc5-442a-a921-ef743bd2b6d2', name: 'Prestige Song of the South - Bangalore' },
  { id: 'b1a2f3c4-e888-4c91-a1b2-3f8c8dcb2e83', name: 'SNN Raj Serenity - Bangalore' }
];

interface WorkerDashboardContextProps {
  user: any;
  loading: boolean;
  workerProfile: any;
  setWorkerProfile: React.Dispatch<React.SetStateAction<any>>;
  availability: Record<string, string[]>;
  setAvailability: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  badges: any[];
  applications: any[];
  availableJobs: any[];
  societiesList: any[];
  saveLoading: boolean;
  deletionRequested: boolean;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  handleSaveProfile: (updatedData: any) => Promise<void>;
  handleRequestAccountDeletion: (reason: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const WorkerDashboardContext = createContext<WorkerDashboardContextProps | null>(null);

export const useWorkerDashboard = () => {
  const context = useContext(WorkerDashboardContext);
  if (!context) {
    throw new Error('useWorkerDashboard must be used within WorkerDashboardLayout');
  }
  return context;
};

export default function WorkerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [societiesList, setSocietiesList] = useState<any[]>(MOCK_SOCIETIES);
  const [deletionRequested, setDeletionRequested] = useState(false);

  const [workerProfile, setWorkerProfile] = useState<any>({
    name: "Janhvi",
    category: ["Professional Nanny", "Child Caregiver"],
    expectedSalary: "18000",
    experience: "4 Years",
    society: "Prestige Song of the South, Bengaluru",
    society_id: "c7e2d9a3-5bc5-442a-a921-ef743bd2b6d2",
    phone: "+91 98765 43210",
    languages: ["Hindi", "English", "Kannada"],
    gender: "female",
    age: "26",
    preferred_areas: ["JP Nagar", "Bannerghatta Road"],
    status: "live"
  });

  const [badges, setBadges] = useState<any[]>([
    { name: 'Mobile', status: 'approved' },
    { name: 'Aadhaar', status: 'approved' },
    { name: 'Police', status: 'approved' },
    { name: 'Interview', status: 'approved' }
  ]);

  const [availability, setAvailability] = useState<Record<string, string[]>>({
    Mon: ['morning', 'afternoon'],
    Wed: ['morning', 'afternoon'],
    Fri: ['morning', 'afternoon', 'evening']
  });

  const [applications, setApplications] = useState<any[]>([
    { id: 'app_1', jobTitle: 'Full Time Cook Needed', society: 'DLF Westend Heights', salary: '15,000', status: 'interview_scheduled', date: '2 hours ago' }
  ]);

  const [availableJobs, setAvailableJobs] = useState<any[]>([
    { id: 'j1', title: 'Need Full Time Cook', description: 'Cooking organic healthy meals for family of 4 in DLF Akshayanagar.', salary_offered: 15000, society_name: 'DLF Westend Heights', created_at: '10 mins ago' },
    { id: 'j2', title: 'Nanny for Infant', description: 'Looking for experienced nanny to take care of 8 month old baby boy.', salary_offered: 18000, society_name: 'Prestige Song of the South', created_at: '3 hours ago' }
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
        setUser({ id: 'w_demo', email: 'worker@demo.com' });
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, worker_profiles(*)')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          if (profile.status === 'deletion_requested') {
            setDeletionRequested(true);
          }
          if (profile.worker_profiles) {
            setWorkerProfile({
              name: profile.worker_profiles.full_name || 'Worker Name',
              category: profile.worker_profiles.skills || [],
              expectedSalary: profile.worker_profiles.expected_salary || '15000',
              experience: profile.worker_profiles.experience_years ? `${profile.worker_profiles.experience_years} Years` : '3 Years',
              society: profile.worker_profiles.preferred_society_name || 'DLF Westend Heights',
              society_id: profile.worker_profiles.preferred_society_id || '',
              phone: profile.phone || '',
              languages: profile.worker_profiles.languages_spoken || [],
              gender: profile.worker_profiles.gender || 'female',
              age: profile.worker_profiles.age || 30,
              status: profile.status
            });
          }
        }

        // Fetch ONLY Admin-Approved/Published jobs for the worker feed
        const { data: liveJobs } = await supabase
          .from('jobs')
          .select('*')
          .or('status.eq.approved,status.eq.published')
          .order('created_at', { ascending: false });

        if (liveJobs && liveJobs.length > 0) {
          setAvailableJobs(liveJobs);
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

  const handleSaveProfile = async (updatedData: any) => {
    setSaveLoading(true);
    try {
      setWorkerProfile((prev: any) => ({ ...prev, ...updatedData }));
      
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                            !process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (!isPlaceholder && user?.id) {
        await supabase
          .from('worker_profiles')
          .update({
            full_name: updatedData.name,
            expected_salary: parseInt(updatedData.expectedSalary) || 15000
          })
          .eq('user_id', user.id);
      }
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRequestAccountDeletion = async (reason: string) => {
    setDeletionRequested(true);
    showToast('Account deletion request submitted. Sevikaa admin will contact you to confirm.', 'warning');
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
    { id: 'overview', label: 'Overview', href: '/worker/dashboard', icon: <User size={18} /> },
    { id: 'jobs', label: 'Jobs', href: '/worker/dashboard/jobs', icon: <Briefcase size={18} />, badge: availableJobs.length },
    { id: 'interviews', label: 'Interviews', href: '/worker/dashboard/interviews', icon: <Calendar size={18} />, badge: applications.length },
    { id: 'societies', label: 'Societies', href: '/worker/dashboard/societies', icon: <MapPin size={18} /> },
    { id: 'profile', label: 'Profile Settings', href: '/worker/dashboard/profile', icon: <Settings size={18} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-300">Loading Worker Mobile App...</span>
        </div>
      </div>
    );
  }

  return (
    <WorkerDashboardContext.Provider value={{
      user, loading, workerProfile, setWorkerProfile, availability, setAvailability,
      badges, applications, availableJobs, societiesList, saveLoading, deletionRequested,
      showToast, handleSaveProfile, handleRequestAccountDeletion, handleLogout
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
              <span className="font-black text-xs text-slate-800">Worker App</span>
            </div>

            <div className="flex items-center gap-2">
              <GlobalLanguageSelector />
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 py-1 px-2 rounded-xl">
                <span className="text-xs font-black text-slate-800 truncate max-w-[130px]" title={workerProfile.name}>
                  {workerProfile.name || 'Worker'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                  deletionRequested 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-emerald-50 text-[#34A853]'
                }`}>
                  {deletionRequested ? 'Pending' : 'Live'}
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
                <strong>Account Deletion Pending:</strong> Sevikaa Admin will call <strong>{workerProfile.phone}</strong> to confirm offboarding.
              </span>
            </div>
          )}

          {/* Main Scrollable Screen Area */}
          <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
            {children}
          </main>

          {/* Exclusive Mobile Bottom Navigation Bar */}
          <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-2 flex justify-around items-center z-50 shadow-lg">
            {navItems.map((item) => {
              const isActive = (item.id === 'overview' && pathname === '/worker/dashboard') || (item.id !== 'overview' && pathname === item.href);
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
    </WorkerDashboardContext.Provider>
  );
}
