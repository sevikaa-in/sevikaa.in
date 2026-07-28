"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { GlobalLanguageSelector } from '@/components/GlobalLanguageSelector';
import { ToastContainer, ToastItem } from '@/components/admin/dashboard/Toast';
import { 
  Home, User, Briefcase, MapPin, Calendar, CheckCircle2, LogOut, 
  ArrowLeft, ShieldAlert, Settings, Phone, Menu, X, Building2, Lock, Bell 
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
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [societiesList, setSocietiesList] = useState<any[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click / tap
  useEffect(() => {
    if (!showMobileMenu) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [showMobileMenu]);

  const [workerProfile, setWorkerProfile] = useState<any>({
    name: "",
    category: [],
    expectedSalary: "",
    experience: "",
    society: "",
    phone: "",
    languages: [],
    gender: "female",
    age: 28,
    status: "pending_verification"
  });

  const [badges, setBadges] = useState<any[]>([
    { name: 'Aadhaar Verified', status: 'pending' },
    { name: 'Police', status: 'pending' },
    { name: 'Interview', status: 'pending' }
  ]);

  const [availability, setAvailability] = useState<Record<string, string[]>>({});

  const [applications, setApplications] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);

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

      // Fetch real societies from database unconditionally
      const { data: dbSocieties } = await supabase
        .from('societies')
        .select('*')
        .order('name', { ascending: true });

      if (dbSocieties) {
        setSocietiesList(dbSocieties);
      }

      // Fetch live jobs unconditionally
      const { data: liveJobs } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (liveJobs) {
        setAvailableJobs(liveJobs);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, worker_profiles(*)')
          .eq('id', session.user.id)
          .maybeSingle();

        let wProf = profile?.worker_profiles 
          ? (Array.isArray(profile.worker_profiles) ? profile.worker_profiles[0] : profile.worker_profiles)
          : null;

        if (!wProf) {
          const { data: directWProf } = await supabase
            .from('worker_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          if (directWProf) wProf = directWProf;
        }

        if (profile?.role && profile.role !== 'worker') {
          if (profile.role === 'employer') router.push('/employer');
          else if (profile.role === 'super-admin') router.push('/super-admin/dashboard');
          else if (profile.role === 'admin') router.push('/admin/dashboard');
          return;
        }

        if (typeof window !== 'undefined') {
          document.cookie = `sevikaa_user_role=worker; path=/; max-age=86400`;
        }

        if (profile || wProf) {
          const profStatus = profile?.status || wProf?.status || 'pending_verification';
          const isApproved = profStatus === 'live' || profStatus === 'approved';

          if (profile?.status === 'deletion_requested') {
            setDeletionRequested(true);
          }

          if (wProf) {
            setWorkerProfile({
              name: wProf.full_name || wProf.name || profile?.full_name || 'Worker',
              category: Array.isArray(wProf.skills) ? wProf.skills : (wProf.skills ? [wProf.skills] : []),
              expectedSalary: String(wProf.expected_salary || '15000'),
              experience: wProf.experience_years ? `${wProf.experience_years} Years` : '0 Years',
              society: wProf.preferred_society_name || wProf.society || '',
              society_id: wProf.preferred_society_id || '',
              phone: profile?.phone || wProf.phone || '',
              languages: wProf.languages_spoken || [],
              gender: wProf.gender || 'female',
              age: wProf.age || 28,
              status: profStatus,
              profile_picture_url: wProf.profile_picture_url || wProf.avatar_url || profile?.avatar_url || '',
              aadhaar_front_url: wProf.aadhaar_front_url || '',
              aadhaar_back_url: wProf.aadhaar_back_url || '',
              video_url: wProf.video_url || '',
              is_aadhaar_verified: wProf.is_aadhaar_verified || isApproved
            });

            setBadges([
              { name: 'Aadhaar Verified', status: (wProf.is_aadhaar_verified || isApproved) ? 'Verified' : 'Pending' },
              { name: 'Police Clearance', status: (wProf.is_police_verified || isApproved) ? 'Verified' : 'Pending' },
              { name: 'Interview Audit', status: (wProf.is_interview_verified || isApproved) ? 'Verified' : 'Pending' }
            ]);
          }
        }

        // Fetch real candidate job applications for this worker from database
        try {
          const { data: dbApps } = await supabase
            .from('job_applications')
            .select('*, jobs(*)')
            .eq('worker_id', session.user.id);

          if (dbApps) {
            const mappedApps = dbApps.map((a: any) => ({
              id: a.id,
              jobTitle: a.jobs?.title || 'Domestic Worker Job',
              employerName: a.jobs?.employer_name || 'Household Employer',
              society: a.jobs?.society_name || 'Residential Society',
              salary: a.jobs?.salary_offered ? `₹${Number(a.jobs.salary_offered).toLocaleString('en-IN')}` : '₹15,000',
              shift: a.jobs?.shift_hours || 'Standard Shift',
              status: a.status || 'under_review',
              interviewTime: a.interview_time || 'Schedule Pending',
              interviewMode: a.interview_mode || 'phone',
              employerPhone: a.jobs?.employer_phone || '+91 98765 43210',
              date: a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : 'Recently'
            }));
            setApplications(mappedApps);
          }
        } catch (appErr) {
          console.error("Error fetching worker job applications:", appErr);
        }
      }
    } catch (err) {
      console.error("Worker session fetch error:", err);
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
            expected_salary: parseInt(updatedData.expectedSalary) || 15000,
            experience_years: parseInt(updatedData.experience) || 0,
            gender: updatedData.gender,
            age: updatedData.age,
            preferred_shift: updatedData.preferredShift,
            emergency_contact: updatedData.emergencyContact,
            bio: updatedData.bio,
            languages_spoken: updatedData.languages,
            skills: updatedData.category,
            profile_picture_url: updatedData.profilePicUrl || updatedData.profile_picture_url || null,
            aadhaar_front_url: updatedData.aadhaarFrontUrl || updatedData.aadhaar_front_url || null,
            aadhaar_back_url: updatedData.aadhaarBackUrl || updatedData.aadhaar_back_url || null,
            video_url: updatedData.introVideoUrl || updatedData.video_url || null,
            is_aadhaar_verified: (!!updatedData.aadhaarFrontUrl && !!updatedData.aadhaarBackUrl) || workerProfile.is_aadhaar_verified
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
    { id: 'overview', label: t('navOverview') || 'Home', href: '/worker', icon: <Home size={20} /> },
    { id: 'jobs', label: t('navJobs') || 'Jobs', href: '/worker/jobs', icon: <Briefcase size={20} />, badge: availableJobs.length },
    { id: 'interviews', label: t('navInterviews') || 'Interviews', href: '/worker/interviews', icon: <Calendar size={20} />, badge: applications.length },
    { id: 'societies', label: t('navSocieties') || 'Societies', href: '/worker/societies', icon: <Building2 size={20} /> },
    { id: 'profile', label: t('navProfile') || 'Settings', href: '/worker/profile', icon: <User size={20} /> },
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
        <div className="w-full max-w-md bg-slate-50 min-h-screen border-x border-slate-200/80 shadow-xl flex flex-col relative">

          {/* Clean Mobile App Header with Integrated Dropdown Menu */}
          <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link href="/" className="text-slate-400 hover:text-slate-700">
                  <ArrowLeft size={18} />
                </Link>
                <img src="/logo.png" alt="Sevikaa Logo" className="h-7 w-auto object-contain" />
                <span className="font-black text-xs text-slate-800">{t('headerWorker')}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Verification Pill */}
                {workerProfile.status === 'live' || workerProfile.status === 'approved' ? (
                  <div className="bg-emerald-50 text-[#34A853] border border-emerald-200/50 py-1 px-2.5 rounded-xl text-[10px] font-black flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    <span>{t('aadhaarVerifiedBadge')}</span>
                  </div>
                ) : (
                  <div className="bg-amber-50 text-amber-700 border border-amber-200/50 py-1 px-2.5 rounded-xl text-[10px] font-black flex items-center gap-1">
                    <Lock size={10} />
                    <span>{t('pendingAdminAudit')}</span>
                  </div>
                )}

                {/* Notifications Bell Button */}
                <Link
                  href="/worker/notifications"
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

            {/* Slide-Down Mobile Header Menu Overlay Drawer */}
            {showMobileMenu && (
              <>
                {/* Transparent backdrop: tap outside to close */}
                <div
                  className="fixed inset-0 z-[99]"
                  onClick={() => setShowMobileMenu(false)}
                  onTouchStart={() => setShowMobileMenu(false)}
                />
                <div ref={menuRef} className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-4 space-y-4 shadow-2xl animate-fade-in z-[100]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{workerProfile.name || 'Worker Candidate'}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{workerProfile.society}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      deletionRequested 
                        ? 'bg-amber-100 text-amber-800' 
                        : (workerProfile.status === 'live' || workerProfile.status === 'approved')
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {deletionRequested ? 'Pending Offboarding' : (workerProfile.status === 'live' || workerProfile.status === 'approved') ? 'VERIFIED' : 'PENDING AUDIT'}
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
              </>
            )}
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
          <main className="flex-1 p-4 space-y-4 pb-6">
            {children}
          </main>

          {/* Sticky Mobile Bottom Navigation Bar */}
          <nav className="sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 py-2.5 px-2 flex justify-around items-center z-50 shadow-lg shrink-0">
            {navItems.map((item) => {
              const isActive = (item.id === 'overview' && pathname === '/worker') || (item.id !== 'overview' && pathname === item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl text-[9.5px] font-bold transition-all relative text-center ${
                    isActive 
                      ? 'text-[#1A73E8] font-black bg-blue-50/80 scale-105' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {item.icon}
                  <span className="text-center leading-tight">{item.label}</span>
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
